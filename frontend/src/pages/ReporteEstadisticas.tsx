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

interface ReporteEstadisticasData {
  media: number | null;
  mediana: number | null;
  desviacion_estandar: number | null;
  minimo: number | null;
  maximo: number | null;
  total_registros: number;
  interpretacion: string;
}

export default function ReporteEstadisticas() {
  const [data, setData] = useState<ReporteEstadisticasData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    requestJson<{ estadisticas: ReporteEstadisticasData }>('/api/reportes')
      .then((r) => setData(r.estadisticas))
      .catch(() => setError('No se pudo cargar el reporte de estadísticas.'));
  }, []);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Reporte de Estadísticas</h2>
          <p style={sub}>Análisis SciPy de los tiempos de atención registrados</p>
        </div>
      </header>

      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Cargando...</p>}

      {data && (
        <div style={card}>
          <p style={cardLabel}>Atenciones analizadas: {data.total_registros}</p>
          {data.media !== null ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
              <Kpi label="Media (min)" value={data.media} />
              <Kpi label="Mediana (min)" value={data.mediana} />
              <Kpi label="Desv. estándar" value={data.desviacion_estandar} />
              <Kpi label="Mínimo" value={data.minimo} />
              <Kpi label="Máximo" value={data.maximo} />
            </div>
          ) : (
            <p style={{ fontSize: '0.82rem', color: '#52676b' }}>{data.interpretacion}</p>
          )}
        </div>
      )}

      {/* Contenido de referencia del proyecto (no son datos en vivo) */}
      <section>
        <h3 style={sH3}>Arquitectura del Sistema</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {CAPAS.map((c) => (
            <div key={c.capa} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.75rem 1rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{c.capa}</span>
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>{c.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={sH3}>Criterios de Evaluacion</h3>
        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#52676b', textAlign: 'left' }}>
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

      <section>
        <h3 style={sH3}>Entregables del Reto Final</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          {['Codigo fuente', 'API documentada', 'Interfaz web', 'Modelo de datos', 'Pruebas', 'Informe de resultados'].map((e) => (
            <div key={e} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 500, color: '#1e293b', textAlign: 'center' }}>
              {e}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | null }) {
  return (
    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.7rem 0.9rem' }}>
      <span style={{ fontSize: '0.72rem', color: '#52676b', display: 'block' }}>{label}</span>
      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{value}</span>
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#52676b' };
const cardLabel: React.CSSProperties = { margin: '0 0 0.6rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' };
const sH3: React.CSSProperties       = { fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.5rem' };
const th: React.CSSProperties        = { padding: '0.5rem 0.6rem', fontWeight: 600 };
const td: React.CSSProperties        = { padding: '0.5rem 0.6rem' };