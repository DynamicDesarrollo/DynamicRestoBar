/**
 * OrdenesController
 * 
 * Controlador para gestión de órdenes:
 * - Crear nueva orden
 * - Obtener orden por ID
 * - Listar órdenes por mesa
 * - Actualizar estado de orden
 * - Eliminar orden
 */

const db = require('../config/database');

class OrdenesController {
  /**
   * POST /ordenes
   * Crear nueva orden
   * Cuerpo: {
   *   mesa_id, usuario_id, sede_id,
   *   items: [{ producto_id, cantidad, precio_unitario, modificadores, observaciones }],
   *   total
   * }
   */
  static async crear(req, res) {
    try {
      const { mesa_id, usuario_id, sede_id, items, total } = req.body;

      console.log(`\n📋 CREAR ORDEN - Mesa: ${mesa_id}, Items: ${items.length}, Total: ${total}`);
      items.forEach((it, i) => console.log(`  ${i+1}. Producto ${it.producto_id} x${it.cantidad}`));

      // Validar datos
      if (!mesa_id || !usuario_id || !sede_id || !items || items.length === 0) {
        return res.status(400).json({
          error: 'Datos incompletos. Se requiere: mesa_id, usuario_id, sede_id, items',
        });
      }

      // Obtener mesa
      const mesa = await db('mesas').where('id', mesa_id).first();
      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }

      // Obtener usuario
      const usuario = await db('usuarios').where('id', usuario_id).first();

      // Buscar si existe orden abierta en esta mesa
      const ordenExistente = await db('ordenes')
        .where('mesa_id', mesa_id)
        .where('estado', 'abierta')
        .first();

      console.log(`🔍 Buscando orden abierta para mesa ${mesa_id}:`, ordenExistente ? `ID ${ordenExistente.id}` : 'No encontrada');

      let ordenId;
      let comandaId;
      let esOrdenNueva = false;

      if (ordenExistente) {
        // Orden ya existe en la mesa, agregar items
        ordenId = ordenExistente.id;
        console.log(`📦 Orden existente encontrada: ${ordenId}`);

        // Obtener comanda existente (debería haber una por orden abierta)
        const comandaExistente = await db('comandas')
          .where('orden_id', ordenId)
          .whereNot('estado', 'entregada')
          .first();

        if (!comandaExistente) {
          console.log(`⚠️  No hay comanda abierta para orden ${ordenId}, creando nueva comanda`);
          // Crear nueva comanda si todas están entregadas
          
          // Obtener la primera estación disponible
          const estacionDisponible = await db('estaciones').first('id');
          if (!estacionDisponible) {
            console.error('❌ No hay estaciones disponibles');
            return res.status(400).json({
              error: 'No hay estaciones configuradas en el sistema'
            });
          }
          
          const numeroComanda = `CMD-${Date.now()}`;
          const comandaResult = await db('comandas').insert({
            numero_comanda: numeroComanda,
            orden_id: ordenId,
            estacion_id: estacionDisponible.id,
            estado: 'pendiente',
            tiempo_preparacion_estimado: 15,
            created_at: new Date(),
            updated_at: new Date(),
          }).returning('id');
          comandaId = Array.isArray(comandaResult) ? comandaResult[0].id : comandaResult.id;
          console.log(`✅ Nueva comanda creada: ${comandaId}`);
        } else {
          comandaId = comandaExistente.id;
          console.log(`✅ Comanda existente: ${comandaId}`);
        }
      } else {
        // Crear nueva orden
        esOrdenNueva = true;
        const numeroOrden = `ORD-${Date.now()}-${Math.floor(Math.random() * 100)}`;
        const ordenResult = await db('ordenes').insert({
          numero_orden: numeroOrden,
          mesa_id,
          usuario_id,
          sede_id,
          canal_id: 1,
          estado: 'abierta',
          total,
          created_at: new Date(),
          updated_at: new Date(),
        }).returning('id');
        ordenId = Array.isArray(ordenResult) ? ordenResult[0].id : ordenResult.id;

        // Determinar estación basada en los productos
        let estacionId;
        
        // Buscar estación del primer producto
        if (items && items.length > 0) {
          const primerProducto = await db('productos')
            .where('id', items[0].producto_id)
            .first();
          
          if (primerProducto && primerProducto.estacion_id) {
            estacionId = primerProducto.estacion_id;
            console.log(`🏪 Estación obtenida del producto: ${estacionId}`);
          }
        }
        
        // Si no hay estación asignada, usar la primera disponible
        if (!estacionId) {
          const estacionDisponible = await db('estaciones')
            .where('sede_id', sede_id)
            .where('activa', true)
            .first();
          
          if (!estacionDisponible) {
            console.error('❌ No hay estaciones disponibles');
            return res.status(400).json({
              error: 'No hay estaciones configuradas en el sistema'
            });
          }
          estacionId = estacionDisponible.id;
          console.log(`🏪 Estación por defecto: ${estacionId}`);
        }

        // Crear nueva comanda
        const numeroComanda = `CMD-${Date.now()}`;
        const comandaResult = await db('comandas').insert({
          numero_comanda: numeroComanda,
          orden_id: ordenId,
          estacion_id: estacionId,
          estado: 'pendiente',
          tiempo_preparacion_estimado: 15,
          created_at: new Date(),
          updated_at: new Date(),
        }).returning('id');
        comandaId = Array.isArray(comandaResult) ? comandaResult[0].id : comandaResult.id;

        // Actualizar estado de mesa a ocupada
        try {
          const updateResult = await db('mesas').where('id', mesa_id).update({
            estado: 'ocupada',
            updated_at: new Date(),
          });
          console.log(`✅ Mesa ${mesa_id} actualizada a 'ocupada' (${updateResult} registro/s afectado/s)`);
        } catch (err) {
          console.error(`❌ Error al actualizar mesa ${mesa_id}:`, err.message);
        }
      }

      // Agregar items (igual para orden nueva o existente)
      for (const item of items) {
        console.log(`📦 Procesando item: ${item.producto_id}, Orden: ${ordenId}, Cantidad solicitada: ${item.cantidad}`);
        
        let itemId;
        
        // Si la orden ya existe, verificar si este producto_id ya está en ella
        if (!esOrdenNueva) {
          const itemExistente = await db('orden_items')
            .where('orden_id', ordenId)
            .where('producto_id', item.producto_id)
            .first();

          if (itemExistente) {
            // Item existe - ACTUALIZAR cantidad si es diferente
            if (itemExistente.cantidad !== item.cantidad) {
              console.log(`🔄 Actualizando cantidad del item ${item.producto_id}: ${itemExistente.cantidad} → ${item.cantidad}`);
              const subtotalNuevo = item.cantidad * item.precio_unitario;
              const diferenciaTotalItem = subtotalNuevo - itemExistente.subtotal;
              
              await db('orden_items').where('id', itemExistente.id).update({
                cantidad: item.cantidad,
                subtotal: subtotalNuevo,
                updated_at: new Date(),
              });
              
              // Actualizar total de la orden
              const nuevaOrdenTotal = ordenExistente.total + diferenciaTotalItem;
              await db('ordenes').where('id', ordenId).update({
                total: nuevaOrdenTotal,
                updated_at: new Date(),
              });
              
              console.log(`✅ Item ${item.producto_id} actualizado. Nuevo total orden: ${nuevaOrdenTotal}`);
            } else {
              console.log(`⏭️  Item ${item.producto_id} ya existe con misma cantidad, sin cambios`);
            }
            continue; // No procesar más para este item existente
          }
        }

        console.log(`✨ Creando nuevo orden_item para producto ${item.producto_id}`);
        // Crear nuevo orden_item
        const itemResult = await db('orden_items').insert({
          orden_id: ordenId,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.cantidad * item.precio_unitario,
          notas_especiales: item.observaciones || null,
          estado: 'pendiente',
          created_at: new Date(),
          updated_at: new Date(),
        }).returning('id');
        itemId = Array.isArray(itemResult) ? itemResult[0].id : itemResult.id;
        console.log(`✅ Orden_item creado con ID: ${itemId}`);

        // Guardar modificadores si existen
        if (item.modificadores && Array.isArray(item.modificadores) && item.modificadores.length > 0) {
          const modificadoresData = item.modificadores.map((mod) => ({
            orden_item_id: itemId,
            modificador_opcion_id: mod.id,
            precio_adicional: mod.precio_adicional || 0,
            created_at: new Date(),
            updated_at: new Date(),
          }));
          await db('orden_item_modificador').insert(modificadoresData);
        }

        // Crear comanda_item para este orden_item
        const notasCompletas = [
          item.observaciones || null,
          item.modificadores && item.modificadores.length > 0
            ? `Modificadores: ${item.modificadores.map((m) => m.nombre).join(', ')}`
            : null,
        ]
          .filter(Boolean)
          .join(' | ');

        await db('comanda_items').insert({
          comanda_id: comandaId,
          orden_item_id: itemId,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          notas_especiales: notasCompletas || null,
          estado: 'pendiente',
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // Recalcular el total de la orden basado en todos los orden_items actuales
      const totalCalculado = await db('orden_items')
        .where('orden_id', ordenId)
        .sum('subtotal as total')
        .first();

      const nuevoTotal = totalCalculado.total || 0;
      
      if (nuevoTotal !== (await db('ordenes').where('id', ordenId).pluck('total')[0])) {
        console.log(`📊 Recalculando total de orden ${ordenId}: ${nuevoTotal}`);
        await db('ordenes').where('id', ordenId).update({
          total: nuevoTotal,
          updated_at: new Date(),
        });
      }

      return res.json({
        success: true,
        message: esOrdenNueva ? 'Orden creada exitosamente' : 'Items agregados a la orden existente',
        data: {
          orden_id: ordenId,
          comanda_id: comandaId,
          es_nueva: esOrdenNueva,
          total: nuevoTotal,
          items_count: items.length,
        },
      });
    } catch (err) {
      console.error('❌ Error al crear orden:', err.message);
      return res.status(500).json({
        error: 'Error al crear orden',
        message: err.message,
      });
    }
  }

  /**
   * GET /ordenes/:id
   * Obtener orden completa con detalles
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const orden = await db('ordenes')
        .select('*')
        .where('id', id)
        .first();

      if (!orden) {
        return res.status(404).json({
          error: 'Orden no encontrada',
        });
      }

      // Obtener detalles
      const detalles = await db('orden_detalles')
        .select('*')
        .where('orden_id', id);

      return res.json({
        success: true,
        data: {
          ...orden,
          detalles,
        },
      });
    } catch (err) {
      console.error('❌ Error en getOrdenById:', err.message);
      return res.status(500).json({
        error: 'Error al obtener orden',
        message: err.message,
      });
    }
  }

  /**
   * GET /ordenes/mesa/:mesaId
   * Obtener órdenes abiertas de una mesa
   */
  static async getByMesa(req, res) {
    try {
      const { mesaId } = req.params;

      const ordenes = await db('ordenes')
        .select('*')
        .where('mesa_id', mesaId)
        .where('estado', 'abierta')
        .orderBy('created_at', 'desc');

      // Obtener items para cada orden con sus modificadores
      const ordenesConItems = await Promise.all(
        ordenes.map(async (orden) => {
          const items = await db('orden_items')
            .select('*')
            .where('orden_id', orden.id);

          // Obtener modificadores para cada item
          const itemsConModificadores = await Promise.all(
            items.map(async (item) => {
              const modificadores = await db('orden_item_modificador')
                .select('orden_item_modificador.*', 'modificador_opciones.nombre')
                .join(
                  'modificador_opciones',
                  'orden_item_modificador.modificador_opcion_id',
                  '=',
                  'modificador_opciones.id'
                )
                .where('orden_item_modificador.orden_item_id', item.id);

              return { ...item, modificadores };
            })
          );

          return { ...orden, items: itemsConModificadores };
        })
      );

      return res.json({
        success: true,
        data: ordenesConItems,
        total: ordenesConItems.length,
      });
    } catch (err) {
      console.error('❌ Error en getOrdenesByMesa:', err.message);
      return res.status(500).json({
        error: 'Error al obtener órdenes de mesa',
        message: err.message,
      });
    }
  }

  /**
   * GET /ordenes/estado/abierta
   * Obtener todas las órdenes abiertas
   */
  static async getPendientes(req, res) {
    try {
      const ordenes = await db('ordenes')
        .select(
          'ordenes.*',
          'mesas.numero as mesa_numero',
          db.raw(`COALESCE(
            (SELECT SUM(pf.monto) 
             FROM pago_facturas pf 
             INNER JOIN facturas f ON pf.factura_id = f.id 
             WHERE f.orden_id = ordenes.id), 
            0) as monto_pagado`)
        )
        .leftJoin('mesas', 'ordenes.mesa_id', '=', 'mesas.id')
        .whereIn('ordenes.estado', ['abierta', 'lista'])
        .orderBy('ordenes.created_at', 'desc');

      return res.json({
        success: true,
        data: ordenes,
        total: ordenes.length,
      });
    } catch (err) {
      console.error('❌ Error en getPendientes:', err.message);
      return res.status(500).json({
        error: 'Error al obtener órdenes pendientes',
        message: err.message,
      });
    }
  }

  /**
   * PATCH /ordenes/:id/estado
   * Actualizar estado de orden
   * Cuerpo: { estado: 'abierta'|'cerrada'|'pagada'|'cancelada' }
   */
  static async updateEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const estadosValidos = ['abierta', 'cerrada', 'pagada', 'cancelada'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`,
        });
      }

      const orden = await db('ordenes').where('id', id).first();

      if (!orden) {
        return res.status(404).json({
          error: 'Orden no encontrada',
        });
      }

      await db('ordenes')
        .where('id', id)
        .update({
          estado,
          updated_at: new Date(),
        });

      return res.json({
        success: true,
        message: `Orden actualizada a estado: ${estado}`,
      });
    } catch (err) {
      console.error('❌ Error en updateEstadoOrden:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar orden',
        message: err.message,
      });
    }
  }

  /**
   * DELETE /ordenes/:id
   * Cancelar orden
   */
  static async cancelar(req, res) {
    const trx = await db.transaction();

    try {
      const { id } = req.params;

      const orden = await trx('ordenes').where('id', id).first();

      if (!orden) {
        await trx.rollback();
        return res.status(404).json({
          error: 'Orden no encontrada',
        });
      }

      // Actualizar estado de orden
      await trx('ordenes')
        .where('id', id)
        .update({
          estado: 'cancelada',
          updated_at: new Date(),
        });

      // Actualizar comanda
      await trx('comandas')
        .where('orden_id', id)
        .update({
          estado: 'cancelada',
          updated_at: new Date(),
        });

      // Cambiar mesa a disponible
      await trx('mesas')
        .where('id', orden.mesa_id)
        .update({
          estado: 'disponible',
          updated_at: new Date(),
        });

      await trx.commit();

      return res.json({
        success: true,
        message: 'Orden cancelada exitosamente',
      });
    } catch (err) {
      await trx.rollback();
      console.error('❌ Error al cancelar orden:', err.message);
      return res.status(500).json({
        error: 'Error al cancelar orden',
        message: err.message,
      });
    }
  }

  /**
   * GET /ordenes/sede/:sedeId
   * Obtener todas las órdenes abiertas de una sede
   */
  static async getBySedeAbiertas(req, res) {
    try {
      const { sedeId } = req.params;

      const ordenes = await db('ordenes')
        .select(
          'ordenes.*',
          'mesas.numero as mesa_numero',
          'usuarios.nombre as usuario_nombre'
        )
        .leftJoin('mesas', 'ordenes.mesa_id', 'mesas.id')
        .leftJoin('usuarios', 'ordenes.usuario_id', 'usuarios.id')
        .where('ordenes.sede_id', sedeId)
        .where('ordenes.estado', 'abierta')
        .orderBy('ordenes.created_at', 'desc');

      return res.json({
        success: true,
        data: ordenes,
        total: ordenes.length,
      });
    } catch (err) {
      console.error('❌ Error en getOrdenesBySedeAbiertas:', err.message);
      return res.status(500).json({
        error: 'Error al obtener órdenes',
        message: err.message,
      });
    }
  }
}

module.exports = OrdenesController;
