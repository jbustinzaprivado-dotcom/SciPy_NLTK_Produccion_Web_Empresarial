import './ClasificacionMensaje.css';

export interface AnalisisMensaje { total_tokens: number; palabras_clave: string[] }

export default function ClasificacionMensaje({ categoria, motivo, analisis }: {
  categoria: string | null; motivo?: string; analisis?: AnalisisMensaje | null;
}) {
  return <section className="message-analysis" aria-label="Clasificación del mensaje">
    <div className="message-analysis-heading">
      <div><span className="message-analysis-label">Categoría del sistema</span>
        <strong className="message-category">{categoria || 'Pendiente de clasificar'}</strong></div>
      {analisis && <div><span className="message-analysis-label">Total de tokens</span><strong>{analisis.total_tokens}</strong></div>}
    </div>
    {motivo && <p className="message-reason">{motivo}</p>}
    {analisis && <div><span className="message-analysis-label">Palabras clave · NLTK</span>
      <div className="message-keywords">{analisis.palabras_clave.length
        ? analisis.palabras_clave.map(palabra => <span key={palabra}>{palabra}</span>)
        : <span>Sin palabras clave</span>}</div></div>}
  </section>;
}
