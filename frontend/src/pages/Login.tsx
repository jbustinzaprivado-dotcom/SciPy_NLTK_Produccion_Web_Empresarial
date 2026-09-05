import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2f8' }}>
      <div className="panel" style={{ padding: 32, width: 340 }}>
        <h1 style={{ margin: '0 0 4px', font: '700 22px "Space Grotesk"', color: '#172033' }}>Centro Inteligente</h1>
        <p style={{ margin: '0 0 20px', color: '#8390a3', fontSize: 13 }}>Iniciá sesión para continuar</p>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="field" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="field" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={{ color: '#c0392b', fontSize: 12, margin: 0 }}>{error}</p>}
          <button className="primary-btn" type="submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}