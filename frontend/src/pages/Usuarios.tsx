import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  created_at: string;
}

const ROLES = ['usuario', 'analista', 'supervisor', 'admin'];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // estado del formulario de creación
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('usuario');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      setUsuarios(await requestJson<Usuario[]>('/api/usuarios'));
    } catch {
      setError('No se pudieron cargar los usuarios (¿tenés rol admin?).');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setErrorGuardado('');
    if (!nombre.trim() || !email.trim() || password.length < 8) {
      setErrorGuardado('Completa nombre, email y una contraseña de al menos 8 caracteres.');
      return;
    }
    setGuardando(true);
    try {
      await requestJson('/api/usuarios', {
        method: 'POST',
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password, rol }),
      });
      setNombre(''); setEmail(''); setPassword(''); setRol('usuario');
      await cargar();
    } catch {
      setErrorGuardado('No se pudo crear el usuario (¿ya existe ese email?).');
    } finally {
      setGuardando(false);
    }
  };

  // activa o desactiva un usuario existente con un solo click
  const alternarEstado = async (u: Usuario) => {
    try {
      await requestJson(`/api/usuarios/${u.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !u.activo }),
      });
      await cargar();
    } catch {
      setError('No se pudo cambiar el estado del usuario.');
    }
  };

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={pageHeader}>
        <div>
          <h2 style={h2}>Usuarios</h2>
          <p style={sub}>Gestión de cuentas y roles de acceso al sistema (solo administradores)</p>
        </div>
      </header>

      {cargando && <p role="status">Cargando usuarios...</p>}
      {error && <p role="alert">{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Formulario */}
        <div style={card}>
          <p style={cardLabel}>Nuevo usuario</p>
          <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} style={input} required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} required />
            <input type="password" placeholder="Contraseña (mín. 8 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} style={input} required />
            <select value={rol} onChange={(e) => setRol(e.target.value)} style={input}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="submit" disabled={guardando} style={btnDark}>{guardando ? 'Guardando...' : 'Crear usuario'}</button>
            {errorGuardado && <p role="alert" style={{ color: '#dc2626', fontSize: '0.8rem', margin: 0 }}>{errorGuardado}</p>}
          </form>
        </div>

        {/* Tabla */}
        <div style={card}>
          <p style={cardLabel}>Usuarios registrados ({usuarios.length})</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#52676b', textAlign: 'left' }}>
                  <th style={th}>Nombre</th>
                  <th style={th}>Email</th>
                  <th style={th}>Rol</th>
                  <th style={th}>Estado</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={td}><strong style={{ color: '#0f172a' }}>{u.nombre}</strong></td>
                    <td style={{ ...td, color: '#475569' }}>{u.email}</td>
                    <td style={{ ...td, color: '#475569' }}>{u.rol}</td>
                    <td style={td}>{u.activo ? 'Activo' : 'Inactivo'}</td>
                    <td style={td}>
                      <button type="button" onClick={() => alternarEstado(u)} style={btnLink}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
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
const btnLink: React.CSSProperties   = { background: 'none', border: 'none', color: '#0f172a', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 };
const th: React.CSSProperties        = { padding: '0.5rem 0.6rem', fontWeight: 600 };
const td: React.CSSProperties        = { padding: '0.5rem 0.6rem' };