from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from app.database.connection import get_connection
from app.database.models import Name
from app.api.deps import requerir_usuario

router = APIRouter(prefix="/api/contacto", tags=["Contacto"])

SELECT_CONSULTAS = "SELECT id::text, nombre, empresa, correo, telefono, asunto, estado, created_at FROM consultas_contacto"


class EstadoConsulta(BaseModel):
    model_config = ConfigDict(extra="forbid")
    estado: Literal['pendiente', 'en_atencion', 'atendida']


@router.get("", dependencies=[Depends(requerir_usuario)])
def listar_consultas(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), db=Depends(get_connection)):
    return db.execute(SELECT_CONSULTAS + " ORDER BY created_at DESC, id DESC LIMIT %s OFFSET %s", (limit, offset)).fetchall()


@router.patch("/{consulta_id}", dependencies=[Depends(requerir_usuario)])
def actualizar_consulta(consulta_id: int, data: EstadoConsulta, db=Depends(get_connection)):
    result = db.execute("UPDATE consultas_contacto SET estado = %s WHERE id = %s RETURNING id", (data.estado, consulta_id)).fetchone()
    if not result:
        raise HTTPException(404, "Consulta no encontrada")
    result = db.execute(SELECT_CONSULTAS + " WHERE id = %s", (consulta_id,)).fetchone()
    db.commit()
    return result


class ConsultaNueva(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    nombre: Name
    empresa: str = Field(default="", max_length=200)
    correo: str = Field(max_length=200, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    telefono: str = Field(default="", max_length=50)
    asunto: str = Field(min_length=10, max_length=5000)


@router.post("", status_code=201)
def crear_consulta(data: ConsultaNueva, db=Depends(get_connection)):
    result = db.execute(
        """INSERT INTO consultas_contacto(nombre, empresa, correo, telefono, asunto)
        VALUES (%s, %s, %s, %s, %s) RETURNING id::text""",
        (data.nombre, data.empresa, data.correo, data.telefono, data.asunto),
    ).fetchone()
    db.commit()
    return {"id": result["id"], "mensaje": "Tu consulta ha sido registrada."}
