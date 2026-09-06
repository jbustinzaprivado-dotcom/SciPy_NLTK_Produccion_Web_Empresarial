from fastapi import FastAPI, Query, Request, Depends
from datetime import date, timedelta
from app.database.connection import get_connection
from app.api.deps import requerir_usuario
from fastapi.responses import JSONResponse
import logging
import psycopg
from app.api.metricas import router as metricas_router
from app.api.clientes import router as clientes_router
from app.api.comentarios import router as comentarios_router
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from scipy.optimize import minimize
from scipy.interpolate import interp1d
from app.api.categorias import router as categorias_router
from app.api.auth import router as auth_router
from app.api.auditoria import router as auditoria_router
from app.api.usuarios import router as usuarios_router
from app.api.reportes import router as reportes_router
from app.api.tiempos_atencion import router as tiempos_atencion_router
from psycopg.types.json import Jsonb

app = FastAPI(
    title="Empresa Inteligente - API",
    description="API empresarial con cálculo científico (SciPy) y procesamiento de lenguaje natural (NLTK)",
    version="1.0.0"
)

app.include_router(metricas_router)
app.include_router(clientes_router)
app.include_router(comentarios_router)
app.include_router(categorias_router)
app.include_router(auth_router)
app.include_router(auditoria_router)
app.include_router(usuarios_router)
app.include_router(reportes_router)
app.include_router(tiempos_atencion_router)

@app.exception_handler(psycopg.Error)
async def database_error(request: Request, exc: psycopg.Error):
    logging.getLogger(__name__).error("Database failure: %s", type(exc).__name__)
    return JSONResponse(status_code=503, content={"detail": "Base de datos no disponible. Intenta nuevamente."})


# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# MODELOS PYDANTIC
# ==========================================
class OptimizacionInput(BaseModel):
    capacidad_minima: float = 40.0
    costo_base_a: float = 80.0
    costo_base_b: float = 50.0

class MensajeInput(BaseModel):
    mensaje: str

# ==========================================
# ENDPOINTS BÁSICOS Y SCIPY
# ==========================================
@app.get("/")
def root():
    return {
        "status": "online",
        "proyecto": "Empresa Inteligente",
        "librerias": ["FastAPI", "SciPy", "NLTK", "NumPy"]
    }

# Ejercicio 2: Optimización de recursos con scipy.optimize.minimize
# Ejercicio 2: Optimización de recursos con scipy.optimize.minimize
@app.post("/api/optimizacion", dependencies=[Depends(requerir_usuario)])
def optimizar_costos(input_data: OptimizacionInput, db=Depends(get_connection)):
    # Función de costo: 80*recurso_a + 50*recurso_b + 10*(recurso_a-3)**2
    def costo(x):
        a, b = x
        return input_data.costo_base_a * a + input_data.costo_base_b * b + 10 * (a - 3)**2

    # Restricción: 10*a + 5*b >= capacidad_minima -> 10*a + 5*b - capacidad_minima >= 0
    restriccion = {
        "type": "ineq",
        "fun": lambda x: 10 * x[0] + 5 * x[1] - input_data.capacidad_minima
    }

    x0 = [2.0, 4.0]
    costo_ini = float(costo(x0))
    res = minimize(costo, x0=x0, bounds=[(0, 10), (0, 10)], constraints=[restriccion], method='SLSQP')

    recurso_a = float(res.x[0])
    recurso_b = float(res.x[1])
    costo_opt = float(res.fun)

    resultado = {
        "recurso_a": round(recurso_a, 2),
        "recurso_b": round(recurso_b, 2),
        "costo_optimo": round(costo_opt, 2),
        "costo_inicial": round(costo_ini, 2),
        "ahorro_obtenido": round(max(0.0, costo_ini - costo_opt), 2),
        "exito": bool(res.success),
        "mensaje": "Optimización exitosa mediante scipy.optimize.minimize (SLSQP)"
    }

    # Antes este resultado se calculaba y se perdía; ahora queda guardado
    # para poder mostrarlo despues en un historial.
    db.execute(
        "INSERT INTO optimizaciones(nombre, parametros_entrada, resultado, costo_inicial, costo_optimizado, estado) "
        "VALUES (%s, %s, %s, %s, %s, 'completado')",
        ("Optimización de recursos", Jsonb(input_data.model_dump()), Jsonb(resultado), costo_ini, costo_opt),
    )
    db.commit()

    return resultado


@app.get("/api/optimizacion/historial", dependencies=[Depends(requerir_usuario)])
def historial_optimizacion(limit: int = Query(20, ge=1, le=100), db=Depends(get_connection)):
    return db.execute(
        "SELECT id::text, nombre, parametros_entrada, resultado, costo_inicial, costo_optimizado, estado, created_at "
        "FROM optimizaciones ORDER BY id DESC LIMIT %s",
        (limit,),
    ).fetchall()

# Ejercicio 3: Interpolación con scipy.interpolate.interp1d
# Antes usaba "ventas mensuales" de ejemplo (el PDF trae ese caso genérico),
# pero este proyecto no tiene tabla de ventas. Lo adaptamos al dato real que
# sí existe acá: el tiempo promedio de atención por día, rellenando los días
# sin registros mediante interpolación lineal.
@app.get("/api/scipy/interpolacion", dependencies=[Depends(requerir_usuario)])
def get_interpolacion(dias: int = Query(14, ge=2, le=90), db=Depends(get_connection)):
    hoy = date.today()
    desde = hoy - timedelta(days=dias - 1)  # rango de N días hacia atrás, incluyendo hoy

    # Traemos el promedio de tiempo_minutos por día, solo para los días que SÍ tienen registros
    filas = db.execute(
        "SELECT fecha, avg(tiempo_minutos)::float8 AS promedio FROM tiempos_atencion "
        "WHERE fecha BETWEEN %s AND %s GROUP BY fecha ORDER BY fecha",
        (desde, hoy),
    ).fetchall()

    reales = {fila["fecha"]: fila["promedio"] for fila in filas}

    # Con menos de 2 puntos reales no se puede trazar ninguna interpolación
    if len(reales) < 2:
        return {
            "puntos": [],
            "metodo": "scipy.interpolate.interp1d(kind='linear')",
            "explicacion": "Se necesitan al menos 2 días con atenciones registradas en el rango para poder interpolar los huecos.",
        }

    # scipy.interpolate necesita números, no fechas: convertimos cada fecha
    # conocida a "cuántos días pasaron desde el inicio del rango" (0, 1, 2...)
    fechas_conocidas = sorted(reales.keys())
    x_conocidos = [(f - desde).days for f in fechas_conocidas]
    y_conocidos = [reales[f] for f in fechas_conocidas]

    f = interp1d(x_conocidos, y_conocidos, kind="linear")

    puntos = []
    for i in range(dias):
        fecha = desde + timedelta(days=i)
        if fecha in reales:
            puntos.append({"fecha": str(fecha), "tiempo_promedio": round(reales[fecha], 2), "tipo": "real"})
        elif x_conocidos[0] <= i <= x_conocidos[-1]:
            # Día sin registro, pero dentro del rango cubierto por datos reales: se estima
            estimado = float(f(i))
            puntos.append({"fecha": str(fecha), "tiempo_promedio": round(estimado, 2), "tipo": "estimado"})
        # Los días fuera del rango de datos reales (antes del primero o después
        # del último) se omiten: interp1d no puede extrapolar con confianza ahí.

    return {
        "puntos": puntos,
        "metodo": "scipy.interpolate.interp1d(kind='linear')",
        "explicacion": "Los días sin atenciones registradas dentro del rango se estiman por interpolación lineal a partir de los días con datos reales más cercanos. Deben presentarse como estimados, no como hechos consumados.",
    }


# ==========================================
# ENDPOINTS NLTK / NLP
# ==========================================
# Ejercicio 4: Análisis de palabras clave
@app.get("/api/comentarios/keywords", dependencies=[Depends(requerir_usuario)])
def get_keywords(db=Depends(get_connection)):
    from nltk.tokenize import word_tokenize
    from nltk.corpus import stopwords
    from collections import Counter

    filas = db.execute("SELECT contenido FROM comentarios ORDER BY id DESC LIMIT 200").fetchall()
    texto = " ".join(fila["contenido"] for fila in filas)

    if not texto.strip():
        return {"keywords": [], "total_palabras_clave": 0}

    tokens = word_tokenize(texto.lower(), language="spanish")
    stop = set(stopwords.words("spanish"))
    limpios = [t for t in tokens if t.isalpha() and t not in stop]
    frecuentes = Counter(limpios).most_common(7)
    keywords = [{"palabra": pal, "frecuencia": frec} for pal, frec in frecuentes]

    return {"keywords": keywords, "total_palabras_clave": len(keywords)}

# Ejercicio 5: Clasificador de Mensajes
@app.post("/api/nltk/clasificar")
def clasificar_ticket(data: MensajeInput):
    msg = data.mensaje.lower()
    palabras_reclamo = ["demora", "retraso", "queja", "reclamo", "mal", "pésimo", "lento", "error", "falla"]
    palabras_ventas = ["precio", "costo", "cotizar", "comprar", "planes", "licencias", "venta", "adquirir"]
    palabras_soporte = ["ayuda", "problema", "computadora", "servidor", "acceso", "configurar", "soporte", "sistema"]

    if any(p in msg for p in palabras_reclamo):
        cat = "reclamo"
        conf = 0.94
        encontradas = [p for p in palabras_reclamo if p in msg]
    elif any(p in msg for p in palabras_ventas):
        cat = "ventas"
        conf = 0.91
        encontradas = [p for p in palabras_ventas if p in msg]
    else:
        cat = "soporte"
        conf = 0.86
        encontradas = [p for p in palabras_soporte if p in msg] or ["general"]

    return {
        "mensaje": data.mensaje,
        "categoria": cat,
        "confianza": conf,
        "palabras_clave_detectadas": encontradas
    }

# Ejercicio 6: Buscador inteligente de servicios
@app.get("/api/nltk/buscar")
def buscar_servicios(q: str = Query("")):
    servicios = [
        {
            "id": 1,
            "nombre": "Mantenimiento Preventivo y Correctivo",
            "categoria": "Soporte Técnico",
            "descripcion": "Atención a computadoras, laptops e infraestructura de oficina.",
            "etiquetas": ["computadora", "laptop", "mantenimiento", "ayuda", "hardware"]
        },
        {
            "id": 2,
            "nombre": "Desarrollo de Software y APIs",
            "categoria": "Tecnología",
            "descripcion": "Portales web empresariales y microservicios con FastAPI y React.",
            "etiquetas": ["web", "software", "api", "desarrollo", "sistema"]
        },
        {
            "id": 3,
            "nombre": "Ciencia de Datos y Procesamiento NLP",
            "categoria": "Analítica",
            "descripcion": "Modelos estadísticos con SciPy y análisis de lenguaje con NLTK.",
            "etiquetas": ["datos", "scipy", "nltk", "analisis", "estadistica"]
        },
        {
            "id": 4,
            "nombre": "Optimización Operativa y de Costos",
            "categoria": "Consultoría",
            "descripcion": "Modelos matemáticos de programación no lineal y optimización de recursos.",
            "etiquetas": ["costo", "optimizacion", "recursos", "eficiencia"]
        }
    ]

    tokens_q = [t.lower() for t in q.split() if len(t) > 2]
    if not tokens_q:
        return servicios

    resultados = []
    for s in servicios:
        score = sum(2 for tag in s["etiquetas"] if any(t in tag for t in tokens_q))
        if any(t in s["nombre"].lower() for t in tokens_q):
            score += 3
        if score > 0:
            resultados.append({**s, "coincidencia": score})

    resultados.sort(key=lambda x: x.get("coincidencia", 0), reverse=True)
    return resultados or servicios[:2]

# ==========================================
# RETO FINAL: COMENTARIOS Y TIEMPOS
# ==========================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
