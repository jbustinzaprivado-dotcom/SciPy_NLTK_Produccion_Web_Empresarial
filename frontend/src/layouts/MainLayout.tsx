import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const nav = [
  { to: '/dashboard',    label: 'Dashboard'     },
  { to: '/metricas',     label: 'Metricas'      },
  { to: '/optimizacion', label: 'Optimizacion'  },
  { to: '/comentarios',  label: 'Comentarios'   },
  { to: '/analisis-nlp', label: 'Analisis NLP'  },
  { to: '/clientes',     label: 'Clientes'      },
  { to: '/reportes',     label: 'Reportes'      },
  { to: '/categorias',   label: 'Categorias'    },
  { to: '/auditoria',    label: 'Auditoria'    },
];

const themes = [
  { id: 'eucalyptus', name: 'Eucalyptus Blue', swatches: ['#dbe4c7', '#a6b9ad', '#6f9098', '#3f6673', '#193d4a'] },
  { id: 'dusty', name: 'Dusty Petrol', swatches: ['#403837', '#707979', '#a7a69d', '#f2e7c5', '#5b3b2e'] },
  { id: 'quiet', name: 'Quiet Cry', swatches: ['#171b20', '#303a48', '#4e6f9e', '#8ac8cc', '#eef0fa'] },
] as const;

export default function MainLayout() {
  const [theme, setTheme] = useState<(typeof themes)[number]['id']>('eucalyptus');
  const themeIndex = themes.findIndex((item) => item.id === theme);
  const nextTheme = themes[(themeIndex + 1) % themes.length];

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">CI</div><div className="brand-copy"><div className="brand-name">Centro IA</div><div className="brand-sub">Atención empresarial</div></div></div>
        <div className="profile"><div className="profile-avatar">◉</div><strong>Panel ejecutivo</strong><span>operaciones@empresa.com</span></div>
          <nav className="nav" aria-label="Navegación principal">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{['⌂','◈','↗','✦','◌','♙','▤','☰','⏱'][nav.indexOf(item)]}</span><span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
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
