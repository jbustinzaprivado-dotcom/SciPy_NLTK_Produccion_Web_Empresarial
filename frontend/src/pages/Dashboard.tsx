import type { MetricasAtencion as Metricas } from '../types';
import { requestJson } from '../services/http';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ── tipos locales ── */
interface Keyword { palabra: string; frecuencia: number; }
interface Comentario {
  id: string;
  cliente_nombre: string;
  fecha: string;
  tiempo_atencion_minutos: number;
  comentario: string;
}

/* ── datos de demostración ── */
const MODULOS = [
  { to: '/metricas',     title: 'Metricas SciPy',  desc: 'Estadistica e Interpolacion — Ejercicios 1 y 3' },
  { to: '/optimizacion', title: 'Optimizacion',     desc: 'Minimizacion de costos — Ejercicio 2' },
  { to: '/comentarios',  title: 'Comentarios',      desc: 'Keywords NLTK — Ejercicio 4' },
  { to: '/analisis-nlp', title: 'Analisis NLP',     desc: 'Clasificacion y Busqueda — Ejercicios 5 y 6' },
  { to: '/clientes',     title: 'Clientes',         desc: 'Directorio y tiempos de atencion' },
  { to: '/reportes',     title: 'Reportes',         desc: 'Informe ejecutivo consolidado' },
];

export default function Dashboard() {
  const [metricas, setMetricas]   = useState<Metricas | null>(null);
  const [keywords, setKeywords]   = useState<Keyword[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [online, setOnline]       = useState<boolean | null>(null);
  const [cliente, setCliente]     = useState('');
  const [tiempo,  setTiempo]      = useState(15);
  const [texto,   setTexto]       = useState('');

  const BASE = '/api';   // Vite proxy -> http://localhost:8000

  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');

  const [errorCarga, setErrorCarga] = useState('');

  const cargaId = useRef(0);
  const cargar = async () => {
    const id = ++cargaId.current;
    setMetricas(null); setOnline(null);
    setErrorCarga('');
    try {
      const [m, k, c] = await Promise.all([
        requestJson<Metricas>(`${BASE}/metricas-atencion${fechaFiltro ? `?fecha=${fechaFiltro}` : ''}`),
        requestJson<{ keywords: Keyword[] }>(`${BASE}/comentarios/keywords`).catch(() => ({ keywords: [] })),
        requestJson<Comentario[]>(fechaFiltro ? `${BASE}/comentarios?fecha=${fechaFiltro}` : `${BASE}/comentarios`),
      ]);
      if (id !== cargaId.current) return;
      setMetricas(m); setKeywords(k.keywords); setComentarios(c); setOnline(true);
    } catch {
      if (id !== cargaId.current) return;
      setOnline(false);
      setErrorCarga('No se pudieron cargar los datos. Comprueba la conexión y vuelve a actualizar.');
      setMetricas(null); setKeywords([]); setComentarios([]);
    }
  };

  useEffect(() => { cargar(); }, [fechaFiltro]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setErrorGuardado('');
    if (!cliente.trim() || !texto.trim() || !Number.isFinite(tiempo) || tiempo <= 0) {
      setErrorGuardado('Completa el cliente, el comentario y un tiempo mayor que cero.');
      return;
    }
    setGuardando(true);
    const ahora = new Date();
    const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
    try {
      await requestJson('/api/comentarios', { method: 'POST', body: JSON.stringify({
        cliente_nombre: cliente.trim(), fecha, tiempo_atencion_minutos: tiempo, comentario: texto.trim(),
      }) });
      setCliente(''); setTexto(''); setTiempo(15);
      await cargar();
    } catch {
      setErrorGuardado('No se pudo confirmar el guardado. Conservamos los datos; comprueba el historial antes de reintentar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="page-shell dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#52676b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel de Control Ejecutivo</p>
          <h2 style={{ margin: '0.2rem 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Centro Inteligente de Atencion</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#52676b' }}>SciPy (calculo numerico) + NLTK (procesamiento de texto) en arquitectura desacoplada.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: online ? '#f0fdf4' : '#f8fafc', color: online ? '#166534' : '#475569', fontWeight: 500 }}>
            {online === null ? 'Conectando...' : online ? 'Backend Activo (:8000)' : 'Sin conexión'}
          </span>
          <button onClick={cargar} style={btnDark}>Actualizar</button>
        </div>
      </div>

      {errorCarga && <p role="alert">{errorCarga}</p>}
      <p role="note">Las métricas usan atenciones guardadas y el filtro de fecha del historial. Los gráficos superiores y palabras frecuentes siguen siendo ejemplos; su integración está pendiente.</p>
      <section className="chart-grid">
        <div className="panel"><div className="panel-title"><h4>Atenciones por periodo</h4><span>Semanal ▾</span></div>
          <div className="bar-chart">{[42,68,51,83,61,74,48,65,57,78].map((v,i)=><div className="bar-group" key={i}><div className="bar primary" style={{height:`${v}%`,animationDelay:`${i*60}ms`}}/><div className="bar accent" style={{height:`${Math.max(18,v-28)}%`,animationDelay:`${i*60+80}ms`}}/><span className="bar-label">{['Lun','Mar','Mie','Jue','Vie','Sab','Dom','Lun','Mar','Mie'][i]}</span></div>)}</div>
          <div className="legend"><span><i className="dot blue"/>Atenciones</span><span><i className="dot yellow"/>Resueltas</span></div>
        </div>
        <div className="panel"><div className="panel-title"><h4>Satisfaccion general</h4><span>Este mes</span></div><div className="donut-wrap"><div className="donut"/><div className="donut-note"><strong>Buen rendimiento</strong><span>La satisfaccion supera el objetivo mensual.</span></div></div></div>
      </section>

      <section className="bottom-grid"><div className="panel"><div className="panel-title"><h4>Tendencia de tiempos</h4><span>Media movil 7d</span></div><div className="area-chart"><svg viewBox="0 0 700 140" preserveAspectRatio="none"><path className="area-fill" d="M0 112 C55 105 65 55 120 70 S190 110 235 76 S292 23 345 73 S414 113 465 59 S525 26 574 62 S650 90 700 38 L700 140 L0 140Z" fill="rgba(255,181,62,.35)"/><path d="M0 112 C55 105 65 55 120 70 S190 110 235 76 S292 23 345 73 S414 113 465 59 S525 26 574 62 S650 90 700 38" fill="none" stroke="#173e63" strokeWidth="3" strokeLinecap="round"/></svg></div></div><div className="panel"><div className="panel-title"><h4>Terminos frecuentes</h4><span>NLTK · top 4</span></div><div className="keyword-list">{keywords.map(k=><span className="keyword" key={k.palabra}>{k.palabra} <b>{k.frecuencia}</b></span>)}</div></div></section>

      {/* 1. Indicadores SciPy — Ejercicio 1 */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={sectionTitle}>1. Indicadores de Tiempos de Atencion — SciPy</h3>
          <code style={badge}>scipy.stats</code>
        </div>
        <p>{metricas ? `${metricas.total_registros} atenciones · ${fechaFiltro || 'Todo el historial'}` : 'Sin métricas disponibles'}</p>
        <p>{metricas?.interpretacion}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <KpiCard label="Tiempo Promedio"       value={`${metricas?.media ?? '-'} min`}           code="np.mean(tiempos)" />
          <KpiCard label="Desviacion Estandar"   value={`±${metricas?.desviacion_estandar ?? '-'} min`} code="np.std(ddof=1)" />
          <KpiCard label="Mediana"               value={`${metricas?.mediana ?? '-'} min`}          code="np.median(tiempos)" />
          <KpiCard label="Coef. de Variacion"    value={`${metricas?.coeficiente_variacion ?? '-'}%`} sub={metricas?.interpretacion} />
        </div>
      </section>

      {/* 2. Keywords NLTK — Ejercicio 4 */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={sectionTitle}>2. Terminos Frecuentes en Comentarios — NLTK</h3>
          <code style={badge}>Counter.most_common</code>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {keywords.map((k) => (
              <span key={k.palabra} style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                {k.palabra} <strong>({k.frecuencia})</strong>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Reto Final */}
      <section>
        <h3 style={{ ...sectionTitle, marginBottom: '0.75rem' }}>3. Reto Final — Registro y Filtrado por Fecha</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Formulario */}
          <div style={card}>
            <p style={cardLabel}>Registrar nueva atencion</p>
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <input type="text"   placeholder="Nombre del cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} style={input} required />
              <input type="number" placeholder="Tiempo (minutos)"   value={tiempo}  onChange={(e) => setTiempo(Number(e.target.value))} min={1} max={120} style={input} required />
              <textarea rows={2}   placeholder="Comentario..."       value={texto}   onChange={(e) => setTexto(e.target.value)} style={{ ...input, resize: 'vertical' }} required />
              <button type="submit" style={btnDark} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar registro'}</button>
              {errorGuardado && <p role="alert">{errorGuardado}</p>}
          </form>
          </div>

          {/* Tabla */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={cardLabel}>Atenciones registradas</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', color: '#52676b' }}>Fecha:</label>
                <input type="date" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} style={{ ...input, width: 'auto', padding: '0.25rem 0.4rem' }} />
                {fechaFiltro && <button onClick={() => setFechaFiltro('')} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', cursor: 'pointer' }}>Limpiar</button>}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#52676b', textAlign: 'left' }}>
                    <th style={th}>Cliente</th><th style={th}>Fecha</th><th style={th}>Tiempo</th><th style={th}>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {comentarios.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}><strong>{c.cliente_nombre}</strong></td>
                      <td style={{ ...td, color: '#52676b' }}>{c.fecha}</td>
                      <td style={td}>{c.tiempo_atencion_minutos} min</td>
                      <td style={{ ...td, color: '#334155' }}>{c.comentario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Modulos */}
      <section>
        <h3 style={{ ...sectionTitle, marginBottom: '0.75rem' }}>4. Modulos del Sistema</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
          {MODULOS.map((m) => (
            <Link key={m.to} to={m.to} style={{ textDecoration: 'none', ...card, display: 'block' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>{m.title}</span>
              <span style={{ fontSize: '0.75rem', color: '#52676b', marginTop: '0.25rem', display: 'block' }}>{m.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── sub-componentes ── */
function KpiCard({ label, value, code, sub }: { label: string; value: string; code?: string; sub?: string }) {
  return (
    <div style={card}>
      <span style={{ fontSize: '0.78rem', color: '#52676b', display: 'block' }}>{label}</span>
      <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', display: 'block', margin: '0.25rem 0' }}>{value}</span>
      {code && <code style={{ fontSize: '0.72rem', color: '#0284c7', fontFamily: 'monospace' }}>{code}</code>}
      {sub  && <span style={{ fontSize: '0.72rem', color: '#059669', display: 'block', marginTop: '0.2rem' }}>{sub}</span>}
    </div>
  );
}

/* ── estilos ── */
const card: React.CSSProperties  = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem', boxSizing: 'border-box' };
const sectionTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0 };
const badge: React.CSSProperties = { fontSize: '0.72rem', color: '#52676b', fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '8px' };
const cardLabel: React.CSSProperties = { margin: '0 0 0.6rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' };
const input: React.CSSProperties = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' };
const btnDark: React.CSSProperties = { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' };
const th: React.CSSProperties = { padding: '0.4rem', fontWeight: 600 };
const td: React.CSSProperties = { padding: '0.4rem' };
