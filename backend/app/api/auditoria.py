from fastapi import APIRouter, Depends, Query
from app.database.connection import get_connection
from app.api.deps import requerir_usuario

router = APIRouter(prefix="/api/auditoria", tags=["Auditoría"], dependencies=[Depends(requerir_usuario)])


@router.get("")
def listar_auditoria(limit: int = Query(50, ge=1, le=200), db=Depends(get_connection)):
    # Los registros mas recientes primero; "limit" evita traer miles de filas de una
    return db.execute(
        "SELECT id::text, accion, tabla, registro_id, detalles, created_at "
        "FROM auditoria ORDER BY id DESC LIMIT %s",
        (limit,),
    ).fetchall()