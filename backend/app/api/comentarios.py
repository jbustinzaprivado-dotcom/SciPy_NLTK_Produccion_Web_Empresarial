from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import get_connection
from app.database.models import ComentarioNuevo
from app.services.nltk_service import clasificar_texto
from app.services.auditoria_service import registrar
from app.api.deps import requerir_usuario

router = APIRouter(prefix="/api/comentarios", tags=["Comentarios"], dependencies=[Depends(requerir_usuario)])
SELECT_COMENTARIOS = """
SELECT c.id::text, c.cliente_id, cl.nombre AS cliente_nombre, c.fecha,
       c.contenido AS comentario, c.estado, c.categoria, c.procesado,
       t.tiempo_minutos::float8 AS tiempo_atencion_minutos
FROM comentarios c JOIN clientes cl ON cl.id = c.cliente_id
JOIN tiempos_atencion t ON t.comentario_id = c.id
"""


@router.get("")
def listar_comentarios(fecha: date | None = None, cliente_id: int | None = None, db=Depends(get_connection)):
    return db.execute(SELECT_COMENTARIOS + " WHERE (%s::date IS NULL OR c.fecha = %s) AND (%s::bigint IS NULL OR c.cliente_id = %s) ORDER BY c.fecha DESC, c.id DESC", (fecha, fecha, cliente_id, cliente_id)).fetchall()


@router.post("", status_code=201)
def crear_comentario(data: ComentarioNuevo, db=Depends(get_connection)):
    cliente_id = data.cliente_id
    if cliente_id is not None:
        if not db.execute("SELECT id FROM clientes WHERE id = %s", (cliente_id,)).fetchone():
            raise HTTPException(404, "Cliente no encontrado")
    else:
        db.execute("SELECT pg_advisory_xact_lock(hashtextextended(lower(%s), 0))", (data.cliente_nombre,))
        matches = db.execute("SELECT id FROM clientes WHERE lower(nombre) = lower(%s)", (data.cliente_nombre,)).fetchall()
        if len(matches) > 1:
            raise HTTPException(409, "Hay clientes con el mismo nombre; indica cliente_id")
        cliente_id = matches[0]["id"] if matches else db.execute("INSERT INTO clientes(nombre) VALUES (%s) RETURNING id", (data.cliente_nombre,)).fetchone()["id"]
    categoria, confianza = clasificar_texto(data.comentario)
    comment_id = db.execute(
        "INSERT INTO comentarios(cliente_id, contenido, fecha, categoria, procesado) VALUES (%s, %s, %s, %s, TRUE) RETURNING id",
        (cliente_id, data.comentario, data.fecha, categoria),
    ).fetchone()["id"]
    db.execute("INSERT INTO tiempos_atencion(cliente_id, comentario_id, tiempo_minutos, fecha) VALUES (%s, %s, %s, %s)", (cliente_id, comment_id, data.tiempo_atencion_minutos, data.fecha))
    registrar(db, "crear_comentario", "comentarios", comment_id, {"categoria": categoria})
    result = db.execute(SELECT_COMENTARIOS + " WHERE c.id = %s", (comment_id,)).fetchone()
    db.commit()
    return result
