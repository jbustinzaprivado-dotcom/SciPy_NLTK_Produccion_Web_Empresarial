import { requestJson } from '../services/http';
import type { ServicioItem } from '../types';
import React, { useState } from 'react';

interface ClasifResult { categoria: string; confianza: number; }
export default function AnalisisNLP() {
  // Ejercicio 5 — Clasificador
  const [mensaje,   setMensaje]   = useState('');
  const [clasif,    setClasif]    = useState<ClasifResult | null>(null);
  const [cargClasif, setCargClasif] = useState(false);

  // Ejercicio 6 — Buscador
  const [consulta,  setConsulta]  = useState('');
  const [resultados, setResultados] = useState<ServicioItem[]>([]);
  const [cargBusq,  setCargBusq]  = useState(false);

  const [errorClasif, setErrorClasif] = useState('');
  const [errorBusq, setErrorBusq] = useState('');
  const [buscado, setBuscado] = useState(false);
  const [mensajeAnalizado, setMensajeAnalizado] = useState('');

    const clasificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargClasif(true); setClasif(null); setErrorClasif('');
    try {
      const data = await requestJson<ClasifResult>('/api/nltk/clasificar', {
        method: 'POST',
        body: JSON.stringify({ mensaje }),
      });
      setClasif(data); setMensajeAnalizado(mensaje);
    } catch {
      setErrorClasif('No se pudo clasificar el mensaje. Inténtalo de nuevo.');
    } finally {
      setCargClasif(false);
    }
  };

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargBusq(true); setResultados([]); setErrorBusq(''); setBuscado(false);
    try {
      setResultados(await requestJson<ServicioItem[]>(`/api/nltk/buscar?q=${encodeURIComponent(consulta)}`));
      setBuscado(true);
    } catch {
      setErrorBusq('No se pudo consultar los servicios. Inténtalo de nuevo.');
    } finally {
      setCargBusq(false);
    }
  };

  const categoriaColor: Record<string, string> = { ventas: '#1d4ed8', soporte: '#0284c7', reclamo: '#dc2626' };
  const categoriaBg:    Record<string, string> = { ventas: '#eff6ff', soporte: '#f0f9ff', reclamo: '#fef2f2' };

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={pageHeader}>
        <div>
          <h2 style={h2}>Analisis de Lenguaje Natural — NLTK</h2>
          <p style={sub}>Ejercicio 5: clasificacion de mensajes · Ejercicio 6: buscador inteligente de servicios</p>
        </div>
      </header>

      <p role="note">Clasificación provisional por reglas. El porcentaje mostrado es fijo y no representa la probabilidad de un modelo entrenado. La búsqueda usa un catálogo de ejemplo.</p>
      {/* Ejercicio 5 — Clasificador */}
      <section>
        <SectionTitle title="Ejercicio 5 — Clasificador de Mensajes" badge="NLTK Classifier" />
        <p style={desc}>
          Flujo: tokenizar → normalizar → extraer atributos → clasificar en <em>ventas</em>, <em>soporte</em> o <em>reclamo</em>.
          El backend devuelve la categoria y nivel de confianza.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={card}>
            <form onSubmit={clasificar} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={labelSt}>Mensaje del cliente:
                <textarea rows={4} placeholder='Ej: "Necesito soporte con mi computadora" o "Tengo un reclamo por la demora"' value={mensaje} onChange={(e) => setMensaje(e.target.value)} style={{ ...input, resize: 'vertical', marginTop: '0.25rem' }} required />
              </label>
              <button type="submit" style={btnDark} disabled={cargClasif}>
                {cargClasif ? 'Clasificando...' : 'Clasificar Mensaje'}
              </button>
            </form>
          </div>

          {errorClasif && <p role="alert">{errorClasif}</p>}
          {clasif && (
            <div style={card}>
              <h3 style={sH3}>Resultado de la Clasificacion</h3>
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: '8px', fontSize: '1.25rem', fontWeight: 700, backgroundColor: categoriaBg[clasif.categoria] ?? '#f8fafc', color: categoriaColor[clasif.categoria] ?? '#334155', border: `2px solid ${categoriaColor[clasif.categoria] ?? '#e2e8f0'}`, textTransform: 'capitalize' }}>
                  {clasif.categoria}
                </div>
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: '#52676b' }}>
                  Confianza: <strong>{(clasif.confianza * 100).toFixed(0)}%</strong>
                </p>
              </div>
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.78rem', color: '#475569', fontFamily: 'monospace' }}>
                Mensaje analizado: "{mensajeAnalizado.slice(0, 60)}{mensajeAnalizado.length > 60 ? '...' : ''}"
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Ejercicio 6 — Buscador */}
      <section>
        <SectionTitle title="Ejercicio 6 — Buscador Inteligente de Servicios" badge="word_tokenize" />
        <p style={desc}>
          Recibe una consulta en lenguaje natural, tokeniza y normaliza, luego compara con la base de servicios de la empresa.
        </p>
        <div style={card}>
          <form onSubmit={buscar} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input type="text" placeholder='Ej: "necesito ayuda con mi computadora"' value={consulta} onChange={(e) => setConsulta(e.target.value)} style={{ ...input, flex: 1, minWidth: '200px' }} required />
            <button type="submit" style={{ ...btnDark, whiteSpace: 'nowrap' }} disabled={cargBusq}>
              {cargBusq ? 'Buscando...' : 'Buscar Servicio'}
            </button>
          </form>
          {errorBusq && <p role="alert">{errorBusq}</p>}
          {buscado && resultados.length === 0 && <p>No se encontraron servicios.</p>}
          {resultados.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#52676b', textAlign: 'left' }}>
                  <th style={th}>Servicio encontrado</th>
                  <th style={th}>Relevancia</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={td}><strong>{r.nombre}</strong></td>
                    <td style={td}>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '3px', backgroundColor: (r.coincidencia ?? 0) >= 3 ? '#f0fdf4' : '#f8fafc', color: (r.coincidencia ?? 0) >= 3 ? '#166534' : '#475569', border: '1px solid', borderColor: (r.coincidencia ?? 0) >= 3 ? '#bbf7d0' : '#e2e8f0' }}>
                        {r.coincidencia === undefined ? 'Sugerencia del catálogo' : `${r.coincidencia} puntos`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title, badge }: { title: string; badge: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>{title}</h3>
      <code style={{ fontSize: '0.7rem', color: '#52676b', fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>{badge}</code>
    </div>
  );
}

const card: React.CSSProperties       = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties  = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties         = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties        = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#52676b' };
const sH3: React.CSSProperties        = { fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.5rem' };
const desc: React.CSSProperties       = { fontSize: '0.82rem', color: '#52676b', margin: '0 0 0.75rem' };
const labelSt: React.CSSProperties    = { fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'flex', flexDirection: 'column' };
const input: React.CSSProperties      = { padding: '0.45rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' };
const btnDark: React.CSSProperties    = { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' };
const th: React.CSSProperties         = { padding: '0.4rem', fontWeight: 600 };
const td: React.CSSProperties         = { padding: '0.4rem' };
