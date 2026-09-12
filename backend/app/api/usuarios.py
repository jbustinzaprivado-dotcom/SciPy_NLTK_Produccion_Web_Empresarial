# Endpoint de gestion de usuarios: solo accesible para administradores.
from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import get_connection
from app.database.models import UsuarioNuevo, EstadoUsuario
from app.core.security import hash_password
from app.services.auditoria_service import registrar
from app.api.deps import requerir_admin

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"], dependencies=[Depends(requerir_admin)])


@router.get("")
def listar_usuarios(db=Depends(get_connection)):
    return db.execute(
        "SELECT id::text, nombre, email, rol, activo, created_at FROM usuarios ORDER BY nombre"
    ).fetchall()


@router.post("", status_code=201)
def crear_usuario(data: UsuarioNuevo, db=Depends(get_connection)):
    existente = db.execute("SELECT id FROM usuarios WHERE email = %s", (data.email,)).fetchone()
    if existente:
        raise HTTPException(409, "Ya existe un usuario con ese email")

    result = db.execute(
        "INSERT INTO usuarios(nombre, email, password_hash, rol) VALUES (%s, %s, %s, %s) "
        "RETURNING id::text, nombre, email, rol, activo, created_at",
        (data.nombre, data.email, hash_password(data.password), data.rol),
    ).fetchone()
    registrar(db, "crear_usuario", "usuarios", int(result["id"]), {"email": data.email, "rol": data.rol})
    db.commit()
    return result


@router.patch("/{usuario_id}/estado")
def cambiar_estado(usuario_id: int, data: EstadoUsuario, db=Depends(get_connection)):
    result = db.execute(
        "UPDATE usuarios SET activo = %s WHERE id = %s "
        "RETURNING id::text, nombre, email, rol, activo, created_at",
        (data.activo, usuario_id),
    ).fetchone()
    if not result:
        raise HTTPException(404, "Usuario no encontrado")
    registrar(db, "cambiar_estado_usuario", "usuarios", usuario_id, {"activo": data.activo})
    db.commit()
    return result