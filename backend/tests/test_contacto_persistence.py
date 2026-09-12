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
