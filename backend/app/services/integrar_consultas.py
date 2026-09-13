"""Run after migrations: python -m app.services.integrar_consultas."""
from types import SimpleNamespace
from app.database.connection import connect
from app.services.contacto_service import registrar_contacto


def integrar_consultas(db):
    # Serialize startup workers before selecting unlinked records.
    db.execute("SELECT pg_advisory_xact_lock(2026091301)")
    rows = db.execute("SELECT * FROM consultas_contacto WHERE comentario_id IS NULL ORDER BY id FOR UPDATE").fetchall()
    for row in rows:
        registrar_contacto(db, SimpleNamespace(**row), consulta_existente=row)
    return len(rows)


if __name__ == '__main__':
    with connect() as db:
        count = integrar_consultas(db)
    print(f'Consultas integradas: {count}')
