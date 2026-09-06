import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard    from '../pages/Dashboard';
import Metricas     from '../pages/Metricas';
import Optimizacion from '../pages/Optimizacion';
import Comentarios  from '../pages/Comentarios';
import AnalisisNLP  from '../pages/AnalisisNLP';
import Clientes     from '../pages/Clientes';
import Reportes     from '../pages/Reportes';
import Login        from '../pages/Login';
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
      <Route element={<RutaProtegida><MainLayout /></RutaProtegida>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"    element={<Dashboard />}    />
        <Route path="/metricas"     element={<Metricas />}     />
        <Route path="/optimizacion" element={<Optimizacion />} />
        <Route path="/comentarios"  element={<Comentarios />}  />
        <Route path="/analisis-nlp" element={<AnalisisNLP />}  />
        <Route path="/clientes"     element={<Clientes />}     />
        <Route path="/categorias"   element={<Categorias />} />
        <Route path="/reportes"     element={<Reportes />}     />
        <Route path="/auditoria"    element={<Auditoria />} />
        <Route path="/usuarios"     element={<Usuarios />} />
        <Route path="*"             element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}