import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard    from '../pages/Dashboard';
import Metricas     from '../pages/Metricas';
import Optimizacion from '../pages/Optimizacion';
import Interpolacion from '../pages/Interpolacion';
import Comentarios  from '../pages/Comentarios';
import Solicitudes      from '../pages/Solicitudes';
import TiemposAtencion  from '../pages/TiemposAtencion';
import AnalisisNLP  from '../pages/AnalisisNLP';
import AnalizarComentario  from '../pages/AnalizarComentario';
import PalabrasFrecuentes  from '../pages/PalabrasFrecuentes';
import Clientes     from '../pages/Clientes';
import NuevoCliente     from '../pages/NuevoCliente';
import HistorialCliente  from '../pages/HistorialCliente';
import ReporteAtencion     from '../pages/ReporteAtencion';
import ReporteNLP          from '../pages/ReporteNLP';
import ReporteEstadisticas from '../pages/ReporteEstadisticas';
import Login        from '../pages/Login';
import Register     from '../pages/Register';
import { getToken }  from '../services/http';
import Categorias   from '../pages/Categorias';
import Auditoria    from '../pages/Auditoria';
import Usuarios     from '../pages/Usuarios';

function RutaProtegida({ children }: { children: React.ReactElement }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<RutaProtegida><MainLayout /></RutaProtegida>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"    element={<Dashboard />}    />
        <Route path="/metricas"     element={<Metricas />}     />
        <Route path="/optimizacion" element={<Optimizacion />} />
        <Route path="/interpolacion" element={<Interpolacion />} />
        <Route path="/comentarios"  element={<Comentarios />}  />
        <Route path="/solicitudes"       element={<Solicitudes />}      />
        <Route path="/tiempos-atencion"  element={<TiemposAtencion />}  />
        <Route path="/analisis-nlp" element={<AnalisisNLP />}  />
        <Route path="/analizar-comentario"  element={<AnalizarComentario />}  />
        <Route path="/palabras-frecuentes"  element={<PalabrasFrecuentes />}  />
        <Route path="/clientes"     element={<Clientes />}     />
        <Route path="/clientes/nuevo"     element={<NuevoCliente />}     />
        <Route path="/clientes/historial" element={<HistorialCliente />} />
        <Route path="/categorias"   element={<Categorias />} />
        <Route path="/reportes/atencion"     element={<ReporteAtencion />}     />
        <Route path="/reportes/nlp"          element={<ReporteNLP />}          />
        <Route path="/reportes/estadisticas" element={<ReporteEstadisticas />} />
        <Route path="/auditoria"    element={<Auditoria />} />
        <Route path="/usuarios"     element={<Usuarios />} />
        <Route path="*"             element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}