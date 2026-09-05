from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import get_connection
from app.database.models import LoginRequest
from app.core.security import verificar_password, crear_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login")
def login(data: LoginRequest, db=Depends(get_connection)):
    usuario = db.execute(
        "SELECT nombre, email, password_hash, rol, activo FROM usuarios WHERE email = %s",
        (data.email,),
    ).fetchone()

    if not usuario or not usuario["activo"] or not verificar_password(data.password, usuario["password_hash"]):
        raise HTTPException(401, "Email o contraseña incorrectos")

    token = crear_token(usuario["email"], usuario["rol"])
    return {"access_token": token, "token_type": "bearer", "nombre": usuario["nombre"], "rol": usuario["rol"]}