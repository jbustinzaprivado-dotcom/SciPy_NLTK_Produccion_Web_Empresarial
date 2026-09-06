from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import get_connection
from app.database.models import ClienteNuevo
from app.services.auditoria_service import registrar
from app.api.deps import requerir_usuario

router = APIRouter(prefix="/api/clientes", tags=["Clientes"], dependencies=[Depends(requerir_usuario)])
SELECT_CLIENTES = """SELECT c.id::text, c.nombre, c.empresa, c.correo, c.telefono,
    count(t.id)::int AS total_atenciones,
    coalesce(avg(t.tiempo_minutos), 0)::float8 AS tiempo_promedio_min
    FROM clientes c LEFT JOIN tiempos_atencion t ON t.cliente_id = c.id"""


@router.get("")
def listar_clientes(db=Depends(get_connection)):
    return db.execute(SELECT_CLIENTES + " GROUP BY c.id ORDER BY c.nombre, c.id").fetchall()


@router.get("/{cliente_id}")
def obtener_cliente(cliente_id: int, db=Depends(get_connection)):
    result = db.execute(SELECT_CLIENTES + " WHERE c.id = %s GROUP BY c.id", (cliente_id,)).fetchone()
    if not result:
        raise HTTPException(404, "Cliente no encontrado")
    return result


@router.post("", status_code=201)
def crear_cliente(data: ClienteNuevo, db=Depends(get_connection)):
    result = db.execute("INSERT INTO clientes(nombre, empresa, correo, telefono) VALUES (%s, %s, %s, %s) RETURNING id::text, nombre, empresa, correo, telefono", (data.nombre, data.empresa, data.correo, data.telefono)).fetchone()
    registrar(db, "crear_cliente", "clientes", int(result["id"]), {"nombre": data.nombre})
    db.commit()
    return {**result, "total_atenciones": 0, "tiempo_promedio_min": 0}
@router.get("/{cliente_id}/historial")
def historial_cliente(cliente_id: int, db=Depends(get_connection)):
    # Junta los datos del cliente con todos sus comentarios y tiempos de atencion registrados
    cliente = db.execute(SELECT_CLIENTES + " WHERE c.id = %s GROUP BY c.id", (cliente_id,)).fetchone()
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado")

    comentarios = db.execute(
        "SELECT id::text, contenido, fecha, estado, categoria FROM comentarios "
        "WHERE cliente_id = %s ORDER BY fecha DESC, id DESC",
        (cliente_id,),
    ).fetchall()

    tiempos = db.execute(
        "SELECT id::text, fecha, tiempo_minutos FROM tiempos_atencion "
        "WHERE cliente_id = %s ORDER BY fecha DESC, id DESC",
        (cliente_id,),
    ).fetchall()

    return {"cliente": cliente, "comentarios": comentarios, "tiempos_atencion": tiempos}
