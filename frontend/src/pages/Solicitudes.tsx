import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface Solicitud {
  id: string;
  cliente_nombre: string;
  fecha: string;
  comentario: string;
  categoria: string | null;
  estado: string;
}

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      setSolicitudes(await requestJson<Solicitud[]>('/api/comentarios?estado=pendiente'));
    } catch {
      setError('No se pudieron cargar las solicitudes pendientes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // marca una solicitud como resuelta y la saca de la lista de pendientes
  const resolver = async (id: string) => {
    try {
      await requestJson(`/api/comentarios/${id}/estado?nuevo_estado=resuelto`, { method: 'PATCH' });
      await cargar();
    } catch {
      setError('No se pudo actualizar el estado de la solicitud.');
    }
  };

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Solicitudes</h2>
          <p style={sub}>Comentarios pendientes de atender</p>
        </div>
      </header>

      {cargando && <p role="status">Cargando solicitudes...</p>}
      {error && <p role="alert">{error}</p>}
      {!cargando && !error && solicitudes.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: '#52676b' }}>No hay solicitudes pendientes. Todo al día.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {solicitudes.map((s) => (
          <div key={s.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{s.cliente_nombre}</strong>
                <span style={{ marginLeft: '0.6rem', fontSize: '0.75rem', color: '#52676b' }}>{s.fecha}</span>
                {s.categoria && (
                  <span style={{ marginLeft: '0.6rem', fontSize: '0.72rem', textTransform: 'capitalize', backgroundColor: '#f1f5f9', color: '#334155', padding: '0.15rem 0.5rem', borderRadius: '8px' }}>
                    {s.categoria}
                  </span>
                )}
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#334155' }}>{s.comentario}</p>
              </div>
              <button type="button" onClick={() => resolver(s.id)} style={btnDark}>Marcar como resuelto</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#52676b' };
const btnDark: React.CSSProperties   = { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' };