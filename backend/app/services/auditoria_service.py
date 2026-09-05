from psycopg.types.json import Jsonb


def registrar(db, accion: str, tabla: str, registro_id: int, detalles: dict | None = None):
    db.execute(
        "INSERT INTO auditoria(accion, tabla, registro_id, detalles) VALUES (%s, %s, %s, %s)",
        (accion, tabla, registro_id, Jsonb(detalles) if detalles is not None else None),
    )