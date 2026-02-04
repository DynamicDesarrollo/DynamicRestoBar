/**
 * KdsController
 * 
 * Controlador para Kitchen Display System (KDS)
 * Gestiona visualización de comandas por estación
 */

const db = require('../config/database');

class KdsController {
  /**
   * GET /kds/estaciones/:sedeId
   * Obtener todas las estaciones activas de una sede
   */
  static async getEstacionesPorSede(req, res) {
    try {
      const { sedeId } = req.params;

      const estaciones = await db('estaciones')
        .where('sede_id', sedeId)
        .where('activa', true)
        .orderBy('nombre', 'asc');

      return res.json({
        success: true,
        data: estaciones,
        total: estaciones.length,
      });
    } catch (err) {
      console.error('❌ Error en getEstacionesPorSede:', err.message);
      return res.status(500).json({
        error: 'Error al obtener estaciones',
        message: err.message,
      });
    }
  }

  /**
   * GET /kds/estacion/:estacionId
   * Obtener todas las comandas pendientes para una estación
   */
  static async getComandaByEstacion(req, res) {
    try {
      const { estacionId } = req.params;

      // Obtener todas las comandas de la estación (incluyendo entregadas)
      const comandas = await db('comandas')
        .select('comandas.*', 'mesas.numero as mesa_numero')
        .leftJoin('ordenes', 'comandas.orden_id', '=', 'ordenes.id')
        .leftJoin('mesas', 'ordenes.mesa_id', '=', 'mesas.id')
        .where('comandas.estacion_id', estacionId)
        .orderBy('comandas.created_at', 'asc');

      // Para cada comanda, obtener sus items
      const comandasConItems = await Promise.all(
        comandas.map(async (comanda) => {
          const items = await db('comanda_items')
            .select(
              'comanda_items.*',
              'orden_items.producto_id',
              'orden_items.cantidad',
              'orden_items.precio_unitario',
              'orden_items.subtotal',
              'orden_items.notas_especiales',
              'productos.nombre',
              'productos.descripcion'
            )
            .leftJoin('orden_items', 'comanda_items.orden_item_id', '=', 'orden_items.id')
            .leftJoin('productos', 'orden_items.producto_id', '=', 'productos.id')
            .where('comanda_items.comanda_id', comanda.id)
            .orderBy('comanda_items.created_at', 'asc');

          return { ...comanda, items };
        })
      );

      return res.json({
        success: true,
        data: comandasConItems,
        total: comandasConItems.length,
      });
    } catch (err) {
      console.error('❌ Error en getComandaByEstacion:', err.message);
      return res.status(500).json({
        error: 'Error al obtener comandas de estación',
        message: err.message,
      });
    }
  }

  /**
   * GET /kds/resumen-estaciones
   * Obtener resumen de comandas por todas las estaciones
   */
  static async getResumenEstaciones(req, res) {
    try {
      const estaciones = await db('estaciones')
        .select('estaciones.*')
        .where('estaciones.activa', true);

      const resumen = await Promise.all(
        estaciones.map(async (estacion) => {
          const comandas = await db('comandas')
            .count('* as total')
            .where('comandas.estacion_id', estacion.id)
            .whereNotIn('comandas.estado', ['entregada'])
            .first();

          const pendientes = await db('comandas')
            .count('* as total')
            .where('comandas.estacion_id', estacion.id)
            .where('comandas.estado', 'pendiente')
            .first();

          const preparando = await db('comandas')
            .count('* as total')
            .where('comandas.estacion_id', estacion.id)
            .where('comandas.estado', 'en_preparacion')
            .first();

          const listas = await db('comandas')
            .count('* as total')
            .where('comandas.estacion_id', estacion.id)
            .where('comandas.estado', 'lista')
            .first();

          return {
            estacion: estacion.nombre,
            estacion_id: estacion.id,
            total: comandas.total || 0,
            pendientes: pendientes.total || 0,
            preparando: preparando.total || 0,
            listas: listas.total || 0,
          };
        })
      );

      return res.json({
        success: true,
        data: resumen,
      });
    } catch (err) {
      console.error('❌ Error en getResumenEstaciones:', err.message);
      return res.status(500).json({
        error: 'Error al obtener resumen de estaciones',
        message: err.message,
      });
    }
  }

  /**
   * PATCH /kds/comanda/:comandaId/estado
   * Actualizar estado de comanda
   * Cuerpo: { estado: 'pendiente'|'en_preparacion'|'lista'|'entregada' }
   */
  static async updateEstadoComanda(req, res) {
    try {
      const { comandaId } = req.params;
      const { estado } = req.body;

      console.log('🔄 Actualizando comanda:', { comandaId, estado });

      if (!['pendiente', 'en_preparacion', 'lista', 'entregada'].includes(estado)) {
        console.error('❌ Estado inválido:', estado);
        return res.status(400).json({
          error: 'Estado inválido',
          estadosValidos: ['pendiente', 'en_preparacion', 'lista', 'entregada'],
          estadoRecibido: estado,
        });
      }

      const comanda = await db('comandas')
        .where('id', comandaId)
        .first();

      if (!comanda) {
        return res.status(404).json({ error: 'Comanda no encontrada' });
      }

      // Actualizar comanda - solamente el estado
      try {
        await db('comandas').where('id', comandaId).update({
          estado: estado,
        });
      } catch (dbErr) {
        console.error('❌ Error BD:', dbErr.message, dbErr.detail);
        throw dbErr;
      }

      return res.json({
        success: true,
        message: `Comanda actualizada a ${estado}`,
        data: { comandaId, estado },
      });
    } catch (err) {
      console.error('❌ Error al actualizar comanda:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar comanda',
        message: err.message,
      });
    }
  }

  /**
   * PATCH /kds/item/:itemId/estado
   * Actualizar estado de un item individual en comanda
   * Cuerpo: { estado: 'pendiente'|'en_preparacion'|'lista'|'entregada' }
   */
  static async updateEstadoItem(req, res) {
    try {
      const { itemId } = req.params;
      const { estado } = req.body;

      // Valores válidos del enum: pendiente, en_preparacion, listo, entregado
      if (!['pendiente', 'en_preparacion', 'listo', 'entregado'].includes(estado)) {
        return res.status(400).json({
          error: 'Estado inválido',
        });
      }

      const item = await db('comanda_items')
        .where('id', itemId)
        .first();

      if (!item) {
        return res.status(404).json({ error: 'Item no encontrado' });
      }

      // Actualizar item
      await db('comanda_items').where('id', itemId).update({
        estado,
        hora_inicio: estado === 'en_preparacion' ? new Date() : item.hora_inicio,
        hora_lista: estado === 'listo' ? new Date() : item.hora_lista,
        updated_at: new Date(),
      });

      // Verificar si todos los items de la comanda están listos
      const itemsPendientes = await db('comanda_items')
        .where('comanda_id', item.comanda_id)
        .whereNotIn('estado', ['listo', 'entregado'])
        .count('id as count')
        .first();

      // Si no hay items pendientes, actualizar comanda a "lista"
      if (itemsPendientes.count === 0) {
        await db('comandas').where('id', item.comanda_id).update({
          estado: 'lista',
          updated_at: new Date(),
        });
      }

      return res.json({
        success: true,
        message: `Item actualizado a ${estado}`,
        data: { itemId, estado },
      });
    } catch (err) {
      console.error('❌ Error al actualizar item:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar item',
        message: err.message,
      });
    }
  }
}

module.exports = KdsController;
