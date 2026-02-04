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
    console.log('🔒 [verificarToken] Authorization header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [verificarToken] Token no proporcionado');
      return res.status(401).json({
        error: 'Token no proporcionado',
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '
    console.log('🔒 [verificarToken] Token recibido:', token);

    // Verificar token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret-key-change-in-prod'
      );
      console.log('✅ [verificarToken] Token válido, payload:', decoded);

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
        console.log('❌ [verificarToken] Token expirado');
        return res.status(401).json({
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED',
        });
      }
      if (error.name === 'JsonWebTokenError') {
        console.log('❌ [verificarToken] Token inválido:', error.message);
        return res.status(401).json({
          error: 'Token inválido',
        });
      }
      console.log('❌ [verificarToken] Error desconocido:', error.message);
      return res.status(401).json({
        error: 'No autorizado',
      });
    }
  } catch (error) {
    console.log('❌ [verificarToken] Error general:', error.message);
    return res.status(401).json({
      error: 'No autorizado',
    });
  }
};

module.exports = verificarToken;
