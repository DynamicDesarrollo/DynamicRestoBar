const db = require('../../config/database');
const { sedesDelCliente } = require('../../utils/tenantScope');

class ProductosController {
  // Obtener todas las categorías del cliente autenticado
  static async getCategorias(req, res) {
    try {
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);
      const { sedeId } = req.query;

      let query = db('categorias')
        .select('*')
        .whereNull('deleted_at')
        .andWhere((q) => {
          q.whereNull('sede_id').orWhereIn('sede_id', sedeIds);
        });

      // Si piden una sede puntual, solo se respeta si es del propio cliente
      if (sedeId && sedeIds.includes(Number(sedeId))) {
        query = query.andWhere((q) => {
          q.whereNull('sede_id').orWhere('sede_id', sedeId);
        });
      }

      const categorias = await query.orderBy('nombre', 'asc');

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
      const clienteId = req.usuario?.cliente_id;

      if (!nombre) {
        return res.status(400).json({
          error: 'El nombre de la categoría es requerido',
        });
      }

      const sedeIds = await sedesDelCliente(clienteId);
      let sede_id = req.body.sede_id || null;
      if (sede_id && !sedeIds.includes(Number(sede_id))) {
        return res.status(403).json({ error: 'La sede indicada no pertenece a tu empresa' });
      }
      if (!sede_id) {
        sede_id = req.usuario?.sede_id || null;
      }

      const result = await db('categorias').insert({
        nombre,
        descripcion: descripcion || null,
        icono_url: icono || null,
        sede_id,
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
      const { nombre, descripcion, icono, sede_id } = req.body;
      const clienteId = req.usuario?.cliente_id;

      if (!nombre) {
        return res.status(400).json({
          error: 'El nombre de la categoría es requerido',
        });
      }

      const sedeIds = await sedesDelCliente(clienteId);
      const existente = await db('categorias').where('id', id).first();
      if (!existente) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      if (existente.sede_id != null && !sedeIds.includes(existente.sede_id)) {
        return res.status(403).json({ error: 'No puedes editar una categoría de otra empresa' });
      }
      if (sede_id && !sedeIds.includes(Number(sede_id))) {
        return res.status(403).json({ error: 'La sede indicada no pertenece a tu empresa' });
      }

      const updateData = {};
      if (nombre) updateData.nombre = nombre;
      if (descripcion !== undefined) updateData.descripcion = descripcion || null;
      if (icono !== undefined) updateData.icono_url = icono || null;
      if (sede_id !== undefined) updateData.sede_id = sede_id || null;

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
      const clienteId = req.usuario?.cliente_id;

      const sedeIds = await sedesDelCliente(clienteId);
      const existente = await db('categorias').where('id', id).first();
      if (!existente) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      if (existente.sede_id != null && !sedeIds.includes(existente.sede_id)) {
        return res.status(403).json({ error: 'No puedes eliminar una categoría de otra empresa' });
      }

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

  // Obtener productos del cliente autenticado
  static async getProductos(req, res) {
    try {
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);
      const { sedeId } = req.query;

      let query = db('productos')
        .leftJoin('categorias', 'productos.categoria_id', 'categorias.id')
        .select(
          'productos.id',
          'productos.nombre',
          'productos.descripcion',
          'productos.precio_venta as precio',
          'productos.estacion_id',
          'productos.categoria_id',
          'productos.foto_url',
          'categorias.nombre as categoria',
        )
        .whereNull('productos.deleted_at')
        .whereIn('productos.sede_id', sedeIds);

      // Filtrar por una sede puntual, solo si es del propio cliente
      if (sedeId && sedeIds.includes(Number(sedeId))) {
        query = query.andWhere('productos.sede_id', sedeId);
      }

      const productos = await query.orderBy('productos.nombre', 'asc');

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
      const clienteId = req.usuario?.cliente_id;

      if (!nombre || !precio_venta || !estacion_id) {
        return res.status(400).json({
          error: 'Nombre, precio y estación son requeridos',
        });
      }

      const sedeIds = await sedesDelCliente(clienteId);
      let sede_id = req.body.sede_id || null;
      if (sede_id && !sedeIds.includes(Number(sede_id))) {
        return res.status(403).json({ error: 'La sede indicada no pertenece a tu empresa' });
      }
      if (!sede_id) {
        sede_id = req.usuario?.sede_id || null;
      }

      let foto_url = null;
      if (req.file) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        foto_url = `${baseUrl}/uploads/productos/${req.file.filename}`;
      }

      const result = await db('productos').insert({
        nombre,
        descripcion: descripcion || null,
        categoria_id: categoria_id || null,
        precio_venta: parseFloat(precio_venta),
        estacion_id: parseInt(estacion_id),
        sede_id,
        foto_url,
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
      const { nombre, descripcion, categoria_id, precio_venta, estacion_id, sede_id } = req.body;
      const clienteId = req.usuario?.cliente_id;

      const producto = await db('productos')
        .where('id', id)
        .first();

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const sedeIds = await sedesDelCliente(clienteId);
      if (producto.sede_id != null && !sedeIds.includes(producto.sede_id)) {
        return res.status(403).json({ error: 'No puedes editar un producto de otra empresa' });
      }
      if (sede_id && !sedeIds.includes(Number(sede_id))) {
        return res.status(403).json({ error: 'La sede indicada no pertenece a tu empresa' });
      }

      const updateData = {};
      if (nombre !== undefined && nombre) updateData.nombre = nombre;
      if (descripcion !== undefined) updateData.descripcion = descripcion;
      if (categoria_id !== undefined && categoria_id) updateData.categoria_id = categoria_id;
      if (precio_venta !== undefined) updateData.precio_venta = parseFloat(precio_venta);
      if (estacion_id !== undefined) updateData.estacion_id = parseInt(estacion_id);
      if (sede_id !== undefined) updateData.sede_id = sede_id || null;
      if (req.file) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        updateData.foto_url = `${baseUrl}/uploads/productos/${req.file.filename}`;
      }

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
      const clienteId = req.usuario?.cliente_id;

      const producto = await db('productos')
        .where('id', id)
        .first();

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const sedeIds = await sedesDelCliente(clienteId);
      if (producto.sede_id != null && !sedeIds.includes(producto.sede_id)) {
        return res.status(403).json({ error: 'No puedes eliminar un producto de otra empresa' });
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

  // Obtener las estaciones del cliente autenticado
  static async getEstaciones(req, res) {
    try {
      const clienteId = req.usuario?.cliente_id;
      const sedeIds = await sedesDelCliente(clienteId);

      const estaciones = await db('estaciones')
        .select('*')
        .where('activa', true)
        .whereIn('sede_id', sedeIds)
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
