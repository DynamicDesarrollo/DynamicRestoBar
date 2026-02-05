const db = require('../../config/database');

class InventarioController {
  // Obtener estado del inventario (dashboard)
  static async getDashboardInventario(req, res) {
    try {
      const { sedeId } = req.usuario;
      const sede = sedeId || 1;

      // Insumos en stock
      const insumos = await db('insumos')
        .select('*')
        .where('activo', true)
        .orderBy('stock_actual', 'asc');

      // Valor total del inventario
      const valorTotal = insumos.reduce((sum, i) => {
        return sum + (i.stock_actual * i.costo_unitario);
      }, 0);

      // Insumos bajo stock
      const bajoStock = insumos.filter(i => i.stock_actual <= i.stock_minimo);

      // Movimientos recientes
      const movimientosRecientes = await db('kardex_movimientos')
        .where('kardex_movimientos.sede_id', sede)
        .orderBy('kardex_movimientos.created_at', 'desc')
        .limit(10)
        .leftJoin('insumos', 'kardex_movimientos.insumo_id', 'insumos.id')
        .select(
          'kardex_movimientos.*',
          'insumos.nombre as insumo_nombre'
        );

      return res.json({
        success: true,
        data: {
          totalInsumos: insumos.length,
          valorTotal: parseFloat(valorTotal.toFixed(2)),
          bajoStock: bajoStock.length,
          insumos,
          movimientosRecientes,
        },
      });
    } catch (err) {
      console.error('❌ Error en getDashboardInventario:', err.message);
      return res.status(500).json({
        error: 'Error al obtener dashboard',
        message: err.message,
      });
    }
  }

  // Obtener todos los movimientos (Kardex)
  static async getKardex(req, res) {
    try {
      const { sedeId } = req.usuario;
      const { insumo_id, tipo, desde, hasta } = req.query;
      const sede = sedeId || 1;

      let query = db('kardex_movimientos')
        .where('sede_id', sede)
        .leftJoin('insumos', 'kardex_movimientos.insumo_id', 'insumos.id')
        .select(
          'kardex_movimientos.*',
          'insumos.nombre as insumo_nombre'
        );

      if (insumo_id) {
        query = query.where('kardex_movimientos.insumo_id', insumo_id);
      }

      if (tipo) {
        query = query.where('kardex_movimientos.tipo', tipo.toLowerCase());
      }

      if (desde) {
        query = query.where('kardex_movimientos.created_at', '>=', new Date(desde));
      }

      if (hasta) {
        query = query.where('kardex_movimientos.created_at', '<=', new Date(hasta));
      }

      const movimientos = await query.orderBy('kardex_movimientos.created_at', 'desc');

      return res.json({
        success: true,
        data: movimientos,
        total: movimientos.length,
      });
    } catch (err) {
      console.error('❌ Error en getKardex:', err.message);
      return res.status(500).json({
        error: 'Error al obtener kardex',
        message: err.message,
      });
    }
  }

  // Registrar entrada de insumos (compra)
  static async registrarEntrada(req, res) {
    try {
      const { sedeId } = req.usuario;
      const { insumo_id, cantidad, unidad_medida_id, costo_unitario, documento_id, referencia } = req.body;
      const sede = sedeId || 1;

      if (!insumo_id || !cantidad) {
        return res.status(400).json({
          error: 'Insumo y cantidad son requeridos',
        });
      }

      // Obtener insumo
      const insumo = await db('insumos').where('id', insumo_id).first();
      if (!insumo) {
        return res.status(404).json({ error: 'Insumo no encontrado' });
      }

      // Registrar movimiento
      await db('kardex_movimientos').insert({
        insumo_id,
        sede_id: sede,
        tipo: 'entrada',
        cantidad: parseFloat(cantidad),
        precio_unitario: parseFloat(costo_unitario) || insumo.costo_unitario,
        costo_total: parseFloat(cantidad) * (parseFloat(costo_unitario) || insumo.costo_unitario),
        referencia: referencia || null,
        observaciones: documento_id ? `Documento: ${documento_id}` : null,
        usuario_id: req.usuario.id,
      });

      // Actualizar stock del insumo
      const nuevoStock = insumo.stock_actual + parseFloat(cantidad);
      await db('insumos').where('id', insumo_id).update({
        stock_actual: nuevoStock,
        costo_promedio: parseFloat(costo_unitario) || insumo.costo_promedio,
        updated_at: new Date(),
      });

      console.log(`✅ Entrada registrada: +${cantidad} ${insumo.nombre}`);

      return res.json({
        success: true,
        message: 'Entrada registrada exitosamente',
        nuevoStock,
      });
    } catch (err) {
      console.error('❌ Error en registrarEntrada:', err.message);
      return res.status(500).json({
        error: 'Error al registrar entrada',
        message: err.message,
      });
    }
  }

  // Registrar salida manual de insumos
  static async registrarSalida(req, res) {
    try {
      const { sedeId } = req.usuario;
      const { insumo_id, cantidad, unidad_medida_id, motivo, referencia } = req.body;
      const sede = sedeId || 1;

      if (!insumo_id || !cantidad) {
        return res.status(400).json({
          error: 'Insumo y cantidad son requeridos',
        });
      }

      // Obtener insumo
      const insumo = await db('insumos').where('id', insumo_id).first();
      if (!insumo) {
        return res.status(404).json({ error: 'Insumo no encontrado' });
      }

      const cantidadNum = parseFloat(cantidad);
      if (insumo.stock_actual < cantidadNum) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          stockActual: insumo.stock_actual,
        });
      }

      // Registrar movimiento
      await db('kardex_movimientos').insert({
        insumo_id,
        sede_id: sede,
        tipo: 'salida',
        cantidad: cantidadNum,
        precio_unitario: insumo.costo_unitario,
        costo_total: cantidadNum * insumo.costo_unitario,
        referencia: referencia || null,
        observaciones: motivo || 'Salida manual',
        usuario_id: req.usuario.id,
      });

      // Actualizar stock
      const nuevoStock = insumo.stock_actual - cantidadNum;
      await db('insumos').where('id', insumo_id).update({
        stock_actual: nuevoStock,
        updated_at: new Date(),
      });

      console.log(`✅ Salida registrada: -${cantidad} ${insumo.nombre}`);

      return res.json({
        success: true,
        message: 'Salida registrada exitosamente',
        nuevoStock,
      });
    } catch (err) {
      console.error('❌ Error en registrarSalida:', err.message);
      return res.status(500).json({
        error: 'Error al registrar salida',
        message: err.message,
      });
    }
  }

  // Registrar ajuste (merma, rotura, etc)
  static async registrarAjuste(req, res) {
    try {
      const { sedeId } = req.usuario;
      const { insumo_id, cantidad, tipo_ajuste, motivo } = req.body;
      const sede = sedeId || 1;

      if (!insumo_id || !cantidad || !tipo_ajuste) {
        return res.status(400).json({
          error: 'Insumo, cantidad y tipo de ajuste son requeridos',
        });
      }

      // Tipos válidos: MERMA, ROTURA, AJUSTE, TRASLADO
      const tiposValidos = ['MERMA', 'ROTURA', 'AJUSTE', 'TRASLADO'];
      if (!tiposValidos.includes(tipo_ajuste)) {
        return res.status(400).json({
          error: `Tipo de ajuste debe ser: ${tiposValidos.join(', ')}`,
        });
      }

      // Obtener insumo
      const insumo = await db('insumos').where('id', insumo_id).first();
      if (!insumo) {
        return res.status(404).json({ error: 'Insumo no encontrado' });
      }

      const cantidadNum = parseFloat(cantidad);
      const nuevoStock = insumo.stock_actual - cantidadNum;

      if (nuevoStock < 0) {
        return res.status(400).json({
          error: 'Stock insuficiente para este ajuste',
          stockActual: insumo.stock_actual,
        });
      }

      // Registrar movimiento
      await db('kardex_movimientos').insert({
        insumo_id,
        sede_id: sede,
        tipo: 'ajuste',
        cantidad: cantidadNum,
        precio_unitario: insumo.costo_unitario,
        costo_total: cantidadNum * insumo.costo_unitario,
        usuario_id: req.usuario.id,
        observaciones: motivo || `${tipo_ajuste} de inventario`,
        referencia: tipo_ajuste,
      });

      // Actualizar stock
      await db('insumos').where('id', insumo_id).update({
        stock_actual: nuevoStock,
        updated_at: new Date(),
      });

      console.log(`✅ Ajuste registrado: ${tipo_ajuste} de -${cantidad} ${insumo.nombre}`);

      return res.json({
        success: true,
        message: `Ajuste de ${tipo_ajuste} registrado exitosamente`,
        nuevoStock,
      });
    } catch (err) {
      console.error('❌ Error en registrarAjuste:', err.message);
      return res.status(500).json({
        error: 'Error al registrar ajuste',
        message: err.message,
      });
    }
  }

  // Descontar insumos por venta (se llama cuando se crea una orden/venta)
  static async descontarInsumosPorVenta(req, res) {
    try {
      const { sedeId } = req.usuario;
      const { orden_id, items } = req.body; // items: [{ producto_id, cantidad }]
      const sede = sedeId || 1;

      if (!orden_id || !items || items.length === 0) {
        return res.status(400).json({
          error: 'Orden ID e items son requeridos',
        });
      }

      let totalDescuentos = 0;

      for (const item of items) {
        // Obtener receta del producto
        const receta = await db('recetas')
          .where('producto_id', item.producto_id)
          .where('activa', true)
          .first();

        if (!receta) {
          console.warn(`⚠️ Producto ${item.producto_id} no tiene receta definida`);
          continue;
        }

        // Obtener insumos de la receta
        const insumosReceta = await db('receta_insumos')
          .where('receta_id', receta.id);

        // Descontar cada insumo
        for (const insumoReceta of insumosReceta) {
          const cantidadADescontar = insumoReceta.cantidad * item.cantidad;
          const insumo = await db('insumos').where('id', insumoReceta.insumo_id).first();

          if (!insumo) continue;

          const nuevoStock = insumo.stock_actual - cantidadADescontar;

          if (nuevoStock < 0) {
            console.warn(`⚠️ Stock insuficiente: ${insumo.nombre} (requerido: ${cantidadADescontar}, disponible: ${insumo.stock_actual})`);
            // No bloqueamos la venta, solo advertencia
          }

          // Registrar movimiento
          await db('kardex_movimientos').insert({
            insumo_id: insumoReceta.insumo_id,
            sede_id: sede,
            tipo_movimiento: 'SALIDA',
            cantidad: cantidadADescontar,
            unidad_medida_id: insumoReceta.unidad_medida_id,
            costo_unitario: insumo.costo_unitario,
            costo_total: cantidadADescontar * insumo.costo_unitario,
            documento_id: orden_id,
            referencia: `Venta orden ${orden_id}`,
            usuario_id: req.usuario.id,
          });

          // Actualizar stock
          await db('insumos').where('id', insumoReceta.insumo_id).update({
            stock_actual: Math.max(0, nuevoStock),
            updated_at: new Date(),
          });

          totalDescuentos += cantidadADescontar * insumo.costo_unitario;
        }
      }

      console.log(`✅ Insumos descontados por venta ${orden_id}: $${totalDescuentos}`);

      return res.json({
        success: true,
        message: 'Insumos descontados exitosamente',
        totalCostoProduccion: parseFloat(totalDescuentos.toFixed(2)),
      });
    } catch (err) {
      console.error('❌ Error en descontarInsumosPorVenta:', err.message);
      return res.status(500).json({
        error: 'Error al descontar insumos',
        message: err.message,
      });
    }
  }

  // Obtener historial de movimientos de un insumo
  static async getHistorialInsumo(req, res) {
    try {
      const { insumo_id } = req.params;
      const { sedeId } = req.usuario;
      const sede = sedeId || 1;

      const movimientos = await db('kardex_movimientos')
        .where('insumo_id', insumo_id)
        .where('sede_id', sede)
        .orderBy('timestamp', 'desc')
        .leftJoin('usuarios', 'kardex_movimientos.usuario_id', 'usuarios.id')
        .select(
          'kardex_movimientos.*',
          'usuarios.nombre as usuario_nombre'
        );

      return res.json({
        success: true,
        data: movimientos,
      });
    } catch (err) {
      console.error('❌ Error en getHistorialInsumo:', err.message);
      return res.status(500).json({
        error: 'Error al obtener historial',
        message: err.message,
      });
    }
  }
}

module.exports = InventarioController;
