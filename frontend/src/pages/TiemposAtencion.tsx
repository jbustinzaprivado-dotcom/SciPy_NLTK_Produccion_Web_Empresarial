import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface Tiempo {
  id: string;
  fecha: string;
  tiempo_minutos: number;
  cliente_nombre: string;
}

export default function TiemposAtencion() {
  const [tiempos, setTiempos] = useState<Tiempo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    requestJson<Tiempo[]>('/api/tiempos-atencion')
      .then(setTiempos)
      .catch(() => setError('No se pudieron cargar los tiempos de atención.'))
      .finally(() => setCargando(false));
  }, []);

  const promedio = tiempos.length
    ? (tiempos.reduce((sum, t) => sum + t.tiempo_minutos, 0) / tiempos.length).toFixed(1)
    : '0.0';

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Tiempos de Atención</h2>
          <p style={sub}>Registro de duración de cada atención por cliente</p>
        </div>
      </header>

      {cargando && <p role="status">Cargando...</p>}
      {error && <p role="alert">{error}</p>}

      {!cargando && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={kpiCard}><span style={kpiLabel}>Atenciones registradas</span><span style={kpiValue}>{tiempos.length}</span></div>
            <div style={kpiCard}><span style={kpiLabel}>Tiempo promedio</span><span style={kpiValue}>{promedio} min</span></div>
          </div>

          <div style={card}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#52676b', textAlign: 'left' }}>
                    <th style={th}>Cliente</th><th style={th}>Fecha</th><th style={th}>Tiempo (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {tiempos.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}><strong style={{ color: '#0f172a' }}>{t.cliente_nombre}</strong></td>
                      <td style={td}>{t.fecha}</td>
                      <td style={{ ...td, fontWeight: 600, color: t.tiempo_minutos > 20 ? '#dc2626' : '#166534' }}>{t.tiempo_minutos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
const kpiCard: React.CSSProperties   = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem 1rem', boxSizing: 'border-box' };
const kpiLabel: React.CSSProperties  = { fontSize: '0.75rem', color: '#52676b', display: 'block' };
const kpiValue: React.CSSProperties  = { fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '0.2rem' };
const th: React.CSSProperties        = { padding: '0.5rem 0.6rem', fontWeight: 600 };
const td: React.CSSProperties        = { padding: '0.5rem 0.6rem' };