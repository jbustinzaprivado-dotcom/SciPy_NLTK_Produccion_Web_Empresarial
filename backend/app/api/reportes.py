# Endpoint de reportes consolidados: junta datos reales de clientes, comentarios
# (con su categoria clasificada por NLTK) y tiempos de atencion (analizados con SciPy).
from fastapi import APIRouter, Depends
from app.database.connection import get_connection
from app.api.deps import requerir_usuario
from app.services.scipy_service import calcular_estadisticas

router = APIRouter(prefix="/api/reportes", tags=["Reportes"], dependencies=[Depends(requerir_usuario)])


@router.get("")
def get_reporte(db=Depends(get_connection)):
    total_clientes = db.execute("SELECT COUNT(*) AS total FROM clientes").fetchone()["total"]
    total_comentarios = db.execute("SELECT COUNT(*) AS total FROM comentarios").fetchone()["total"]
    total_atenciones = db.execute("SELECT COUNT(*) AS total FROM tiempos_atencion").fetchone()["total"]

    por_estado = db.execute(
        "SELECT estado, COUNT(*) AS total FROM comentarios GROUP BY estado ORDER BY total DESC"
    ).fetchall()

    por_categoria = db.execute(
        "SELECT categoria, COUNT(*) AS total FROM comentarios "
        "WHERE categoria IS NOT NULL GROUP BY categoria ORDER BY total DESC"
    ).fetchall()

    procesamiento = db.execute(
        "SELECT COUNT(*) FILTER (WHERE procesado) AS procesados, "
        "COUNT(*) FILTER (WHERE NOT procesado) AS sin_procesar FROM comentarios"
    ).fetchone()

    tiempos = db.execute("SELECT tiempo_minutos FROM tiempos_atencion").fetchall()
    estadisticas = calcular_estadisticas([row["tiempo_minutos"] for row in tiempos])

    return {
        "atencion": {
            "total_clientes": total_clientes,
            "total_comentarios": total_comentarios,
            "total_atenciones_registradas": total_atenciones,
            "comentarios_por_estado": por_estado,
        },
        "nlp": {
            "comentarios_por_categoria": por_categoria,
            "total_procesados": procesamiento["procesados"],
            "total_sin_procesar": procesamiento["sin_procesar"],
        },
        "estadisticas": estadisticas,
    }
