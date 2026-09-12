import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface ClienteResumen {
  id: string;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  tiempo_promedio_min: number;
  total_atenciones: number;
}

interface ComentarioHistorial {
  id: string;
  contenido: string;
  fecha: string;
  estado: string;
  categoria: string | null;
}

interface TiempoHistorial {
  id: string;
  fecha: string;
  tiempo_minutos: number;
}

interface HistorialData {
  cliente: ClienteResumen;
  comentarios: ComentarioHistorial[];
  tiempos_atencion: TiempoHistorial[];
}

export default function HistorialCliente() {
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [historial, setHistorial] = useState<HistorialData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Carga el listado de clientes una sola vez, para poblar el selector
  useEffect(() => {
    requestJson<ClienteResumen[]>('/api/clientes').then(setClientes).catch(() => setError('No se pudo cargar la lista de clientes.'));
  }, []);

  // Cada vez que cambia el cliente seleccionado, trae su historial completo
  useEffect(() => {
    if (!clienteId) { setHistorial(null); return; }
    setCargando(true); setError('');
    requestJson<HistorialData>(`/api/clientes/${clienteId}/historial`)
      .then(setHistorial)
      .catch(() => setError('No se pudo cargar el historial de este cliente.'))
      .finally(() => setCargando(false));
  }, [clienteId]);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Historial de Cliente</h2>
          <p style={sub}>Comentarios y tiempos de atención registrados por cliente</p>
        </div>
      </header>

      <div style={card}>
        <label style={labelSt}>Seleccionar cliente
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} style={{ ...input, marginTop: '0.35rem' }}>
            <option value="">-- Elegí un cliente --</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
      </div>

      {error && <p role="alert">{error}</p>}
      {cargando && <p role="status">Cargando historial...</p>}

      {historial && (
        <>
          {/* Resumen del cliente */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={kpiCard}><span style={kpiLabel}>Empresa</span><span style={kpiValue}>{historial.cliente.empresa || '—'}</span></div>
            <div style={kpiCard}><span style={kpiLabel}>Total atenciones</span><span style={kpiValue}>{historial.cliente.total_atenciones}</span></div>
            <div style={kpiCard}><span style={kpiLabel}>Tiempo promedio</span><span style={kpiValue}>{historial.cliente.tiempo_promedio_min.toFixed(1)} min</span></div>
          </div>

          {/* Comentarios */}
          <div style={card}>
            <p style={cardLabel}>Comentarios ({historial.comentarios.length})</p>
            {historial.comentarios.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#52676b' }}>Este cliente no tiene comentarios registrados.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#52676b', textAlign: 'left' }}>
                      <th style={th}>Fecha</th><th style={th}>Comentario</th><th style={th}>Categoría</th><th style={th}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.comentarios.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}>{c.fecha}</td>
                        <td style={{ ...td, color: '#475569' }}>{c.contenido}</td>
                        <td style={{ ...td, textTransform: 'capitalize' }}>{c.categoria || '—'}</td>
                        <td style={td}>{c.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tiempos de atencion */}
          <div style={card}>
            <p style={cardLabel}>Tiempos de atención ({historial.tiempos_atencion.length})</p>
            {historial.tiempos_atencion.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#52676b' }}>Este cliente no tiene atenciones registradas.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#52676b', textAlign: 'left' }}>
                      <th style={th}>Fecha</th><th style={th}>Tiempo (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.tiempos_atencion.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}>{t.fecha}</td>
                        <td style={td}>{t.tiempo_minutos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
const labelSt: React.CSSProperties   = { display: 'flex', flexDirection: 'column', fontSize: '0.82rem', fontWeight: 600, color: '#475569' };
const input: React.CSSProperties     = { padding: '0.45rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', width: '100%', maxWidth: '320px', boxSizing: 'border-box' };
const kpiCard: React.CSSProperties   = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem 1rem', boxSizing: 'border-box' };
const kpiLabel: React.CSSProperties  = { fontSize: '0.75rem', color: '#52676b', display: 'block' };
const kpiValue: React.CSSProperties  = { fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '0.2rem' };
const th: React.CSSProperties        = { padding: '0.5rem 0.6rem', fontWeight: 600 };
const td: React.CSSProperties        = { padding: '0.5rem 0.6rem' };