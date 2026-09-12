import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface ReporteAtencionData {
  total_clientes: number;
  total_comentarios: number;
  total_atenciones_registradas: number;
  comentarios_por_estado: { estado: string; total: number }[];
}

export default function ReporteAtencion() {
  const [data, setData] = useState<ReporteAtencionData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    requestJson<{ atencion: ReporteAtencionData }>('/api/reportes')
      .then((r) => setData(r.atencion))
      .catch(() => setError('No se pudo cargar el reporte de atención.'));
  }, []);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Reporte de Atención</h2>
          <p style={sub}>Resumen de clientes, comentarios y atenciones registradas</p>
        </div>
      </header>

      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Cargando...</p>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={kpiCard}><span style={kpiLabel}>Clientes registrados</span><span style={kpiValue}>{data.total_clientes}</span></div>
            <div style={kpiCard}><span style={kpiLabel}>Comentarios recibidos</span><span style={kpiValue}>{data.total_comentarios}</span></div>
            <div style={kpiCard}><span style={kpiLabel}>Atenciones registradas</span><span style={kpiValue}>{data.total_atenciones_registradas}</span></div>
          </div>

          <div style={card}>
            <p style={cardLabel}>Comentarios por estado</p>
            {data.comentarios_por_estado.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Sin datos.</p>
            ) : (
              data.comentarios_por_estado.map((e) => (
                <div key={e.estado} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', textTransform: 'capitalize' }}>
                  <span style={{ fontSize: '0.85rem', color: '#334155' }}>{e.estado}</span>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{e.total}</strong>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' };
const cardLabel: React.CSSProperties = { margin: '0 0 0.6rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' };
const kpiCard: React.CSSProperties   = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.85rem 1rem', boxSizing: 'border-box' };
const kpiLabel: React.CSSProperties  = { fontSize: '0.75rem', color: '#64748b', display: 'block' };
const kpiValue: React.CSSProperties  = { fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '0.2rem' };