import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

// Cada item de navegacion apunta a una ruta real de la app
type NavItem = { to: string; label: string; icon: string; end?: boolean };
type NavGroup = { titulo: string; items: NavItem[] };

// Item suelto, fuera de cualquier grupo (como "Inicio" en el dashboard de referencia)
const inicio: NavItem = { to: '/dashboard', label: 'Dashboard', icon: '⌂' };

// Agrupacion por area funcional, siguiendo la estructura del documento de arquitectura
const grupos: NavGroup[] = [
  { titulo: 'Clientes', items: [
    { to: '/clientes', label: 'Lista de clientes', icon: '♙', end: true },
    { to: '/clientes/nuevo', label: 'Nuevo cliente', icon: '✚' },
    { to: '/clientes/historial', label: 'Historial', icon: '⏳' },
  ]},
  { titulo: 'Atención', items: [
    { to: '/solicitudes', label: 'Solicitudes', icon: '◔' },
    { to: '/comentarios', label: 'Comentarios', icon: '✦' },
    { to: '/tiempos-atencion', label: 'Tiempos de atención', icon: '⏲' },
  ]},
  { titulo: 'Inteligencia NLP', items: [
    { to: '/analizar-comentario', label: 'Analizar comentario', icon: '◍' },
    { to: '/palabras-frecuentes', label: 'Palabras frecuentes', icon: '❋' },
    { to: '/analisis-nlp', label: 'Clasificación', icon: '◌' },
    { to: '/categorias', label: 'Categorías', icon: '☰' },
  ]},
  { titulo: 'Scientific Data', items: [
    { to: '/metricas', label: 'Estadísticas', icon: '◈' },
    { to: '/interpolacion', label: 'Interpolación', icon: '∿' },
    { to: '/optimizacion', label: 'Optimización', icon: '↗' },
  ]},
  { titulo: 'Reportes', items: [
    { to: '/reportes/atencion', label: 'Atención', icon: '◔' },
    { to: '/reportes/nlp', label: 'NLP', icon: '❋' },
    { to: '/reportes/estadisticas', label: 'Estadísticas', icon: '▤' },
  ]},
  { titulo: 'Configuración', items: [
    { to: '/categorias', label: 'Categorías', icon: '☰' },
    { to: '/auditoria', label: 'Auditoría', icon: '⏱' },
    { to: '/usuarios', label: 'Usuarios', icon: '⚙' },
  ]},
];

const themes = [
  { id: 'eucalyptus', name: 'Eucalyptus Blue', swatches: ['#dbe4c7', '#a6b9ad', '#6f9098', '#3f6673', '#193d4a'] },
  { id: 'dusty', name: 'Dusty Petrol', swatches: ['#403837', '#707979', '#a7a69d', '#f2e7c5', '#5b3b2e'] },
  { id: 'quiet', name: 'Quiet Cry', swatches: ['#171b20', '#303a48', '#4e6f9e', '#8ac8cc', '#eef0fa'] },
] as const;

export default function MainLayout() {
  const location = useLocation();

  // El grupo que contiene la ruta activa arranca expandido; los demas, cerrados
  const grupoActivo = grupos.find((g) => g.items.some((item) => location.pathname.startsWith(item.to)))?.titulo;
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>(() => (
    grupoActivo ? { [grupoActivo]: true } : {}
  ));

  const alternar = (titulo: string) => setAbiertos((prev) => ({ ...prev, [titulo]: !prev[titulo] }));

  const [theme, setTheme] = useState<(typeof themes)[number]['id']>('eucalyptus');
  const themeIndex = themes.findIndex((item) => item.id === theme);
  const nextTheme = themes[(themeIndex + 1) % themes.length];

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">CI</div><div className="brand-copy"><div className="brand-name">Centro IA</div><div className="brand-sub">Atención empresarial</div></div></div>
        <div className="profile"><div className="profile-avatar">◉</div><strong>Panel ejecutivo</strong><span>operaciones@empresa.com</span></div>
        <nav className="nav" aria-label="Navegación principal">
          <NavLink to={inicio.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{inicio.icon}</span><span className="nav-label">{inicio.label}</span>
          </NavLink>

          {grupos.map((grupo) => {
            const abierto = !!abiertos[grupo.titulo];
            return (
              <div key={grupo.titulo} className="nav-group">
                <button
                  type="button"
                  className="nav-group-header"
                  onClick={() => alternar(grupo.titulo)}
                  aria-expanded={abierto}
                >
                  <span>{grupo.titulo.toUpperCase()}</span>
                  <span className="nav-group-caret">{abierto ? '▾' : '▸'}</span>
                </button>
                {abierto && (
                  <div className="nav-group-items">
                    {grupo.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `nav-link nav-sublink${isActive ? ' active' : ''}`}
                      >
                        <span className="nav-icon">{item.icon}</span><span className="nav-label">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      <main className="main-area">
        <div className="theme-switcher" role="group" aria-label="Selector de tema de color">
          <span className="theme-switcher-label">Tema</span>
          <div className="theme-swatches" aria-hidden="true">
            {themes[themeIndex].swatches.slice(0, 4).map((color) => <i key={color} style={{ backgroundColor: color }} />)}
          </div>
          <button type="button" className="theme-button" onClick={() => setTheme(nextTheme.id)} aria-label={`Cambiar al tema ${nextTheme.name}`}>
            <span>{themes[themeIndex].name}</span><b>↻</b>
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}