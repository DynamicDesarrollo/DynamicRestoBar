// backend/src/middleware/roles.js

module.exports.allowRoles = (...roles) => (req, res, next) => {
  const userRol = req.usuario?.rol;
  console.log('[ROLES] req.usuario:', req.usuario);
  console.log('[ROLES] userRol:', userRol, '| roles permitidos:', roles);
  if (!userRol) {
    return res.status(403).json({ msg: "Acceso denegado" });
  }
  const equivalencias = {
    'SUPER_ADMIN': ['SUPER_ADMIN', 'Administrador'],
    'Administrador': ['SUPER_ADMIN', 'Administrador']
  };
  const rolesPermitidos = roles.flatMap(r => equivalencias[r] || [r]);
  if (!rolesPermitidos.includes(userRol)) {
    return res.status(403).json({ msg: "Acceso denegado" });
  }
  next();
};
