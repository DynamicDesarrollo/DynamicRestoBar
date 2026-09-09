const db = require('../../config/database');
const { sedesDelCliente } = require('../../utils/tenantScope');

const TIPOS_VALIDOS = ['ingreso', 'egreso'];

const ConceptosMovimientoController = {
  // Obtener conceptos del cliente autenticado (globales del cliente + los de sus sedes)
  async getConceptos(req, res) {
    try {
      const clienteId = req.usuario?.cliente_id;
      if (!clienteId) return res.json({ success: true, data: [] });

      const sedeIds = await sedesDelCliente(clienteId);
      const { tipo } = req.query;

      let query = db('conceptos_movimiento')
        .select('*')
        .where('cliente_id', clienteId)
        .andWhere('activo', true)
        .whereNull('deleted_at')
        .andWhere((q) => {
          q.whereNull('sede_id').orWhereIn('sede_id', sedeIds);
        });

      if (tipo && TIPOS_VALIDOS.includes(tipo)) {
        query = query.andWhere('tipo', tipo);
      }

      const conceptos = await query.orderBy('nombre', 'asc');

      return res.json({ success: true, data: conceptos });
    } catch (err) {
      console.error('❌ Error en getConceptos:', err.message);
      return res.status(500).json({ error: 'Error al obtener conceptos', message: err.message });
    }
  },

  // Crear concepto
  async crearConcepto(req, res) {
    try {
      const { nombre, tipo, descripcion } = req.body;
      const clienteId = req.usuario?.cliente_id;

      if (!clienteId) {
        return res.status(400).json({ error: 'No se puede determinar el cliente para el concepto' });
      }
      if (!nombre || !TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({ error: 'Nombre y tipo (ingreso/egreso) son requeridos' });
      }

      const sedeIds = await sedesDelCliente(clienteId);
      let sede_id = req.body.sede_id || null;
      if (sede_id && !sedeIds.includes(Number(sede_id))) {
        return res.status(403).json({ error: 'La sede indicada no pertenece a tu empresa' });
      }

      const [concepto] = await db('conceptos_movimiento').insert({
        cliente_id: clienteId,
        nombre,
        tipo,
        descripcion: descripcion || null,
        sede_id: sede_id || null,
        activo: true,
      }).returning('*');

      return res.status(201).json({ success: true, data: concepto });
    } catch (err) {
      console.error('❌ Error en crearConcepto:', err.message);
      return res.status(500).json({ error: 'Error al crear concepto', message: err.message });
    }
  },

  // Actualizar concepto
  async actualizarConcepto(req, res) {
    try {
      const { id } = req.params;
      const { nombre, tipo, descripcion } = req.body;
      const clienteId = req.usuario?.cliente_id;

      const existente = await db('conceptos_movimiento').where('id', id).whereNull('deleted_at').first();
      if (!existente) {
        return res.status(404).json({ error: 'Concepto no encontrado' });
      }
      if (existente.cliente_id !== clienteId) {
        return res.status(403).json({ error: 'No puedes editar un concepto de otra empresa' });
      }

      const sedeIds = await sedesDelCliente(clienteId);
      const sede_id = req.body.sede_id;
      if (sede_id && !sedeIds.includes(Number(sede_id))) {
        return res.status(403).json({ error: 'La sede indicada no pertenece a tu empresa' });
      }
      if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo inválido' });
      }

      const updateData = { updated_at: new Date() };
      if (nombre !== undefined) updateData.nombre = nombre;
      if (tipo !== undefined) updateData.tipo = tipo;
      if (descripcion !== undefined) updateData.descripcion = descripcion || null;
      if (sede_id !== undefined) updateData.sede_id = sede_id || null;

      const [concepto] = await db('conceptos_movimiento').where('id', id).update(updateData).returning('*');

      return res.json({ success: true, data: concepto });
    } catch (err) {
      console.error('❌ Error en actualizarConcepto:', err.message);
      return res.status(500).json({ error: 'Error al actualizar concepto', message: err.message });
    }
  },

  // Eliminar concepto (soft delete)
  async eliminarConcepto(req, res) {
    try {
      const { id } = req.params;
      const clienteId = req.usuario?.cliente_id;

      const existente = await db('conceptos_movimiento').where('id', id).whereNull('deleted_at').first();
      if (!existente) {
        return res.status(404).json({ error: 'Concepto no encontrado' });
      }
      if (existente.cliente_id !== clienteId) {
        return res.status(403).json({ error: 'No puedes eliminar un concepto de otra empresa' });
      }

      await db('conceptos_movimiento').where('id', id).update({
        activo: false,
        deleted_at: new Date(),
      });

      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Error en eliminarConcepto:', err.message);
      return res.status(500).json({ error: 'Error al eliminar concepto', message: err.message });
    }
  },
};

module.exports = ConceptosMovimientoController;
