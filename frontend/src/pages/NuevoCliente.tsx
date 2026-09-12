import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestJson } from '../services/http';

export default function NuevoCliente() {
  const navegar = useNavigate();

  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setError(''); setExito(false);
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setGuardando(true);
    try {
      await requestJson('/api/clientes', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombre.trim(),
          empresa: empresa.trim(),
          correo: correo.trim(),
          telefono: telefono.trim(),
        }),
      });
      setExito(true);
      setNombre(''); setEmpresa(''); setCorreo(''); setTelefono('');
    } catch {
      setError('No se pudo crear el cliente. Revisa los datos e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Nuevo Cliente</h2>
          <p style={sub}>Registrar un nuevo cliente en el directorio</p>
        </div>
      </header>

      <div style={{ ...card, maxWidth: '480px' }}>
        <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={labelSt}>Nombre *
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={input} required />
          </label>
          <label style={labelSt}>Empresa
            <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} style={input} />
          </label>
          <label style={labelSt}>Correo
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} style={input} />
          </label>
          <label style={labelSt}>Teléfono
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={input} />
          </label>
          <button type="submit" style={btnDark} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Crear cliente'}
          </button>
          {error && <p role="alert" style={{ color: '#dc2626', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
          {exito && (
            <p style={{ color: '#166534', fontSize: '0.82rem', margin: 0 }}>
              Cliente creado correctamente.{' '}
              <button type="button" onClick={() => navegar('/clientes')} style={btnLink}>Ver en la lista</button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#52676b' };
const labelSt: React.CSSProperties   = { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 600, color: '#475569' };
const input: React.CSSProperties     = { padding: '0.45rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', fontWeight: 400 };
const btnDark: React.CSSProperties   = { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '0.55rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' };
const btnLink: React.CSSProperties   = { background: 'none', border: 'none', color: '#166534', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 };