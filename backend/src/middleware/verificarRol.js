/**
 * Middleware: verificarRol
 * 
 * Valida que el usuario tenga uno de los roles requeridos
 */

const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      // Obtener el rol del usuario desde la base de datos
      // Por ahora, el roleId viene en el token
      // En una implementación completa, se consultaría la BD

      // Si no se especifican roles, permitir acceso
      if (!rolesPermitidos || rolesPermitidos.length === 0) {
        return next();
      }

      // Verificar si el rol del usuario está en la lista de permitidos
      // Nota: roleId viene del JWT, se necesitaría mapear a nombre de rol
      // o incluir el nombre del rol en el JWT

      // Por ahora, asumir que viene el rol en el token
      if (rolesPermitidos.includes(req.usuario.roleName)) {
        return next();
      }

      return res.status(403).json({
        error: 'Acceso denegado. Rol insuficiente',
        rolRequerido: rolesPermitidos,
        rolActual: req.usuario.roleName,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error al validar rol',
      });
    }
  };
};

module.exports = verificarRol;
