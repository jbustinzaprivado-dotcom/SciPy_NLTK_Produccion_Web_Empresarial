import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface ComentarioResumen {
  id: string;
  cliente_nombre: string;
  comentario: string;
}

interface Analisis {
  id: string;
  contenido: string;
  categoria: string | null;
  cliente_nombre: string;
  total_tokens: number;
  palabras_clave: string[];
}

export default function AnalizarComentario() {
  const [comentarios, setComentarios] = useState<ComentarioResumen[]>([]);
  const [comentarioId, setComentarioId] = useState('');
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Carga la lista de comentarios reales una sola vez, para el selector
  useEffect(() => {
    requestJson<ComentarioResumen[]>('/api/comentarios')
      .then(setComentarios)
      .catch(() => setError('No se pudo cargar la lista de comentarios.'));
  }, []);

  useEffect(() => {
    if (!comentarioId) { setAnalisis(null); return; }
    setCargando(true); setError('');
    requestJson<Analisis>(`/api/comentarios/${comentarioId}/analisis`)
      .then(setAnalisis)
      .catch(() => setError('No se pudo analizar este comentario.'))
      .finally(() => setCargando(false));
  }, [comentarioId]);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Analizar Comentario</h2>
          <p style={sub}>Desglose NLTK (tokens y palabras clave) de un comentario real ya registrado</p>
        </div>
      </header>

      <div style={card}>
        <label style={labelSt}>Seleccionar comentario
          <select value={comentarioId} onChange={(e) => setComentarioId(e.target.value)} style={{ ...input, marginTop: '0.35rem' }}>
            <option value="">-- Elegí un comentario --</option>
            {comentarios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cliente_nombre}: {c.comentario.slice(0, 50)}{c.comentario.length > 50 ? '...' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p role="alert">{error}</p>}
      {cargando && <p role="status">Analizando...</p>}

      {analisis && (
        <div style={card}>
          <p style={cardLabel}>Resultado del análisis</p>
          <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0 0 0.75rem' }}>
            <strong>{analisis.cliente_nombre}:</strong> "{analisis.contenido}"
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem' }}>
            <div>
              <span style={miniLabel}>Categoría (NLTK)</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{analisis.categoria || '—'}</span>
            </div>
            <div>
              <span style={miniLabel}>Total tokens</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{analisis.total_tokens}</span>
            </div>
          </div>
          <span style={miniLabel}>Palabras clave detectadas</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
            {analisis.palabras_clave.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No se detectaron palabras clave relevantes.</span>
            ) : (
              analisis.palabras_clave.map((p) => (
                <span key={p} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.82rem' }}>{p}</span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' };
const cardLabel: React.CSSProperties = { margin: '0 0 0.6rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' };
const labelSt: React.CSSProperties   = { display: 'flex', flexDirection: 'column', fontSize: '0.82rem', fontWeight: 600, color: '#475569' };
const input: React.CSSProperties     = { padding: '0.45rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', width: '100%', maxWidth: '420px', boxSizing: 'border-box' };
const miniLabel: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' };