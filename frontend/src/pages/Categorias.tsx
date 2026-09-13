import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  // estado del formulario de creación
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');

  const cargar = async () => {
    setCargando(true); setError('');
    try { setCategorias(await requestJson<Categoria[]>('/api/categorias')); }
    catch { setCategorias([]); setError('No se pudieron cargar las categorías.'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setErrorGuardado('');
    if (!nombre.trim()) {
      setErrorGuardado('Ingresa un nombre para la categoría.');
      return;
    }
    setGuardando(true);
    try {
      // el backend guarda el nombre tal cual se lo mandemos (en minúscula,
      // para que combine con lo que ya clasifica el clasificador de NLTK)
      await requestJson('/api/categorias', {
        method: 'POST',
        body: JSON.stringify({ nombre: nombre.trim().toLowerCase(), descripcion: descripcion.trim() }),
      });
      setNombre(''); setDescripcion('');
      await cargar();
    } catch {
      setErrorGuardado('No se pudo crear la categoría (¿ya existe ese nombre?).');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Categorías de Comentarios</h2>
          <p style={sub}>Catálogo administrable usado por la clasificación NLTK</p>
        </div>
      </header>

      {cargando && <p role="status">Cargando categorías...</p>}
      {error && <p role="alert">{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Formulario */}
        <div style={card}>
          <p style={cardLabel}>Nueva categoría</p>
          <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <input type="text" placeholder="Nombre (ej. envios)" value={nombre} onChange={(e) => setNombre(e.target.value)} style={input} required />
            <textarea rows={2} placeholder="Descripción..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={{ ...input, resize: 'vertical' }} />
            <button type="submit" disabled={guardando} style={btnDark}>{guardando ? 'Guardando...' : 'Crear categoría'}</button>
            {errorGuardado && <p role="alert" style={{ color: '#dc2626', fontSize: '0.8rem', margin: 0 }}>{errorGuardado}</p>}
          </form>
        </div>

        {/* Tabla */}
        <div style={card}>
          <p style={cardLabel}>Categorías activas ({categorias.length})</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#52676b', textAlign: 'left' }}>
                  <th style={th}>Nombre</th>
                  <th style={th}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={td}><strong style={{ color: '#0f172a' }}>{c.nombre}</strong></td>
                    <td style={{ ...td, color: '#475569' }}>{c.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#52676b' };
const cardLabel: React.CSSProperties = { margin: '0 0 0.6rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' };
const input: React.CSSProperties     = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' };
const btnDark: React.CSSProperties   = { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' };
const th: React.CSSProperties        = { padding: '0.5rem 0.6rem', fontWeight: 600 };
const td: React.CSSProperties        = { padding: '0.5rem 0.6rem' };