import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface Keyword { palabra: string; frecuencia: number; }

export default function PalabrasFrecuentes() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    requestJson<{ keywords: Keyword[] }>('/api/comentarios/keywords')
      .then((data) => setKeywords(data.keywords))
      .catch(() => setError('No se pudieron cargar las palabras frecuentes.'))
      .finally(() => setCargando(false));
  }, []);

  const maxFrecuencia = Math.max(1, ...keywords.map((k) => k.frecuencia));

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Palabras Frecuentes</h2>
          <p style={sub}>Términos más repetidos en los comentarios registrados (NLTK: tokenize + stopwords + Counter)</p>
        </div>
      </header>

      {cargando && <p role="status">Cargando...</p>}
      {error && <p role="alert">{error}</p>}
      {!cargando && !error && keywords.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Todavía no hay suficientes comentarios para calcular frecuencias.</p>
      )}

      {keywords.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {keywords.map((k) => (
              <div key={k.palabra} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ width: '110px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{k.palabra}</span>
                <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '4px', height: '18px', overflow: 'hidden' }}>
                  <div style={{ width: `${(k.frecuencia / maxFrecuencia) * 100}%`, height: '100%', backgroundColor: '#0f172a' }} />
                </div>
                <span style={{ width: '30px', textAlign: 'right', fontSize: '0.82rem', color: '#64748b' }}>{k.frecuencia}</span>
              </div>
            ))}
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