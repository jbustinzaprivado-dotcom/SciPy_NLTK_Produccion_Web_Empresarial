from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import get_connection
from app.core.security import verificar_password, crear_token, encriptar_password
from pydantic import BaseModel
from typing import Optional
import base64
import numpy as np
import cv2
import json

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequestModel(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str = "usuario"
    face_image: str

class FaceLoginRequest(BaseModel):
    face_image: str
    email: Optional[str] = None


@router.post("/login")
def login(data: LoginRequestModel, db=Depends(get_connection)):
    usuario = db.execute(
        "SELECT nombre, email, password_hash, rol, activo FROM usuarios WHERE email = %s",
        (data.email,),
    ).fetchone()

    if not usuario or not usuario["activo"] or not verificar_password(data.password, usuario["password_hash"]):
        raise HTTPException(401, "Email o contraseña incorrectos")

    token = crear_token(usuario["email"], usuario["rol"])
    return {"access_token": token, "token_type": "bearer", "nombre": usuario["nombre"], "rol": usuario["rol"]}


def extraer_vector_facial(base64_str: str):
    """Extrae un vector numérico robusto basado en la distribución de intensidades de la imagen."""
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    img_bytes = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None
    
    # Redimensionar la imagen a un tamaño estándar (100x100 píxeles)
    img_resized = cv2.resize(img, (100, 100))
    
    # Generar un vector de 25 características dividiendo la imagen en una rejilla 5x5
    vector = []
    cell_size = 20
    for r in range(5):
        for c in range(5):
            sub_region = img_resized[r*cell_size:(r+1)*cell_size, c*cell_size:(c+1)*cell_size]
            vector.append(float(np.mean(sub_region)))
            
    return vector


@router.post("/register")
def register(data: RegisterRequest, db=Depends(get_connection)):
    try:
        existe = db.execute("SELECT email FROM usuarios WHERE email = %s", (data.email,)).fetchone()
        if existe:
            raise HTTPException(400, "El correo ya está registrado")

        # Extraer vector matemático del rostro
        vector = extraer_vector_facial(data.face_image)
        if not vector:
            raise HTTPException(400, "No se pudo extraer vectores del rostro. Intenta con mejor iluminación.")

        password_hash = encriptar_password(data.password)
        vector_json = json.dumps(vector)
        
        db.execute(
            """
            INSERT INTO usuarios (nombre, email, password_hash, rol, activo, face_image, face_vector)
            VALUES (%s, %s, %s, %s, TRUE, %s, %s)
            """,
            (data.nombre, data.email, password_hash, data.rol, data.face_image, vector_json)
        )
        db.commit()

        return {"mensaje": "Usuario registrado exitosamente con vectores biométricos"}
    except Exception as e:
        print("--- ERROR EN /register ---")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(500, f"Error interno en el servidor: {str(e)}")


@router.post("/face-login")
def face_login(data: FaceLoginRequest, db=Depends(get_connection)):
    try:
        current_vector = extraer_vector_facial(data.face_image)
        if not current_vector:
            raise HTTPException(400, "No se detectó un rostro válido en la cámara")

        current_arr = np.array(current_vector)
        usuario_encontrado = None
        
        UMBRAL_DISTANCIA = 300.0 
        
        mejor_distancia = float('inf')
        usuario_mas_cercano = None

        if data.email and data.email.strip() != "":
            usuario = db.execute(
                "SELECT nombre, email, rol, activo, face_vector FROM usuarios WHERE email = %s AND activo = TRUE",
                (data.email.strip(),),
            ).fetchone()
            
            if usuario and usuario["face_vector"]:
                stored_vector = json.loads(usuario["face_vector"])
                stored_arr = np.array(stored_vector)
                distancia = np.linalg.norm(current_arr - stored_arr)
                if distancia <= UMBRAL_DISTANCIA:
                    usuario_encontrado = usuario
        else:
            usuarios = db.execute("SELECT nombre, email, rol, activo, face_vector FROM usuarios WHERE activo = TRUE").fetchall()
            for u in usuarios:
                if u["face_vector"]:
                    try:
                        stored_vector = json.loads(u["face_vector"])
                        stored_arr = np.array(stored_vector)
                        distancia = np.linalg.norm(current_arr - stored_arr)
                        
                        if distancia < mejor_distancia:
                            mejor_distancia = distancia
                            usuario_mas_cercano = u

                        if distancia <= UMBRAL_DISTANCIA:
                            usuario_encontrado = u
                            break
                    except Exception:
                        continue
            
            if not usuario_encontrado and usuario_mas_cercano and mejor_distancia <= UMBRAL_DISTANCIA:
                usuario_encontrado = usuario_mas_cercano

        if not usuario_encontrado:
            raise HTTPException(401, "Rostro no reconocido en el sistema")

        token = crear_token(usuario_encontrado["email"], usuario_encontrado["rol"])
        return {
            "access_token": token,
            "token_type": "bearer",
            "nombre": usuario_encontrado["nombre"],
            "rol": usuario_encontrado["rol"]
        }
    except Exception as e:
        print("--- ERROR EN /face-login ---")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(500, f"Error interno en el servidor: {str(e)}")