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
      
      if (!sedeId) {
        return res.status(400).json({
          error: 'sedeId es requerido',
        });
      }

      const mesas = await db('mesas')
        .select('*')
        .where('sede_id', sedeId)
        .where('deleted_at', null)
        .orderBy('numero', 'asc');

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
}

module.exports = MesasController;
