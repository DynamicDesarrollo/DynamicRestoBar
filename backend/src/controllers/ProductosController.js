/**
 * ProductosController
 * 
 * Controlador para gestión de productos:
 * - Obtener categorías
 * - Obtener productos por categoría
 * - Obtener producto individual
 * - Obtener modificadores de un producto
 * - Crear/Editar/Eliminar productos (admin)
 */

const db = require('../config/database');
const { io } = require('../server');

class ProductosController {
  /**
   * GET /api/v1/productos/categorias
   * Obtener todas las categorías disponibles
   * Query: { sedeId? }
   */
  static async getCategorias(req, res) {
    try {
      const { sedeId } = req.query;

      let query = db('categorias')
        .select('id', 'nombre', 'descripcion', 'icono_url', 'orden')
        .where('activa', true)
        .andWhere((q) => {
          // Categorías generales O específicas de la sede
          q.whereNull('sede_id').orWhere('sede_id', sedeId);
        })
        .andWhere('deleted_at', null)
        .orderBy('orden', 'asc');

      if (sedeId) {
        query.andWhere((q) => {
          q.whereNull('sede_id').orWhere('sede_id', sedeId);
        });
      }

      const categorias = await query;

      return res.json({
        success: true,
        data: categorias,
        total: categorias.length,
      });
    } catch (error) {
      console.error('❌ Error al obtener categorías:', error);
      return res.status(500).json({
        error: 'Error al obtener categorías',
      });
    }
  }

  /**
   * GET /api/v1/productos
   * Obtener productos con filtros
   * Query: { categoriaId, sedeId, activos=true }
   */
  static async getProductos(req, res) {
    try {
      const { categoriaId, sedeId, activos } = req.query;

      let query = db('productos')
        .select(
          'productos.id',
          'productos.nombre',
          'productos.descripcion',
          'productos.precio_venta',
          'productos.foto_url',
          'productos.categoria_id',
          'productos.estacion_id',
          'productos.tiempo_preparacion',
          'categorias.nombre as categoria_nombre',
          'estaciones.nombre as estacion_nombre'
        )
        .join('categorias', 'productos.categoria_id', 'categorias.id')
        .leftJoin('estaciones', 'productos.estacion_id', 'estaciones.id')
        .where('productos.deleted_at', null);

      // Filtro: solo activos
      if (activos !== 'false') {
        query.andWhere('productos.estado', 'activo');
      }

      // Filtro: categoría
      if (categoriaId) {
        query.andWhere('productos.categoria_id', categoriaId);
      }

      // Filtro: sede
      if (sedeId) {
        query.andWhere((q) => {
          q.whereNull('productos.sede_id').orWhere('productos.sede_id', sedeId);
        });
      }

      const productos = await query.orderBy('productos.nombre', 'asc');

      return res.json({
        success: true,
        data: productos,
        total: productos.length,
      });
    } catch (error) {
      console.error('❌ Error al obtener productos:', error);
      return res.status(500).json({
        error: 'Error al obtener productos',
      });
    }
  }

  /**
   * GET /api/v1/productos/:id
   * Obtener producto con todos sus detalles
   */
  static async getProductoDetalle(req, res) {
    try {
      const { id } = req.params;

      // Obtener producto base
      const producto = await db('productos')
        .select(
          'productos.*',
          'categorias.nombre as categoria_nombre',
          'estaciones.nombre as estacion_nombre'
        )
        .join('categorias', 'productos.categoria_id', 'categorias.id')
        .leftJoin('estaciones', 'productos.estacion_id', 'estaciones.id')
        .where('productos.id', id)
        .andWhere('productos.deleted_at', null)
        .first();

      if (!producto) {
        return res.status(404).json({
          error: 'Producto no encontrado',
        });
      }

      // Obtener modificadores del producto
      const modificadores = await db('modificadores')
        .select(
          'modificadores.id',
          'modificadores.nombre',
          'modificadores.tipo',
          'modificadores.requerido',
          'modificadores.maxima_seleccion'
        )
        .join(
          'producto_modificador',
          'modificadores.id',
          'producto_modificador.modificador_id'
        )
        .where('producto_modificador.producto_id', id)
        .andWhere('modificadores.deleted_at', null);

      // Obtener opciones de cada modificador
      const modificadoresConOpciones = await Promise.all(
        modificadores.map(async (mod) => {
          const opciones = await db('modificador_opciones')
            .select('id', 'nombre', 'precio_adicional')
            .where('modificador_id', mod.id)
            .orderBy('orden', 'asc');

          return {
            ...mod,
            opciones,
          };
        })
      );

      // Obtener variantes si aplica
      const variantes = await db('variantes')
        .select(
          'variantes.id',
          'variantes.nombre',
          'producto_variante.valor',
          'producto_variante.precio_adicional'
        )
        .join(
          'producto_variante',
          'variantes.id',
          'producto_variante.variante_id'
        )
        .where('producto_variante.producto_id', id);

      return res.json({
        success: true,
        data: {
          ...producto,
          modificadores: modificadoresConOpciones,
          variantes,
        },
      });
    } catch (error) {
      console.error('❌ Error al obtener detalle producto:', error);
      return res.status(500).json({
        error: 'Error al obtener producto',
      });
    }
  }

  /**
   * GET /api/v1/productos/modificadores/:modificadorId
   * Obtener opciones de un modificador
   */
  static async getModificadorOpciones(req, res) {
    try {
      const { modificadorId } = req.params;

      const opciones = await db('modificador_opciones')
        .select('id', 'nombre', 'precio_adicional', 'orden')
        .where('modificador_id', modificadorId)
        .orderBy('orden', 'asc');

      return res.json({
        success: true,
        data: opciones,
        total: opciones.length,
      });
    } catch (error) {
      console.error('❌ Error al obtener opciones:', error);
      return res.status(500).json({
        error: 'Error al obtener opciones',
      });
    }
  }

  /**
   * POST /api/v1/productos
   * Crear nuevo producto (ADMIN)
   */
  static async crearProducto(req, res) {
    try {
      const { nombre, descripcion, categoriaId, precio, estacionId, sedeId } = req.body;

      // Validar campos requeridos
      if (!nombre || !categoriaId || !precio) {
        return res.status(400).json({
          error: 'Campos requeridos: nombre, categoriaId, precio',
        });
      }

      // Crear producto
      const [id] = await db('productos').insert({
        nombre,
        descripcion,
        categoria_id: categoriaId,
        precio_venta: precio,
        estacion_id: estacionId,
        sede_id: sedeId,
        estado: 'activo',
      });

      // Obtener producto creado
      const producto = await db('productos').where('id', id).first();

      // Emitir evento a través de Socket.IO
      io.emit('producto:creado', {
        id,
        nombre,
        categoriaId,
        sedeId,
      });

      return res.status(201).json({
        success: true,
        mensaje: 'Producto creado exitosamente',
        data: producto,
      });
    } catch (error) {
      console.error('❌ Error al crear producto:', error);
      return res.status(500).json({
        error: 'Error al crear producto',
      });
    }
  }

  /**
   * PUT /api/v1/productos/:id
   * Actualizar producto (ADMIN)
   */
  static async actualizarProducto(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, precio, estado } = req.body;

      // Validar que existe
      const producto = await db('productos').where('id', id).first();
      if (!producto) {
        return res.status(404).json({
          error: 'Producto no encontrado',
        });
      }

      // Actualizar
      await db('productos').where('id', id).update({
        nombre: nombre || producto.nombre,
        descripcion: descripcion || producto.descripcion,
        precio_venta: precio || producto.precio_venta,
        estado: estado || producto.estado,
      });

      // Emitir evento
      io.emit('producto:actualizado', { id, nombre });

      return res.json({
        success: true,
        mensaje: 'Producto actualizado exitosamente',
      });
    } catch (error) {
      console.error('❌ Error al actualizar producto:', error);
      return res.status(500).json({
        error: 'Error al actualizar producto',
      });
    }
  }

  /**
   * DELETE /api/v1/productos/:id
   * Eliminar producto (ADMIN) - Soft delete
   */
  static async eliminarProducto(req, res) {
    try {
      const { id } = req.params;

      const producto = await db('productos').where('id', id).first();
      if (!producto) {
        return res.status(404).json({
          error: 'Producto no encontrado',
        });
      }

      // Soft delete
      await db('productos').where('id', id).update({
        deleted_at: new Date(),
      });

      // Emitir evento
      io.emit('producto:eliminado', { id });

      return res.json({
        success: true,
        mensaje: 'Producto eliminado exitosamente',
      });
    } catch (error) {
      console.error('❌ Error al eliminar producto:', error);
      return res.status(500).json({
        error: 'Error al eliminar producto',
      });
    }
  }

  /**
   * GET /api/v1/productos/combos/listar
   * Obtener combos disponibles
   */
  static async getCombos(req, res) {
    try {
      const { sedeId } = req.query;

      let query = db('combos')
        .select(
          'combos.id',
          'combos.nombre',
          'combos.descripcion',
          'combos.precio_venta',
          'combos.foto_url',
          'categorias.nombre as categoria_nombre'
        )
        .join('categorias', 'combos.categoria_id', 'categorias.id')
        .where('combos.activo', true)
        .andWhere('combos.deleted_at', null);

      if (sedeId) {
        query.andWhere((q) => {
          q.whereNull('combos.sede_id').orWhere('combos.sede_id', sedeId);
        });
      }

      const combos = await query;

      return res.json({
        success: true,
        data: combos,
        total: combos.length,
      });
    } catch (error) {
      console.error('❌ Error al obtener combos:', error);
      return res.status(500).json({
        error: 'Error al obtener combos',
      });
    }
  }
}

module.exports = ProductosController;
