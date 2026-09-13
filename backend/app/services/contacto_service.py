from datetime import date

from psycopg.types.json import Jsonb
from fastapi import HTTPException

from app.services.auditoria_service import registrar
from app.services.nltk_service import analizar_texto, clasificar_texto


def registrar_contacto(db, data, consulta_existente=None):
    """Create the public submission and its analysis in the caller's transaction."""
    categoria, _ = clasificar_texto(data.asunto)
    try:
        analisis = analizar_texto(data.asunto)
    except LookupError as exc:
        raise HTTPException(503, "El servicio de análisis no está disponible. Intenta más tarde.") from exc
    # Public visitors are leads, not authenticated identities. Do not merge an
    # existing customer's data based only on an unverified email address.
    cliente_id = db.execute(
        "INSERT INTO clientes(nombre, empresa, correo, telefono) VALUES (%s, %s, %s, %s) RETURNING id",
        (data.nombre, data.empresa, data.correo, data.telefono),
    ).fetchone()["id"]
    comentario_id = db.execute(
        "INSERT INTO comentarios(cliente_id, contenido, fecha, categoria, procesado) "
        "VALUES (%s, %s, %s, %s, TRUE) RETURNING id",
        (cliente_id, data.asunto, consulta_existente["created_at"].date() if consulta_existente else date.today(), categoria),
    ).fetchone()["id"]
    if consulta_existente:
        consulta_id = str(consulta_existente['id'])
        db.execute("UPDATE comentarios SET estado = %s WHERE id = %s",
                   ('resuelto' if consulta_existente['estado'] == 'atendida' else consulta_existente['estado'], comentario_id))
        db.execute("UPDATE consultas_contacto SET comentario_id = %s, analisis = %s WHERE id = %s",
                   (comentario_id, Jsonb(analisis), consulta_id))
    else:
        consulta_id = db.execute(
            "INSERT INTO consultas_contacto(nombre, empresa, correo, telefono, asunto, comentario_id, analisis) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id::text",
            (data.nombre, data.empresa, data.correo, data.telefono, data.asunto, comentario_id, Jsonb(analisis)),
        ).fetchone()["id"]
    registrar(db, "crear_contacto_landing", "comentarios", comentario_id,
              {"categoria": categoria, "consulta_id": consulta_id})
    return {"id": consulta_id, "mensaje": "Tu consulta ha sido registrada."}
