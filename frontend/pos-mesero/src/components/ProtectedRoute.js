
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores';

export default function ProtectedRoute({ children, requiredRoles = [], superAdminOnly = false }) {
  const [cargando, setCargando] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const usuario = useAuthStore((state) => state.usuario);
  const setUsuario = useAuthStore((state) => state.setUsuario);

  useEffect(() => {
    const usuarioLS = localStorage.getItem('usuario');
    const tokenLS = localStorage.getItem('token');
    if (!usuario && usuarioLS && tokenLS) {
      setUsuario(JSON.parse(usuarioLS), tokenLS);
      console.log('[ProtectedRoute] Rehidratando usuario/token desde localStorage');
    }
    setCargando(false);
  }, [usuario, setUsuario]);

  if (cargando) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    console.warn('[ProtectedRoute] No autenticado, redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  // Si se requieren roles específicos, verificar que el usuario tenga uno
  if (requiredRoles.length > 0) {
    const tieneRol = requiredRoles.includes(usuario?.rol?.nombre);
    if (!tieneRol) {
      console.warn('[ProtectedRoute] Usuario sin rol requerido, redirigiendo a /inicio', usuario?.rol?.nombre);
      return <Navigate to="/inicio" replace />;
    }
  }

  // El super-admin del SaaS se identifica de dos formas según el entorno:
  // en producción tiene su propio rol 'SUPER_ADMIN'; en desarrollo local
  // comparte el rol 'Administrador' y se distingue solo por no tener
  // cliente_id. Misma regla que usa el backend en requireSuperAdmin.
  if (superAdminOnly) {
    const esSuperAdmin =
      usuario?.rol?.nombre === 'SUPER_ADMIN' ||
      (usuario?.rol?.nombre === 'Administrador' && usuario?.cliente_id == null);
    if (!esSuperAdmin) {
      console.warn('[ProtectedRoute] Usuario no es super-admin, redirigiendo a /inicio');
      return <Navigate to="/inicio" replace />;
    }
  }

  return children;
}
