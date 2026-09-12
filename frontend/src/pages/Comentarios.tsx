import { requestJson } from '../services/http';
import React, { useState, useEffect } from 'react';

interface Keyword    { palabra: string; frecuencia: number; }
interface Comentario { id: string; cliente_nombre: string; fecha: string; tiempo_atencion_minutos: number; comentario: string; }

const DEMO_KW: Keyword[] = [
  { palabra: 'servicio',   frecuencia: 12 },
  { palabra: 'atencion',   frecuencia: 9  },
  { palabra: 'rapido',     frecuencia: 7  },
  { palabra: 'soporte',    frecuencia: 5  },
  { palabra: 'excelente',  frecuencia: 4  },
  { palabra: 'demora',     frecuencia: 3  },
];

export default function Comentarios() {
  const [keywords,    setKeywords]    = useState<Keyword[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [online,      setOnline]      = useState<boolean | null>(null);

  // formulario
  const [cliente, setCliente] = useState('');
  const [tiempo,  setTiempo]  = useState(15);
  const [texto,   setTexto]   = useState('');

  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');

  const [errorCarga, setErrorCarga] = useState('');

  const cargar = async () => {
    setErrorCarga('');
    try {
      const [kd, comentariosData] = await Promise.all([
        requestJson<{ keywords: Keyword[] }>('/api/comentarios/keywords'),
        requestJson<Comentario[]>(fechaFiltro ? `/api/comentarios?fecha=${fechaFiltro}` : '/api/comentarios'),
      ]);
      setKeywords(kd.keywords ?? []);
      setComentarios(comentariosData);
      setOnline(true);
    } catch {
      setOnline(false);
      setErrorCarga('No se pudo cargar el historial. Comprueba la conexión y vuelve a actualizar.');
      setKeywords(DEMO_KW);
      setComentarios([]);
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
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={pageHeader}>
        <div>
          <h2 style={h2}>Comentarios de Clientes</h2>
          <p style={sub}>Ejercicio 4: analisis de frecuencia con NLTK · Reto Final: registro y filtrado por fecha</p>
        </div>
        <span style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: online ? '#f0fdf4' : '#f8fafc', color: online ? '#166534' : '#475569' }}>
          {online === null ? 'Conectando...' : online ? 'Backend Activo' : 'Demostracion'}
        </span>
      </header>

      {errorCarga && <p role="alert">{errorCarga}</p>}
      <p role="note">Las palabras frecuentes son ejemplos; aún no analizan el historial. Los registros confirmados se guardan en PostgreSQL.</p>
      {/* Palabras clave — Ejercicio 4 */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={sH3}>Ejercicio 4 — Terminos Frecuentes (NLTK)</h3>
          <code style={badge}>Counter.most_common(10)</code>
        </div>
        <div style={card}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#64748b' }}>
            Flujo: tokenizar → eliminar stopwords en español → contar frecuencias con <code>collections.Counter</code>.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {keywords.map((k, i) => (
              <span key={k.palabra} style={{ backgroundColor: i < 3 ? '#0f172a' : '#f1f5f9', color: i < 3 ? '#ffffff' : '#334155', border: '1px solid #e2e8f0', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.82rem' }}>
                {k.palabra} <strong>({k.frecuencia})</strong>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario + tabla */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={card}>
          <h3 style={sH3}>Registrar Comentario</h3>
          <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
            <input type="text"   placeholder="Nombre del cliente"  value={cliente} onChange={(e) => setCliente(e.target.value)} style={input} required />
            <input type="number" placeholder="Tiempo de atencion"  value={tiempo}  onChange={(e) => setTiempo(Number(e.target.value))} min={1} max={120} style={input} required />
            <textarea rows={3}   placeholder="Texto del comentario..." value={texto} onChange={(e) => setTexto(e.target.value)} style={{ ...input, resize: 'vertical' }} required />
            <button type="submit" style={btnDark} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
            {errorGuardado && <p role="alert">{errorGuardado}</p>}
          </form>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <h3 style={sH3}>Historial</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#64748b' }}>Filtrar fecha:</label>
              <input type="date" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} style={{ ...input, width: 'auto', padding: '0.25rem 0.4rem' }} />
              {fechaFiltro && <button onClick={() => setFechaFiltro('')} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', cursor: 'pointer' }}>Limpiar</button>}
            </div>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
            {comentarios.map((c) => (
              <div key={c.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '0.65rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <strong style={{ color: '#0f172a' }}>{c.cliente_nombre}</strong>
                  <span style={{ color: '#64748b' }}>{c.fecha} · {c.tiempo_atencion_minutos} min</span>
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#334155' }}>{c.comentario}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' };
const sH3: React.CSSProperties       = { fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', margin: 0 };
const badge: React.CSSProperties     = { fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' };
const input: React.CSSProperties     = { padding: '0.45rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' };
const btnDark: React.CSSProperties   = { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '0.55rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' };
