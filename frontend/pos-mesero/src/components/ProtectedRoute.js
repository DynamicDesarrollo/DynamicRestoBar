import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores';

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const usuario = useAuthStore((state) => state.usuario);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se requieren roles específicos, verificar que el usuario tenga uno
  if (requiredRoles.length > 0) {
    const tieneRol = requiredRoles.includes(usuario?.rol?.nombre);
    if (!tieneRol) {
      return <Navigate to="/inicio" replace />;
    }
  }

  return children;
}
