
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
      // "/inicio" no existe como ruta — Login.js ya hace de despachador:
      // si el usuario autenticado aterriza ahí, su propio useEffect lo
      // manda a la ruta correcta según su rol (obtenerRutaPorRol). Antes
      // esto apuntaba a "/inicio", una ruta muerta que solo agregaba un
      // salto extra a través del catch-all antes de llegar acá.
      console.warn('[ProtectedRoute] Usuario sin rol requerido, redirigiendo a /login', usuario?.rol?.nombre);
      return <Navigate to="/login" replace />;
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
      console.warn('[ProtectedRoute] Usuario no es super-admin, redirigiendo a /login');
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
