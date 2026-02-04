const db = require('../../config/database');

class MesasController {
  // Obtener siguiente número disponible
  static async obtenerSiguienteNumero(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;

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

  // Obtener todas las mesas
  static async getMesas(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;

      const mesas = await db('mesas')
        .where('sede_id', sede_id)
        .whereNull('deleted_at')
        .select('*')
        .orderByRaw('CAST(numero AS INTEGER) ASC');

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
      const { sedeId: sede_id } = req.usuario;
      const { numero, zona_id, capacidad } = req.body;

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
      const { sedeId: sede_id } = req.usuario;
      const { numero, zona_id, capacidad, estado } = req.body;

      const mesa = await db('mesas')
        .where('id', id)
        .where('sede_id', sede_id)
        .first();

      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }

      const updateData = {};
      if (numero !== undefined) updateData.numero = parseInt(numero);
      if (zona_id !== undefined) updateData.zona_id = zona_id;
      if (capacidad !== undefined) updateData.capacidad = parseInt(capacidad);
      if (estado !== undefined) updateData.estado = estado;
      updateData.updated_at = new Date();

      await db('mesas').where('id', id).update(updateData);

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
      const { sedeId: sede_id } = req.usuario;

      const mesa = await db('mesas')
        .where('id', id)
        .where('sede_id', sede_id)
        .first();

      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }

      // Soft delete
      await db('mesas').where('id', id).update({
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

  // Endpoint DEBUG: Eliminar todas las mesas 21
  static async eliminarTodas21(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;
      
      const result = await db('mesas')
        .where('sede_id', sede_id)
        .where('numero', '21')
        .update({ deleted_at: new Date() });

      return res.json({
        success: true,
        message: `${result} mesa(s) con número 21 eliminada(s)`,
      });
    } catch (err) {
      console.error('❌ Error en eliminarTodas21:', err.message);
      return res.status(500).json({
        error: 'Error',
        message: err.message,
      });
    }
  }

  // Limpiar mesas duplicadas (endpoint temporal)
  static async limpiarDuplicadas(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;

      // Obtener TODOS los números con duplicados
      const duplicadas = await db('mesas')
        .where('sede_id', sede_id)
        .select('numero')
        .groupBy('numero')
        .havingRaw('COUNT(*) > 1')
        .orHavingRaw('COUNT(*) > 1');

      console.log('Duplicadas encontradas:', duplicadas);

      let totalLimpiadas = 0;

      // Para cada número duplicado
      for (const dup of duplicadas) {
        const numero = dup.numero;
        
        // Obtener todas las mesas con ese número (activas)
        const mesas = await db('mesas')
          .where('sede_id', sede_id)
          .where('numero', numero)
          .whereNull('deleted_at')
          .orderBy('id', 'asc');

        console.log(`Número ${numero}: ${mesas.length} mesas encontradas`);

        // Si hay más de una, eliminar (soft delete) todas excepto la primera
        if (mesas.length > 1) {
          const idsAEliminar = mesas.slice(1).map(m => m.id);
          await db('mesas')
            .whereIn('id', idsAEliminar)
            .update({ deleted_at: new Date() });
          
          totalLimpiadas += idsAEliminar.length;
          console.log(`✅ Eliminadas ${idsAEliminar.length} mesa(s) duplicada(s) con número ${numero}`);
        }
      }

      return res.json({
        success: true,
        message: `Limpieza completada. ${totalLimpiadas} mesa(s) duplicada(s) eliminada(s).`,
        duplicadas: duplicadas.length,
        totalLimpiadas,
      });
    } catch (err) {
      console.error('❌ Error en limpiarDuplicadas:', err.message);
      return res.status(500).json({
        error: 'Error al limpiar duplicadas',
        message: err.message,
      });
    }
  }
}

module.exports = MesasController;
