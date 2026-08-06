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
const PrintDispatchService = require('../services/PrintDispatchService');

class OrdenesController {
  static async obtenerEstacionPorProducto(productoId, sedeId) {
    const producto = await db('productos as p')
      .leftJoin('estaciones as e', 'p.estacion_id', 'e.id')
      .leftJoin('categorias as c', 'p.categoria_id', 'c.id')
      .select(
        'p.id as producto_id',
        'p.nombre as producto_nombre',
        'p.estacion_id',
        'c.nombre as categoria_nombre',
        'e.nombre as estacion_nombre',
        'e.tipo as estacion_tipo'
      )
      .where('p.id', productoId)
      .first();

    if (!producto) {
      return null;
    }

    if (producto.estacion_id) {
      return producto;
    }

    const contextoProducto = `${producto.producto_nombre || ''} ${producto.categoria_nombre || ''}`.toLowerCase();
    const preferirBar = ['bar', 'bebida', 'coctel', 'licor', 'cafeteria', 'cafe', 'jugo', 'gaseosa']
      .some((tag) => contextoProducto.includes(tag));
    const tipoEstacionPreferida = preferirBar ? 'bar' : (producto.estacion_tipo || 'cocina');

    const estacionFallback = await db('estaciones')
      .where('sede_id', sedeId)
      .where('activa', true)
      .andWhere(function() {
        this.where('tipo', tipoEstacionPreferida);
      })
      .first();

    if (estacionFallback) {
      return {
        ...producto,
        estacion_id: estacionFallback.id,
        estacion_nombre: estacionFallback.nombre,
        estacion_tipo: estacionFallback.tipo,
      };
    }

    const estacionGenerica = await db('estaciones')
      .where('sede_id', sedeId)
      .where('activa', true)
      .first();

    if (!estacionGenerica) {
      return null;
    }

    return {
      ...producto,
      estacion_id: estacionGenerica.id,
      estacion_nombre: estacionGenerica.nombre,
      estacion_tipo: estacionGenerica.tipo,
    };
  }

  static async obtenerOCrearComanda({ ordenId, estacionId, numeroOrden, tiempoPreparacion = 15 }) {
    let comanda = await db('comandas')
      .where('orden_id', ordenId)
      .where('estacion_id', estacionId)
      .whereNot('estado', 'entregada')
      .first();

    if (comanda) {
      return comanda;
    }

    const numeroComanda = `CMD-${Date.now()}-${estacionId}`;
    const comandaResult = await db('comandas').insert({
      numero_comanda: numeroComanda,
      orden_id: ordenId,
      estacion_id: estacionId,
      estado: 'pendiente',
      tiempo_preparacion_estimado: tiempoPreparacion,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('*');

    comanda = Array.isArray(comandaResult) ? comandaResult[0] : comandaResult;
    console.log(`✅ Comanda creada para orden ${numeroOrden}: ${comanda.numero_comanda} (estación ${estacionId})`);
    return comanda;
  }

  static async obtenerImpresorasPorEstacion(sedeId, estacionId) {
    const impresorasRelacionadas = await db('impresoras as i')
      .select('i.id', 'i.nombre', 'i.ip_address', 'i.puerto')
      .join('sede_estacion_impresora as sei', 'sei.impresora_id', 'i.id')
      .where('sei.sede_id', sedeId)
      .where('sei.estacion_id', estacionId)
      .where('i.estado', 'activa')
      .whereNull('i.deleted_at');

    if (impresorasRelacionadas.length > 0) {
      return impresorasRelacionadas;
    }

    const estacion = await db('estaciones').where('id', estacionId).first();
    const nombreEstacion = (estacion?.nombre || '').toLowerCase();
    const tipoEstacion = (estacion?.tipo || '').toLowerCase();
    const contextoEstacion = `${nombreEstacion} ${tipoEstacion}`.trim();

    const fallbackQuery = db('impresoras as i')
      .select('i.id', 'i.nombre', 'i.ip_address', 'i.puerto')
      .where('i.sede_id', sedeId)
      .where('i.estado', 'activa')
      .whereNull('i.deleted_at');

    if (contextoEstacion.includes('cocina')) {
      fallbackQuery.andWhere(function() {
        this.whereRaw('LOWER(i.nombre) like ?', ['%cocina%'])
          .orWhereRaw('LOWER(i.modelo) like ?', ['%cocina%']);
      });
      const impresorasFallback = await fallbackQuery.orderBy('i.id', 'asc');
      if (impresorasFallback.length > 0) {
        return impresorasFallback;
      }
    }

    const esEstacionCocina = ['cocina', 'parrilla', 'plancha', 'freidora']
      .some((tag) => contextoEstacion.includes(tag));

    if (esEstacionCocina) {
      return db('impresoras as i')
        .select('i.id', 'i.nombre', 'i.ip_address', 'i.puerto')
        .where('i.sede_id', sedeId)
        .where('i.estado', 'activa')
        .whereNull('i.deleted_at')
        .where(function() {
          this.whereRaw('LOWER(i.nombre) like ?', ['%cocina%'])
            .orWhereRaw('LOWER(i.modelo) like ?', ['%cocina%'])
            .orWhereRaw('LOWER(i.nombre) like ?', ['%kitchen%'])
            .orWhereRaw('LOWER(i.modelo) like ?', ['%kitchen%']);
        })
        .orderBy('i.id', 'asc');
    }

    const esEstacionBar = ['bar', 'bebida', 'coctel', 'licor', 'cafeteria', 'cafe', 'caja']
      .some((tag) => contextoEstacion.includes(tag));

    if (esEstacionBar) {
      const impresorasBar = await db('impresoras as i')
        .select('i.id', 'i.nombre', 'i.ip_address', 'i.puerto')
        .where('i.sede_id', sedeId)
        .where('i.estado', 'activa')
        .whereNull('i.deleted_at')
        .where(function() {
          this.whereRaw('LOWER(i.nombre) like ?', ['%bar%'])
            .orWhereRaw('LOWER(i.modelo) like ?', ['%bar%'])
            .orWhereRaw('LOWER(i.nombre) like ?', ['%bebida%'])
            .orWhereRaw('LOWER(i.modelo) like ?', ['%bebida%'])
            .orWhereRaw('LOWER(i.nombre) like ?', ['%caja%'])
            .orWhereRaw('LOWER(i.modelo) like ?', ['%caja%']);
        })
        .orderBy('i.id', 'asc');

      if (impresorasBar.length > 0) {
        return impresorasBar;
      }

      // Último fallback para bar: usar impresoras activas que no parezcan de cocina.
      return db('impresoras as i')
        .select('i.id', 'i.nombre', 'i.ip_address', 'i.puerto')
        .where('i.sede_id', sedeId)
        .where('i.estado', 'activa')
        .whereNull('i.deleted_at')
        .whereNot(function() {
          this.whereRaw('LOWER(i.nombre) like ?', ['%cocina%'])
            .orWhereRaw('LOWER(i.modelo) like ?', ['%cocina%']);
        })
        .orderBy('i.id', 'asc');
    }

    // Fallback general para estaciones no cocina: preferir cualquier impresora activa no cocina.
    const impresorasNoCocina = await db('impresoras as i')
      .select('i.id', 'i.nombre', 'i.ip_address', 'i.puerto')
      .where('i.sede_id', sedeId)
      .where('i.estado', 'activa')
      .whereNull('i.deleted_at')
      .whereNot(function() {
        this.whereRaw('LOWER(i.nombre) like ?', ['%cocina%'])
          .orWhereRaw('LOWER(i.modelo) like ?', ['%cocina%']);
      })
      .orderBy('i.id', 'asc');

    if (impresorasNoCocina.length > 0) {
      return impresorasNoCocina;
    }

    return db('impresoras as i')
      .select('i.id', 'i.nombre', 'i.ip_address', 'i.puerto')
      .where('i.sede_id', sedeId)
      .where('i.estado', 'activa')
      .whereNull('i.deleted_at')
      .orderBy('i.id', 'asc');
  }

  static async imprimirTicketsPorComanda({ orden, mesa, usuario, tickets, clienteId = null }) {
    const trabajos = [];
    const ticketsAgrupados = Array.from(
      tickets.reduce((acc, ticket) => {
        const key = `${ticket.estacion_id}-${ticket.comanda_id}`;
        if (!acc.has(key)) {
          acc.set(key, {
            ...ticket,
            items: [],
          });
        }

        const existente = acc.get(key);
        existente.items.push(...ticket.items);
        return acc;
      }, new Map()).values()
    );

    for (const ticket of ticketsAgrupados) {
      const impresoras = await OrdenesController.obtenerImpresorasPorEstacion(orden.sede_id, ticket.estacion_id);

      if (!impresoras.length) {
        console.log(`⚠️ No hay impresoras configuradas para la estación ${ticket.estacion_nombre}`);
        continue;
      }

      const payload = {
        numero_orden: orden.numero_orden,
        mesa: mesa?.numero || mesa?.id || '',
        zona: mesa?.zona_nombre || '',
        mesero: usuario?.nombre || '',
        estacion: ticket.estacion_nombre || 'COMANDA',
        items: ticket.items.map((item) => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          modificadores: item.modificadores || [],
          observaciones: item.notas_especiales || item.observaciones || '',
        })),
        observaciones: orden.observaciones || '',
      };

      for (const impresora of impresoras) {
        trabajos.push(
          PrintDispatchService.dispatchComanda({
            impresora,
            payload,
            sedeId: orden.sede_id,
            clienteId,
          }).catch((err) => {
            console.error(`❌ Error imprimiendo en ${impresora.nombre}:`, err.message);
          })
        );
      }
    }

    await Promise.allSettled(trabajos);
  }

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
      const { mesa_id, usuario_id, sede_id, items, total, canal_id } = req.body;

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
      const ticketsParaImprimir = [];
      const firmasModsCache = new Map();
      let ordenItemsPrevios = [];
      const ordenItemsProcesados = new Set();

      const construirNotasCompletas = (item) => ([
        item.observaciones || null,
        item.modificadores && item.modificadores.length > 0
          ? `Modificadores: ${item.modificadores.map((m) => m.nombre).join(', ')}`
          : null,
      ]
        .filter(Boolean)
        .join(' | '));

      const construirFirmaMods = (mods = []) => mods
        .map((mod) => Number(mod.id || mod.modificador_opcion_id || 0))
        .filter((id) => id > 0)
        .sort((a, b) => a - b)
        .join(',');

      const obtenerFirmaModsOrdenItem = async (ordenItemId) => {
        if (firmasModsCache.has(ordenItemId)) {
          return firmasModsCache.get(ordenItemId);
        }

        const mods = await db('orden_item_modificador')
          .where('orden_item_id', ordenItemId)
          .select('modificador_opcion_id');

        const firma = mods
          .map((mod) => Number(mod.modificador_opcion_id || 0))
          .filter((id) => id > 0)
          .sort((a, b) => a - b)
          .join(',');

        firmasModsCache.set(ordenItemId, firma);
        return firma;
      };

      const buscarItemExistenteCompatible = async (ordenIdActual, itemActual) => {
        const candidatos = await db('orden_items')
          .where('orden_id', ordenIdActual)
          .where('producto_id', itemActual.producto_id)
          .orderBy('id', 'asc');

        if (!candidatos.length) {
          return null;
        }

        const firmaEntrada = construirFirmaMods(itemActual.modificadores || []);

        for (const candidato of candidatos) {
          const firmaCandidato = await obtenerFirmaModsOrdenItem(candidato.id);
          if (firmaCandidato === firmaEntrada) {
            return candidato;
          }
        }

        return null;
      };

      if (ordenExistente) {
        // Orden ya existe en la mesa, agregar items
        ordenId = ordenExistente.id;
        console.log(`📦 Orden existente encontrada: ${ordenId}`);

        // Las comandas ahora se crean por estación/item, no una sola para toda la orden.
      } else {
        // Crear nueva orden
        esOrdenNueva = true;
        const numeroOrden = `ORD-${Date.now()}-${Math.floor(Math.random() * 100)}`;
        const ordenResult = await db('ordenes').insert({
          numero_orden: numeroOrden,
          mesa_id,
          usuario_id,
          sede_id,
          canal_id: canal_id || 1,
          estado: 'abierta',
          total,
          created_at: new Date(),
          updated_at: new Date(),
        }).returning('id');
        ordenId = Array.isArray(ordenResult) ? ordenResult[0].id : ordenResult.id;

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

      if (!esOrdenNueva) {
        ordenItemsPrevios = await db('orden_items')
          .where('orden_id', ordenId)
          .where('cantidad', '>', 0)
          .select('*');
      }

      // Agregar items (igual para orden nueva o existente)
      for (const item of items) {
        console.log(`📦 Procesando item: ${item.producto_id}, Orden: ${ordenId}, Cantidad solicitada: ${item.cantidad}`);
        
        const productoConEstacion = await OrdenesController.obtenerEstacionPorProducto(item.producto_id, sede_id);
        if (!productoConEstacion?.estacion_id) {
          return res.status(400).json({
            error: `No se pudo determinar la estación para el producto ${item.producto_id}`,
          });
        }

        const comandaEstacion = await OrdenesController.obtenerOCrearComanda({
          ordenId,
          estacionId: productoConEstacion.estacion_id,
          numeroOrden: esOrdenNueva ? 'NUEVA' : ordenExistente?.numero_orden || ordenId,
        });

        if (!comandaId) {
          comandaId = comandaEstacion.id;
        }

        let itemId;
        
        // Si la orden ya existe, verificar si este item (producto + modificadores) ya está en ella
        if (!esOrdenNueva) {
          const itemExistente = await buscarItemExistenteCompatible(ordenId, item);

          if (itemExistente) {
            // Item existe - ACTUALIZAR cantidad si es diferente
            const cantidadAnterior = Number(itemExistente.cantidad || 0);
            const cantidadNueva = Number(item.cantidad || 0);
            const deltaCantidad = cantidadNueva - cantidadAnterior;
            ordenItemsProcesados.add(itemExistente.id);

            if (cantidadAnterior !== cantidadNueva) {
              console.log(`🔄 Actualizando cantidad del item ${item.producto_id}: ${cantidadAnterior} → ${cantidadNueva}`);
              const precioUnitario = Number(item.precio_unitario || itemExistente.precio_unitario || 0);
              const subtotalNuevo = cantidadNueva * precioUnitario;
              const diferenciaTotalItem = subtotalNuevo - Number(itemExistente.subtotal || 0);
              const notasCompletas = construirNotasCompletas(item);
              
              await db('orden_items').where('id', itemExistente.id).update({
                cantidad: cantidadNueva,
                precio_unitario: precioUnitario,
                subtotal: subtotalNuevo,
                notas_especiales: item.observaciones || null,
                updated_at: new Date(),
              });
              
              // Actualizar total de la orden
              const nuevaOrdenTotal = ordenExistente.total + diferenciaTotalItem;
              await db('ordenes').where('id', ordenId).update({
                total: nuevaOrdenTotal,
                updated_at: new Date(),
              });
              
              console.log(`✅ Item ${item.producto_id} actualizado. Nuevo total orden: ${nuevaOrdenTotal}`);

              if (deltaCantidad > 0) {
                // Version PRO: enviar a cocina/bar solo el incremento agregado.
                await db('comanda_items').insert({
                  comanda_id: comandaEstacion.id,
                  orden_item_id: itemExistente.id,
                  producto_id: item.producto_id,
                  cantidad: deltaCantidad,
                  notas_especiales: notasCompletas || null,
                  estado: 'pendiente',
                  created_at: new Date(),
                  updated_at: new Date(),
                });

                ticketsParaImprimir.push({
                  estacion_id: productoConEstacion.estacion_id,
                  estacion_nombre: productoConEstacion.estacion_nombre || productoConEstacion.estacion_tipo || 'Comanda',
                  comanda_id: comandaEstacion.id,
                  items: [{
                    nombre: productoConEstacion.producto_nombre || `Producto ${item.producto_id}`,
                    cantidad: deltaCantidad,
                    accion: 'agregado',
                    modificadores: item.modificadores?.map((m) => m.nombre) || [],
                    notas_especiales: notasCompletas || null,
                    observaciones: item.observaciones || null,
                  }],
                });
              } else if (deltaCantidad < 0) {
                const cantidadReducida = Math.abs(deltaCantidad);
                const notaAjuste = `[ACCION:REDUCIDO] ${notasCompletas || ''}`.trim();

                await db('comanda_items').insert({
                  comanda_id: comandaEstacion.id,
                  orden_item_id: itemExistente.id,
                  producto_id: item.producto_id,
                  cantidad: cantidadReducida,
                  notas_especiales: notaAjuste,
                  estado: 'pendiente',
                  created_at: new Date(),
                  updated_at: new Date(),
                });

                ticketsParaImprimir.push({
                  estacion_id: productoConEstacion.estacion_id,
                  estacion_nombre: productoConEstacion.estacion_nombre || productoConEstacion.estacion_tipo || 'Comanda',
                  comanda_id: comandaEstacion.id,
                  items: [{
                    nombre: productoConEstacion.producto_nombre || `Producto ${item.producto_id}`,
                    cantidad: cantidadReducida,
                    accion: 'reducido',
                    modificadores: item.modificadores?.map((m) => m.nombre) || [],
                    notas_especiales: notaAjuste,
                    observaciones: item.observaciones || null,
                  }],
                });
              }
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
        ordenItemsProcesados.add(itemId);

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
        const notasCompletas = construirNotasCompletas(item);

        await db('comanda_items').insert({
          comanda_id: comandaEstacion.id,
          orden_item_id: itemId,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          notas_especiales: notasCompletas || null,
          estado: 'pendiente',
          created_at: new Date(),
          updated_at: new Date(),
        });

        ticketsParaImprimir.push({
          estacion_id: productoConEstacion.estacion_id,
          estacion_nombre: productoConEstacion.estacion_nombre || productoConEstacion.estacion_tipo || 'Comanda',
          comanda_id: comandaEstacion.id,
          items: [{
            nombre: productoConEstacion.producto_nombre || `Producto ${item.producto_id}`,
            cantidad: item.cantidad,
            accion: 'agregado',
            modificadores: item.modificadores?.map((m) => m.nombre) || [],
            notas_especiales: notasCompletas || null,
            observaciones: item.observaciones || null,
          }],
        });
      }

      // Detectar items que fueron eliminados del carrito y emitir ticket de cancelación.
      if (!esOrdenNueva && ordenItemsPrevios.length > 0) {
        for (const itemPrevio of ordenItemsPrevios) {
          if (ordenItemsProcesados.has(itemPrevio.id)) {
            continue;
          }

          const cantidadCancelada = Number(itemPrevio.cantidad || 0);
          if (cantidadCancelada <= 0) {
            continue;
          }

          const productoConEstacion = await OrdenesController.obtenerEstacionPorProducto(itemPrevio.producto_id, sede_id);
          if (!productoConEstacion?.estacion_id) {
            continue;
          }

          const comandaEstacion = await OrdenesController.obtenerOCrearComanda({
            ordenId,
            estacionId: productoConEstacion.estacion_id,
            numeroOrden: ordenExistente?.numero_orden || ordenId,
          });

          const notaCancelacion = `[ACCION:CANCELADO] ${itemPrevio.notas_especiales || ''}`.trim();

          await db('comanda_items').insert({
            comanda_id: comandaEstacion.id,
            orden_item_id: itemPrevio.id,
            producto_id: itemPrevio.producto_id,
            cantidad: cantidadCancelada,
            notas_especiales: notaCancelacion,
            estado: 'pendiente',
            created_at: new Date(),
            updated_at: new Date(),
          });

          await db('orden_items').where('id', itemPrevio.id).update({
            cantidad: 0,
            subtotal: 0,
            updated_at: new Date(),
          });

          ticketsParaImprimir.push({
            estacion_id: productoConEstacion.estacion_id,
            estacion_nombre: productoConEstacion.estacion_nombre || productoConEstacion.estacion_tipo || 'Comanda',
            comanda_id: comandaEstacion.id,
            items: [{
              nombre: productoConEstacion.producto_nombre || `Producto ${itemPrevio.producto_id}`,
              cantidad: cantidadCancelada,
              accion: 'cancelado',
              modificadores: [],
              notas_especiales: notaCancelacion,
              observaciones: itemPrevio.notas_especiales || null,
            }],
          });
        }
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

      try {
        const ordenCompleta = await db('ordenes').where('id', ordenId).first();
        if (ticketsParaImprimir.length > 0) {
          const mesaCompleta = await db('mesas').where('id', mesa_id).first();
          await OrdenesController.imprimirTicketsPorComanda({
            orden: ordenCompleta,
            mesa: mesaCompleta,
            usuario,
            tickets: ticketsParaImprimir,
            clienteId: req.usuario?.cliente_id || null,
          });
        }
      } catch (printErr) {
        console.error('❌ Error imprimiendo tickets de comanda:', printErr.message);
      }

      return res.json({
        success: true,
        message: esOrdenNueva ? 'Orden creada exitosamente' : 'Items agregados a la orden existente',
        data: {
          orden_id: ordenId,
          comanda_id: comandaId,
          comanda_ids: [...new Set(ticketsParaImprimir.map((ticket) => ticket.comanda_id))],
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
        .whereIn('estado', ['abierta', 'enviada_produccion', 'en_preparacion', 'lista_entrega'])
        .orderBy('created_at', 'desc');

      // Obtener items para cada orden con sus modificadores
      const ordenesConItems = await Promise.all(
        ordenes.map(async (orden) => {
          const items = await db('orden_items')
            .select('*')
            .where('orden_id', orden.id)
            .where('cantidad', '>', 0);

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
      const { sedeId } = req.query;
      const clienteId = req.usuario?.cliente_id || req.query.clienteId;

      let query = db('ordenes')
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
        .whereIn('ordenes.estado', ['abierta', 'lista']);

      // Filtrar por sede si está presente
      if (sedeId) {
        query = query.andWhere('ordenes.sede_id', sedeId);
      }

      // Nota: la tabla `ordenes` puede tener cliente_id nulo,
      // por eso no filtramos por cliente automáticamente aquí.

      const ordenes = await query.orderBy('ordenes.created_at', 'desc');

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
      const clienteId = req.usuario?.cliente_id || req.query.clienteId;

      let query = db('ordenes')
        .select(
          'ordenes.*',
          'mesas.numero as mesa_numero',
          'usuarios.nombre as usuario_nombre'
        )
        .leftJoin('mesas', 'ordenes.mesa_id', 'mesas.id')
        .leftJoin('usuarios', 'ordenes.usuario_id', 'usuarios.id')
        .where('ordenes.sede_id', sedeId)
        .where('ordenes.estado', 'abierta');

      // Filtrar por cliente si está presente
      if (clienteId) {
        query = query.andWhere('ordenes.cliente_id', clienteId);
      }

      const ordenes = await query.orderBy('ordenes.created_at', 'desc');

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
