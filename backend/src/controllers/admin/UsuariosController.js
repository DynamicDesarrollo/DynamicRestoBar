const bcrypt = require('bcryptjs');
const db = require('../../config/database');

const UsuariosController = {
  async getUsuarios(req, res) {
    try {
      const userId = req.usuario?.userId;
      const sedeId = req.usuario?.sedeId || req.usuario?.sede_id;
      let clienteId = req.usuario?.cliente_id || null;

      // Compatibilidad con tokens antiguos que no incluyen cliente_id.
      if (!clienteId && userId) {
        const usuarioActual = await db('usuarios')
          .select('cliente_id')
          .where('id', userId)
          .whereNull('deleted_at')
          .first();

        clienteId = usuarioActual?.cliente_id || null;
      }

      let query = db('usuarios')
        .select('id', 'nombre', 'email', 'pin', 'rol_id', 'sede_id', 'cliente_id')
        .whereNull('deleted_at')
        .whereNot('rol_id', 8);

      if (clienteId) {
        query = query.where('cliente_id', clienteId);
      } else if (sedeId) {
        // Fallback defensivo para datos legacy sin cliente asociado.
        query = query.where('sede_id', sedeId);
      } else {
        return res.json({ success: true, data: [] });
      }

      const usuarios = await query.orderBy('nombre', 'asc');
      res.json({ success: true, data: usuarios });
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  },

  async getUsuarioById(req, res) {
    try {
      const usuario = await db('usuarios')
        .select('id', 'nombre', 'email', 'pin', 'rol_id', 'sede_id')
        .where({ id: req.params.id })
        .whereNull('deleted_at')
        .first();
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ data: usuario });
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  },

  async crearUsuario(req, res) {
    try {
      const { nombre, email, pin, rol_id, sede_id } = req.body;
      const cliente_id = req.usuario?.cliente_id;
      if (!cliente_id) {
        return res.status(400).json({ error: 'No se puede determinar el cliente para el usuario.' });
      }
      // Usamos una contraseña temporal segura para cumplir la columna NOT NULL.
      // El usuario puede cambiarla después si es necesario.
      const contraseña = await bcrypt.hash(pin || '1234', 10);
      const [id] = await db('usuarios')
        .insert({ nombre, email, pin, rol_id, sede_id, cliente_id, contraseña })
        .returning('id');
      res.json({ success: true, id });
    } catch (err) {
      console.error('❌ Error al crear usuario:', err);
      const response = { error: 'Error al crear usuario' };
      if (process.env.NODE_ENV !== 'production') {
        response.details = err.message;
      }
      res.status(500).json(response);
    }
  },

  async actualizarUsuario(req, res) {
    try {
      const { nombre, email, pin, rol_id, sede_id } = req.body;
      await db('usuarios')
        .where({ id: req.params.id })
        .update({ nombre, email, pin, rol_id, sede_id });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  },

  async eliminarUsuario(req, res) {
    try {
      await db('usuarios')
        .where({ id: req.params.id })
        .update({ deleted_at: db.fn.now() });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  },
};

module.exports = UsuariosController;
