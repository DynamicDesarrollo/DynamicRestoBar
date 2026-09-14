const db = require('../../config/database');
const { sedesDelCliente } = require('../../utils/tenantScope');

const ESTADOS_VALIDOS = ['activo', 'en_domicilio', 'disponible', 'inactivo'];

const RepartidoresController = {
  async getRepartidores(req, res) {
    try {
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);
      const { sedeId, estado } = req.query;

      let query = db('repartidores')
        .whereIn('sede_id', sedeIds)
        .whereNull('deleted_at');

      if (sedeId && sedeIds.includes(Number(sedeId))) {
        query = query.andWhere('sede_id', sedeId);
      }
      if (estado && ESTADOS_VALIDOS.includes(estado)) {
        query = query.andWhere('estado', estado);
      }

      const repartidores = await query.orderBy('nombre', 'asc');
      return res.json({ success: true, data: repartidores });
    } catch (err) {
      console.error('❌ Error en getRepartidores:', err.message);
      return res.status(500).json({ error: 'Error al obtener repartidores', message: err.message });
    }
  },

  async crearRepartidor(req, res) {
    try {
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);
      const sedeId = req.usuario?.sedeId || req.usuario?.sede_id;
      const { nombre, email, telefono, documento, vehiculo, placa } = req.body;

      if (!sedeId || !sedeIds.includes(Number(sedeId))) {
        return res.status(400).json({ error: 'No se puede determinar la sede del usuario' });
      }
      if (!nombre) {
        return res.status(400).json({ error: 'El nombre es requerido' });
      }

      const [repartidor] = await db('repartidores').insert({
        sede_id: sedeId,
        nombre,
        email: email || null,
        telefono: telefono || null,
        documento: documento || null,
        vehiculo: vehiculo || null,
        placa: placa || null,
        estado: 'disponible',
      }).returning('*');

      return res.status(201).json({ success: true, data: repartidor });
    } catch (err) {
      console.error('❌ Error en crearRepartidor:', err.message);
      return res.status(500).json({ error: 'Error al crear repartidor', message: err.message });
    }
  },

  async actualizarRepartidor(req, res) {
    try {
      const { id } = req.params;
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);

      const existente = await db('repartidores').where('id', id).whereNull('deleted_at').first();
      if (!existente) return res.status(404).json({ error: 'Repartidor no encontrado' });
      if (!sedeIds.includes(existente.sede_id)) {
        return res.status(403).json({ error: 'No puedes editar un repartidor de otra empresa' });
      }

      const { nombre, email, telefono, documento, vehiculo, placa, estado } = req.body;
      const updateData = { updated_at: new Date() };
      if (nombre !== undefined) updateData.nombre = nombre;
      if (email !== undefined) updateData.email = email || null;
      if (telefono !== undefined) updateData.telefono = telefono || null;
      if (documento !== undefined) updateData.documento = documento || null;
      if (vehiculo !== undefined) updateData.vehiculo = vehiculo || null;
      if (placa !== undefined) updateData.placa = placa || null;
      if (estado !== undefined) {
        if (!ESTADOS_VALIDOS.includes(estado)) {
          return res.status(400).json({ error: 'Estado inválido' });
        }
        updateData.estado = estado;
      }

      const [repartidor] = await db('repartidores').where('id', id).update(updateData).returning('*');
      return res.json({ success: true, data: repartidor });
    } catch (err) {
      console.error('❌ Error en actualizarRepartidor:', err.message);
      return res.status(500).json({ error: 'Error al actualizar repartidor', message: err.message });
    }
  },

  async eliminarRepartidor(req, res) {
    try {
      const { id } = req.params;
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);

      const existente = await db('repartidores').where('id', id).whereNull('deleted_at').first();
      if (!existente) return res.status(404).json({ error: 'Repartidor no encontrado' });
      if (!sedeIds.includes(existente.sede_id)) {
        return res.status(403).json({ error: 'No puedes eliminar un repartidor de otra empresa' });
      }

      await db('repartidores').where('id', id).update({ deleted_at: new Date() });
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Error en eliminarRepartidor:', err.message);
      return res.status(500).json({ error: 'Error al eliminar repartidor', message: err.message });
    }
  },
};

module.exports = RepartidoresController;
