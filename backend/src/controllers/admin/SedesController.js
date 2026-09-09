// backend/src/controllers/admin/SedesController.js
// Controlador para CRUD de sedes
const db = require('../../config/database');

const getClienteIdColumnSupported = async () => db.schema.hasColumn('sedes', 'cliente_id');

const SedesController = {
  async getSedes(req, res) {
    try {
      // El cliente SIEMPRE sale del token, nunca de la query — de lo
      // contrario cualquier admin podría listar las sedes de otra empresa
      // con solo cambiar ?clienteId= en la URL.
      const clienteId = req.usuario?.cliente_id;
      const soportaClienteId = await getClienteIdColumnSupported();

      if (!soportaClienteId || !clienteId) {
        return res.json([]);
      }

      const sedes = await db('sedes')
        .where('cliente_id', clienteId)
        .whereNull('deleted_at');
      res.json(sedes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getSedeById(req, res) {
    try {
      const { id } = req.params;
      const clienteId = req.usuario?.cliente_id;
      const soportaClienteId = await getClienteIdColumnSupported();

      const sede = await db('sedes').where({ id }).whereNull('deleted_at').first();
      if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
      if (soportaClienteId && sede.cliente_id != null && sede.cliente_id !== clienteId) {
        return res.status(403).json({ error: 'No puedes ver una sede de otra empresa' });
      }
      res.json(sede);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async crearSede(req, res) {
    try {
      const { nombre, direccion, ciudad, telefono, email, descripcion, activa } = req.body;
      const clienteId = req.usuario?.cliente_id;
      if (!nombre || !clienteId) return res.status(400).json({ error: 'nombre requerido y usuario debe pertenecer a un cliente' });

      const soportaClienteId = await getClienteIdColumnSupported();
      const payload = { nombre, direccion, ciudad, telefono, email, descripcion, activa };
      if (soportaClienteId) {
        // El cliente_id SIEMPRE es el del usuario autenticado, nunca el que
        // venga en el body — de lo contrario un admin podría crear una sede
        // colgada de otra empresa.
        payload.cliente_id = clienteId;
        const cliente = await db('clientes').where({ id: clienteId }).first();
        if (cliente?.estilo_catalogo) {
          payload.estilo_catalogo = cliente.estilo_catalogo;
        }
      }
      const [inserted] = await db('sedes').insert(payload).returning('id');
      const sede = await db('sedes').where({ id: inserted.id }).first();
      res.status(201).json(sede);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async actualizarSede(req, res) {
    try {
      const { id } = req.params;
      const clienteId = req.usuario?.cliente_id;
      const soportaClienteId = await getClienteIdColumnSupported();

      const existente = await db('sedes').where({ id }).whereNull('deleted_at').first();
      if (!existente) return res.status(404).json({ error: 'Sede no encontrada' });
      if (soportaClienteId && existente.cliente_id != null && existente.cliente_id !== clienteId) {
        return res.status(403).json({ error: 'No puedes editar una sede de otra empresa' });
      }

      // No agregar estilo_catalogo aquí: solo el super-admin del SaaS puede fijarlo
      // (vía ClientesController), nunca el admin del restaurante.
      const { nombre, direccion } = req.body;
      await db('sedes').where({ id }).whereNull('deleted_at').update({ nombre, direccion, updated_at: db.fn.now() });
      const sede = await db('sedes').where({ id }).whereNull('deleted_at').first();
      res.json(sede);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async eliminarSede(req, res) {
    try {
      const { id } = req.params;
      const clienteId = req.usuario?.cliente_id;
      const soportaClienteId = await getClienteIdColumnSupported();

      const existente = await db('sedes').where({ id }).whereNull('deleted_at').first();
      if (!existente) return res.status(404).json({ error: 'Sede no encontrada' });
      if (soportaClienteId && existente.cliente_id != null && existente.cliente_id !== clienteId) {
        return res.status(403).json({ error: 'No puedes eliminar una sede de otra empresa' });
      }

      const updated = await db('sedes')
        .where({ id })
        .whereNull('deleted_at')
        .update({ deleted_at: db.fn.now(), updated_at: db.fn.now() });
      if (!updated) return res.status(404).json({ error: 'Sede no encontrada' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = SedesController;
