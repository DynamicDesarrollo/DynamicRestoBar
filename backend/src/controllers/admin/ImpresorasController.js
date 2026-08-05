const db = require('../../config/database');
const { imprimirPrueba } = require('../../services/PrinterService');

class ImpresorasController {

  // GET /admin/impresoras
  static async getImpresoras(req, res) {
    try {
      const sede_id = req.query.sede_id || req.usuario?.sedeId;
      let query = db('impresoras').whereNull('deleted_at').orderBy('nombre');
      if (sede_id) query = query.where('sede_id', sede_id);

      const impresoras = await query.select(
        'id', 'sede_id', 'nombre', 'tipo', 'modelo',
        'ip_address', 'puerto', 'estado', 'created_at'
      );

      // Adjuntar la sede a cada impresora
      const sedeIds = [...new Set(impresoras.map(i => i.sede_id))];
      const sedes = sedeIds.length
        ? await db('sedes').whereIn('id', sedeIds).select('id', 'nombre')
        : [];
      const sedeMap = Object.fromEntries(sedes.map(s => [s.id, s.nombre]));

      const result = impresoras.map(i => ({
        ...i,
        sede_nombre: sedeMap[i.sede_id] || '',
      }));

      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('❌ getImpresoras:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /admin/impresoras
  static async crearImpresora(req, res) {
    try {
      const { sede_id, nombre, tipo = 'termica', modelo, ip_address, puerto = 9100, estado = 'activa' } = req.body;

      if (!sede_id || !nombre || !ip_address) {
        return res.status(400).json({ error: 'sede_id, nombre e ip_address son obligatorios' });
      }

      const [id] = await db('impresoras').insert({
        sede_id,
        nombre,
        tipo,
        modelo: modelo || null,
        ip_address,
        puerto: parseInt(puerto),
        estado,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');

      const impresora = await db('impresoras').where('id', id?.id ?? id).first();
      return res.status(201).json({ success: true, data: impresora });
    } catch (err) {
      console.error('❌ crearImpresora:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT /admin/impresoras/:id
  static async actualizarImpresora(req, res) {
    try {
      const { id } = req.params;
      const { sede_id, nombre, tipo, modelo, ip_address, puerto, estado } = req.body;

      const updates = { updated_at: new Date() };
      if (sede_id   !== undefined) updates.sede_id    = sede_id;
      if (nombre    !== undefined) updates.nombre     = nombre;
      if (tipo      !== undefined) updates.tipo       = tipo;
      if (modelo    !== undefined) updates.modelo     = modelo;
      if (ip_address !== undefined) updates.ip_address = ip_address;
      if (puerto    !== undefined) updates.puerto     = parseInt(puerto);
      if (estado    !== undefined) updates.estado     = estado;

      await db('impresoras').where('id', id).update(updates);
      const impresora = await db('impresoras').where('id', id).first();
      return res.json({ success: true, data: impresora });
    } catch (err) {
      console.error('❌ actualizarImpresora:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE /admin/impresoras/:id
  static async eliminarImpresora(req, res) {
    try {
      const { id } = req.params;
      await db('impresoras').where('id', id).update({ deleted_at: new Date() });
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ eliminarImpresora:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /admin/impresoras/:id/test
  static async testImpresora(req, res) {
    try {
      const { id } = req.params;
      const impresora = await db('impresoras').where('id', id).whereNull('deleted_at').first();

      if (!impresora) {
        return res.status(404).json({ error: 'Impresora no encontrada' });
      }
      if (!impresora.ip_address) {
        return res.status(400).json({ error: 'La impresora no tiene IP configurada' });
      }

      await imprimirPrueba(impresora);
      return res.json({ success: true, message: `Prueba enviada a ${impresora.ip_address}:${impresora.puerto}` });
    } catch (err) {
      console.error('❌ testImpresora:', err.message);
      return res.status(500).json({ error: `No se pudo conectar a la impresora: ${err.message}` });
    }
  }
}

module.exports = ImpresorasController;
