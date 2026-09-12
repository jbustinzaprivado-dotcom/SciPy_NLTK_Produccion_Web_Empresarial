import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface RegistroAuditoria {
  id: string;
  accion: string;
  tabla: string | null;
  registro_id: number | null;
  detalles: Record<string, unknown> | null;
  created_at: string;
}

export default function Auditoria() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true); setError('');
    try { setRegistros(await requestJson<RegistroAuditoria[]>('/api/auditoria')); }
    catch { setRegistros([]); setError('No se pudo cargar el registro de auditoría.'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Registro de Auditoría</h2>
          <p style={sub}>Últimas acciones registradas en el sistema (creación de clientes, comentarios y categorías)</p>
        </div>
      </header>

      <button onClick={cargar} disabled={cargando}>Actualizar</button>
      {cargando && <p role="status">Cargando registros...</p>}
      {error && <p role="alert">{error}</p>}
      {!cargando && !error && registros.length === 0 && <p>Todavía no hay acciones registradas.</p>}

      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#52676b', textAlign: 'left' }}>
                <th style={th}>Fecha</th>
                <th style={th}>Acción</th>
                <th style={th}>Tabla</th>
                <th style={th}>Registro</th>
                <th style={th}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...td, color: '#52676b', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleString('es-PE')}</td>
                  <td style={td}><strong style={{ color: '#0f172a' }}>{r.accion}</strong></td>
                  <td style={{ ...td, color: '#475569' }}>{r.tabla ?? '—'}</td>
                  <td style={{ ...td, color: '#475569' }}>{r.registro_id ?? '—'}</td>
                  <td style={{ ...td, color: '#52676b', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {r.detalles ? JSON.stringify(r.detalles) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#52676b' };
const th: React.CSSProperties        = { padding: '0.5rem 0.6rem', fontWeight: 600 };
const td: React.CSSProperties        = { padding: '0.5rem 0.6rem' };