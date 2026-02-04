const db = require('../../config/database');

class ProductosController {
  // Obtener todas las categorías
  static async getCategorias(req, res) {
    try {
      const categorias = await db('categorias')
        .select('*')
        .orderBy('nombre', 'asc');

      return res.json({
        success: true,
        data: categorias,
      });
    } catch (err) {
      console.error('❌ Error en getCategorias:', err.message);
      return res.status(500).json({
        error: 'Error al obtener categorías',
        message: err.message,
      });
    }
  }

  // Crear categoría
  static async crearCategoria(req, res) {
    try {
      const { nombre, descripcion, icono } = req.body;

      if (!nombre) {
        return res.status(400).json({
          error: 'El nombre de la categoría es requerido',
        });
      }

      const result = await db('categorias').insert({
        nombre,
        descripcion: descripcion || null,
        icono_url: icono || null,
      }).returning('*');

      const categoria = Array.isArray(result) ? result[0] : result;

      console.log(`✅ Categoría ${nombre} creada`);

      return res.json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: categoria,
      });
    } catch (err) {
      console.error('❌ Error en crearCategoria:', err.message);
      return res.status(500).json({
        error: 'Error al crear categoría',
        message: err.message,
      });
    }
  }

  // Actualizar categoría
  static async actualizarCategoria(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, icono } = req.body;

      if (!nombre) {
        return res.status(400).json({
          error: 'El nombre de la categoría es requerido',
        });
      }

      const updateData = {};
      if (nombre) updateData.nombre = nombre;
      if (descripcion !== undefined) updateData.descripcion = descripcion || null;
      if (icono !== undefined) updateData.icono_url = icono || null;

      const result = await db('categorias').where('id', id).update(updateData).returning('*');
      const categoria = Array.isArray(result) ? result[0] : result;

      console.log(`✅ Categoría ${id} actualizada`);

      return res.json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: categoria,
      });
    } catch (err) {
      console.error('❌ Error en actualizarCategoria:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar categoría',
        message: err.message,
      });
    }
  }

  // Eliminar categoría
  static async eliminarCategoria(req, res) {
    try {
      const { id } = req.params;

      // Verificar si tiene productos asociados
      const productosAsociados = await db('productos')
        .where('categoria_id', id)
        .select('id');

      if (productosAsociados.length > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar una categoría que tiene productos asignados',
          detalles: `Hay ${productosAsociados.length} producto(s) en esta categoría`,
        });
      }

      await db('categorias').where('id', id).delete();

      console.log(`✅ Categoría ${id} eliminada`);

      return res.json({
        success: true,
        message: 'Categoría eliminada exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en eliminarCategoria:', err.message);
      return res.status(500).json({
        error: 'Error al eliminar categoría',
        message: err.message,
      });
    }
  }

  // Obtener productos
  static async getProductos(req, res) {
    try {
      const productos = await db('productos')
        .leftJoin('categorias', 'productos.categoria_id', 'categorias.id')
        .select(
          'productos.id',
          'productos.nombre',
          'productos.descripcion',
          'productos.precio_venta as precio',
          'productos.estacion_id',
          'categorias.nombre as categoria',
        )
        .whereNull('productos.deleted_at')
        .orderBy('productos.nombre', 'asc');

      return res.json({
        success: true,
        data: productos,
      });
    } catch (err) {
      console.error('❌ Error en getProductos:', err.message);
      return res.status(500).json({
        error: 'Error al obtener productos',
        message: err.message,
      });
    }
  }

  // Crear producto
  static async crearProducto(req, res) {
    try {
      const { nombre, descripcion, categoria_id, precio_venta, estacion_id } = req.body;

      if (!nombre || !precio_venta || !estacion_id) {
        return res.status(400).json({
          error: 'Nombre, precio y estación son requeridos',
        });
      }

      const result = await db('productos').insert({
        nombre,
        descripcion: descripcion || null,
        categoria_id: categoria_id || null,
        precio_venta: parseFloat(precio_venta),
        estacion_id: parseInt(estacion_id),
      }).returning('*');

      const producto = Array.isArray(result) ? result[0] : result;

      console.log(`✅ Producto ${nombre} creado`);

      return res.json({
        success: true,
        message: 'Producto creado exitosamente',
        data: producto,
      });
    } catch (err) {
      console.error('❌ Error en crearProducto:', err.message);
      return res.status(500).json({
        error: 'Error al crear producto',
        message: err.message,
      });
    }
  }

  // Actualizar producto
  static async actualizarProducto(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, categoria_id, precio_venta, estacion_id } = req.body;

      const producto = await db('productos')
        .where('id', id)
        .first();

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const updateData = {};
      if (nombre !== undefined && nombre) updateData.nombre = nombre;
      if (descripcion !== undefined) updateData.descripcion = descripcion;
      if (categoria_id !== undefined && categoria_id) updateData.categoria_id = categoria_id;
      if (precio_venta !== undefined) updateData.precio_venta = parseFloat(precio_venta);
      if (estacion_id !== undefined) updateData.estacion_id = parseInt(estacion_id);
      
      // Solo actualizar si hay cambios
      if (Object.keys(updateData).length === 0) {
        return res.json({
          success: true,
          message: 'No hay cambios para actualizar',
        });
      }
      
      updateData.updated_at = new Date();

      await db('productos').where('id', id).update(updateData);

      console.log(`✅ Producto ${id} actualizado`);

      return res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en actualizarProducto:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar producto',
        message: err.message,
      });
    }
  }

  // Eliminar producto
  static async eliminarProducto(req, res) {
    try {
      const { id } = req.params;

      const producto = await db('productos')
        .where('id', id)
        .first();

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Soft delete
      await db('productos').where('id', id).update({
        deleted_at: new Date(),
      });

      console.log(`✅ Producto ${id} eliminado`);

      return res.json({
        success: true,
        message: 'Producto eliminado exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en eliminarProducto:', err.message);
      return res.status(500).json({
        error: 'Error al eliminar producto',
        message: err.message,
      });
    }
  }

  // Obtener todas las estaciones
  static async getEstaciones(req, res) {
    try {
      const estaciones = await db('estaciones')
        .select('*')
        .where('activa', true)
        .orderBy('nombre', 'asc');

      return res.json({
        success: true,
        data: estaciones,
      });
    } catch (err) {
      console.error('❌ Error en getEstaciones:', err.message);
      return res.status(500).json({
        error: 'Error al obtener estaciones',
        message: err.message,
      });
    }
  }
}

module.exports = ProductosController;
