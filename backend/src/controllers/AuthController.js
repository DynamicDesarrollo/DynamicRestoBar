/**
 * AuthController
 * 
 * Controlador para autenticación:
 * - Login con email/contraseña
 * - Login con PIN (para tablets)
 * - Refresh token
 * - Logout
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

class AuthController {
  /**
   * POST /auth/login
   * Login con email y contraseña
   * Cuerpo: { email, contraseña }
   * Respuesta: { token, refreshToken, usuario }
   */
  static async login(req, res) {
    try {
      const { email, contraseña } = req.body;

      // Validar input
      if (!email || !contraseña) {
        return res.status(400).json({
          error: 'Email y contraseña son requeridos',
        });
      }

      // Buscar usuario por email
      const usuario = await db('usuarios')
        .select(
          'usuarios.id',
          'usuarios.nombre',
          'usuarios.email',
          'usuarios.contraseña',
          'usuarios.rol_id',
          'usuarios.sede_id',
          'usuarios.estado',
          'roles.nombre as rol_nombre'
        )
        .join('roles', 'usuarios.rol_id', 'roles.id')
        .where('usuarios.email', email)
        .andWhere('usuarios.deleted_at', null)
        .first();

      if (!usuario) {
        return res.status(401).json({
          error: 'Email o contraseña incorrectos',
        });
      }

      // Validar estado
      if (usuario.estado !== 'activo') {
        return res.status(403).json({
          error: 'Usuario inactivo',
        });
      }

      // Comparar contraseña
      const esValida = await bcrypt.compare(contraseña, usuario.contraseña);
      if (!esValida) {
        return res.status(401).json({
          error: 'Email o contraseña incorrectos',
        });
      }

      // Generar tokens
      const token = jwt.sign(
        {
          userId: usuario.id,
          email: usuario.email,
          roleId: usuario.rol_id,
          roleName: usuario.rol_nombre,
          sedeId: usuario.sede_id,
        },
        process.env.JWT_SECRET || 'secret-key-change-in-prod',
        { expiresIn: '8h' }
      );

      const refreshToken = jwt.sign(
        {
          userId: usuario.id,
        },
        process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-change-in-prod',
        { expiresIn: '7d' }
      );

      // Actualizar último login
      await db('usuarios').where('id', usuario.id).update({
        ultimo_login: new Date(),
      });

      // Responder
      return res.json({
        success: true,
        token,
        refreshToken,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: {
            id: usuario.rol_id,
            nombre: usuario.rol_nombre,
          },
          sedeId: usuario.sede_id,
        },
      });
    } catch (error) {
      console.error('❌ Error en login:', error);
      return res.status(500).json({
        error: 'Error al procesar login',
        details: error.message,
      });
    }
  }

  /**
   * POST /auth/login-pin
   * Login con PIN para tablets (rápido)
   * Cuerpo: { pin }
   * Respuesta: { token, usuario }
   */
  static async loginPin(req, res) {
    try {
      const { pin } = req.body;

      if (!pin) {
        return res.status(400).json({
          error: 'PIN es requerido',
        });
      }

      const pinTrimmed = String(pin).trim();
      console.log('🔍 Login PIN backend - Buscando PIN:', pinTrimmed); // Debug

      // Buscar usuario por PIN
      const usuario = await db('usuarios')
        .select(
          'usuarios.id',
          'usuarios.nombre',
          'usuarios.pin',
          'usuarios.rol_id',
          'usuarios.sede_id',
          'usuarios.estado',
          'roles.nombre as rol_nombre'
        )
        .join('roles', 'usuarios.rol_id', 'roles.id')
        .where('usuarios.pin', pinTrimmed)
        .andWhere('usuarios.deleted_at', null)
        .first();

      if (!usuario) {
        console.log('❌ PIN no encontrado. PIN buscado:', pinTrimmed); // Debug
        return res.status(401).json({
          error: 'PIN incorrecto',
        });
      }

      if (usuario.estado !== 'activo') {
        return res.status(403).json({
          error: 'Usuario inactivo',
        });
      }

      // Generar token
      const token = jwt.sign(
        {
          userId: usuario.id,
          nombre: usuario.nombre,
          roleId: usuario.rol_id,
          roleName: usuario.rol_nombre,
          sedeId: usuario.sede_id,
        },
        process.env.JWT_SECRET || 'secret-key-change-in-prod',
        { expiresIn: '8h' }
      );

      // Actualizar último login
      await db('usuarios').where('id', usuario.id).update({
        ultimo_login: new Date(),
      });

      return res.json({
        success: true,
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          rol: {
            id: usuario.rol_id,
            nombre: usuario.rol_nombre,
          },
          sedeId: usuario.sede_id,
        },
      });
    } catch (error) {
      console.error('❌ Error en login PIN:', error);
      return res.status(500).json({
        error: 'Error al procesar login PIN',
        details: error.message,
      });
    }
  }

  /**
   * POST /auth/refresh
   * Refrescar token con refresh token
   * Cuerpo: { refreshToken }
   * Respuesta: { token }
   */
  static async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token es requerido',
        });
      }

      // Verificar refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-change-in-prod'
      );

      // Buscar usuario
      const usuario = await db('usuarios')
        .select('id', 'email', 'rol_id', 'sede_id', 'estado')
        .where('id', decoded.userId)
        .andWhere('deleted_at', null)
        .first();

      if (!usuario || usuario.estado !== 'activo') {
        return res.status(401).json({
          error: 'Usuario no válido',
        });
      }

      // Generar nuevo token
      const nuevoToken = jwt.sign(
        {
          userId: usuario.id,
          email: usuario.email,
          roleId: usuario.rol_id,
          sedeId: usuario.sede_id,
        },
        process.env.JWT_SECRET || 'secret-key-change-in-prod',
        { expiresIn: '8h' }
      );

      return res.json({
        success: true,
        token: nuevoToken,
      });
    } catch (error) {
      console.error('❌ Error en refresh token:', error);
      return res.status(401).json({
        error: 'Refresh token inválido o expirado',
      });
    }
  }

  /**
   * GET /auth/me
   * Obtener datos del usuario autenticado
   */
  static async getMe(req, res) {
    try {
      const { userId } = req.usuario;

      const usuario = await db('usuarios')
        .select(
          'usuarios.id',
          'usuarios.nombre',
          'usuarios.email',
          'usuarios.rol_id',
          'usuarios.sede_id',
          'usuarios.foto_url',
          'usuarios.estado',
          'roles.nombre as rol_nombre',
          'sedes.nombre as sede_nombre'
        )
        .join('roles', 'usuarios.rol_id', 'roles.id')
        .leftJoin('sedes', 'usuarios.sede_id', 'sedes.id')
        .where('usuarios.id', userId)
        .andWhere('usuarios.deleted_at', null)
        .first();

      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
        });
      }

      // Obtener permisos del usuario
      const permisos = await db('rol_permiso')
        .select('permisos.nombre')
        .join('permisos', 'rol_permiso.permiso_id', 'permisos.id')
        .where('rol_permiso.rol_id', usuario.rol_id)
        .pluck('permisos.nombre');

      return res.json({
        success: true,
        usuario: {
          ...usuario,
          permisos,
        },
      });
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      return res.status(500).json({
        error: 'Error al obtener datos del usuario',
      });
    }
  }

  /**
   * POST /auth/logout
   * Logout (principalmente para limpiar tokens en cliente)
   */
  static async logout(req, res) {
    try {
      // En implementación stateless (JWT), el logout ocurre en el cliente
      // Aquí podríamos agregar el token a una blacklist si fuera necesario
      return res.json({
        success: true,
        mensaje: 'Logout exitoso',
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error al hacer logout',
      });
    }
  }

  /**
   * POST /auth/change-password
   * Cambiar contraseña del usuario autenticado
   */
  static async changePassword(req, res) {
    try {
      const { userId } = req.usuario;
      const { contrasenaActual, contrasenaNueva, confirmar } = req.body;

      // Validar inputs
      if (!contrasenaActual || !contrasenaNueva || !confirmar) {
        return res.status(400).json({
          error: 'Todos los campos son requeridos',
        });
      }

      if (contrasenaNueva !== confirmar) {
        return res.status(400).json({
          error: 'Las contraseñas no coinciden',
        });
      }

      if (contrasenaNueva.length < 6) {
        return res.status(400).json({
          error: 'La contraseña debe tener al menos 6 caracteres',
        });
      }

      // Obtener usuario
      const usuario = await db('usuarios').where('id', userId).first();

      // Verificar contraseña actual
      const esValida = await bcrypt.compare(contrasenaActual, usuario.contraseña);
      if (!esValida) {
        return res.status(401).json({
          error: 'Contraseña actual incorrecta',
        });
      }

      // Hash nueva contraseña
      const hash = await bcrypt.hash(contrasenaNueva, 10);

      // Actualizar
      await db('usuarios').where('id', userId).update({
        contraseña: hash,
      });

      return res.json({
        success: true,
        mensaje: 'Contraseña actualizada correctamente',
      });
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      return res.status(500).json({
        error: 'Error al cambiar contraseña',
      });
    }
  }
}

module.exports = AuthController;
