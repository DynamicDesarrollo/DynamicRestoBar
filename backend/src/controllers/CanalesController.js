const db = require('../config/database');

class CanalesController {
  static async listar(req, res) {
    try {
      const canales = await db('canales').select('*');
      res.json({ data: canales });
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener canales', details: err.message });
    }
  }
}

module.exports = CanalesController;
