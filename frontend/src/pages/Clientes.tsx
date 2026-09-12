import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  tiempo_promedio_min: number;
  total_atenciones: number;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const cargar = async () => {
    setCargando(true); setError('');
    try { setClientes(await requestJson<Cliente[]>('/api/clientes')); }
    catch { setClientes([]); setError('No se pudo cargar el directorio de clientes.'); }
    finally { setCargando(false); }
  };
  useEffect(() => { cargar(); }, []);
  const total = clientes.reduce((sum, c) => sum + c.total_atenciones, 0);
  const promedio = total ? (clientes.reduce((sum, c) => sum + c.tiempo_promedio_min * c.total_atenciones, 0) / total).toFixed(1) : '0.0';

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={pageHeader}>
        <div>
          <h2 style={h2}>Directorio de Clientes</h2>
          <p style={sub}>Tiempos de atencion promedio y conteo de atenciones por cliente</p>
        </div>
      </header>

      <button onClick={cargar} disabled={cargando}>Actualizar clientes</button>
      {cargando && <p role="status">Cargando clientes...</p>}
      {error && <p role="alert">{error}</p>}
      {!cargando && !error && clientes.length === 0 && <p>Aún no hay clientes. Registra una atención para crear el primero.</p>}
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        <div style={kpiCard}>
          <span style={kpiLabel}>Total clientes</span>
          <span style={kpiValue}>{clientes.length}</span>
        </div>
        <div style={kpiCard}>
          <span style={kpiLabel}>Tiempo promedio global</span>
          <span style={kpiValue}>{promedio} min</span>
        </div>
        <div style={kpiCard}>
          <span style={kpiLabel}>Total atenciones</span>
          <span style={kpiValue}>{clientes.reduce((s, c) => s + c.total_atenciones, 0)}</span>
        </div>
      </div>

      {/* Tabla */}
      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#52676b', textAlign: 'left' }}>
                <th style={th}>Cliente</th>
                <th style={th}>Empresa</th>
                <th style={th}>Correo</th>
                <th style={th}>Telefono</th>
                <th style={{ ...th, textAlign: 'center' }}>Tiempo Prom.</th>
                <th style={{ ...th, textAlign: 'center' }}>Atenciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={td}><strong style={{ color: '#0f172a' }}>{c.nombre}</strong></td>
                  <td style={{ ...td, color: '#475569' }}>{c.empresa}</td>
                  <td style={{ ...td, color: '#52676b', fontFamily: 'monospace', fontSize: '0.78rem' }}>{c.correo}</td>
                  <td style={{ ...td, color: '#52676b' }}>{c.telefono}</td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: c.tiempo_promedio_min > 20 ? '#dc2626' : '#166534' }}>
                    {c.tiempo_promedio_min.toFixed(1)} min
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>{c.total_atenciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: '#52676b' }}>
          Tiempos en rojo indican atencion por encima de 20 minutos (umbral de alerta).
        </p>
      </div>
    </div>
  );
}

const card: React.CSSProperties       = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties  = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties         = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties        = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#52676b' };
const kpiCard: React.CSSProperties    = { ...{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem 1rem', boxSizing: 'border-box' as const } };
const kpiLabel: React.CSSProperties   = { fontSize: '0.75rem', color: '#52676b', display: 'block' };
const kpiValue: React.CSSProperties   = { fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '0.2rem' };
const th: React.CSSProperties         = { padding: '0.5rem 0.6rem', fontWeight: 600 };
const td: React.CSSProperties         = { padding: '0.5rem 0.6rem' };
