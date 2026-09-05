from fastapi import Depends, HTTPException, Header
from app.core.security import decodificar_token


def requerir_usuario(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Falta el token de autenticación")

    token = authorization.removeprefix("Bearer ").strip()
    payload = decodificar_token(token)

    if payload is None:
        raise HTTPException(401, "Token inválido o vencido")

    return payload