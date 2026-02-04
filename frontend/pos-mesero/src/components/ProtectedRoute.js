import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores';

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const usuario = useAuthStore((state) => state.usuario);
  React.useEffect(() => {
    const usuarioLS = localStorage.getItem('usuario');
    const tokenLS = localStorage.getItem('token');
    if (!usuario && usuarioLS && tokenLS) {
      useAuthStore.getState().setUsuario(JSON.parse(usuarioLS), tokenLS);
      console.log('[ProtectedRoute] Rehidratando usuario/token desde localStorage');
    }
  }, [usuario]);

  // Log para depuración
  console.log('[ProtectedRoute] Render:', { isAuthenticated, usuario, requiredRoles });

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

  return children;
}
