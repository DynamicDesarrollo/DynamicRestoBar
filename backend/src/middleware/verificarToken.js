/**
 * Middleware: verificarToken
 * 
 * Valida el JWT en el header Authorization
 * Adjunta datos del usuario al request
 */

const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado',
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret-key-change-in-prod'
    );

    // Adjuntar datos al request
    req.usuario = {
      userId: decoded.userId,
      email: decoded.email,
      roleId: decoded.roleId,
      sedeId: decoded.sedeId,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
      });
    }

    return res.status(401).json({
      error: 'No autorizado',
    });
  }
};

module.exports = verificarToken;
