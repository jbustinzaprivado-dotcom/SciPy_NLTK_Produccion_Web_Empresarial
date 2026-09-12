import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../services/http';
import { hasActiveSession } from '../services/session';
import Icon from './Icon';

export default function SessionAccess() {
  const [active, setActive] = useState(() => hasActiveSession(getToken()));
  useEffect(() => {
    const refresh = () => setActive(hasActiveSession(getToken()));
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, []);
  return <Link className="landing-access" to={active ? '/dashboard' : '/login'}>{active ? 'Ir al dashboard' : 'Iniciar sesión'}<Icon name="arrow" size={16} /></Link>;
}
