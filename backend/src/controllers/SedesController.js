// ...existing code...

/**
 * SedesController
 * CRUD para sedes (sucursales) de una empresa (cliente)
 * Relación: cada sede pertenece a un cliente (empresa)
 */
const db = require('../config/database');

class SedesController {
  // Verificar si una sede tiene datos asociados
  static async tieneAsociados(req, res) {
    try {
      const { id } = req.params;
      // Verificar mesas
      const mesas = await db('mesas').where({ sede_id: id, deleted_at: null }).count('id as total');
      // Verificar ordenes
      const ordenes = await db('ordenes').where({ sede_id: id, deleted_at: null }).count('id as total');
      // Verificar productos
      const productos = await db('productos').where({ sede_id: id, deleted_at: null }).count('id as total');
      const tiene = (mesas[0].total > 0) || (ordenes[0].total > 0) || (productos[0].total > 0);
      return res.json({ tieneAsociados: tiene });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }
  // ...existing code...
  // Obtener todas las sedes de un cliente
  static async getAll(req, res) {
    try {
      const clienteId = req.query.clienteId || req.usuario?.cliente_id;
      if (!clienteId) {
        return res.status(400).json({ error: 'clienteId es requerido' });
      }
      const sedes = await db('sedes')
        .select('*')
        .where('cliente_id', clienteId)
        .where('deleted_at', null)
        .orderBy('nombre', 'asc');
      return res.json({ success: true, data: sedes });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Obtener sede por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const sede = await db('sedes').where({ id, deleted_at: null }).first();
      if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
      return res.json({ success: true, data: sede });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Crear sede
  static async create(req, res) {
    try {
      console.log('BODY SEDE:', req.body);
      const {
        nombre,
        direccion,
        ciudad,
        telefono,
        email,
        descripcion,
        activa,
        cliente_id
      } = req.body;
      if (!nombre || !cliente_id) {
        return res.status(400).json({ error: 'nombre y cliente_id son requeridos' });
      }
      const [sede] = await db('sedes').insert({
        nombre,
        direccion,
        ciudad,
        telefono,
        email,
        descripcion,
        activa: activa !== undefined ? activa : true,
        cliente_id,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      }).returning('*');
      return res.status(201).json({ success: true, data: sede });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Actualizar sede
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body, updated_at: db.fn.now() };
      const [sede] = await db('sedes')
        .where({ id, deleted_at: null })
        .update(updateData)
        .returning('*');
      if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
      return res.json({ success: true, data: sede });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Eliminar sede (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const [sede] = await db('sedes')
        .where({ id, deleted_at: null })
        .update({ deleted_at: db.fn.now() })
        .returning('*');
      if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
      return res.json({ success: true, data: sede });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = SedesController;
