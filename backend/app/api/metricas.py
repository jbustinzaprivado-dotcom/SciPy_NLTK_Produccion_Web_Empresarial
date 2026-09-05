from datetime import date
from hashlib import sha256
import json
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from psycopg.types.json import Jsonb
from app.database.connection import get_connection
from app.services.scipy_service import calcular_estadisticas, VERSION
from app.api.deps import requerir_usuario

router = APIRouter(prefix='/api', tags=['Estadísticas'], dependencies=[Depends(requerir_usuario)])


class TiemposInput(BaseModel):
    tiempos: list[Annotated[float, Field(gt=0, le=99999999.99, allow_inf_nan=False)]] = Field(min_length=1, max_length=10000)


@router.get('/metricas-atencion')
def get_metricas(fecha: date | None = None, fecha_inicio: date | None = None,
                fecha_fin: date | None = None, db=Depends(get_connection)):
    if fecha and (fecha_inicio or fecha_fin):
        raise HTTPException(422, 'Usa fecha o un rango, no ambos.')
    inicio, fin = (fecha, fecha) if fecha else (fecha_inicio, fecha_fin)
    if inicio and fin and inicio > fin:
        raise HTTPException(422, 'La fecha inicial no puede superar la final.')
    rows = db.execute('''SELECT id, fecha, tiempo_minutos FROM tiempos_atencion
        WHERE (%s::date IS NULL OR fecha >= %s) AND (%s::date IS NULL OR fecha <= %s)
        ORDER BY fecha, id''', (inicio, inicio, fin, fin)).fetchall()
    # Fingerprint the actual inputs, not only their count: a new or edited attention invalidates it.
    source = {'version': VERSION, 'inicio': inicio, 'fin': fin, 'atenciones': rows}
    huella = sha256(json.dumps(source, default=str, sort_keys=True).encode()).hexdigest()
    saved = db.execute('SELECT id, resultado, created_at FROM metricas_estadisticas WHERE huella=%s', (huella,)).fetchone()
    if not saved:
        result = calcular_estadisticas([row['tiempo_minutos'] for row in rows])
        result.update(fecha_inicio=str(inicio) if inicio else None, fecha_fin=str(fin) if fin else None,
                      origen='atenciones_registradas', atencion_ids=[row['id'] for row in rows])
        saved = db.execute('''INSERT INTO metricas_estadisticas
            (huella, fecha_inicio, fecha_fin, cantidad_registros, resultado) VALUES (%s,%s,%s,%s,%s)
            ON CONFLICT (huella) DO UPDATE SET huella=EXCLUDED.huella
            RETURNING id, resultado, created_at''', (huella, inicio, fin, len(rows), Jsonb(result))).fetchone()
    db.commit()
    return {**saved['resultado'], 'resultado_id': saved['id'], 'calculado_en': saved['created_at']}


@router.post('/metricas-atencion')
def calcular_personalizadas(data: TiemposInput):
    # Manual exercises are deliberately not mixed into persisted attention history.
    return {**calcular_estadisticas(data.tiempos), 'origen': 'valores_personalizados'}


@router.get('/metricas-atencion/historial')
def historial(limit: int = Query(20, ge=1, le=100), db=Depends(get_connection)):
    return db.execute('''SELECT id AS resultado_id, fecha_inicio, fecha_fin, cantidad_registros,
        resultado, created_at AS calculado_en FROM metricas_estadisticas
        ORDER BY id DESC LIMIT %s''', (limit,)).fetchall()
