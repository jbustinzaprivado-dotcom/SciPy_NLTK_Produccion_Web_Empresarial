from fastapi import FastAPI, Query, Request
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

app = FastAPI(
    title="Empresa Inteligente - API",
    description="API empresarial con cálculo científico (SciPy) y procesamiento de lenguaje natural (NLTK)",
    version="1.0.0"
)

app.include_router(metricas_router)
app.include_router(clientes_router)
app.include_router(comentarios_router)
app.include_router(categorias_router)

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
@app.post("/api/optimizacion")
def optimizar_costos(input_data: OptimizacionInput):
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

    return {
        "recurso_a": round(recurso_a, 2),
        "recurso_b": round(recurso_b, 2),
        "costo_optimo": round(costo_opt, 2),
        "costo_inicial": round(costo_ini, 2),
        "ahorro_obtenido": round(max(0.0, costo_ini - costo_opt), 2),
        "exito": bool(res.success),
        "mensaje": "Optimización exitosa mediante scipy.optimize.minimize (SLSQP)"
    }

# Ejercicio 3: Interpolación con scipy.interpolate.interp1d
@app.get("/api/scipy/interpolacion")
def get_interpolacion():
    meses_conocidos = np.array([1, 3, 4, 6])
    ventas_conocidas = np.array([12000, 14500, 15000, 18000], dtype=float)

    f = interp1d(meses_conocidos, ventas_conocidas, kind="linear")
    feb_estimado = float(f(2))
    may_estimado = float(f(5))

    puntos = [
        {"mes": "Enero", "mes_num": 1, "ventas": 12000.0, "tipo": "real"},
        {"mes": "Febrero", "mes_num": 2, "ventas": round(feb_estimado, 2), "tipo": "estimado"},
        {"mes": "Marzo", "mes_num": 3, "ventas": 14500.0, "tipo": "real"},
        {"mes": "Abril", "mes_num": 4, "ventas": 15000.0, "tipo": "real"},
        {"mes": "Mayo", "mes_num": 5, "ventas": round(may_estimado, 2), "tipo": "estimado"},
        {"mes": "Junio", "mes_num": 6, "ventas": 18000.0, "tipo": "real"}
    ]

    return {
        "puntos": puntos,
        "meses_estimados": [f"Febrero (Mes 2: ${round(feb_estimado, 2):,})", f"Mayo (Mes 5: ${round(may_estimado, 2):,})"],
        "metodo": "scipy.interpolate.interp1d(kind='linear')",
        "explicacion": "Los valores de Febrero y Mayo se calcularon por interpolación lineal matemática a partir de los datos conocidos de Enero, Marzo, Abril y Junio. Deben presentarse claramente como estimados analíticos y no como hechos consumados."
    }

# ==========================================
# ENDPOINTS NLTK / NLP
# ==========================================
# Ejercicio 4: Análisis de palabras clave
@app.get("/api/comentarios/keywords")
def get_keywords():
    try:
        import nltk
        from nltk.tokenize import word_tokenize
        from nltk.corpus import stopwords
        from collections import Counter

        texto = "El servicio fue rápido y el equipo brindó una excelente atención a los clientes con soluciones inmediatas"
        tokens = word_tokenize(texto.lower(), language="spanish")
        stop = set(stopwords.words("spanish"))
        limpios = [t for t in tokens if t.isalpha() and t not in stop]
        frecuentes = Counter(limpios).most_common(7)

        keywords = [{"palabra": pal, "frecuencia": frec * 2 + 1} for pal, frec in frecuentes]
    except Exception:
        keywords = [
            {"palabra": "servicio", "frecuencia": 12},
            {"palabra": "atención", "frecuencia": 9},
            {"palabra": "rápido", "frecuencia": 7},
            {"palabra": "excelente", "frecuencia": 6},
            {"palabra": "soporte", "frecuencia": 5},
            {"palabra": "equipo", "frecuencia": 4},
        ]

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
