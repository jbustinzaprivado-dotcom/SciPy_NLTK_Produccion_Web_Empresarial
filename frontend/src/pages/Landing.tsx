import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { requestPublicJson } from '../services/http';
import './Landing.css';

const services = [
  ['01', 'Soporte técnico', 'Mantenimiento preventivo y correctivo', 'Atención a computadoras, laptops e infraestructura de oficina.'],
  ['02', 'Tecnología', 'Desarrollo de software y APIs', 'Portales web y soluciones digitales adaptadas a tu empresa.'],
  ['03', 'Analítica', 'Ciencia de datos y procesamiento NLP', 'Estadística y análisis de lenguaje para comprender mejor tus datos.'],
  ['04', 'Consultoría', 'Optimización operativa y de costos', 'Modelos matemáticos para aprovechar mejor tus recursos.'],
];

export default function Landing() {
  const { hash } = useLocation();
  const [sending, setSending] = useState(false);
  const busy = useRef(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  useEffect(() => {
    document.title = 'Centro IA | Contáctenos';
    return () => { document.title = 'Centro Inteligente de Atención'; };
  }, []);
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [hash]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const data = Object.fromEntries(['nombre', 'empresa', 'correo', 'telefono', 'asunto'].map(key => [key, String(values.get(key) ?? '').trim()]));
    if (!data.nombre || data.asunto.length < 10) {
      setNotice({ error: true, text: 'Escribe tu nombre y una consulta de al menos 10 caracteres.' });
      return;
    }
    busy.current = true;
    setSending(true);
    setNotice(null);
    try {
      const result = await requestPublicJson<{ id: string }>('/api/contacto', { method: 'POST', body: JSON.stringify(data), signal: AbortSignal.timeout(20000) });
      setNotice({ error: false, text: `Gracias por escribirnos. Tu consulta ha sido registrada con el número ${result.id}.` });
      form.reset();
    } catch {
      setNotice({ error: true, text: 'No pudimos confirmar el registro de tu consulta. Conservamos tus datos en el formulario para que puedas volver a intentarlo.' });
    } finally {
      busy.current = false;
      setSending(false);
    }
  }

  return <div className="contact-landing theme-eucalyptus">
    <a className="landing-skip" href="#contacto">Ir al formulario de contacto</a>
    <header className="landing-header"><div className="landing-container landing-nav">
      <Link className="landing-brand" to="/landing"><span className="brand-mark" aria-hidden="true">CI</span><span className="landing-brand-copy">Centro IA<small>Atención empresarial</small></span></Link>
      <nav aria-label="Navegación pública">
        <a href="#nosotros">Nosotros</a><a href="#servicios">Servicios</a><a className="landing-button" href="#contacto">Contáctenos <span aria-hidden="true">↗</span></a>
      </nav>
    </div></header>
    <main>
      <section className="landing-hero"><div className="landing-container landing-hero-grid">
        <div><p className="landing-kicker">TECNOLOGÍA · DATOS · PERSONAS</p><h1>Soluciones inteligentes.<br /><span>Conversaciones que importan.</span></h1><p className="landing-intro">Tu próximo paso empieza con una conversación. Conectamos tecnología y datos para ayudar a tu empresa a crecer.</p><a className="landing-button" href="#contacto">Hablemos de tu proyecto <span aria-hidden="true">↗</span></a></div>
        <aside className="landing-promise"><span className="landing-orbit" aria-hidden="true">✳</span><p className="landing-kicker">UN EQUIPO, MÁS POSIBILIDADES</p><h2>La tecnología empieza<br />por escucharte.</h2><ul><li>Soluciones según las necesidades de tu empresa</li><li>Desarrollo, soporte y datos en un solo lugar</li><li>Un enfoque cercano y personalizado</li></ul></aside>
      </div></section>
      <section id="nosotros" className="landing-container landing-about"><div><p className="landing-kicker">CONÓCENOS</p><h2>Datos con propósito.<br />Tecnología con sentido.</h2><p>En Centro IA combinamos ciencia de datos, procesamiento de lenguaje natural y desarrollo de software para ayudar a las empresas a atender mejor a sus clientes y optimizar sus operaciones.</p><p>Queremos entender tu reto y encontrar juntos una solución que encaje con tu negocio.</p></div><div className="landing-values"><article><h3>Misión</h3><p>Convertir los datos y las conversaciones con clientes en decisiones concretas mediante soluciones tecnológicas accesibles.</p></article><article><h3>Visión</h3><p>Ser una referencia en atención inteligente, integrando ciencia de datos y automatización en el servicio empresarial.</p></article></div></section>
      <section id="servicios" className="landing-services"><div className="landing-container"><p className="landing-kicker">CÓMO PODEMOS AYUDARTE</p><h2>Un aliado para cada desafío.</h2><p>Cuatro áreas de trabajo. Un mismo compromiso con tu empresa.</p><div className="landing-service-grid">{services.map(([number, category, title, description]) => <article key={number}><span className="landing-service-number">{number}</span><p className="landing-kicker">{category}</p><h3>{title}</h3><p>{description}</p><a href="#contacto" aria-label={`Consultar sobre ${title}`}>Conversemos <span aria-hidden="true">↗</span></a></article>)}</div></div></section>
      <section id="contacto" className="landing-container landing-contact"><div><p className="landing-kicker">ESTAMOS PARA ESCUCHARTE</p><h2>Contáctenos<span className="landing-blue">.</span></h2><p className="landing-intro">Cuéntanos qué tienes en mente.<br />Demos el primer paso juntos.</p><div className="landing-contact-note"><span aria-hidden="true">↗</span><div><h3>Una conversación a tu medida</h3><p>Describe lo que necesitas y comparte un correo para que podamos responderte.</p></div></div><p className="landing-small">¿Ya trabajas con nosotros? <Link to="/dashboard">Ir al panel empresarial →</Link></p></div>
        <form className="landing-form" onSubmit={submit} aria-label="Formulario de contacto" aria-busy={sending}><h3>Hablemos de tu proyecto</h3><p>Los campos con * son obligatorios.</p><fieldset disabled={sending}><div className="landing-fields"><label>Nombre completo *<input name="nombre" autoComplete="name" required maxLength={150} placeholder="Tu nombre" /></label><label>Empresa<input name="empresa" autoComplete="organization" maxLength={200} placeholder="Nombre de tu empresa" /></label><label>Correo electrónico *<input name="correo" type="email" autoComplete="email" required maxLength={200} placeholder="nombre@empresa.com" /></label><label>Teléfono<input name="telefono" type="tel" autoComplete="tel" maxLength={50} placeholder="Incluye el código de país" /></label><label className="landing-message">¿En qué podemos ayudarte? *<textarea name="asunto" required minLength={10} maxLength={5000} rows={5} placeholder="Cuéntanos sobre tu proyecto o consulta…" /></label></div><p className="landing-small">Usaremos los datos que compartas para atender esta consulta.</p><button className="landing-button" type="submit">{sending ? 'Registrando consulta…' : 'Enviar consulta'} <span aria-hidden="true">↗</span></button></fieldset>{notice && <p className={`landing-notice ${notice.error ? 'is-error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.text}</p>}</form>
      </section>
    </main>
    <footer className="landing-footer landing-container"><Link className="landing-brand" to="/landing"><span className="brand-mark" aria-hidden="true">CI</span><span className="landing-brand-copy">Centro IA<small>Atención empresarial</small></span></Link><p>© {new Date().getFullYear()} Centro IA</p><a href="#nosotros">Volver a nosotros ↑</a></footer>
  </div>;
}
