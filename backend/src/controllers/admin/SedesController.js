// backend/src/controllers/admin/SedesController.js
// Controlador para CRUD de sedes
const db = require('../../config/database');

const getClienteIdColumnSupported = async () => db.schema.hasColumn('sedes', 'cliente_id');

const SedesController = {
  async getSedes(req, res) {
    try {
      let clienteId = req.query.clienteId;
      if (!clienteId && req.usuario && req.usuario.cliente_id) {
        clienteId = req.usuario.cliente_id;
      }
      let query = db('sedes');
      const soportaClienteId = await getClienteIdColumnSupported();
      if (clienteId && soportaClienteId) query = query.where('cliente_id', clienteId);
      query = query.whereNull('deleted_at');
      const sedes = await query;
      res.json(sedes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getSedeById(req, res) {
    try {
      const { id } = req.params;
      const sede = await db('sedes').where({ id }).whereNull('deleted_at').first();
      if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
      res.json(sede);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async crearSede(req, res) {
    try {
      const { nombre, cliente_id, direccion, ciudad, telefono, email, descripcion, activa } = req.body;
      if (!nombre || !cliente_id) return res.status(400).json({ error: 'nombre y cliente_id requeridos' });
      const soportaClienteId = await getClienteIdColumnSupported();
      const payload = { nombre, direccion, ciudad, telefono, email, descripcion, activa };
      if (soportaClienteId) {
        payload.cliente_id = cliente_id;
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
