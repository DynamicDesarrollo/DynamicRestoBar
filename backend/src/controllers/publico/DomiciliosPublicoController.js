/**
 * Endpoint PÚBLICO (sin JWT) para que el comensal siga su domicilio en un
 * mapa desde su celular — mismo patrón que MenuDigitalController.js: la
 * "sede" nunca se resuelve desde req.usuario (no existe), se valida a mano
 * contra el tracking_token de la URL.
 */
const db = require('../../config/database');

const DomiciliosPublicoController = {
  async getSeguimiento(req, res) {
    try {
      const { token } = req.params;
      if (!token) return res.status(404).json({ error: 'Domicilio no encontrado' });

      const entrega = await db('domicilio_entregas as de')
        .join('ordenes as o', 'de.orden_id', 'o.id')
        .join('sedes as s', 'o.sede_id', 's.id')
        .leftJoin('repartidores as r', 'de.repartidor_id', 'r.id')
        .select(
          'de.id', 'de.estado', 'de.direccion_entrega', 'de.referencia',
          'de.latitud_destino', 'de.longitud_destino',
          'de.hora_asignacion', 'de.hora_salida', 'de.hora_entrega',
          'o.numero_orden', 'o.total',
          's.nombre as sede_nombre',
          'r.nombre as repartidor_nombre', 'r.telefono as repartidor_telefono'
        )
        .where('de.tracking_token', token)
        .whereNull('de.deleted_at')
        .first();

      if (!entrega) return res.status(404).json({ error: 'Domicilio no encontrado' });

      const ultimaPosicion = await db('domicilio_tracking')
        .where('domicilio_entrega_id', entrega.id)
        .orderBy('created_at', 'desc')
        .first();

      return res.json({
        success: true,
        data: {
          ...entrega,
          ultima_posicion: ultimaPosicion
            ? { latitud: ultimaPosicion.latitud, longitud: ultimaPosicion.longitud, hora: ultimaPosicion.created_at }
            : null,
        },
      });
    } catch (err) {
      console.error('❌ Error en getSeguimiento:', err.message);
      return res.status(500).json({ error: 'Error al obtener el seguimiento' });
    }
  },
};

module.exports = DomiciliosPublicoController;
