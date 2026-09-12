import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';
import { requestPublicJson, setToken } from '../services/http';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [isFaceMode, setIsFaceMode] = useState(false);
  const [faceEmail, setFaceEmail] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [streamObj, setStreamObj] = useState<MediaStream | null>(null);

  const navigate = useNavigate();

  // Control seguro del stream de la camara al cambiar de modo
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    async function setupCamera() {
      if (cameraActive) {
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStreamObj(currentStream);
          if (videoRef.current) {
            videoRef.current.srcObject = currentStream;
          }
        } catch (err) {
          console.error(err);
          setCameraActive(false);
          setError('No se pudo acceder a la cámara. Verifica permisos.');
        }
      }
    }
    setupCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, [cameraActive]);

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

  const startCamera = () => {
    setError(null);
    setCameraActive(true);
  };

  const stopCamera = () => {
    if (streamObj) {
      streamObj.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setStreamObj(null);
    }
    setCameraActive(false);
  };

  async function handleFaceLogin() {
    if (!videoRef.current) return;

    // El email es obligatorio: el rostro se compara solo contra ESA cuenta
    if (!faceEmail.trim()) {
      setError('Ingresa tu email para el login facial.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageBase64 = canvas.toDataURL('image/jpeg');

      const data = await requestPublicJson<{ access_token: string }>('/api/auth/face-login', {
        method: 'POST',
        body: JSON.stringify({
          face_image: imageBase64,
          email: faceEmail.trim(),
        }),
      });

      setToken(data.access_token);
      stopCamera();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Rostro no reconocido en el sistema');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-shell theme-eucalyptus">
      <div className="panel auth-card">
        <Link to="/landing" className="auth-brand"><span className="brand-mark">CI</span><span>Centro IA<small>Atención empresarial</small></span></Link>
        <h1 style={{ margin: '0 0 4px', font: '700 22px "Space Grotesk"', color: '#172033' }}>Bienvenido de nuevo</h1>
        <p style={{ margin: '0 0 20px', color: '#52676b', fontSize: 13 }}>
          {isFaceMode ? 'Acceso con tu rostro' : 'Ingresa a tu espacio de trabajo'}
        </p>

        {!isFaceMode ? (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="field" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="field" type="password" placeholder="Contraseña" aria-label="Contraseña" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p style={{ color: '#c0392b', fontSize: 12, margin: 0 }}>{error}</p>}
            <button className="primary-btn" type="submit" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
            <button type="button" onClick={() => { setIsFaceMode(true); setError(null); }} style={{ background: 'transparent', border: 'none', color: '#193d4a', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
              Iniciar sesión con Reconocimiento Facial
            </button>
            <Link to="/register" style={{ textAlign: 'center', color: '#52676b', fontSize: 12, textDecoration: 'none' }}>
              ¿No tienes cuenta? Regístrate aquí
            </Link>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="field"
              type="email"
              placeholder="Correo electrónico" aria-label="Correo electrónico" autoComplete="email"
              value={faceEmail}
              onChange={e => setFaceEmail(e.target.value)}
              required
            />

            <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', display: 'flex', justifyContent: 'center', minHeight: 180, position: 'relative' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', display: cameraActive ? 'block' : 'none' }}
              />
              {!cameraActive && (
                <div style={{ color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                  Cámara inactiva
                </div>
              )}
            </div>

            {error && <p style={{ color: '#c0392b', fontSize: 12, margin: 0 }}>{error}</p>}

            {!cameraActive ? (
              <button className="primary-btn" type="button" onClick={startCamera}>
                Encender Cámara
              </button>
            ) : (
              <button className="primary-btn" type="button" disabled={cargando} onClick={handleFaceLogin}>
                {cargando ? 'Validando rostro...' : 'Iniciar Sesión con mi Rostro'}
              </button>
            )}

            <button type="button" onClick={() => { stopCamera(); setIsFaceMode(false); setError(null); }} style={{ background: 'transparent', border: 'none', color: '#52676b', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
              Volver al login normal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}