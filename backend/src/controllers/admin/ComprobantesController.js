const db = require('../../config/database');
const { sedesDelCliente } = require('../../utils/tenantScope');

const TIPOS_VALIDOS = ['ingreso', 'egreso'];

// Verifica que el concepto exista, pertenezca a este cliente y que su tipo
// coincida con el tipo del comprobante que se está creando/editando.
const validarConcepto = async (conceptoId, clienteId, tipo) => {
  const concepto = await db('conceptos_movimiento')
    .where('id', conceptoId)
    .whereNull('deleted_at')
    .first();
  if (!concepto) return { ok: false, error: 'Concepto no encontrado' };
  if (concepto.cliente_id !== clienteId) {
    return { ok: false, error: 'El concepto indicado no pertenece a tu empresa' };
  }
  if (concepto.tipo !== tipo) {
    return { ok: false, error: `El concepto seleccionado es de tipo "${concepto.tipo}", no "${tipo}"` };
  }
  return { ok: true, concepto };
};

const ComprobantesController = {
  // Listar comprobantes del cliente autenticado
  async getComprobantes(req, res) {
    try {
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);
      const { tipo, conceptoId, sedeId, desde, hasta } = req.query;

      let query = db('comprobantes')
        .leftJoin('conceptos_movimiento', 'comprobantes.concepto_id', 'conceptos_movimiento.id')
        .leftJoin('metodos_pago', 'comprobantes.metodo_pago_id', 'metodos_pago.id')
        .leftJoin('usuarios', 'comprobantes.usuario_id', 'usuarios.id')
        .select(
          'comprobantes.*',
          'conceptos_movimiento.nombre as concepto_nombre',
          'metodos_pago.nombre as metodo_pago_nombre',
          'usuarios.nombre as usuario_nombre'
        )
        .whereIn('comprobantes.sede_id', sedeIds)
        .whereNull('comprobantes.deleted_at');

      if (tipo && TIPOS_VALIDOS.includes(tipo)) {
        query = query.andWhere('comprobantes.tipo', tipo);
      }
      if (conceptoId) {
        query = query.andWhere('comprobantes.concepto_id', conceptoId);
      }
      if (sedeId && sedeIds.includes(Number(sedeId))) {
        query = query.andWhere('comprobantes.sede_id', sedeId);
      }
      if (desde) {
        query = query.andWhere('comprobantes.fecha', '>=', desde);
      }
      if (hasta) {
        query = query.andWhere('comprobantes.fecha', '<=', hasta);
      }

      const comprobantes = await query.orderBy('comprobantes.fecha', 'desc').orderBy('comprobantes.id', 'desc');

      return res.json({ success: true, data: comprobantes });
    } catch (err) {
      console.error('❌ Error en getComprobantes:', err.message);
      return res.status(500).json({ error: 'Error al obtener comprobantes', message: err.message });
    }
  },

  // Crear comprobante
  async crearComprobante(req, res) {
    try {
      const { concepto_id, tipo, fecha, monto, beneficiario, metodo_pago_id, referencia, observaciones } = req.body;
      const clienteId = req.usuario?.cliente_id;
      const usuarioId = req.usuario?.userId;
      const sedeId = req.usuario?.sedeId || req.usuario?.sede_id;

      if (!clienteId || !sedeId) {
        return res.status(400).json({ error: 'No se puede determinar el cliente/sede del usuario' });
      }
      if (!concepto_id || !TIPOS_VALIDOS.includes(tipo) || !monto || Number(monto) <= 0) {
        return res.status(400).json({ error: 'Concepto, tipo y monto (mayor a 0) son requeridos' });
      }

      const validacion = await validarConcepto(concepto_id, clienteId, tipo);
      if (!validacion.ok) {
        return res.status(400).json({ error: validacion.error });
      }

      let adjunto_url = null;
      if (req.file) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        adjunto_url = `${baseUrl}/uploads/comprobantes/${req.file.filename}`;
      }

      const [comprobante] = await db('comprobantes').insert({
        cliente_id: clienteId,
        sede_id: sedeId,
        concepto_id,
        tipo,
        fecha: fecha || new Date(),
        monto: parseFloat(monto),
        beneficiario: beneficiario || null,
        metodo_pago_id: metodo_pago_id || null,
        referencia: referencia || null,
        observaciones: observaciones || null,
        adjunto_url,
        usuario_id: usuarioId,
      }).returning('*');

      return res.status(201).json({ success: true, data: comprobante });
    } catch (err) {
      console.error('❌ Error en crearComprobante:', err.message);
      return res.status(500).json({ error: 'Error al crear comprobante', message: err.message });
    }
  },

  // Actualizar comprobante
  async actualizarComprobante(req, res) {
    try {
      const { id } = req.params;
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);

      const existente = await db('comprobantes').where('id', id).whereNull('deleted_at').first();
      if (!existente) {
        return res.status(404).json({ error: 'Comprobante no encontrado' });
      }
      if (!sedeIds.includes(existente.sede_id)) {
        return res.status(403).json({ error: 'No puedes editar un comprobante de otra empresa' });
      }

      const { concepto_id, tipo, fecha, monto, beneficiario, metodo_pago_id, referencia, observaciones } = req.body;

      const tipoFinal = tipo || existente.tipo;
      if (concepto_id !== undefined) {
        const validacion = await validarConcepto(concepto_id, clienteId, tipoFinal);
        if (!validacion.ok) {
          return res.status(400).json({ error: validacion.error });
        }
      }
      if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo inválido' });
      }

      const updateData = { updated_at: new Date() };
      if (concepto_id !== undefined) updateData.concepto_id = concepto_id;
      if (tipo !== undefined) updateData.tipo = tipo;
      if (fecha !== undefined) updateData.fecha = fecha;
      if (monto !== undefined) {
        if (Number(monto) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
        updateData.monto = parseFloat(monto);
      }
      if (beneficiario !== undefined) updateData.beneficiario = beneficiario || null;
      if (metodo_pago_id !== undefined) updateData.metodo_pago_id = metodo_pago_id || null;
      if (referencia !== undefined) updateData.referencia = referencia || null;
      if (observaciones !== undefined) updateData.observaciones = observaciones || null;
      if (req.file) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        updateData.adjunto_url = `${baseUrl}/uploads/comprobantes/${req.file.filename}`;
      }

      const [comprobante] = await db('comprobantes').where('id', id).update(updateData).returning('*');

      return res.json({ success: true, data: comprobante });
    } catch (err) {
      console.error('❌ Error en actualizarComprobante:', err.message);
      return res.status(500).json({ error: 'Error al actualizar comprobante', message: err.message });
    }
  },

  // Eliminar comprobante (soft delete)
  async eliminarComprobante(req, res) {
    try {
      const { id } = req.params;
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);

      const existente = await db('comprobantes').where('id', id).whereNull('deleted_at').first();
      if (!existente) {
        return res.status(404).json({ error: 'Comprobante no encontrado' });
      }
      if (!sedeIds.includes(existente.sede_id)) {
        return res.status(403).json({ error: 'No puedes eliminar un comprobante de otra empresa' });
      }

      await db('comprobantes').where('id', id).update({
        deleted_at: new Date(),
      });

      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Error en eliminarComprobante:', err.message);
      return res.status(500).json({ error: 'Error al eliminar comprobante', message: err.message });
    }
  },
};

module.exports = ComprobantesController;
