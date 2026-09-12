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
import Landing from '../pages/Landing';
import Consultas from '../pages/Consultas';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/landing" element={<Landing />} />
      <Route path="/contactenos" element={<Navigate to="/landing#contacto" replace />} />
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"    element={<Dashboard />}    />
        <Route path="/metricas"     element={<Metricas />}     />
        <Route path="/optimizacion" element={<Optimizacion />} />
        <Route path="/comentarios"  element={<Comentarios />}  />
        <Route path="/analisis-nlp" element={<AnalisisNLP />}  />
        <Route path="/clientes"     element={<Clientes />}     />
        <Route path="/consultas" element={<Consultas />} />
        <Route path="/reportes"     element={<Reportes />}     />
        <Route path="*"             element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
