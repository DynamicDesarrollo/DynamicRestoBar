const db = require('../../config/database');

class ZonasController {
  static async getZonas(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;
      
      const zonas = await db('zonas')
        .where('sede_id', sede_id)
        .orderBy('nombre', 'asc');

      return res.json({
        success: true,
        data: zonas,
      });
    } catch (err) {
      console.error('❌ Error en getZonas:', err.message);
      return res.status(500).json({
        error: 'Error al obtener zonas',
        message: err.message,
      });
    }
  }

  static async crearZona(req, res) {
    try {
      const { nombre, descripcion } = req.body;
      const { sedeId: sede_id } = req.usuario;

      if (!nombre) {
        return res.status(400).json({ error: 'El nombre es requerido' });
      }

      const zona = await db('zonas').insert({
        nombre,
        descripcion: descripcion || null,
        sede_id,
      }).returning('*');

      console.log(`✅ Zona "${nombre}" creada`);

      return res.json({
        success: true,
        data: Array.isArray(zona) ? zona[0] : zona,
      });
    } catch (err) {
      console.error('❌ Error en crearZona:', err.message);
      return res.status(500).json({
        error: 'Error al crear zona',
        message: err.message,
      });
    }
  }

  static async actualizarZona(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;

      await db('zonas').where('id', id).update({
        nombre,
        descripcion: descripcion || null,
      });

      const zona = await db('zonas').where('id', id).first();

      console.log(`✅ Zona "${nombre}" actualizada`);

      return res.json({
        success: true,
        data: zona,
      });
    } catch (err) {
      console.error('❌ Error en actualizarZona:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar zona',
        message: err.message,
      });
    }
  }

  static async eliminarZona(req, res) {
    try {
      const { id } = req.params;

      await db('zonas').where('id', id).del();

      console.log(`✅ Zona ${id} eliminada`);

      return res.json({
        success: true,
        message: 'Zona eliminada exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en eliminarZona:', err.message);
      return res.status(500).json({
        error: 'Error al eliminar zona',
        message: err.message,
      });
    }
  }
}

module.exports = ZonasController;
