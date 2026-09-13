from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from app.database.connection import get_connection
from app.database.models import Name
from app.api.deps import requerir_usuario
from app.services.contacto_service import registrar_contacto
from app.services.nltk_service import explicar_categoria

router = APIRouter(prefix="/api/contacto", tags=["Contacto"])

SELECT_CONSULTAS = """SELECT q.id::text, q.nombre, q.empresa, q.correo, q.telefono,
q.asunto, q.estado, q.created_at, q.comentario_id::text, q.analisis, c.categoria
FROM consultas_contacto q LEFT JOIN comentarios c ON c.id = q.comentario_id"""


class EstadoConsulta(BaseModel):
    model_config = ConfigDict(extra="forbid")
    estado: Literal['pendiente', 'en_atencion', 'atendida']


@router.get("", dependencies=[Depends(requerir_usuario)])
def listar_consultas(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), db=Depends(get_connection)):
    rows = db.execute(SELECT_CONSULTAS + " ORDER BY q.created_at DESC, q.id DESC LIMIT %s OFFSET %s", (limit, offset)).fetchall()
    return [{**row, "motivo_categoria": explicar_categoria(row['asunto'], row['categoria'])} for row in rows]


@router.patch("/{consulta_id}", dependencies=[Depends(requerir_usuario)])
def actualizar_consulta(consulta_id: int, data: EstadoConsulta, db=Depends(get_connection)):
    estado_comentario = 'resuelto' if data.estado == 'atendida' else data.estado
    db.execute("UPDATE comentarios SET estado = %s WHERE id = "
               "(SELECT comentario_id FROM consultas_contacto WHERE id = %s)",
               (estado_comentario, consulta_id))
    result = db.execute("UPDATE consultas_contacto SET estado = %s WHERE id = %s RETURNING id", (data.estado, consulta_id)).fetchone()
    if not result:
        raise HTTPException(404, "Consulta no encontrada")
    result = db.execute(SELECT_CONSULTAS + " WHERE q.id = %s", (consulta_id,)).fetchone()
    db.commit()
    return {**result, "motivo_categoria": explicar_categoria(result["asunto"], result["categoria"])}


class ConsultaNueva(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    nombre: Name
    empresa: str = Field(default="", max_length=200)
    correo: str = Field(max_length=200, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    telefono: str = Field(default="", max_length=50)
    asunto: str = Field(min_length=10, max_length=5000)


@router.post("", status_code=201)
def crear_consulta(data: ConsultaNueva, db=Depends(get_connection)):
    result = registrar_contacto(db, data)
    db.commit()
    return result
