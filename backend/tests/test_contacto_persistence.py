from test_persistence import api
from app.database.connection import connect


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
