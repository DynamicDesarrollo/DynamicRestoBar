// ...existing code...
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import SedesAdminPage from './pages/admin/SedesAdminPage';
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout';
import SuperAdminClientes from './pages/superadmin/SuperAdminClientes';
import SuperAdminPagos from './pages/superadmin/SuperAdminPagos';
import SuperAdminMetricas from './pages/superadmin/SuperAdminMetricas';
import ActivarCuenta from './pages/ActivarCuenta';
import ConfiguracionUsuarios from './pages/admin/components/ConfiguracionUsuarios';
import ConfiguracionImpresoras from './pages/admin/components/ConfiguracionImpresoras';
import './App.css';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/activar-cuenta" element={<ActivarCuenta />} />

        {/* Super Admin SaaS */}
        <Route path="/superadmin/*" element={<SuperAdminLayout />}>
          <Route path="clientes" element={<SuperAdminClientes />} />
          <Route path="pagos" element={<SuperAdminPagos />} />
          <Route path="metricas" element={<SuperAdminMetricas />} />
        </Route>

        {/* Mesas - Meseros y Repartidores */}
        <Route
          path="/mesas"
          element={
            <ProtectedRoute requiredRoles={['Mesero', 'Repartidor']}>
              <Mesas />
            </ProtectedRoute>
          }
        />


        {/* Orden - Mesero y Repartidor */}
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
        <Route path="/admin" element={<Dashboard />} />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
              <ConfiguracionUsuarios />
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
        <Route
          path="/admin/sedes"
          element={
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
              <SedesAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/impresoras"
          element={
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
              <ConfiguracionImpresoras />
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