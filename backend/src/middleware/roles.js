// backend/src/middleware/roles.js

module.exports.allowRoles = (...roles) => (req, res, next) => {
  const userRol = req.usuario?.rol;
  if (!userRol || !roles.includes(userRol)) {
    return res.status(403).json({ msg: "Acceso denegado" });
  }
  next();
};

// El super-admin del SaaS se identifica de DOS formas distintas según el
// entorno: en producción (Neon) tiene su propio rol con nombre 'SUPER_ADMIN';
// en desarrollo local comparte el rol 'Administrador' con el admin de
// restaurante y se distingue solo por no tener cliente_id. Se aceptan ambas
// para que el backend funcione igual sobre cualquiera de las dos bases.
// Ver también ProtectedRoute.js en el frontend, que usa la misma regla.
const esSuperAdmin = (usuario) =>
  usuario?.rol === 'SUPER_ADMIN' ||
  (usuario?.rol === 'Administrador' && usuario?.cliente_id == null);

module.exports.esSuperAdmin = esSuperAdmin;

module.exports.requireSuperAdmin = (req, res, next) => {
  if (!esSuperAdmin(req.usuario)) {
    return res.status(403).json({ msg: "Acceso denegado" });
  }
  next();
};
