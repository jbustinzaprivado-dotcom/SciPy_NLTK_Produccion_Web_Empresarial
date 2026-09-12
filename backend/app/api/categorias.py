from fastapi import APIRouter, Depends
from app.database.connection import get_connection
from app.database.models import CategoriaNueva
from app.services.auditoria_service import registrar
from app.api.deps import requerir_usuario

router = APIRouter(prefix="/api/categorias", tags=["Categorías"], dependencies=[Depends(requerir_usuario)])

@router.get("")
def listar_categorias(db=Depends(get_connection)):
    return db.execute(
        "SELECT id::text, nombre, descripcion, activo FROM categorias WHERE activo ORDER BY nombre"
    ).fetchall()


@router.post("", status_code=201)
def crear_categoria(data: CategoriaNueva, db=Depends(get_connection)):
    result = db.execute(
        "INSERT INTO categorias(nombre, descripcion) VALUES (%s, %s) RETURNING id::text, nombre, descripcion, activo",
        (data.nombre, data.descripcion),
    ).fetchone()
    registrar(db, "crear_categoria", "categorias", int(result["id"]), {"nombre": data.nombre})
    db.commit()
    return result