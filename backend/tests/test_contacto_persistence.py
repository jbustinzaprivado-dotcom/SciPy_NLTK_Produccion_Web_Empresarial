from test_persistence import api
from app.database.connection import connect


def test_private_inbox_requires_login(api):
    from app.core.security import hash_password
    with connect() as db:
        db.execute("INSERT INTO usuarios(nombre, email, password_hash) VALUES (%s, %s, %s)",
                   ('Prueba', 'sesion@example.com', hash_password('Test-only-pass-123')))
    api.headers.pop('Authorization', None)
    assert api.get('/api/contacto').status_code == 401
    assert api.patch('/api/contacto/1', json={'estado': 'atendida'}).status_code == 401
    assert api.post('/api/contacto', json={'nombre': 'Visitante', 'correo': 'visitante@example.com', 'asunto': 'Consulta pública sin sesión.'}).status_code == 201
    login = api.post('/api/auth/login', json={'email': 'sesion@example.com', 'password': 'Test-only-pass-123'})
    assert login.status_code == 200
    api.headers['Authorization'] = 'Bearer ' + login.json()['access_token']
    assert len(api.get('/api/contacto').json()) == 1


def test_landing_to_inbox_and_status_persist(api):
    payload = {'nombre': 'Prueba contacto', 'empresa': 'Prueba',
               'correo': 'prueba@example.com', 'telefono': '+51 000000000',
               'asunto': 'Consulta de prueba de integración.'}
    response = api.post('/api/contacto', json=payload)
    assert response.status_code == 201
    contact_id = response.json()['id']
    rows = api.get('/api/contacto').json()
    assert len(rows) == 1 and rows[0]['id'] == contact_id
    assert rows[0]['estado'] == 'pendiente'
    assert rows[0]['asunto'] == payload['asunto']
    for estado in ['en_atencion', 'atendida']:
        updated = api.patch(f'/api/contacto/{contact_id}', json={'estado': estado})
        assert updated.status_code == 200
        assert updated.json()['estado'] == estado
    with connect() as db:
        assert db.execute('SELECT estado FROM consultas_contacto WHERE id = %s', (contact_id,)).fetchone()['estado'] == 'atendida'
        assert db.execute('SELECT count(*) AS n FROM tiempos_atencion').fetchone()['n'] == 0
    assert api.patch(f'/api/contacto/{contact_id}', json={'estado': 'invalid'}).status_code == 422
    assert api.patch('/api/contacto/999999', json={'estado': 'atendida'}).status_code == 404
    assert api.get('/api/contacto?limit=1&offset=1').json() == []
    assert api.get('/api/contacto?limit=101').status_code == 422


import pytest


@pytest.mark.parametrize('endpoint', ['/api/contacto', '/api/landing/contacto'])
def test_public_contact_reaches_panel_and_nlp(api, endpoint):
    payload = {'nombre': 'Visitante', 'correo': 'visitante@example.com',
               'asunto': 'Quiero comprar licencias para mi empresa.'}
    response = api.post(endpoint, json=payload)
    assert response.status_code == 201, response.text
    consulta = api.get('/api/contacto').json()[0]
    assert consulta['categoria'] == 'ventas'
    assert 'licencias' in consulta['analisis']['palabras_clave']
    assert consulta['analisis']['total_tokens'] > 0
    comentario = api.get('/api/comentarios?estado=pendiente').json()[0]
    assert comentario['id'] == consulta['comentario_id']
    assert comentario['comentario'] == payload['asunto']
    assert comentario['procesado'] is True
    assert comentario['tiempo_atencion_minutos'] is None
    report = api.get('/api/reportes').json()
    assert report['atencion']['total_comentarios'] == 1
    assert report['atencion']['total_atenciones_registradas'] == 0
    assert report['nlp']['total_procesados'] == 1
    for estado, esperado in [('en_atencion', 'en_atencion'), ('atendida', 'resuelto'), ('pendiente', 'pendiente')]:
        assert api.patch(f"/api/contacto/{consulta['id']}", json={'estado': estado}).status_code == 200
        assert api.get('/api/comentarios').json()[0]['estado'] == esperado
    assert api.patch(f"/api/comentarios/{comentario['id']}/estado?nuevo_estado=resuelto").status_code == 200
    assert api.get('/api/contacto').json()[0]['estado'] == 'atendida'
    assert api.patch(f"/api/comentarios/{comentario['id']}/estado?nuevo_estado=incorrecto").status_code == 422


def test_contact_transaction_rolls_back_all_records(api):
    with connect() as db:
        db.execute("ALTER TABLE consultas_contacto ADD CONSTRAINT test_reject CHECK (nombre <> 'Rechazar')")
    response = api.post('/api/contacto', json={'nombre': 'Rechazar', 'correo': 'prueba@example.com',
                                             'asunto': 'Necesito comprar una licencia.'})
    assert response.status_code == 503
    with connect() as db:
        for table in ['clientes', 'comentarios', 'consultas_contacto', 'auditoria']:
            assert db.execute(f'SELECT count(*) AS n FROM {table}').fetchone()['n'] == 0


def test_missing_nltk_resources_does_not_save_partial_contact(api, monkeypatch):
    def unavailable(_):
        raise LookupError('missing corpus')
    monkeypatch.setattr('app.services.contacto_service.analizar_texto', unavailable)
    response = api.post('/api/contacto', json={'nombre': 'Visitante', 'correo': 'prueba@example.com',
                                             'asunto': 'Necesito comprar una licencia.'})
    assert response.status_code == 503
    assert api.get('/api/contacto').json() == []
    assert api.get('/api/comentarios').json() == []
    assert api.get('/api/clientes').json() == []


def test_integrate_old_contacts_preserves_status_and_is_idempotent(api):
    from app.services.integrar_consultas import integrar_consultas
    with connect() as db:
        db.execute("INSERT INTO consultas_contacto(nombre, correo, asunto, estado) VALUES ('Anterior', 'old@example.com', 'Mal servicio y demora', 'atendida')")
        assert integrar_consultas(db) == 1
    with connect() as db:
        assert integrar_consultas(db) == 0
    row = api.get('/api/contacto').json()[0]
    assert row['categoria'] == 'reclamo'
    assert 'demora' in row['motivo_categoria']
    assert row['analisis']['total_tokens'] > 0
    assert row['estado'] == 'atendida'
    comments = api.get('/api/comentarios').json()
    assert len(comments) == 1
    assert comments[0]['estado'] == 'resuelto'
    assert comments[0]['analisis'] == row['analisis']
    assert comments[0]['motivo_categoria'] == row['motivo_categoria']


def test_startup_integrates_old_consultas_without_manual_command(api):
    from fastapi.testclient import TestClient
    from app.main import app
    with connect() as db:
        db.execute("INSERT INTO consultas_contacto(nombre, correo, asunto, estado, created_at) "
                   "VALUES ('Anterior', 'old@example.com', 'Queja por demora', 'en_atencion', '2026-09-01 12:00:00+00')")
    for _ in range(2):
        with TestClient(app) as restarted:
            restarted.headers.update(api.headers)
            response = restarted.get('/api/contacto')
            assert response.status_code == 200
            row = response.json()[0]
            assert row['categoria'] == 'reclamo'
            assert row['analisis']['palabras_clave'] == ['demora', 'queja']
            assert row['analisis']['total_tokens'] == 3
            assert row['estado'] == 'en_atencion'
    with connect() as db:
        assert db.execute('SELECT count(*) AS n FROM comentarios').fetchone()['n'] == 1
        assert db.execute('SELECT count(*) AS n FROM clientes').fetchone()['n'] == 1
        assert db.execute('SELECT count(*) AS n FROM tiempos_atencion').fetchone()['n'] == 0
        row = db.execute('SELECT fecha, estado FROM comentarios').fetchone()
        assert str(row['fecha']) == '2026-09-01'
        assert row['estado'] == 'en_atencion'
