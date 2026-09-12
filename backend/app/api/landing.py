from datetime import date
from typing import Annotated
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from app.database.connection import get_connection
from app.services.nltk_service import clasificar_texto
from app.services.auditoria_service import registrar

router = APIRouter(tags=["Landing"])

Asunto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10000)]


class ContactoLanding(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    nombre: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
    empresa: str = Field(default="", max_length=200)
    correo: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    telefono: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
    asunto: Asunto


@router.post("/api/landing/contacto", status_code=201)
def crear_contacto(data: ContactoLanding, db=Depends(get_connection)):
    # Cada envío del formulario público crea un cliente nuevo: no es un usuario
    # del sistema, es un lead que recién llega, así que no se busca duplicados.
    cliente_id = db.execute(
        "INSERT INTO clientes(nombre, empresa, correo, telefono) VALUES (%s, %s, %s, %s) RETURNING id",
        (data.nombre, data.empresa, data.correo, data.telefono),
    ).fetchone()["id"]

    categoria, _ = clasificar_texto(data.asunto)
    comment_id = db.execute(
        "INSERT INTO comentarios(cliente_id, contenido, fecha, categoria, procesado) VALUES (%s, %s, %s, %s, TRUE) RETURNING id",
        (cliente_id, data.asunto, date.today(), categoria),
    ).fetchone()["id"]

    registrar(db, "crear_contacto_landing", "comentarios", comment_id, {"categoria": categoria})
    db.commit()

    return {"mensaje": "Gracias por contactarnos, en breve te responderemos."}


@router.get("/landing", response_class=HTMLResponse)
def landing_page():
    return LANDING_HTML


LANDING_HTML = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Empresa Inteligente - Contacto</title>
<style>
  :root {
    --accent: #2563eb;
    --accent-dark: #1d4ed8;
    --texto: #0f172a;
    --muted: #64748b;
    --borde: #e2e8f0;
    --fondo: #f8fafc;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #fff; margin: 0; padding: 0; color: var(--texto); line-height: 1.5; }

  .navbar { position: sticky; top: 0; background: #fff; box-shadow: 0 1px 3px rgba(15,23,42,0.06); z-index: 10; }
  .navbar-inner { max-width: 1140px; margin: 0 auto; padding: 1.1rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
  .navbar .brand { font-weight: 800; font-size: 1.1rem; color: var(--texto); }
  .navbar .brand span { color: var(--accent); }
  .navbar .nav-links { display: flex; gap: 1.75rem; align-items: center; }
  .navbar .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.88rem; font-weight: 600; transition: color 0.15s; }
  .navbar .nav-links a:hover { color: var(--accent); }
  .navbar .nav-links a.cta { background: var(--accent); color: #fff; padding: 0.5rem 1.1rem; border-radius: 6px; }
  .navbar .nav-links a.cta:hover { background: var(--accent-dark); color: #fff; }

  .contenedor { max-width: 1140px; margin: 0 auto; padding: 0 2rem; }

  header.hero { position: relative; overflow: hidden; background: linear-gradient(180deg, #eff6ff 0%, #fff 100%); padding: 5rem 0; }
  header.hero::before, header.hero::after { content: ""; position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.35; z-index: 0; }
  header.hero::before { width: 320px; height: 320px; background: #93c5fd; top: -100px; right: -60px; }
  header.hero::after { width: 260px; height: 260px; background: #bfdbfe; bottom: -120px; right: 220px; }
  .hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 3rem; align-items: center; }
  .badge { display: inline-block; background: #dbeafe; color: var(--accent-dark); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.35rem 0.9rem; border-radius: 999px; margin-bottom: 1.25rem; }
  header.hero h1 { font-size: 2.75rem; margin: 0 0 1rem; letter-spacing: -0.02em; line-height: 1.1; }
  header.hero p.lead { color: var(--muted); font-size: 1.1rem; max-width: 480px; margin: 0 0 1.75rem; }
  .btn-primario { display: inline-block; background: var(--accent); color: #fff; text-decoration: none; padding: 0.85rem 1.75rem; border-radius: 6px; font-weight: 700; font-size: 0.92rem; transition: background 0.15s; }
  .btn-primario:hover { background: var(--accent-dark); }

  .destacados { background: #fff; border: 1px solid var(--borde); border-radius: 14px; padding: 2rem; box-shadow: 0 10px 30px rgba(15,23,42,0.08); }
  .destacados h3 { font-size: 0.95rem; margin: 0 0 1.1rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .destacados ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
  .destacados li { display: flex; gap: 0.75rem; font-size: 0.92rem; color: #334155; align-items: flex-start; }
  .destacados li .check { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #dcfce7; color: #166534; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }

  section { padding: 5rem 0; }
  section.alterna { background: var(--fondo); }
  h2.titulo-seccion { font-size: 1.9rem; margin: 0 0 0.5rem; letter-spacing: -0.01em; }
  p.subtitulo-seccion { color: var(--muted); font-size: 0.95rem; max-width: 480px; margin: 0 0 2.5rem; }
  .centrado { text-align: center; margin-left: auto; margin-right: auto; }

  .nosotros-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
  .nosotros-grid p { color: #334155; font-size: 0.98rem; margin: 0 0 1rem; }
  .mv-stack { display: flex; flex-direction: column; gap: 1.25rem; }
  .mv-card { background: #fff; border: 1px solid var(--borde); border-radius: 10px; padding: 1.75rem; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
  .mv-card h3 { font-size: 1rem; margin: 0 0 0.6rem; color: var(--accent); }
  .mv-card p { font-size: 0.88rem; color: #334155; margin: 0; }

  .servicios { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
  .servicio { background: #fff; border: 1px solid var(--borde); border-top: 3px solid var(--accent); border-radius: 10px; padding: 1.75rem 1.5rem; transition: transform 0.15s, box-shadow 0.15s; }
  .servicio:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(15,23,42,0.08); }
  .servicio span.categoria { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); }
  .servicio h3 { font-size: 1rem; margin: 0.6rem 0 0.6rem; }
  .servicio p { font-size: 0.85rem; color: var(--muted); margin: 0; }

  .contacto-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 3rem; align-items: start; }
  .contacto-info p { color: #334155; font-size: 0.95rem; margin: 0 0 1.5rem; }
  .contacto-info ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.9rem; }
  .contacto-info li { font-size: 0.9rem; color: #334155; }
  .contacto-info li strong { display: block; font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }

  .card { background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 2.25rem; box-shadow: 0 10px 30px rgba(15,23,42,0.06); }
  label { display: flex; flex-direction: column; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 1.1rem; }
  input, textarea { margin-top: 0.4rem; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; font-family: inherit; transition: border-color 0.15s; }
  input:focus, textarea:focus { outline: none; border-color: var(--accent); }
  textarea { resize: vertical; min-height: 90px; }
  button { width: 100%; padding: 0.8rem; background: var(--accent); color: #fff; border: none; border-radius: 6px; font-weight: 700; font-size: 0.92rem; cursor: pointer; transition: background 0.15s; }
  button:hover:not(:disabled) { background: var(--accent-dark); }
  button:disabled { opacity: 0.6; cursor: default; }
  #resultado { margin-top: 1rem; font-size: 0.85rem; text-align: center; }
  #resultado.ok { color: #166534; }
  #resultado.error { color: #dc2626; }

  footer { text-align: center; padding: 2rem 1rem; color: var(--muted); font-size: 0.8rem; border-top: 1px solid var(--borde); }

  @media (max-width: 800px) {
    .hero-grid, .nosotros-grid, .contacto-grid { grid-template-columns: 1fr; }
    .servicios { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    header.hero h1 { font-size: 2.1rem; }
  }
</style>
</head>
<body>
  <nav class="navbar">
    <div class="navbar-inner">
      <span class="brand">Empresa <span>Inteligente</span></span>
      <div class="nav-links">
        <a href="#nosotros">Nosotros</a>
        <a href="#servicios">Servicios</a>
        <a href="#contacto" class="cta">Contactanos</a>
      </div>
    </div>
  </nav>

  <header class="hero" id="inicio">
    <div class="contenedor">
      <div class="hero-grid">
        <div>
          <span class="badge">Tecnología · Datos · Atención al Cliente</span>
          <h1>Soluciones inteligentes para tu empresa</h1>
          <p class="lead">Soporte técnico, desarrollo de software, ciencia de datos y optimización de costos, todo en un mismo equipo.</p>
          <a href="#contacto" class="btn-primario">Hablar con un asesor</a>
        </div>
        <div class="destacados">
          <h3>Por qué elegirnos</h3>
          <ul>
            <li><span class="check">&#10003;</span> Análisis inteligente de cada consulta con procesamiento de lenguaje natural</li>
            <li><span class="check">&#10003;</span> Equipo técnico y de datos trabajando en un solo lugar</li>
            <li><span class="check">&#10003;</span> Respuesta personalizada según la necesidad de tu empresa</li>
          </ul>
        </div>
      </div>
    </div>
  </header>

  <section id="nosotros">
    <div class="contenedor">
      <div class="nosotros-grid">
        <div>
          <h2 class="titulo-seccion">Quiénes Somos</h2>
          <p>
            En Empresa Inteligente combinamos ciencia de datos, procesamiento de lenguaje natural y desarrollo de software
            para ayudar a otras empresas a atender mejor a sus clientes, tomar decisiones basadas en datos reales
            y optimizar sus costos operativos.
          </p>
          <p>
            Cada consulta que recibimos se analiza automáticamente para dirigirla al equipo correcto y responder
            de la forma más rápida y precisa posible.
          </p>
        </div>
        <div class="mv-stack">
          <div class="mv-card">
            <h3>Misión</h3>
            <p>Brindar soluciones tecnológicas accesibles que conviertan los datos y las conversaciones con clientes en decisiones concretas para las empresas que confían en nosotros.</p>
          </div>
          <div class="mv-card">
            <h3>Visión</h3>
            <p>Ser una referencia en soluciones de atención inteligente para empresas, integrando ciencia de datos y automatización en cada etapa del servicio al cliente.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="servicios" class="alterna">
    <div class="contenedor">
      <h2 class="titulo-seccion centrado">Nuestros Servicios</h2>
      <p class="subtitulo-seccion centrado">Cuatro áreas donde podemos ayudar a tu empresa a crecer.</p>
      <div class="servicios">
        <div class="servicio">
          <span class="categoria">Soporte Técnico</span>
          <h3>Mantenimiento Preventivo y Correctivo</h3>
          <p>Atención a computadoras, laptops e infraestructura de oficina.</p>
        </div>
        <div class="servicio">
          <span class="categoria">Tecnología</span>
          <h3>Desarrollo de Software y APIs</h3>
          <p>Portales web empresariales y microservicios con FastAPI y React.</p>
        </div>
        <div class="servicio">
          <span class="categoria">Analítica</span>
          <h3>Ciencia de Datos y Procesamiento NLP</h3>
          <p>Modelos estadísticos con SciPy y análisis de lenguaje con NLTK.</p>
        </div>
        <div class="servicio">
          <span class="categoria">Consultoría</span>
          <h3>Optimización Operativa y de Costos</h3>
          <p>Modelos matemáticos de programación no lineal y optimización de recursos.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="contacto">
    <div class="contenedor">
      <div class="contacto-grid">
        <div class="contacto-info">
          <h2 class="titulo-seccion">Contactanos</h2>
          <p>Contanos tu consulta sobre alguno de estos servicios y un asesor se va a comunicar con vos a la brevedad.</p>
          <ul>
            <li><strong>Atención</strong>Lunes a viernes, 9:00 a 18:00</li>
            <li><strong>Respuesta</strong>Un asesor te contacta según el motivo de tu consulta</li>
          </ul>
        </div>
        <div class="card">
          <form id="form-contacto">
            <label>Nombre
              <input type="text" name="nombre" required maxlength="150">
            </label>
            <label>Empresa
              <input type="text" name="empresa" maxlength="200">
            </label>
            <label>Correo
            <input type="email" name="correo" required maxlength="200">
            </label>
             <label>Telefono
            <input type="text" name="telefono" required maxlength="50">
             </label>
            <label>Asunto
              <textarea name="asunto" required maxlength="10000" placeholder="Contanos que necesitas..."></textarea>
            </label>
            <button type="submit" id="btn-enviar">Enviar</button>
          </form>
          <div id="resultado"></div>
        </div>
      </div>
    </div>
  </section>

  <footer>&copy; Empresa Inteligente</footer>

  <script>
    const form = document.getElementById('form-contacto');
    const boton = document.getElementById('btn-enviar');
    const resultado = document.getElementById('resultado');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      boton.disabled = true;
      boton.textContent = 'Enviando...';
      resultado.textContent = '';
      resultado.className = '';

      const datos = Object.fromEntries(new FormData(form));

      try {
        const resp = await fetch('/api/landing/contacto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos),
        });
        if (!resp.ok) throw new Error('rechazado');
        const data = await resp.json();
        resultado.textContent = data.mensaje;
        resultado.className = 'ok';
        form.reset();
      } catch {
        resultado.textContent = 'No se pudo enviar tu consulta. Intenta nuevamente.';
        resultado.className = 'error';
      } finally {
        boton.disabled = false;
        boton.textContent = 'Enviar';
      }
    });
  </script>
</body>
</html>"""