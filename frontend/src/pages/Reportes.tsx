import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

const CRITERIOS = [
  { criterio: 'Conceptos de SciPy',  peso: '15%', evidencia: 'Explicacion y seleccion correcta de modulos.' },
  { criterio: 'Conceptos de NLTK',   peso: '15%', evidencia: 'Flujo de NLP y uso de tecnicas.' },
  { criterio: 'Ejercicios SciPy',    peso: '25%', evidencia: 'Correcta aplicacion y resultados coherentes.' },
  { criterio: 'Ejercicios NLTK',     peso: '25%', evidencia: 'Implementacion funcional con datos reales.' },
  { criterio: 'Proyecto integrador', peso: '20%', evidencia: 'Web funcional que combina SciPy y NLTK.' },
];

const CAPAS = [
  { capa: 'Frontend',      desc: 'React / HTML / CSS: dashboard, formularios, tablas y alertas.' },
  { capa: 'API',           desc: 'FastAPI: endpoints para metricas, optimizacion y NLP.' },
  { capa: 'SciPy',         desc: 'Estadistica, optimizacion e interpolacion de datos numericos.' },
  { capa: 'NLTK',          desc: 'Tokenizacion, limpieza, frecuencia y clasificacion de texto.' },
  { capa: 'Base de datos', desc: 'Almacena solicitudes, metricas y resultados procesados.' },
];

const PRACTICAS = [
  'Separar frontend, API, logica de negocio y acceso a datos.',
  'Validar y sanitizar toda entrada proveniente del navegador.',
  'No ejecutar calculos pesados directamente en el navegador.',
  'Controlar versiones de dependencias y fijar versiones compatibles.',
  'Registrar errores y metricas, evitando almacenar datos sensibles innecesarios.',
  'En NLP, documentar el idioma, los recursos descargados y las decisiones de limpieza.',
  'Para funciones criticas, agregar pruebas unitarias con datos reales anonimizados.',
];

// Forma de la respuesta de GET /api/reportes
interface ReporteData {
  atencion: {
    total_clientes: number;
    total_comentarios: number;
    total_atenciones_registradas: number;
    comentarios_por_estado: { estado: string; total: number }[];
  };
  nlp: {
    comentarios_por_categoria: { categoria: string; total: number }[];
    total_procesados: number;
    total_sin_procesar: number;
  };
  estadisticas: {
    media: number | null;
    mediana: number | null;
    desviacion_estandar: number | null;
    minimo: number | null;
    maximo: number | null;
    total_registros: number;
    interpretacion: string;
  };
}

export default function Reportes() {
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    requestJson<ReporteData>('/api/reportes')
      .then(setReporte)
      .catch(() => setError('No se pudo cargar el reporte. Revisa tu conexión.'));
  }, []);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={pageHeader}>
        <div>
          <h2 style={h2}>Reporte Ejecutivo Consolidado</h2>
          <p style={sub}>Proyecto integrador — Portal web empresarial inteligente (SENATI)</p>
        </div>
      </header>

      {error && <p role="alert">{error}</p>}

      {/* Datos reales: Atencion / NLP / Estadisticas */}
      <section>
        <h3 style={sH3}>Resumen en Tiempo Real</h3>
        {!reporte && !error ? (
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Cargando datos...</p>
        ) : reporte && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Atencion */}
            <div style={card}>
              <h4 style={h4}>Atención</h4>
              <KpiRow label="Clientes registrados"        value={reporte.atencion.total_clientes} />
              <KpiRow label="Comentarios recibidos"       value={reporte.atencion.total_comentarios} />
              <KpiRow label="Atenciones registradas"      value={reporte.atencion.total_atenciones_registradas} />
              {reporte.atencion.comentarios_por_estado.length > 0 && (
                <div style={{ marginTop: '0.6rem' }}>
                  <span style={miniLabel}>Por estado</span>
                  {reporte.atencion.comentarios_por_estado.map((e) => (
                    <KpiRow key={e.estado} label={e.estado} value={e.total} />
                  ))}
                </div>
              )}
            </div>

            {/* NLP */}
            <div style={card}>
              <h4 style={h4}>Inteligencia NLP</h4>
              <KpiRow label="Procesados por NLTK"  value={reporte.nlp.total_procesados} />
              <KpiRow label="Sin procesar"          value={reporte.nlp.total_sin_procesar} />
              {reporte.nlp.comentarios_por_categoria.length > 0 && (
                <div style={{ marginTop: '0.6rem' }}>
                  <span style={miniLabel}>Por categoría</span>
                  {reporte.nlp.comentarios_por_categoria.map((c) => (
                    <KpiRow key={c.categoria} label={c.categoria} value={c.total} />
                  ))}
                </div>
              )}
            </div>

            {/* Estadisticas */}
            <div style={card}>
              <h4 style={h4}>Estadísticas (SciPy)</h4>
              <KpiRow label="Atenciones analizadas" value={reporte.estadisticas.total_registros} />
              {reporte.estadisticas.media !== null ? (
                <>
                  <KpiRow label="Media (min)"      value={reporte.estadisticas.media} />
                  <KpiRow label="Mediana (min)"     value={reporte.estadisticas.mediana} />
                  <KpiRow label="Desv. estándar"    value={reporte.estadisticas.desviacion_estandar} />
                  <KpiRow label="Mínimo / Máximo"   value={`${reporte.estadisticas.minimo} / ${reporte.estadisticas.maximo}`} />
                </>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.5rem 0 0' }}>
                  {reporte.estadisticas.interpretacion}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Arquitectura */}
      <section>
        <h3 style={sH3}>Arquitectura del Sistema</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {CAPAS.map((c) => (
            <div key={c.capa} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem 1rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{c.capa}</span>
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>{c.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Criterios de evaluacion */}
      <section>
        <h3 style={sH3}>Criterios de Evaluacion</h3>
        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={th}>Criterio</th><th style={th}>Peso</th><th style={th}>Evidencia requerida</th>
              </tr>
            </thead>
            <tbody>
              {CRITERIOS.map((c) => (
                <tr key={c.criterio} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={td}><strong>{c.criterio}</strong></td>
                  <td style={{ ...td, fontWeight: 700, color: '#0f172a' }}>{c.peso}</td>
                  <td style={{ ...td, color: '#475569' }}>{c.evidencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Buenas practicas */}
      <section>
        <h3 style={sH3}>Buenas Practicas para Produccion</h3>
        <div style={card}>
          <ul style={{ margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {PRACTICAS.map((p, i) => (
              <li key={i} style={{ fontSize: '0.85rem', color: '#334155' }}>{p}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Entregables */}
      <section>
        <h3 style={sH3}>Entregables del Reto Final</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          {['Codigo fuente', 'API documentada', 'Interfaz web', 'Modelo de datos', 'Pruebas', 'Informe de resultados'].map((e) => (
            <div key={e} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 500, color: '#1e293b', textAlign: 'center' }}>
              {e}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KpiRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '0.82rem', color: '#475569', textTransform: 'capitalize' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{value}</span>
    </div>
  );
}

const card: React.CSSProperties       = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties  = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties         = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const h4: React.CSSProperties         = { margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties        = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' };
const sH3: React.CSSProperties        = { fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.5rem' };
const th: React.CSSProperties         = { padding: '0.5rem 0.6rem', fontWeight: 600 };
const td: React.CSSProperties         = { padding: '0.5rem 0.6rem' };
const miniLabel: React.CSSProperties  = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' };
