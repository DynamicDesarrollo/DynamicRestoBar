const db = require('../../config/database');
const { sedesDelCliente, sedePerteneceACliente } = require('../../utils/tenantScope');

class MesasController {
  // Obtener siguiente número disponible
  static async obtenerSiguienteNumero(req, res) {
    try {
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);
      const solicitada = req.query?.sedeId || req.body?.sede_id || req.usuario?.sedeId;
      const sede_id = sedePerteneceACliente(solicitada, sedeIds) ? Number(solicitada) : req.usuario?.sedeId;

      if (!sede_id || !sedeIds.includes(Number(sede_id))) {
        return res.status(400).json({
          error: 'Sede no proporcionada o no pertenece a tu empresa',
        });
      }

      // Obtener todos los números existentes (no soft-deleted)
      const mesas = await db('mesas')
        .where('sede_id', sede_id)
        .whereNull('deleted_at')
        .select('numero')
        .orderByRaw('CAST(numero AS INTEGER) ASC');

      if (mesas.length === 0) {
        return res.json({ success: true, numero: 1 });
      }

      // Buscar el primer hueco disponible
      const numerosExistentes = new Set(mesas.map(m => parseInt(m.numero)).filter(n => !isNaN(n)));
      let numero = 1;
      while (numerosExistentes.has(numero)) {
        numero++;
      }

      return res.json({ success: true, numero });
    } catch (err) {
      console.error('❌ Error en obtenerSiguienteNumero:', err.message);
      return res.status(500).json({
        error: 'Error al obtener siguiente número',
        message: err.message,
      });
    }
  }

  // Obtener todas las mesas del cliente autenticado
  static async getMesas(req, res) {
    try {
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);

      const query = db('mesas')
        .whereNull('deleted_at')
        .select('*')
        .whereIn('sede_id', sedeIds)
        .orderByRaw('CAST(numero AS INTEGER) ASC');

      const querySedeId = req.query?.sedeId;
      if (querySedeId !== undefined && querySedeId !== '' && sedePerteneceACliente(querySedeId, sedeIds)) {
        query.andWhere('sede_id', Number(querySedeId));
      }

      const mesas = await query;

      return res.json({
        success: true,
        data: mesas,
      });
    } catch (err) {
      console.error('❌ Error en getMesas:', err.message);
      return res.status(500).json({
        error: 'Error al obtener mesas',
        message: err.message,
      });
    }
  }

  // Crear mesa
  static async crearMesa(req, res) {
    try {
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);
      const solicitada = req.body?.sede_id || req.usuario?.sedeId;
      const { numero, zona_id, capacidad } = req.body;

      if (!solicitada || !sedeIds.includes(Number(solicitada))) {
        return res.status(400).json({
          error: 'Sede no proporcionada o no pertenece a tu empresa',
        });
      }
      const sede_id = Number(solicitada);

      if (!numero || !zona_id) {
        return res.status(400).json({
          error: 'Número de mesa y zona son requeridos',
        });
      }

      const result = await db('mesas').insert({
        sede_id,
        zona_id,
        numero: parseInt(numero),
        capacidad: parseInt(capacidad) || 4,
        estado: 'disponible',
      }).returning('*');

      const mesa = Array.isArray(result) ? result[0] : result;

      console.log(`✅ Mesa ${numero} creada`);

      return res.json({
        success: true,
        message: 'Mesa creada exitosamente',
        data: mesa,
      });
    } catch (err) {
      console.error('❌ Error en criarMesa:', err.message);
      return res.status(500).json({
        error: 'Error al crear mesa',
        message: err.message,
      });
    }
  }

  // Actualizar mesa
  static async actualizarMesa(req, res) {
    try {
      const { id } = req.params;
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);
      const { numero, zona_id, capacidad, estado } = req.body;

      // La sede que manda a validar es SIEMPRE la de la mesa ya guardada en
      // BD, nunca la que venga en el body — de lo contrario basta con que el
      // atacante mande el sede_id real de la mesa ajena para "aprobar" el
      // check y luego mutarla igual.
      const mesa = await db('mesas').where('id', id).first();

      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }
      if (!sedeIds.includes(mesa.sede_id)) {
        return res.status(403).json({ error: 'No puedes editar una mesa de otra empresa' });
      }

      const updateData = {};
      if (numero !== undefined) updateData.numero = parseInt(numero);
      if (zona_id !== undefined) updateData.zona_id = zona_id;
      if (capacidad !== undefined) updateData.capacidad = parseInt(capacidad);
      if (estado !== undefined) updateData.estado = estado;
      updateData.updated_at = new Date();

      await db('mesas').where('id', id).where('sede_id', mesa.sede_id).update(updateData);

      console.log(`✅ Mesa ${id} actualizada`);

      return res.json({
        success: true,
        message: 'Mesa actualizada exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en actualizarMesa:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar mesa',
        message: err.message,
      });
    }
  }

  // Eliminar mesa
  static async eliminarMesa(req, res) {
    try {
      const { id } = req.params;
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);

      const mesa = await db('mesas').where('id', id).first();

      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }
      if (!sedeIds.includes(mesa.sede_id)) {
        return res.status(403).json({ error: 'No puedes eliminar una mesa de otra empresa' });
      }

      // Soft delete
      await db('mesas').where('id', id).where('sede_id', mesa.sede_id).update({
        deleted_at: new Date(),
      });

      console.log(`✅ Mesa ${id} eliminada`);

      return res.json({
        success: true,
        message: 'Mesa eliminada exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en eliminarMesa:', err.message);
      return res.status(500).json({
        error: 'Error al eliminar mesa',
        message: err.message,
      });
    }
  }
}

module.exports = MesasController;
