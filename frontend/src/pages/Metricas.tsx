import type { MetricasAtencion as Metricas } from '../types';
import { requestJson } from '../services/http';
import React, { useState, useEffect } from 'react';

export default function Metricas() {
  const [met, setMet]         = useState<Metricas | null>(null);
  const [online, setOnline]   = useState<boolean | null>(null);

  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setMet(null); setError(''); setOnline(null);
    if (inicio && fin && inicio > fin) {
      setError('La fecha inicial no puede superar la final.'); setOnline(false); return;
    }
    const query = new URLSearchParams();
    if (inicio) query.set('fecha_inicio', inicio);
    if (fin) query.set('fecha_fin', fin);
    requestJson<Metricas>(`/api/metricas-atencion?${query}`)
      .then(data => { if (active) { setMet(data); setOnline(true); } })
      .catch(() => { if (active) { setError('No se pudieron cargar las estadísticas.'); setOnline(false); } });
    return () => { active = false; };
  }, [inicio, fin, version]);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={pageHeader}>
        <div>
          <h2 style={h2}>Estadisticas — SciPy</h2>
          <p style={sub}>Ejercicio 1: estadistica descriptiva de tiempos de atencion</p>
        </div>
        <StatusBadge online={online} />
      </header>

      {/* Ejercicio 1 — estadistica */}
      <section>
        <SectionTitle title="Ejercicio 1 — Estadistica de Tiempos de Atencion" badge="scipy.stats" />
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <label>Desde <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} /></label>
          <label>Hasta <input type="date" value={fin} onChange={e => setFin(e.target.value)} /></label>
          <button onClick={() => { setInicio(''); setFin(''); }}>Todo el historial</button>
          <button onClick={() => setVersion(v => v + 1)}>Actualizar</button>
        </div>
        {error && <p role="alert">{error}</p>}
        <p style={desc}>{met ? `${met.total_registros} atenciones registradas en el período seleccionado` : 'Sin resultados disponibles'}</p>
        <div style={grid4}>
          <StatCard label="Media"              value={`${met?.media ?? '-'} min`}           code="np.mean(tiempos)"   />
          <StatCard label="Desviacion Estandar" value={`${met?.desviacion_estandar ?? '-'} min`} code="np.std(ddof=1)"    />
          <StatCard label="Mediana"             value={`${met?.mediana ?? '-'} min`}          code="np.median(tiempos)" />
          <StatCard label="Varianza"            value={`${met?.varianza ?? '-'}`}             code="np.var(ddof=1)"    />
        </div>
        <div style={{ ...grid4, marginTop: '1rem' }}>
          <StatCard label="Mínimo" value={`${met?.minimo ?? '-'} min`} />
          <StatCard label="Máximo" value={`${met?.maximo ?? '-'} min`} />
          <StatCard label="Percentil 25" value={`${met?.percentil_25 ?? '-'} min`} />
          <StatCard label="Percentil 75" value={`${met?.percentil_75 ?? '-'} min`} />
        </div>
        {met && <p>{met.interpretacion} {met.coeficiente_variacion != null && `CV: ${met.coeficiente_variacion}%`}</p>}
        {met?.resultado_id && met?.calculado_en && <p style={desc}>Resultado guardado #{met.resultado_id} · {new Date(met.calculado_en).toLocaleString()}</p>}
      </section>
    </div>
  );
}

function StatCard({ label, value, code }: { label: string; value: string; code?: string }) {
  return (
    <div style={card}>
      <span style={{ fontSize: '0.78rem', color: '#52676b', display: 'block' }}>{label}</span>
      <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', display: 'block', margin: '0.2rem 0' }}>{value}</span>
      {code && <code style={{ fontSize: '0.7rem', color: '#0284c7', fontFamily: 'monospace' }}>{code}</code>}
    </div>
  );
}

function StatusBadge({ online }: { online: boolean | null }) {
  return <span style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: online ? '#f0fdf4' : '#f8fafc', color: online ? '#166534' : '#475569' }}>{online === null ? 'Conectando...' : online ? 'Backend Activo' : 'Sin datos disponibles'}</span>;
}

function SectionTitle({ title, badge }: { title: string; badge: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>{title}</h3>
      <code style={{ fontSize: '0.7rem', color: '#52676b', fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>{badge}</code>
    </div>
  );
}

const card: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem', boxSizing: 'border-box' };
const grid4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' };
const pageHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#52676b' };
const desc: React.CSSProperties = { fontSize: '0.82rem', color: '#52676b', margin: '0 0 0.75rem' };
