import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requestJson } from '../services/http';

interface Consulta {
  id: string; nombre: string; empresa: string; correo: string; telefono: string;
  asunto: string; created_at: string; estado: 'pendiente' | 'en_atencion' | 'atendida';
}
const estados = { pendiente: 'Pendiente', en_atencion: 'En atención', atendida: 'Atendida' };

export default function Consultas() {
  const [items, setItems] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [offset, setOffset] = useState(0);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setNotice('');
    requestJson<Consulta[]>(`/api/contacto?limit=20&offset=${offset}`, { signal: controller.signal })
      .then(setItems).catch(() => { if (!controller.signal.aborted) { setItems([]); setError('No se pudieron cargar las consultas. Comprueba que la API esté iniciada e intenta actualizar.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [offset, reload]);

  async function changeStatus(item: Consulta, estado: string) {
    setSaving(item.id); setError(''); setNotice('');
    try {
      const updated = await requestJson<Consulta>(`/api/contacto/${item.id}`, { method: 'PATCH', body: JSON.stringify({ estado }) });
      setItems(current => current.map(row => row.id === updated.id ? updated : row));
      setNotice(`Consulta #${item.id}: ${estados[updated.estado]}.`);
    } catch { setError('No se pudo guardar el estado. Intenta nuevamente.'); }
    finally { setSaving(null); }
  }

  return <div className="page-shell content-stack">
    <header className="page-header"><div><p className="eyebrow">ATENCIÓN EMPRESARIAL</p><h2>Consultas web</h2><p>Mensajes recibidos desde el formulario de Contáctenos.</p></div></header>
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}><button className="primary-btn" disabled={loading || saving !== null} onClick={() => setReload(value => value + 1)}>Actualizar consultas</button><Link to="/landing#contacto">Abrir formulario público ↗</Link></div>
    {loading && <p role="status">Cargando consultas…</p>}
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {!loading && !error && items.length === 0 && <div className="panel"><h3>No hay consultas en esta página</h3><p>Las consultas enviadas desde la landing aparecerán aquí.</p></div>}
    {!loading && items.map(item => <article className="panel" key={item.id}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}><div><span className="eyebrow">CONSULTA #{item.id} · {new Date(item.created_at).toLocaleString('es-PE')}</span><h3 style={{ margin: '8px 0' }}>{item.nombre}</h3><p style={{ margin: '0 0 12px' }}>{item.empresa || 'Sin empresa indicada'}</p></div><label>Estado <select aria-label={`Estado de consulta ${item.id}`} className="field" style={{ marginLeft: 8 }} disabled={saving !== null} value={item.estado} onChange={event => changeStatus(item, event.target.value)}>{Object.entries(estados).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, overflowWrap: 'anywhere' }}><a href={`mailto:${item.correo}`}>{item.correo}</a><span>{item.telefono || 'Sin teléfono indicado'}</span></div>
      <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.7, borderTop: '1px solid #e5eaf1', paddingTop: 16 }}>{item.asunto}</p>
    </article>)}
    <nav aria-label="Páginas de consultas" style={{ display: 'flex', gap: 16, alignItems: 'center' }}><button className="primary-btn" disabled={loading || saving !== null || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 20))}>Anterior</button><span>Página {offset / 20 + 1}</span><button className="primary-btn" disabled={loading || saving !== null || items.length < 20} onClick={() => setOffset(value => value + 20)}>Siguiente</button></nav>
  </div>;
}
