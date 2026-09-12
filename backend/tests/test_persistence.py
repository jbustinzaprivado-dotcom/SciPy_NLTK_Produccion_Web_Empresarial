"""Integration tests use a fresh schema and never delete existing application data."""
import os
import uuid
import subprocess
import sys
from pathlib import Path
import pytest
import psycopg
from psycopg import sql
from psycopg.conninfo import make_conninfo
from fastapi.testclient import TestClient


@pytest.fixture()
def api(monkeypatch):
    dsn = os.environ.get("TEST_DATABASE_URL")
    if not dsn:
        pytest.skip("TEST_DATABASE_URL required")
    schema = "test_" + uuid.uuid4().hex
    with psycopg.connect(dsn, autocommit=True) as db:
        db.execute(sql.SQL("CREATE SCHEMA {}").format(sql.Identifier(schema)))
    monkeypatch.setenv("DATABASE_URL", make_conninfo(dsn, options=f"-c search_path={schema}"))
    from app.database.migrate import migrate
    from app.main import app
    from app.core.security import crear_token
    migrate()
    migrate()  # Already applied migrations are safe to rerun.
    try:
        with TestClient(app) as client:
            client.headers['Authorization'] = 'Bearer ' + crear_token('prueba@example.com', 'admin')
            yield client
    finally:
        with psycopg.connect(dsn, autocommit=True) as db:
            db.execute(sql.SQL("DROP SCHEMA {} CASCADE").format(sql.Identifier(schema)))


def payload(**kwargs):
    return {"cliente_nombre": "Cliente prueba", "fecha": "2026-09-05", "tiempo_atencion_minutos": 12.5, "comentario": "Atención de prueba", **kwargs}


def test_persistence_relations_and_filters(api):
    first = api.post('/api/comentarios', json=payload())
    assert first.status_code == 201, first.text
    row = first.json()
    assert row['categoria'] is not None and row['procesado'] is True
    second = api.post('/api/comentarios', json=payload(fecha='2026-09-04', tiempo_atencion_minutos=17.5))
    assert second.status_code == 201
    assert second.json()['cliente_id'] == row['cliente_id']
    assert len(api.get('/api/comentarios?fecha=2026-09-05').json()) == 1
    assert api.get('/api/comentarios?fecha=2026-01-01').json() == []
    clients = api.get('/api/clientes').json()
    assert len(clients) == 1
    assert clients[0]['total_atenciones'] == 2
    assert clients[0]['tiempo_promedio_min'] == 15
    # New interpreter / connections must see the committed data.
    script = "from app.database.connection import connect; c=connect(); assert c.execute('SELECT count(*) AS n FROM comentarios').fetchone()['n']==2; assert c.execute('SELECT count(*) AS n FROM tiempos_atencion').fetchone()['n']==2; c.close()"
    subprocess.run([sys.executable, '-c', script], check=True, env=os.environ.copy())


@pytest.mark.parametrize('changes', [dict(tiempo_atencion_minutos=-1), dict(tiempo_atencion_minutos=0), dict(comentario=' '), dict(cliente_nombre=' '), dict(fecha='invalid'), dict(tiempo_atencion_minutos=1.234)])
def test_invalid_input_never_writes(api, changes):
    assert api.post('/api/comentarios', json=payload(**changes)).status_code == 422
    assert api.get('/api/clientes').json() == []
    assert api.get('/api/comentarios').json() == []


def test_unknown_and_ambiguous_client(api):
    assert api.post('/api/comentarios', json=payload(cliente_id=999)).status_code == 404
    for _ in range(2):
        assert api.post('/api/clientes', json={'nombre': 'Cliente prueba'}).status_code == 201
    assert api.post('/api/comentarios', json=payload()).status_code == 409
    selected = int(api.get('/api/clientes').json()[0]['id'])
    assert api.post('/api/comentarios', json=payload(cliente_id=selected)).status_code == 201


def test_transaction_rolls_back_if_time_insert_fails(api):
    from app.database.connection import connect
    with connect() as db:
        db.execute("ALTER TABLE tiempos_atencion ADD CONSTRAINT test_limit CHECK (tiempo_minutos < 10)")
    assert api.post('/api/comentarios', json=payload()).status_code == 503
    assert api.get('/api/clientes').json() == []
    assert api.get('/api/comentarios').json() == []
