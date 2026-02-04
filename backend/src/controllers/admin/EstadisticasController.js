const db = require('../../config/database');

const EstadisticasController = {
  async ventasPorDia(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;
      const rango = req.query.rango === '30' ? '30' : 'hoy';
      let query = db('ordenes')
        .select(db.raw(`DATE(created_at) as fecha`))
        .sum('total as total')
        .where('sede_id', sede_id)
        .where('estado', 'entregada');

      if (rango === '30') {
        query = query.where(db.raw('DATE(created_at)'), '>=', db.raw("CURRENT_DATE - INTERVAL '30 days'"));
      } else {
        query = query.where(db.raw('DATE(created_at)'), '=', db.raw('CURRENT_DATE'));
      }

      const rows = await query.groupByRaw('DATE(created_at)').orderBy('fecha', 'asc');
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error('❌ Error en ventasPorDia:', err.message);
      res.status(500).json({ error: 'Error al obtener ventas por día', message: err.message });
    }
  }
};

module.exports = EstadisticasController;
