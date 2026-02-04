// Dummy change for redeploy - 2026-02-03
// Cambio dummy para forzar redeploy en Vercel
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Mesas from './pages/Mesas';
import Orden from './pages/Orden';
import Kds from './pages/Kds';
import Caja from './pages/Caja';
import Dashboard from './pages/admin/Dashboard';
import ConfiguracionMesas from './pages/admin/components/ConfiguracionMesas';
import ConfiguracionProductos from './pages/admin/components/ConfiguracionProductos';
import ConfiguracionInsumos from './pages/admin/components/ConfiguracionInsumos';
import ConfiguracionRecetas from './pages/admin/components/ConfiguracionRecetas';
import Inventario from './pages/admin/components/Inventario';
import Informes from './pages/admin/components/Informes';
import './App.css';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Mesas - Meseros y Repartidores */}
        <Route
          path="/mesas"
          element={
            <ProtectedRoute requiredRoles={['Mesero', 'Repartidor']}>
              <Mesas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orden/:mesaId"
          element={
            <ProtectedRoute requiredRoles={['Mesero', 'Repartidor']}>
              <Orden />
            </ProtectedRoute>
          }
        />
        
        {/* KDS - Cocina y Bar */}
        <Route
          path="/kds"
          element={
            <ProtectedRoute requiredRoles={['Cocina', 'Bar']}>
              <Kds />
            </ProtectedRoute>
          }
        />
        
        {/* Caja - Caja */}
        <Route
          path="/caja"
          element={
            <ProtectedRoute requiredRoles={['Caja']}>
              <Caja />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Administrador y Gerente */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mesas"
          element={
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
              <ConfiguracionMesas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
              <ConfiguracionProductos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/insumos"
          element={
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
              <ConfiguracionInsumos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recetas"
          element={
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
              <ConfiguracionRecetas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventario"
          element={
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
              <Inventario />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/informes"
          element={
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
              <Informes />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
