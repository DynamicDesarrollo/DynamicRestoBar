/**
 * MesasController
 * 
 * Controlador para gestión de mesas:
 * - Obtener mesas por sede
 * - Obtener mesa por ID
 * - Actualizar estado de mesa
 */

const db = require('../config/database');

class MesasController {
  /**
   * GET /mesas
   * Obtener todas las mesas de una sede
   * Query params: sedeId
   */
  static async getAll(req, res) {
    try {
      const { sedeId } = req.query;
      const clienteId = req.usuario?.cliente_id || req.query.clienteId;

      if (!sedeId) {
        return res.status(400).json({
          error: 'sedeId es requerido',
        });
      }

      const mesas = await db('mesas as m')
        .leftJoin(
          db.raw(`(
            SELECT o1.id as orden_id, o1.numero_orden, o1.mesa_id, o1.usuario_id
            FROM ordenes o1
            INNER JOIN (
              SELECT mesa_id, MAX(created_at) AS max_created_at
              FROM ordenes
              WHERE estado IN ('abierta', 'enviada_produccion', 'en_preparacion', 'lista_entrega', 'en_precuenta')
              GROUP BY mesa_id
            ) o2 ON o1.mesa_id = o2.mesa_id AND o1.created_at = o2.max_created_at
            WHERE o1.estado IN ('abierta', 'enviada_produccion', 'en_preparacion', 'lista_entrega', 'en_precuenta')
          ) as orden_activa ON orden_activa.mesa_id = m.id`)
        )
        .leftJoin('usuarios as u', 'u.id', 'orden_activa.usuario_id')
        .select(
          'm.*',
          db.raw('u.nombre as mesero_nombre'),
          db.raw('orden_activa.usuario_id as mesero_id'),
          db.raw('orden_activa.orden_id as orden_activa_id'),
          db.raw('orden_activa.numero_orden as orden_activa_numero')
        )
        .where('m.sede_id', sedeId)
        .whereNull('m.deleted_at')
        .orderByRaw('CAST(m.numero AS INTEGER) ASC');

      return res.json({
        success: true,
        data: mesas,
        total: mesas.length,
      });
    } catch (err) {
      console.error('❌ Error en getMesas:', err.message);
      return res.status(500).json({
        error: 'Error al cargar mesas',
        message: err.message,
      });
    }
  }

  /**
   * GET /mesas/:id
   * Obtener una mesa específica
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const mesa = await db('mesas')
        .select('*')
        .where('id', id)
        .where('deleted_at', null)
        .first();

      if (!mesa) {
        return res.status(404).json({
          error: 'Mesa no encontrada',
        });
      }

      return res.json({
        success: true,
        data: mesa,
      });
    } catch (err) {
      console.error('❌ Error en getMesaById:', err.message);
      return res.status(500).json({
        error: 'Error al obtener mesa',
        message: err.message,
      });
    }
  }

  /**
   * PATCH /mesas/:id/estado
   * Actualizar estado de una mesa
   * Cuerpo: { estado: 'disponible'|'ocupada'|'en_precuenta'|'reservada' }
   */
  static async updateEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      // Validar estado
      const estadosValidos = ['disponible', 'ocupada', 'en_precuenta', 'reservada'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`,
        });
      }

      const mesa = await db('mesas')
        .where('id', id)
        .where('deleted_at', null)
        .first();

      if (!mesa) {
        return res.status(404).json({
          error: 'Mesa no encontrada',
        });
      }

      // Actualizar
      await db('mesas')
        .where('id', id)
        .update({
          estado,
          updated_at: new Date(),
        });

      return res.json({
        success: true,
        message: `Mesa actualizada a estado: ${estado}`,
        data: { id, estado },
      });
    } catch (err) {
      console.error('❌ Error en updateEstadoMesa:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar mesa',
        message: err.message,
      });
    }
  }

  /**
   * GET /mesas/:id/comanda
   * Obtener comanda actual de una mesa
   */
  static async getComanda(req, res) {
    try {
      const { id } = req.params;

      const comanda = await db('comandas')
        .select('*')
        .where('mesa_id', id)
        .where('estado', 'abierta')
        .orderBy('created_at', 'desc')
        .first();

      if (!comanda) {
        return res.json({
          success: true,
          data: null,
          message: 'No hay comanda abierta',
        });
      }

      return res.json({
        success: true,
        data: comanda,
      });
    } catch (err) {
      console.error('❌ Error en getComanda:', err.message);
      return res.status(500).json({
        error: 'Error al obtener comanda',
        message: err.message,
      });
    }
  }

  /**
   * PATCH /mesas/trasladar
   * Trasladar una orden activa de una mesa origen a una mesa destino
   * Cuerpo: { orden_id, mesa_origen_id, mesa_destino_id, motivo? }
   */
  static async trasladar(req, res) {
    const trx = await db.transaction();

    try {
      const { orden_id, mesa_origen_id, mesa_destino_id, motivo } = req.body;
      const usuarioId = req.usuario?.userId || null;

      if (!orden_id || !mesa_origen_id || !mesa_destino_id) {
        await trx.rollback();
        return res.status(400).json({
          error: 'orden_id, mesa_origen_id y mesa_destino_id son requeridos',
        });
      }

      if (Number(mesa_origen_id) === Number(mesa_destino_id)) {
        await trx.rollback();
        return res.status(400).json({
          error: 'La mesa destino debe ser diferente de la mesa origen',
        });
      }

      const estadosActivos = ['abierta', 'enviada_produccion', 'en_preparacion', 'lista_entrega', 'en_precuenta'];

      const orden = await trx('ordenes')
        .where('id', orden_id)
        .forUpdate()
        .first();

      if (!orden) {
        await trx.rollback();
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      if (!estadosActivos.includes(orden.estado)) {
        await trx.rollback();
        return res.status(400).json({
          error: `La orden no se puede trasladar en estado ${orden.estado}`,
        });
      }

      if (Number(orden.mesa_id) !== Number(mesa_origen_id)) {
        await trx.rollback();
        return res.status(409).json({
          error: 'La orden ya no pertenece a la mesa origen indicada',
        });
      }

      const mesaOrigen = await trx('mesas')
        .where('id', mesa_origen_id)
        .whereNull('deleted_at')
        .forUpdate()
        .first();

      const mesaDestino = await trx('mesas')
        .where('id', mesa_destino_id)
        .whereNull('deleted_at')
        .forUpdate()
        .first();

      if (!mesaOrigen || !mesaDestino) {
        await trx.rollback();
        return res.status(404).json({
          error: 'Mesa origen o destino no encontrada',
        });
      }

      if (Number(mesaOrigen.sede_id) !== Number(mesaDestino.sede_id)) {
        await trx.rollback();
        return res.status(400).json({
          error: 'No se puede trasladar entre sedes distintas',
        });
      }

      if (mesaDestino.estado !== 'disponible') {
        await trx.rollback();
        return res.status(409).json({
          error: 'La mesa destino no está disponible',
        });
      }

      await trx('ordenes')
        .where('id', orden_id)
        .update({
          mesa_id: mesa_destino_id,
          updated_at: new Date(),
        });

      await trx('mesas')
        .where('id', mesa_destino_id)
        .update({
          estado: 'ocupada',
          updated_at: new Date(),
        });

      const otrasActivasOrigen = await trx('ordenes')
        .where('mesa_id', mesa_origen_id)
        .whereIn('estado', estadosActivos)
        .count('* as total')
        .first();

      const totalActivas = Number(otrasActivasOrigen?.total || 0);
      if (totalActivas === 0) {
        await trx('mesas')
          .where('id', mesa_origen_id)
          .update({
            estado: 'disponible',
            updated_at: new Date(),
          });
      }

      await trx.commit();

      console.log(`🔁 Orden ${orden_id} trasladada de mesa ${mesa_origen_id} a mesa ${mesa_destino_id} por usuario ${usuarioId || 'N/A'}. Motivo: ${motivo || 'N/A'}`);

      return res.json({
        success: true,
        message: 'Orden trasladada exitosamente',
        data: {
          orden_id,
          mesa_origen_id,
          mesa_destino_id,
        },
      });
    } catch (err) {
      await trx.rollback();
      console.error('❌ Error en trasladar mesa:', err.message);
      return res.status(500).json({
        error: 'Error al trasladar la orden de mesa',
        message: err.message,
      });
    }
  }
}

module.exports = MesasController;
