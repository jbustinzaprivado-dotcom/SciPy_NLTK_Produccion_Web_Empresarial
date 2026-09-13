import React, { useEffect, useState } from 'react';
import { requestJson } from '../services/http';

interface ResultadoOpt {
  recurso_a: number;
  recurso_b: number;
  costo_optimo: number;
  costo_inicial?: number;
  ahorro_obtenido?: number;
  exito: boolean;
}

// Forma de cada fila que devuelve GET /api/optimizacion/historial
interface HistorialItem {
  id: string;
  nombre: string;
  resultado: {
    recurso_a: number;
    recurso_b: number;
    costo_optimo: number;
  };
  costo_inicial: number;
  costo_optimizado: number;
  estado: string;
  created_at: string;
}

export default function Optimizacion() {
  const [capacidad, setCapacidad] = useState(40);
  const [costoA,    setCostoA]    = useState(80);
  const [costoB,    setCostoB]    = useState(50);
  const [resultado, setResultado] = useState<ResultadoOpt | null>(null);
  const [cargando,  setCargando]  = useState(false);

  const [error, setError] = useState('');

  // Historial persistido en la tabla `optimizaciones`
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  // Trae el historial guardado en Supabase al entrar a la pagina
  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const data = await requestJson<HistorialItem[]>('/api/optimizacion/historial');
      setHistorial(data);
    } catch {
      // Si falla, simplemente se deja el historial vacio (no bloquea el resto de la pagina)
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const calcular = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true); setResultado(null); setError('');
    try {
      const data = await requestJson<ResultadoOpt>('/api/optimizacion', {
        method: 'POST',
        body: JSON.stringify({ capacidad_minima: capacidad, costo_base_a: costoA, costo_base_b: costoB }),
      });
      if (!data.exito) throw new Error('Sin solución válida');
      setResultado(data);
      // Cada calculo nuevo queda guardado en la BD, asi que refrescamos la tabla de historial
      cargarHistorial();
    } catch {
      setError('No se obtuvo una optimización válida. Revisa los parámetros y la conexión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={pageHeader}>
        <div>
          <h2 style={h2}>Optimizacion de Recursos — SciPy</h2>
          <p style={sub}>Ejercicio 2: minimizacion de funcion de costo con restriccion de capacidad</p>
        </div>
      </header>

      {error && <p role="alert">{error}</p>}
      {/* Contexto */}
      <div style={card}>
        <h3 style={sectionH3}>Situacion del Ejercicio</h3>
        <p style={p}>Una empresa quiere reducir el costo de operacion de dos recursos (A y B). Se define una funcion de costo:</p>
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#0f172a', margin: '0.75rem 0' }}>
          costo(a, b) = costoA·a + costoB·b + 10·(a − 3)²
        </div>
        <p style={p}><strong>Restriccion:</strong> 10·a + 5·b ≥ capacidad_minima (asegurar cobertura operativa)</p>
        <p style={p}><strong>Metodo:</strong> <code>scipy.optimize.minimize</code> con solver SLSQP y bounds [(0,10),(0,10)].</p>
      </div>

      {/* Formulario */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div style={card}>
          <h3 style={sectionH3}>Parametros de Entrada</h3>
          <form onSubmit={calcular} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <label style={labelSt}>
              Costo base Recurso A (S/):
              <input type="number" value={costoA} onChange={(e) => setCostoA(Number(e.target.value))} style={input} min={1} />
            </label>
            <label style={labelSt}>
              Costo base Recurso B (S/):
              <input type="number" value={costoB} onChange={(e) => setCostoB(Number(e.target.value))} style={input} min={1} />
            </label>
            <label style={labelSt}>
              Capacidad minima requerida:
              <input type="number" value={capacidad} onChange={(e) => setCapacidad(Number(e.target.value))} style={input} min={1} />
            </label>
            <button type="submit" style={btnDark} disabled={cargando}>
              {cargando ? 'Calculando...' : 'Ejecutar Optimizacion'}
            </button>
          </form>
        </div>

        {/* Resultado */}
        {resultado && (
          <div style={card}>
            <h3 style={sectionH3}>Resultado Optimo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
              <KpiRow label="Recurso A optimo"  value={`${resultado.recurso_a} unidades`}  />
              <KpiRow label="Recurso B optimo"  value={`${resultado.recurso_b} unidades`}  />
              <KpiRow label="Costo minimo"      value={`S/ ${resultado.costo_optimo}`}       highlight />
              {resultado.costo_inicial !== undefined && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.82rem', color: '#166534' }}>
                  Ahorro vs. punto inicial: S/ {(resultado.costo_inicial - resultado.costo_optimo).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Historial persistido (tabla `optimizaciones` en Supabase) */}
      <div style={card}>
        <h3 style={sectionH3}>Historial de Optimizaciones</h3>
        {cargandoHistorial ? (
          <p style={p}>Cargando historial...</p>
        ) : historial.length === 0 ? (
          <p style={p}>Todavía no hay optimizaciones guardadas.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th style={th}>Fecha</th>
                  <th style={th}>Recurso A</th>
                  <th style={th}>Recurso B</th>
                  <th style={th}>Costo Inicial</th>
                  <th style={th}>Costo Optimo</th>
                  <th style={th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id}>
                    <td style={td}>{new Date(h.created_at).toLocaleString()}</td>
                    <td style={td}>{h.resultado?.recurso_a}</td>
                    <td style={td}>{h.resultado?.recurso_b}</td>
                    <td style={td}>S/ {h.costo_inicial}</td>
                    <td style={td}>S/ {h.costo_optimizado}</td>
                    <td style={td}>{h.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '0.85rem', color: '#475569' }}>{label}</span>
      <span style={{ fontSize: '1rem', fontWeight: 700, color: highlight ? '#0f172a' : '#334155' }}>{value}</span>
    </div>
  );
}

const card: React.CSSProperties      = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxSizing: 'border-box' };
const pageHeader: React.CSSProperties = { borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' };
const h2: React.CSSProperties        = { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' };
const sub: React.CSSProperties       = { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#52676b' };
const sectionH3: React.CSSProperties = { fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.25rem' };
const p: React.CSSProperties         = { margin: '0.4rem 0', fontSize: '0.85rem', color: '#334155' };
const labelSt: React.CSSProperties   = { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 600, color: '#475569' };
const input: React.CSSProperties     = { padding: '0.45rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', fontWeight: 400 };
const btnDark: React.CSSProperties   = { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '0.55rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' };
const th: React.CSSProperties        = { textAlign: 'left', padding: '0.5rem 0.6rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600 };
const td: React.CSSProperties        = { padding: '0.5rem 0.6rem', borderBottom: '1px solid #f1f5f9', color: '#334155' };