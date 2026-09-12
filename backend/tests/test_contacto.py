from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import get_connection


@pytest.fixture
def contact_api():
    db = MagicMock()
    db.execute.return_value.fetchone.return_value = {"id": "12"}
    app.dependency_overrides[get_connection] = lambda: db
    try:
        with TestClient(app) as client:
            yield client, db
    finally:
        app.dependency_overrides.pop(get_connection, None)


def test_contact_commits_before_confirming(contact_api):
    client, db = contact_api
    response = client.post('/api/contacto', json={
        'nombre': ' Ana ', 'correo': 'ana@example.com',
        'asunto': 'Necesito una cotización de software.',
    })
    assert response.status_code == 201
    assert response.json()['id'] == '12'
    assert db.execute.call_args.args[1] == (
        'Ana', '', 'ana@example.com', '', 'Necesito una cotización de software.')
    db.commit.assert_called_once()


@pytest.mark.parametrize('changes', [
    {'nombre': '  '}, {'correo': 'sin-correo'}, {'asunto': 'corto'},
    {'asunto': ' ' * 20}, {'asunto': 'a' * 5001}, {'telefono': '1' * 51},
])
def test_invalid_contact_does_not_write(contact_api, changes):
    client, db = contact_api
    response = client.post('/api/contacto', json={
        'nombre': 'Ana', 'correo': 'ana@example.com',
        'asunto': 'Necesito información de servicios.', **changes,
    })
    assert response.status_code == 422
    db.execute.assert_not_called()


def test_failed_commit_never_confirms_success(contact_api):
    import psycopg
    client, db = contact_api
    db.commit.side_effect = psycopg.OperationalError('unavailable')
    response = client.post('/api/contacto', json={
        'nombre': 'Ana', 'correo': 'ana@example.com',
        'asunto': 'Necesito información de servicios.',
    })
    assert response.status_code == 503
