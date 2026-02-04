const db = require('../../config/database');

class InformesController {
  // Reporte de ventas diarias
  static async getReporteVentas(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;
      const { fecha_inicio, fecha_fin } = req.query;

      let query = db('ordenes')
        .where('ordenes.sede_id', sede_id)
        .where('ordenes.estado', 'entregada');

      if (fecha_inicio) {
        query = query.where(db.raw('DATE(ordenes.created_at)'), '>=', fecha_inicio);
      }

      if (fecha_fin) {
        query = query.where(db.raw('DATE(ordenes.created_at)'), '<=', fecha_fin);
      }

      const ventasData = await query
        .select(
          db.raw('DATE(ordenes.created_at) as fecha'),
          db.raw('COUNT(DISTINCT ordenes.id) as cantidad_ordenes'),
          db.raw('SUM(ordenes.total) as total_ventas'),
          db.raw('COUNT(DISTINCT ordenes.mesa_id) as mesas_atendidas'),
        )
        .groupBy(db.raw('DATE(ordenes.created_at)'))
        .orderBy('fecha', 'desc');

      return res.json({
        success: true,
        data: ventasData,
      });
    } catch (err) {
      console.error('❌ Error en getReporteVentas:', err.message);
      return res.status(500).json({
        error: 'Error al obtener reporte de ventas',
        message: err.message,
      });
    }
  }

  // Reporte de productos más vendidos
  static async getReporteProductos(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;
      const { fecha_inicio, fecha_fin, limite = 10 } = req.query;

      let query = db('orden_items')
        .leftJoin('ordenes', 'orden_items.orden_id', 'ordenes.id')
        .leftJoin('productos', 'orden_items.producto_id', 'productos.id')
        .where('ordenes.sede_id', sede_id)
        .where('ordenes.estado', 'entregada');

      if (fecha_inicio) {
        query = query.where(db.raw('DATE(ordenes.created_at)'), '>=', fecha_inicio);
      }

      if (fecha_fin) {
        query = query.where(db.raw('DATE(ordenes.created_at)'), '<=', fecha_fin);
      }

      const productosData = await query
        .select(
          'productos.id',
          'productos.nombre',
          db.raw('SUM(orden_items.cantidad) as cantidad_vendida'),
          db.raw('SUM(orden_items.subtotal) as ingresos'),
          db.raw('AVG(productos.precio_venta) as precio_promedio'),
        )
        .groupBy('productos.id', 'productos.nombre')
        .orderBy(db.raw('SUM(orden_items.cantidad)'), 'desc')
        .limit(parseInt(limite));

      return res.json({
        success: true,
        data: productosData,
      });
    } catch (err) {
      console.error('❌ Error en getReporteProductos:', err.message);
      return res.status(500).json({
        error: 'Error al obtener reporte de productos',
        message: err.message,
      });
    }
  }

  // Reporte de inventario
  static async getReporteInventario(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;

      const inventarioData = await db('insumos')
        .where('sede_id', sede_id)
        .select(
          'id',
          'nombre',
          'unidad_medida',
          'stock_actual',
          'stock_minimo',
          'precio_unitario',
          db.raw('(stock_actual * precio_unitario) as valor_total'),
          db.raw('CASE WHEN stock_actual <= stock_minimo THEN true ELSE false END as requiere_compra'),
        )
        .orderBy('nombre', 'asc');

      // Calcular totales
      const totales = await db('insumos')
        .where('sede_id', sede_id)
        .select(
          db.raw('SUM(stock_actual * precio_unitario) as valor_total_inventario'),
          db.raw('COUNT(*) as total_insumos'),
          db.raw('SUM(CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END) as insumos_bajo_stock'),
        )
        .first();

      return res.json({
        success: true,
        data: {
          insumos: inventarioData,
          resumen: totales,
        },
      });
    } catch (err) {
      console.error('❌ Error en getReporteInventario:', err.message);
      return res.status(500).json({
        error: 'Error al obtener reporte de inventario',
        message: err.message,
      });
    }
  }

  // Reporte de caja
  static async getReporteCaja(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;
      const { fecha } = req.query;


      // Buscar primero apertura abierta
      let apertura = await db('aperturas_caja')
        .where('sede_id', sede_id)
        .where('estado', 'abierta')
        .orderBy('created_at', 'desc')
        .first();

      // Si no hay abierta, mostrar la más reciente
      if (!apertura) {
        apertura = await db('aperturas_caja')
          .where('sede_id', sede_id)
          .orderBy('created_at', 'desc')
          .first();
      }

      if (!apertura) {
        return res.json({
          success: true,
          data: null,
          message: 'No hay apertura de caja para la fecha especificada',
        });
      }

      // Obtener movimientos
      const movimientos = await db('caja_movimientos')
        .where('apertura_caja_id', apertura.id)
        .select('*')
        .orderBy('created_at', 'desc');

      // Calcular totales
      const ingresos = movimientos
        .filter(m => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + parseFloat(m.monto), 0);

      const egresos = movimientos
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + parseFloat(m.monto), 0);

      const cierre = await db('cierres_caja')
        .where('apertura_caja_id', apertura.id)
        .first();

      return res.json({
        success: true,
        data: {
          apertura,
          movimientos,
          resumen: {
            monto_inicial: parseFloat(apertura.monto_inicial),
            ingresos: ingresos,
            egresos: egresos,
            total_en_caja: parseFloat(apertura.monto_inicial) + ingresos - egresos,
            diferencia: cierre?.diferencia || null,
            estado_cierre: cierre?.estado || null,
          },
        },
      });
    } catch (err) {
      console.error('❌ Error en getReporteCaja:', err.message);
      return res.status(500).json({
        error: 'Error al obtener reporte de caja',
        message: err.message,
      });
    }
  }

  // Reporte de métodos de pago
  static async getReporteMetodosPago(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;
      const { fecha_inicio, fecha_fin } = req.query;

      let query = db('pago_facturas')
        .leftJoin('metodos_pago', 'pago_facturas.metodo_pago_id', 'metodos_pago.id')
        .leftJoin('facturas', 'pago_facturas.factura_id', 'facturas.id')
        .where('facturas.sede_id', sede_id);

      if (fecha_inicio) {
        query = query.where(db.raw('DATE(pago_facturas.created_at)'), '>=', fecha_inicio);
      }

      if (fecha_fin) {
        query = query.where(db.raw('DATE(pago_facturas.created_at)'), '<=', fecha_fin);
      }

      const pagosData = await query
        .select(
          'metodos_pago.nombre',
          db.raw('COUNT(pago_facturas.id) as cantidad_transacciones'),
          db.raw('SUM(pago_facturas.monto) as total_recaudado'),
          db.raw('AVG(pago_facturas.monto) as monto_promedio'),
        )
        .groupBy('metodos_pago.nombre')
        .orderBy(db.raw('SUM(pago_facturas.monto)'), 'desc');

      return res.json({
        success: true,
        data: pagosData,
      });
    } catch (err) {
      console.error('❌ Error en getReporteMetodosPago:', err.message);
      return res.status(500).json({
        error: 'Error al obtener reporte de métodos de pago',
        message: err.message,
      });
    }
  }

  // Estadísticas generales
  static async getEstadisticas(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;
      const { rango } = req.query;
      let filtroFecha;
      if (rango === '30') {
        filtroFecha = db.raw("DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'");
      } else {
        filtroFecha = db.raw('DATE(created_at) = CURRENT_DATE');
      }

      // Ventas
      const ventas = await db('ordenes')
        .where('sede_id', sede_id)
        .where('estado', 'entregada')
        .where(filtroFecha)
        .sum('total as total');

      // Órdenes
      const ordenes = await db('ordenes')
        .where('sede_id', sede_id)
        .where(filtroFecha)
        .count('* as total');

      // Mesas activas
      const mesasActivas = await db('mesas')
        .where('sede_id', sede_id)
        .where('estado', 'ocupada')
        .count('* as total');

      // Insumos bajo stock
      const insumosBajoStock = await db('insumos')
        .where('sede_id', sede_id)
        .where(db.raw('stock_actual <= stock_minimo'))
        .count('* as total');

      // Ticket promedio
      const ticketPromedio = await db('ordenes')
        .where('sede_id', sede_id)
        .where('estado', 'entregada')
        .where(filtroFecha)
        .avg('total as promedio');

      return res.json({
        success: true,
        data: {
          ventas_hoy: parseFloat(ventas[0]?.total || 0),
          ordenes_hoy: parseInt(ordenes[0]?.total || 0),
          mesas_activas: parseInt(mesasActivas[0]?.total || 0),
          insumos_bajo_stock: parseInt(insumosBajoStock[0]?.total || 0),
          ticket_promedio: parseFloat(ticketPromedio[0]?.promedio || 0),
        },
      });
    } catch (err) {
      console.error('❌ Error en getEstadisticas:', err.message);
      return res.status(500).json({
        error: 'Error al obtener estadísticas',
        message: err.message,
      });
    }
  }

  // Reporte de impacto de ventas en inventario
  static async getImpactoVentasInventario(req, res) {
    try {
      const { sedeId: sede_id } = req.usuario;
      const { fecha_inicio, fecha_fin } = req.query;

      // Obtener productos vendidos con sus cantidades
      let query = db('orden_items')
        .leftJoin('ordenes', 'orden_items.orden_id', 'ordenes.id')
        .leftJoin('productos', 'orden_items.producto_id', 'productos.id')
        .where('ordenes.sede_id', sede_id)
        .where('ordenes.estado', 'entregada');

      if (fecha_inicio) {
        query = query.where(db.raw('DATE(ordenes.created_at)'), '>=', fecha_inicio);
      }

      if (fecha_fin) {
        query = query.where(db.raw('DATE(ordenes.created_at)'), '<=', fecha_fin);
      }

      const productosVendidos = await query
        .select(
          'productos.id as producto_id',
          'productos.nombre as producto_nombre',
          db.raw('SUM(orden_items.cantidad) as cantidad_vendida')
        )
        .groupBy('productos.id', 'productos.nombre')
        .orderBy(db.raw('SUM(orden_items.cantidad)'), 'desc');

      // Para cada producto, calcular el impacto en insumos
      const impactoInventario = [];

      for (const producto of productosVendidos) {
        // Obtener la receta del producto
        const receta = await db('recetas')
          .where('producto_id', producto.producto_id)
          .first();

        if (receta) {
          // Obtener insumos de la receta
          const insumosReceta = await db('receta_insumos')
            .leftJoin('insumos', 'receta_insumos.insumo_id', 'insumos.id')
            .leftJoin('unidad_medida', 'insumos.unidad_medida_id', 'unidad_medida.id')
            .where('receta_insumos.receta_id', receta.id)
            .select(
              'insumos.id as insumo_id',
              'insumos.nombre as insumo_nombre',
              'insumos.stock_actual',
              'insumos.stock_minimo',
              'unidad_medida.nombre as unidad_medida',
              'receta_insumos.cantidad as cantidad_por_unidad'
            );

          for (const insumo of insumosReceta) {
            const consumoTotal = parseFloat(insumo.cantidad_por_unidad) * parseFloat(producto.cantidad_vendida);
            const stockRestante = parseFloat(insumo.stock_actual);
            const stockAntes = stockRestante + consumoTotal;
            const porcentajeConsumo = stockAntes > 0
              ? ((consumoTotal / stockAntes) * 100).toFixed(2)
              : 0;

            impactoInventario.push({
              producto_nombre: producto.producto_nombre,
              producto_vendido: producto.cantidad_vendida,
              insumo_nombre: insumo.insumo_nombre,
              cantidad_por_unidad: parseFloat(insumo.cantidad_por_unidad).toFixed(2),
              consumo_total: consumoTotal.toFixed(2),
              stock_antes: stockAntes.toFixed(2),
              stock_actual: stockRestante.toFixed(2),
              stock_minimo: insumo.stock_minimo,
              unidad_medida: insumo.unidad_medida,
              porcentaje_consumo: porcentajeConsumo,
              alerta_bajo_stock: stockRestante <= insumo.stock_minimo,
            });
          }
        }
      }

      // Agrupar por insumo para resumen
      const resumenPorInsumo = {};
      impactoInventario.forEach(item => {
        if (!resumenPorInsumo[item.insumo_nombre]) {
          resumenPorInsumo[item.insumo_nombre] = {
            insumo: item.insumo_nombre,
            consumo_total: 0,
            stock_actual: item.stock_actual,
            stock_minimo: item.stock_minimo,
            unidad_medida: item.unidad_medida,
            productos_relacionados: [],
            alerta: item.alerta_bajo_stock,
          };
        }
        resumenPorInsumo[item.insumo_nombre].consumo_total += parseFloat(item.consumo_total);
        resumenPorInsumo[item.insumo_nombre].productos_relacionados.push({
          producto: item.producto_nombre,
          vendidos: item.producto_vendido,
          consumo: item.consumo_total,
        });
      });

      return res.json({
        success: true,
        data: {
          detalle: impactoInventario,
          resumen: Object.values(resumenPorInsumo),
        },
      });
    } catch (err) {
      console.error('❌ Error en getImpactoVentasInventario:', err.message);
      return res.status(500).json({
        error: 'Error al obtener impacto de ventas en inventario',
        message: err.message,
      });
    }
  }
}

module.exports = InformesController;
