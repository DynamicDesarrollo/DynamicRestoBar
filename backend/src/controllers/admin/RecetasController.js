const db = require('../../config/database');

class RecetasController {
  // Obtener todas las recetas con sus insumos
  static async getRecetas(req, res) {
    try {
      const recetas = await db('recetas')
        .leftJoin('productos', 'recetas.producto_id', 'productos.id')
        .select(
          'recetas.id',
          'recetas.producto_id',
          'productos.nombre as producto_nombre',
          'recetas.activa'
        )
        .where('recetas.activa', true)
        .orderBy('productos.nombre', 'asc');

      return res.json({
        success: true,
        data: recetas,
      });
    } catch (err) {
      console.error('❌ Error en getRecetas:', err.message);
      return res.status(500).json({
        error: 'Error al obtener recetas',
        message: err.message,
      });
    }
  }

  // Obtener receta por ID con todos sus insumos
  static async getRecetaById(req, res) {
    try {
      const { id } = req.params;

      const receta = await db('recetas')
        .where('recetas.id', id)
        .where('recetas.activa', true)
        .first();

      if (!receta) {
        return res.status(404).json({ error: 'Receta no encontrada' });
      }

      // Obtener los insumos de la receta
      const insumos = await db('receta_insumos')
        .leftJoin('insumos', 'receta_insumos.insumo_id', 'insumos.id')
        .leftJoin('unidad_medida', 'insumos.unidad_medida_id', 'unidad_medida.id')
        .select(
          'receta_insumos.id as receta_insumo_id',
          'receta_insumos.insumo_id',
          'insumos.nombre as insumo_nombre',
          'insumos.costo_unitario',
          'unidad_medida.nombre as unidad_medida',
          'receta_insumos.cantidad'
        )
        .where('receta_insumos.receta_id', id);

      return res.json({
        success: true,
        data: {
          ...receta,
          insumos,
        },
      });
    } catch (err) {
      console.error('❌ Error en getRecetaById:', err.message);
      return res.status(500).json({
        error: 'Error al obtener receta',
        message: err.message,
      });
    }
  }

  // Obtener receta de un producto
  static async getRecetaByProducto(req, res) {
    try {
      const { producto_id } = req.params;

      const receta = await db('recetas')
        .where('producto_id', producto_id)
        .where('activa', true)
        .orderBy('id', 'desc')
        .first();

      if (!receta) {
        return res.json({
          success: true,
          data: null,
          message: 'Este producto no tiene receta definida',
        });
      }

      // Obtener los insumos
      const insumos = await db('receta_insumos')
        .leftJoin('insumos', 'receta_insumos.insumo_id', 'insumos.id')
        .leftJoin('unidad_medida', 'insumos.unidad_medida_id', 'unidad_medida.id')
        .select(
          'receta_insumos.id as receta_insumo_id',
          'receta_insumos.insumo_id',
          'insumos.nombre as insumo_nombre',
          'insumos.costo_unitario',
          'unidad_medida.nombre as unidad_medida',
          'receta_insumos.cantidad'
        )
        .where('receta_insumos.receta_id', receta.id);

      return res.json({
        success: true,
        data: {
          ...receta,
          insumos,
        },
      });
    } catch (err) {
      console.error('❌ Error en getRecetaByProducto:', err.message);
      return res.status(500).json({
        error: 'Error al obtener receta del producto',
        message: err.message,
      });
    }
  }

  // Crear receta
  static async crearReceta(req, res) {
    try {
      const { producto_id, descripcion, rendimiento, insumos } = req.body;

      if (!producto_id || !insumos || insumos.length === 0) {
        return res.status(400).json({
          error: 'Producto e insumos son requeridos',
        });
      }

      // Verificar que el producto existe
      const producto = await db('productos').where('id', producto_id).first();
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Calcular costo total de la receta
      let costo_produccion = 0;
      for (const insumo of insumos) {
        const costo = insumo.cantidad * insumo.costo_unitario;
        costo_produccion += costo;
      }

      // Desactivar recetas previas de este producto
      await db('recetas')
        .where('producto_id', producto_id)
        .where('activa', true)
        .update({ activa: false });

      // Crear nueva receta
      const result = await db('recetas').insert({
        producto_id,
        nombre: `Receta ${producto.nombre}`,
        descripcion: descripcion || null,
        rendimiento: rendimiento || 1,
        costo_total: parseFloat(costo_produccion.toFixed(2)),
        costo_produccion: parseFloat(costo_produccion.toFixed(2)),
        activa: true,
      }).returning('*');

      const receta = Array.isArray(result) ? result[0] : result;

      // Insertar insumos de la receta
      const insumoData = insumos.map(ing => ({
        receta_id: receta.id,
        insumo_id: ing.insumo_id,
        cantidad: ing.cantidad,
      }));

      await db('receta_insumos').insert(insumoData);

      console.log(`✅ Receta para producto ${producto_id} creada con costo total $${costo_produccion}`);

      return res.json({
        success: true,
        message: 'Receta creada exitosamente',
        data: receta,
        costo_total: costo_produccion,
      });
    } catch (err) {
      console.error('❌ Error en crearReceta:', err.message);
      return res.status(500).json({
        error: 'Error al crear receta',
        message: err.message,
      });
    }
  }

  // Actualizar receta (crea nueva versión)
  static async actualizarReceta(req, res) {
    try {
      const { id } = req.params;
      const { descripcion, rendimiento, insumos } = req.body;

      const recetaAnterior = await db('recetas')
        .where('id', id)
        .where('activa', true)
        .first();

      if (!recetaAnterior) {
        return res.status(404).json({ error: 'Receta no encontrada' });
      }

      // Calcular nuevo costo total
      let costo_produccion = 0;
      for (const insumo of insumos) {
        const costo = insumo.cantidad * insumo.costo_unitario;
        costo_produccion += costo;
      }

      // Desactivar receta anterior
      await db('recetas').where('id', id).update({ activa: false });

      // Crear nueva versión de receta
      const result = await db('recetas').insert({
        producto_id: recetaAnterior.producto_id,
        nombre: recetaAnterior.nombre,
        descripcion: descripcion || recetaAnterior.descripcion,
        rendimiento: rendimiento || recetaAnterior.rendimiento,
        costo_total: parseFloat(costo_produccion.toFixed(2)),
        costo_produccion: parseFloat(costo_produccion.toFixed(2)),
        activa: true,
      }).returning('*');

      const nuevaReceta = Array.isArray(result) ? result[0] : result;

      // Eliminar insumos anteriores
      await db('receta_insumos').where('receta_id', id).del();

      // Insertar nuevos insumos
      const insumoData = insumos.map(ing => ({
        receta_id: nuevaReceta.id,
        insumo_id: ing.insumo_id,
        cantidad: ing.cantidad,
      }));

      await db('receta_insumos').insert(insumoData);

      console.log(`✅ Receta ${id} actualizada con costo $${costo_produccion}`);

      return res.json({
        success: true,
        message: 'Receta actualizada exitosamente (nueva versión creada)',
        data: nuevaReceta,
        costo_total: costo_produccion,
      });
    } catch (err) {
      console.error('❌ Error en actualizarReceta:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar receta',
        message: err.message,
      });
    }
  }

  // Agregar insumo a receta
  static async agregarInsumoReceta(req, res) {
    try {
      const { id } = req.params;
      const { insumo_id, cantidad, unidad_medida_id, costo_unitario, merma } = req.body;

      const receta = await db('recetas').where('id', id).where('activa', true).first();
      if (!receta) {
        return res.status(404).json({ error: 'Receta no encontrada' });
      }

      // Verificar si el insumo ya está en la receta
      const existe = await db('receta_insumos')
        .where('receta_id', id)
        .where('insumo_id', insumo_id)
        .first();

      if (existe) {
        return res.status(400).json({ error: 'Este insumo ya está en la receta' });
      }

      await db('receta_insumos').insert({
        receta_id: id,
        insumo_id,
        cantidad: parseFloat(cantidad),
      });

      // Recalcular costo total
      const nuevoCosto = await db('receta_insumos')
        .where('receta_id', id)
        .sum('cantidad * costo_unitario as total')
        .first();

      await db('recetas').where('id', id).update({
        costo_total: parseFloat(nuevoCosto.total || 0),
      });

      console.log(`✅ Insumo agregado a receta ${id}`);

      return res.json({
        success: true,
        message: 'Insumo agregado exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en agregarInsumoReceta:', err.message);
      return res.status(500).json({
        error: 'Error al agregar insumo',
        message: err.message,
      });
    }
  }

  // Eliminar insumo de receta
  static async eliminarInsumoReceta(req, res) {
    try {
      const { id, insumo_id } = req.params;

      const receta = await db('recetas').where('id', id).where('activa', true).first();
      if (!receta) {
        return res.status(404).json({ error: 'Receta no encontrada' });
      }

      await db('receta_insumos')
        .where('receta_id', id)
        .where('insumo_id', insumo_id)
        .del();

      // Recalcular costo total
      const nuevoCosto = await db('receta_insumos')
        .where('receta_id', id)
        .sum('cantidad * costo_unitario as total')
        .first();

      await db('recetas').where('id', id).update({
        costo_total: parseFloat(nuevoCosto.total || 0),
      });

      console.log(`✅ Insumo eliminado de receta ${id}`);

      return res.json({
        success: true,
        message: 'Insumo eliminado exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en eliminarInsumoReceta:', err.message);
      return res.status(500).json({
        error: 'Error al eliminar insumo',
        message: err.message,
      });
    }
  }

  // Desactivar receta
  static async eliminarReceta(req, res) {
    try {
      const { id } = req.params;

      const receta = await db('recetas').where('id', id).first();
      if (!receta) {
        return res.status(404).json({ error: 'Receta no encontrada' });
      }

      await db('recetas').where('id', id).update({
        activa: false,
        deleted_at: new Date(),
      });

      console.log(`✅ Receta ${id} desactivada`);

      return res.json({
        success: true,
        message: 'Receta eliminada exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en eliminarReceta:', err.message);
      return res.status(500).json({
        error: 'Error al eliminar receta',
        message: err.message,
      });
    }
  }
}

module.exports = RecetasController;
