# Listado de tiempos de atencion registrados, con el nombre del cliente asociado.
from fastapi import APIRouter, Depends, Query
from app.database.connection import get_connection
from app.api.deps import requerir_usuario

router = APIRouter(prefix="/api/tiempos-atencion", tags=["Tiempos de Atención"], dependencies=[Depends(requerir_usuario)])


@router.get("")
def listar_tiempos(limit: int = Query(100, ge=1, le=500), db=Depends(get_connection)):
    return db.execute(
        "SELECT t.id::text, t.fecha, t.tiempo_minutos::float8, c.nombre AS cliente_nombre "
        "FROM tiempos_atencion t JOIN clientes c ON c.id = t.cliente_id "
        "ORDER BY t.fecha DESC, t.id DESC LIMIT %s",
        (limit,),
    ).fetchall()