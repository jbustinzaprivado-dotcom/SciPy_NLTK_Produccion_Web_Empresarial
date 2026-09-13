import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestPublicJson } from '../services/http';

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [streamObj, setStreamObj] = useState<MediaStream | null>(null);

  const navigate = useNavigate();

  // Efecto robusto para conectar el stream al elemento video de forma segura
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
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive]);

  const startCamera = () => {
    setError(null);
    setCapturedImage(null);
    setCameraActive(true);
  };

  const stopCamera = () => {
    if (streamObj) {
      streamObj.getTracks().forEach(track => track.stop());
      setStreamObj(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 320;
    canvas.height = videoRef.current.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageBase64 = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageBase64);
    stopCamera(); // Apagamos la camara al capturar para liberar recursos
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!capturedImage) {
      setError('Debes capturar tu rostro para registrarte');
      return;
    }

    setCargando(true);
    setError(null);

    try {
        await requestPublicJson('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          face_image: capturedImage,
        }),
      });

      alert('¡Registro exitoso! Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Hubo un error en el servidor');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-shell theme-eucalyptus">
      <div className="panel auth-card">
        <Link to="/landing" className="auth-brand"><span className="brand-mark">CI</span><span>Centro IA<small>Atención empresarial</small></span></Link>
        <h1 style={{ margin: '0 0 4px', font: '700 22px "Space Grotesk"', color: '#172033' }}>Crea tu cuenta</h1>
        <p style={{ margin: '0 0 20px', color: '#52676b', fontSize: 13 }}>Crea tu cuenta vinculada a tu rostro</p>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="field" type="text" placeholder="Nombre completo" aria-label="Nombre completo" autoComplete="name" value={nombre} onChange={e => setNombre(e.target.value)} required />
          <input className="field" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="field" type="password" placeholder="Contraseña" aria-label="Contraseña" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required />

          {/* Seccion de Camara */}
          <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', minHeight: 160, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', display: cameraActive && !capturedImage ? 'block' : 'none' }}
            />
            {capturedImage && (
              <img src={capturedImage} alt="Rostro capturado" style={{ width: '100%', height: 'auto', display: 'block' }} />
            )}
            {!cameraActive && !capturedImage && (
              <button type="button" onClick={startCamera} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                Encender Cámara para Foto
              </button>
            )}
          </div>

          {cameraActive && !capturedImage && (
            <button type="button" onClick={capturePhoto} className="primary-btn" style={{ background: '#059669' }}>
              Tomar Foto del Rostro
            </button>
          )}

          {capturedImage && (
            <button type="button" onClick={startCamera} style={{ background: 'transparent', border: 'none', color: '#193d4a', fontSize: 12, cursor: 'pointer' }}>
              Volver a tomar foto
            </button>
          )}

          {error && <p style={{ color: '#c0392b', fontSize: 12, margin: 0 }}>{error}</p>}

          <button className="primary-btn" type="submit" disabled={cargando}>
            {cargando ? 'Registrando...' : 'Completar Registro'}
          </button>

          <Link to="/login" style={{ textAlign: 'center', color: '#52676b', fontSize: 12, textDecoration: 'none', marginTop: 8 }}>
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </form>
      </div>
    </div>
  );
}