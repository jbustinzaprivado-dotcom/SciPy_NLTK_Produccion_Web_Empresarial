import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface ReporteNLPData {
  comentarios_por_categoria: { categoria: string; total: number }[];
  total_procesados: number;
  total_sin_procesar: number;
}

export default function ReporteNLP() {
  const [data, setData] = useState<ReporteNLPData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    requestJson<{ nlp: ReporteNLPData }>('/api/reportes')
      .then((r) => setData(r.nlp))
      .catch(() => setError('No se pudo cargar el reporte de NLP.'));
  }, []);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Reporte de NLP</h2>
          <p style={sub}>Clasificación de comentarios procesada con NLTK</p>
        </div>
      </header>

      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Cargando...</p>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={kpiCard}><span style={kpiLabel}>Procesados por NLTK</span><span style={kpiValue}>{data.total_procesados}</span></div>
            <div style={kpiCard}><span style={kpiLabel}>Sin procesar</span><span style={kpiValue}>{data.total_sin_procesar}</span></div>
          </div>

          <div style={card}>
            <p style={cardLabel}>Comentarios por categoría</p>
            {data.comentarios_por_categoria.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#52676b' }}>Sin datos.</p>
            ) : (
              data.comentarios_por_categoria.map((c) => (
                <div key={c.categoria} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', textTransform: 'capitalize' }}>
                  <span style={{ fontSize: '0.85rem', color: '#334155' }}>{c.categoria}</span>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{c.total}</strong>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#52676b' };
const cardLabel: React.CSSProperties = { margin: '0 0 0.6rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' };
const kpiCard: React.CSSProperties   = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem 1rem', boxSizing: 'border-box' };
const kpiLabel: React.CSSProperties  = { fontSize: '0.75rem', color: '#52676b', display: 'block' };
const kpiValue: React.CSSProperties  = { fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '0.2rem' };