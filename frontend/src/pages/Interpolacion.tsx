import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface Punto {
  fecha: string;
  tiempo_promedio: number;
  tipo: 'real' | 'estimado';
}

interface InterpolacionData {
  puntos: Punto[];
  metodo: string;
  explicacion: string;
}

export default function Interpolacion() {
  const [dias, setDias] = useState(14);
  const [data, setData] = useState<InterpolacionData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      setData(await requestJson<InterpolacionData>(`/api/scipy/interpolacion?dias=${dias}`));
    } catch {
      setError('No se pudo cargar la interpolación.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Interpolación — SciPy</h2>
          <p style={sub}>Ejercicio 3: tiempo promedio de atención por día, estimando los días sin registros</p>
        </div>
      </header>

      <div style={card}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={labelSt}>Rango de días
            <input type="number" value={dias} onChange={(e) => setDias(Number(e.target.value))} min={2} max={90} style={input} />
          </label>
          <button type="button" onClick={cargar} style={btnDark} disabled={cargando}>
            {cargando ? 'Calculando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}

      {data && (
        <>
          <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
            <code style={badge}>{data.metodo}</code> {data.explicacion}
          </p>

          {data.puntos.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No hay suficientes datos en este rango.</p>
          ) : (
            <div style={card}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                      <th style={th}>Fecha</th><th style={th}>Tiempo promedio (min)</th><th style={th}>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.puntos.map((p) => (
                      <tr key={p.fecha} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}>{p.fecha}</td>
                        <td style={td}>{p.tiempo_promedio}</td>
                        <td style={td}>
                          <span style={{
                            fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
                            backgroundColor: p.tipo === 'real' ? '#f0fdf4' : '#fffbeb',
                            color: p.tipo === 'real' ? '#166534' : '#92400e',
                            border: '1px solid', borderColor: p.tipo === 'real' ? '#bbf7d0' : '#fde68a',
                          }}>
                            {p.tipo === 'real' ? 'Real' : 'Estimado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' };
const labelSt: React.CSSProperties   = { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 600, color: '#475569' };
const input: React.CSSProperties     = { padding: '0.45rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '120px', boxSizing: 'border-box' };
const btnDark: React.CSSProperties   = { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' };
const badge: React.CSSProperties     = { fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', marginRight: '0.4rem' };
const th: React.CSSProperties        = { padding: '0.5rem 0.6rem', fontWeight: 600 };
const td: React.CSSProperties        = { padding: '0.5rem 0.6rem' };