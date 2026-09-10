const db = require('../../config/database');
const { sedesDelCliente, sedePerteneceACliente } = require('../../utils/tenantScope');
const FacturaElectronicaService = require('../../services/FacturaElectronicaService');

const FacturasElectronicasController = {
  /**
   * GET /admin/facturas-electronicas?estado=pendiente
   * Lista las facturas con requiere_electronica=true de las sedes del
   * cliente autenticado. Sirve para ver qué queda por mandar — sobre
   * todo útil para vaciar el atraso el día que se configure la app
   * puente por primera vez.
   */
  async listar(req, res) {
    try {
      const sedeIds = await sedesDelCliente(req.usuario?.cliente_id);
      if (sedeIds.length === 0) return res.json({ success: true, data: [] });

      const { estado } = req.query;

      let query = db('facturas as f')
        .select(
          'f.id',
          'f.numero_factura',
          'f.orden_id',
          'f.sede_id',
          'f.total',
          'f.estado_envio_dian',
          'f.fecha_emision',
          'f.updated_at',
          'c.numero_documento',
          'c.nombre_razon_social'
        )
        .leftJoin('factura_compradores as c', 'c.factura_id', 'f.id')
        .where('f.requiere_electronica', true)
        .whereIn('f.sede_id', sedeIds)
        .orderBy('f.updated_at', 'desc');

      if (estado) {
        query = query.andWhere('f.estado_envio_dian', estado);
      }

      const facturas = await query;
      return res.json({ success: true, data: facturas });
    } catch (err) {
      console.error('❌ Error en listar facturas electrónicas:', err.message);
      return res.status(500).json({ error: 'Error al listar facturas electrónicas', message: err.message });
    }
  },

  /**
   * POST /admin/facturas-electronicas/:id/reenviar
   * Reintenta el envío de una factura puntual — para cuando quedó
   * "pendiente" por un fallo temporal, o para vaciar el atraso apenas
   * se configure FACTURACION_BRIDGE_URL por primera vez.
   */
  async reenviar(req, res) {
    try {
      const { id } = req.params;
      const sedeIds = await sedesDelCliente(req.usuario?.cliente_id);

      const factura = await db('facturas').where('id', id).first();
      if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
      if (!sedePerteneceACliente(factura.sede_id, sedeIds)) {
        return res.status(403).json({ error: 'Esa factura no pertenece a tu empresa' });
      }
      if (!factura.requiere_electronica) {
        return res.status(400).json({ error: 'Esta factura no fue marcada para factura electrónica' });
      }

      const resultado = await FacturaElectronicaService.enviarFactura(factura.id);
      return res.json({ success: resultado.enviado, data: resultado });
    } catch (err) {
      console.error('❌ Error al reenviar factura electrónica:', err.message);
      return res.status(500).json({ error: 'Error al reenviar factura electrónica', message: err.message });
    }
  },
};

module.exports = FacturasElectronicasController;
