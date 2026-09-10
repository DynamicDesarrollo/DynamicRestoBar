/**
 * CajaController
 * 
 * Controlador para gestión de caja:
 * - Abrir/cerrar caja
 * - Registrar pagos completos y abonos
 * - Procesar devoluciones
 * - Obtener resumen de caja
 * - Transacciones por método de pago
 */

const db = require('../config/database');
const PrintDispatchService = require('../services/PrintDispatchService');
const FacturaElectronicaService = require('../services/FacturaElectronicaService');
const { validarSedeDeReq } = require('../utils/tenantScope');

class CajaController {
  /**
   * POST /caja/abrir
   * Abrir caja con saldo inicial
   */
  static async abrirCaja(req, res) {
    try {
      const { userId: usuario_id, sedeId: sede_id, cliente_id = null } = req.usuario;
      const { monto_inicial = 0 } = req.body;

      // Verificar si ya hay caja abierta
      const cajaActual = await db('aperturas_caja')
        .where('usuario_id', usuario_id)
        .where('sede_id', sede_id)
        .where('estado', 'abierta')
        .where('activa', true)
        .first();

      if (cajaActual) {
        return res.status(400).json({
          error: 'Ya existe una caja abierta para este usuario',
        });
      }

      const resultado = await db('aperturas_caja').insert({
        sede_id,
        usuario_id,
        monto_inicial,
        estado: 'abierta',
        activa: true,
      }).returning('*');

      const apertura = Array.isArray(resultado) ? resultado[0] : resultado;

      // Registrar movimiento inicial
      await db('caja_movimientos').insert({
        apertura_caja_id: apertura.id,
        tipo: 'ingreso',
        monto: monto_inicial,
        concepto: `Apertura de caja - Saldo inicial: $${monto_inicial}`,
        usuario_id,
        created_at: new Date(),
        updated_at: new Date(),
      });

      console.log(`🟢 CAJA ABIERTA - Usuario: ${usuario_id}, Saldo inicial: $${monto_inicial}`);

      return res.json({
        success: true,
        message: 'Caja abierta exitosamente',
        data: apertura,
      });
    } catch (err) {
      console.error('❌ Error en abrirCaja:', err.message);
      return res.status(500).json({
        error: 'Error al abrir caja',
        message: err.message,
      });
    }
  }

  /**
   * GET /caja/apertura-actual
   * Obtener apertura actual con resumen
   */
  static async getAperturaActual(req, res) {
    try {
      const { userId: usuario_id, sedeId: sede_id } = req.usuario;

      const apertura = await db('aperturas_caja')
        .where('usuario_id', usuario_id)
        .where('sede_id', sede_id)
        .where('estado', 'abierta')
        .where('activa', true)
        .orderBy('created_at', 'desc')
        .first();

      if (!apertura) {
        return res.json({
          success: true,
          data: null,
          message: 'No hay caja abierta',
        });
      }

      // Obtener movimientos
      const movimientos = await db('caja_movimientos')
        .where('apertura_caja_id', apertura.id)
        .orderBy('created_at', 'desc');

      // Calcular totales
    const ingresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);

    const egresos = movimientos
    .filter(m => m.tipo === 'egreso')
    .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);

    // El monto inicial ya está incluido como ingreso (apertura de caja), no se suma dos veces
    const totalCaja = ingresos - egresos;

      return res.json({
        success: true,
        data: {
          ...apertura,
          movimientos,
          resumen: {
            monto_inicial: apertura.monto_inicial,
            ingresos,
            egresos,
            total: totalCaja,
          },
        },
      });
    } catch (err) {
      console.error('❌ Error en getAperturaActual:', err.message);
      return res.status(500).json({
        error: 'Error al obtener apertura',
        message: err.message,
      });
    }
  }

  /**
   * POST /caja/pago
   * Registrar pago completo o abono (pago parcial)
   * Body: { orden_id, monto, metodo_pago_id, referencia, es_abono }
   */
  static async registrarPago(req, res) {
    try {
      const { userId: usuario_id, sedeId: sede_id, cliente_id = null } = req.usuario;
      const { orden_id, monto, metodo_pago_id, referencia, es_abono = false, comprador } = req.body;
      const now = new Date();

      if (!orden_id || !monto || !metodo_pago_id) {
        return res.status(400).json({
          error: 'Datos incompletos. Se requiere: orden_id, monto, metodo_pago_id',
        });
      }

      // Factura electrónica: es un servicio que solo el super-admin activa
      // por empresa (clientes.factura_electronica_habilitada). Se valida
      // aquí también — no solo se oculta el checkbox en el frontend — para
      // que nadie pueda forzarlo llamando la API directamente si su
      // empresa no tiene el servicio contratado.
      if (comprador) {
        const { tipo_documento, numero_documento, nombre_razon_social } = comprador;
        if (!tipo_documento || !numero_documento || !nombre_razon_social) {
          return res.status(400).json({
            error: 'Para factura electrónica se requiere tipo y número de documento, y nombre/razón social',
          });
        }
        const clienteEmpresaAuth = cliente_id
          ? await db('clientes').where('id', cliente_id).first()
          : null;
        if (!clienteEmpresaAuth?.factura_electronica_habilitada) {
          return res.status(403).json({
            error: 'Tu empresa no tiene habilitado el servicio de factura electrónica',
          });
        }
      }

      // Obtener apertura actual
      const apertura = await db('aperturas_caja')
        .where('usuario_id', usuario_id)
        .where('estado', 'abierta')
        .where('activa', true)
        .first();

      if (!apertura) {
        return res.status(400).json({ error: 'No hay caja abierta' });
      }

      // Obtener orden
      const orden = await db('ordenes').where('id', orden_id).first();
      if (!orden) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      const mesaInfo = orden.mesa_id
        ? await db('mesas').select('numero').where('id', orden.mesa_id).first()
        : null;
      const meseroInfo = orden.usuario_id
        ? await db('usuarios').select('nombre').where('id', orden.usuario_id).first()
        : null;
      const mesaNumero = mesaInfo?.numero ? String(mesaInfo.numero) : '';
      const meseroNombre = meseroInfo?.nombre || req.usuario?.nombre || '';

      const montoPago = parseFloat(monto);
      const totalOrden = parseFloat(orden.total);

      // Validar monto
      if (montoPago > totalOrden && !es_abono) {
        return res.status(400).json({
          error: `Monto no puede superar el total (${totalOrden})`,
        });
      }

      // Obtener o crear factura
      let factura = await db('facturas').where('orden_id', orden_id).first();
      
      if (!factura) {
        const numeroFactura = `FAC-${Date.now()}`;
        const resultFactura = await db('facturas').insert({
          numero_factura: numeroFactura,
          orden_id,
          sede_id,
          subtotal: totalOrden,
          total: totalOrden,
          estado: 'emitida',
          fecha_emision: now,
          created_at: now,
          updated_at: now,
        }).returning('*');
        factura = Array.isArray(resultFactura) ? resultFactura[0] : resultFactura;
      }

      // Si el comensal pidió factura electrónica en este pago, se guarda el
      // comprador (upsert: si ya se había capturado en un abono anterior de
      // esta misma factura, se actualiza en vez de duplicar) y se marca la
      // factura como pendiente de envío.
      if (comprador) {
        await db('factura_compradores')
          .insert({
            factura_id: factura.id,
            tipo_documento: comprador.tipo_documento,
            numero_documento: comprador.numero_documento,
            nombre_razon_social: comprador.nombre_razon_social,
            email: comprador.email || null,
            telefono: comprador.telefono || null,
            direccion: comprador.direccion || null,
            updated_at: now,
          })
          .onConflict('factura_id')
          .merge();

        await db('facturas').where('id', factura.id).update({
          requiere_electronica: true,
          estado_envio_dian: 'pendiente',
          updated_at: now,
        });
        factura.requiere_electronica = true;
        factura.estado_envio_dian = 'pendiente';
      }

      // Registrar pago
      const pagoProcesado = await db('pago_facturas').insert({
        factura_id: factura.id,
        metodo_pago_id,
        monto: montoPago,
        referencia: referencia || null,
        fecha_pago: now,
        created_at: now,
        updated_at: now,
      }).returning('*');

      const pago = Array.isArray(pagoProcesado) ? pagoProcesado[0] : pagoProcesado;

      // Calcular monto pagado total
      const pagosTotal = await db('pago_facturas')
        .where('factura_id', factura.id)
        .sum('monto as total');
      
      const montoPagadoTotal = parseFloat(pagosTotal[0]?.total || 0);
      const facturaPagada = montoPagadoTotal >= totalOrden;

      // Actualizar factura si está completamente pagada
      if (facturaPagada) {
        await db('facturas').where('id', factura.id).update({
          estado: 'cancelada',
          updated_at: new Date(),
        });
      }

      // Si la venta ya quedó completamente pagada y alguien pidió factura
      // electrónica (en este pago o en un abono anterior de la misma
      // factura), se intenta enviar a la app puente. Fire-and-forget a
      // propósito: nunca se espera esta llamada ni se deja que su falla
      // afecte la respuesta al cajero — la app puente todavía no existe,
      // así que hoy esto siempre queda "pendiente", y eso es correcto.
      if (facturaPagada && factura.requiere_electronica) {
        FacturaElectronicaService.enviarFactura(factura.id).catch((err) => {
          console.error(`❌ Envío de factura electrónica #${factura.id} falló inesperadamente:`, err.message);
        });
      }

      // Actualizar orden si está completamente pagada
      if (facturaPagada) {
        await db('ordenes').where('id', orden_id).update({
          estado: 'entregada',
          updated_at: new Date(),
        });

        // Liberar mesa
        if (orden.mesa_id) {
          await db('mesas').where('id', orden.mesa_id).update({
            estado: 'disponible',
            updated_at: new Date(),
          });
        }
      }

      // Registrar en movimientos de caja
      await db('caja_movimientos').insert({
        apertura_caja_id: apertura.id,
        tipo: 'ingreso',
        monto: montoPago,
        concepto: `${es_abono ? 'Abono' : 'Pago'} - Orden #${orden.numero_orden} - $${montoPago}`,
        metodo_pago_id,
        orden_id,
        usuario_id,
        created_at: new Date(),
        updated_at: new Date(),
      });

      console.log(`💰 ${es_abono ? 'ABONO' : 'PAGO'} REGISTRADO - Orden: ${orden.numero_orden}, Monto: $${montoPago}, Saldo: $${Math.max(0, totalOrden - montoPagadoTotal)}`);

      const sede = await db('sedes')
        .where('id', sede_id)
        .whereNull('deleted_at')
        .first();

      const configRows = await db('configuracion')
        .select('clave', 'valor')
        .where('sede_id', sede_id)
        .whereIn('clave', ['nombre_negocio', 'nit', 'numero_nit', 'numero_resolucion', 'web']);

      const config = configRows.reduce((acc, row) => {
        acc[row.clave] = row.valor;
        return acc;
      }, {});

      const clienteEmpresa = await db('clientes')
        .whereNull('deleted_at')
        .where((qb) => qb.where('sede_id', sede_id).orWhereNull('sede_id'))
        .orderByRaw('CASE WHEN sede_id = ? THEN 0 ELSE 1 END', [sede_id])
        .orderBy('id', 'asc')
        .first();

      const datosNegocioBase = {
        nombre: config.nombre_negocio || sede?.nombre || clienteEmpresa?.nombre || 'DynamicRestoBar',
        direccion: sede?.direccion || '',
        ciudad: sede?.ciudad || '',
        telefono: sede?.telefono || clienteEmpresa?.telefono || '',
        email: sede?.email || clienteEmpresa?.email || '',
        nit: config.nit || config.numero_nit || clienteEmpresa?.documento || '',
        resolucion: config.numero_resolucion || '',
        web: config.web || 'www.dynamicrestobar.com',
      };

      const pagosFactura = await db('pago_facturas as pf')
        .select('pf.monto', 'pf.referencia', 'mp.nombre as metodo_nombre')
        .leftJoin('metodos_pago as mp', 'pf.metodo_pago_id', 'mp.id')
        .where('pf.factura_id', factura.id)
        .orderBy('pf.fecha_pago', 'asc');

      const itemsParaImpresion = await db('orden_items')
        .select(
          'orden_items.*',
          'productos.nombre as producto_nombre'
        )
        .leftJoin('productos', 'orden_items.producto_id', 'productos.id')
        .where('orden_items.orden_id', orden_id);

      for (let item of itemsParaImpresion) {
        const modificadores = await db('orden_item_modificador')
          .select('orden_item_modificador.*', 'modificador_opciones.nombre')
          .leftJoin('modificador_opciones', 'orden_item_modificador.modificador_opcion_id', 'modificador_opciones.id')
          .where('orden_item_modificador.orden_item_id', item.id);
        item.modificadores = modificadores;
      }

      const impresoraCaja = await db('impresoras')
        .where('sede_id', sede_id)
        .whereNull('deleted_at')
        .where('estado', 'activa')
        .where(function() {
          this.whereRaw('LOWER(nombre) LIKE ?', ['%bar%'])
            .orWhereRaw('LOWER(modelo) LIKE ?', ['%bar%'])
            .orWhereRaw('LOWER(nombre) LIKE ?', ['%caja%'])
            .orWhereRaw('LOWER(modelo) LIKE ?', ['%caja%'])
            .orWhereRaw('LOWER(nombre) LIKE ?', ['%bebida%'])
            .orWhereRaw('LOWER(modelo) LIKE ?', ['%bebida%']);
        })
        .orderBy('id', 'asc')
        .first();

      if (impresoraCaja?.ip_address) {
        try {
          const fechaFactura = pago?.created_at || factura.created_at || now;
          const fechaStr = new Date(fechaFactura).toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });

          const subtotalFactura = parseFloat(factura.subtotal ?? totalOrden ?? 0);
          const totalFactura = parseFloat(factura.total ?? totalOrden ?? 0);
          const impuestosFactura = 0;
          const montoPagadoFactura = pagosFactura.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
          const cambioFactura = Math.max(0, montoPagadoFactura - totalFactura);
          const saldoPendienteFactura = Math.max(0, totalFactura - montoPagadoFactura);

          const dispatch = await PrintDispatchService.dispatchFactura({
            impresora: impresoraCaja,
            sedeId: sede_id,
            clienteId: cliente_id,
            payload: {
            tipoDocumento: facturaPagada ? 'FACTURA' : 'RECIBO ABONO',
            numeroFactura: factura.numero_factura,
            fecha: fechaStr,
            ordenNumero: `#${orden.numero_orden}`,
            mesa: mesaNumero,
            mesero: meseroNombre,
            negocio: datosNegocioBase,
            items: itemsParaImpresion,
            subtotal: subtotalFactura,
            impuestos: impuestosFactura,
            total: totalFactura,
            montoPagado: montoPagadoFactura,
            cambio: cambioFactura,
            saldoPendiente: saldoPendienteFactura,
            pagos: pagosFactura,
            },
          });

          if (dispatch.mode === 'bridge') {
            console.log(`🧾 ${facturaPagada ? 'FACTURA' : 'RECIBO ABONO'} ENCOLADO - job #${dispatch.jobId} -> ${impresoraCaja.nombre}`);
          } else {
            console.log(`🧾 ${facturaPagada ? 'FACTURA' : 'RECIBO ABONO'} IMPRESO EN RED - ${impresoraCaja.nombre} (${impresoraCaja.ip_address}:${impresoraCaja.puerto || 9100})`);
          }
        } catch (printError) {
          console.error('⚠️ No se pudo imprimir documento de caja en red:', printError.message);
        }
      } else {
        console.warn(`⚠️ Sin impresora activa para caja en sede ${sede_id}.`);
      }

      // Si está pagada completamente, obtener items de la orden para la factura
      let ordenConItems = null;
      let datosNegocio = null;
      if (facturaPagada) {
        ordenConItems = itemsParaImpresion;
        datosNegocio = datosNegocioBase;
      }

      return res.json({
        success: true,
        message: facturaPagada ? 'Pago completado' : 'Abono registrado',
        data: {
          pago,
          factura: facturaPagada
            ? {
                ...factura,
                negocio: datosNegocio,
                fecha_hora: pago?.created_at || factura.created_at || now,
              }
            : null,
          orden: {
            id: orden.id,
            numero_orden: orden.numero_orden,
            mesa_numero: mesaNumero || null,
            usuario_nombre: meseroNombre || null,
            total: totalOrden,
            pagado: facturaPagada,
            saldo_pendiente: Math.max(0, totalOrden - montoPagadoTotal),
            items: ordenConItems,
          },
        },
      });
    } catch (err) {
      console.error('❌ Error en registrarPago:', err.message);
      return res.status(500).json({
        error: 'Error al registrar pago',
        message: err.message,
      });
    }
  }

  /**
   * POST /caja/devolucion
   * Procesar devolución de orden
   * Body: { orden_id, motivo, monto_devuelto }
   */
  static async procesarDevolucion(req, res) {
    try {
      const { userId: usuario_id, sedeId: sede_id } = req.usuario;
      const { orden_id, motivo, monto_devuelto } = req.body;

      if (!orden_id || !motivo) {
        return res.status(400).json({
          error: 'Datos incompletos. Se requiere: orden_id, motivo',
        });
      }

      // Obtener apertura actual
      const apertura = await db('aperturas_caja')
        .where('usuario_id', usuario_id)
        .where('estado', 'abierta')
        .where('activa', true)
        .first();

      if (!apertura) {
        return res.status(400).json({ error: 'No hay caja abierta' });
      }

      // Obtener orden
      const orden = await db('ordenes').where('id', orden_id).first();
      if (!orden) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      const montoDevolucion = parseFloat(monto_devuelto || orden.total);

      // Obtener factura
      const factura = await db('facturas').where('orden_id', orden_id).first();

      // Actualizar orden
      await db('ordenes').where('id', orden_id).update({
        estado: 'anulada',
        updated_at: new Date(),
      });

      // Actualizar factura si existe
      if (factura) {
        await db('facturas').where('id', factura.id).update({
          estado: 'anulada',
          updated_at: new Date(),
        });
      }

      // Liberar mesa
      if (orden.mesa_id) {
        await db('mesas').where('id', orden.mesa_id).update({
          estado: 'disponible',
          updated_at: new Date(),
        });
      }

      // Registrar en movimientos de caja (egreso)
      await db('caja_movimientos').insert({
        apertura_caja_id: apertura.id,
        tipo: 'egreso',
        monto: montoDevolucion,
        concepto: `Devolución Orden #${orden.numero_orden} - Motivo: ${motivo}`,
        orden_id,
        usuario_id,
        created_at: new Date(),
        updated_at: new Date(),
      });

      console.log(`🔄 DEVOLUCIÓN PROCESADA - Orden: ${orden.numero_orden}, Monto: $${montoDevolucion}, Motivo: ${motivo}`);

      return res.json({
        success: true,
        message: 'Devolución registrada',
        data: {
          orden: {
            id: orden.id,
            numero_orden: orden.numero_orden,
            monto_devuelto: montoDevolucion,
            motivo,
          },
        },
      });
    } catch (err) {
      console.error('❌ Error en procesarDevolucion:', err.message);
      return res.status(500).json({
        error: 'Error al procesar devolución',
        message: err.message,
      });
    }
  }

  /**
   * POST /caja/cerrar
   * Cerrar caja del usuario
   */
  static async cerrarCaja(req, res) {
    try {
      const { userId: usuario_id, sedeId: sede_id } = req.usuario;
      const { saldo_final, observaciones } = req.body;

      // Obtener apertura actual. Se acota por sede igual que abrirCaja y
      // getAperturaActual: sin este filtro, un cajero de un cliente con varias
      // sedes cerraba desde la sede B la caja que dejó abierta en la sede A.
      const apertura = await db('aperturas_caja')
        .where('usuario_id', usuario_id)
        .where('sede_id', sede_id)
        .where('estado', 'abierta')
        .where('activa', true)
        .first();

      if (!apertura) {
        return res.status(400).json({ error: 'No hay caja abierta' });
      }

      // Obtener movimientos
      const movimientos = await db('caja_movimientos')
        .where('apertura_caja_id', apertura.id);

      const ingresos = movimientos
        .filter(m => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);

      const egresos = movimientos
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);

      // El monto inicial YA está registrado como movimiento de ingreso por
      // abrirCaja, así que no se vuelve a sumar (getAperturaActual hace lo
      // mismo). Además PostgreSQL devuelve numeric como string: sin Number()
      // el "+" concatenaba en vez de sumar y el esperado salía corrupto.
      const montoInicial = Number(apertura.monto_inicial) || 0;
      const totalVendido = ingresos - montoInicial;
      const totalEsperado = ingresos - egresos;
      const diferencia = (Number(saldo_final) || 0) - totalEsperado;

      // Crear cierre (usando los nombres y campos correctos)
      const cierreProcesado = await db('cierres_caja').insert({
        apertura_caja_id: apertura.id,
        usuario_id,
        monto_inicial: montoInicial,
        total_ingresos: ingresos,
        total_egresos: egresos,
        monto_esperado: totalEsperado,
        monto_contado: Number(saldo_final) || 0,
        diferencia,
        observaciones: observaciones || null,
      }).returning('*');

      const cierre = Array.isArray(cierreProcesado) ? cierreProcesado[0] : cierreProcesado;

      // Actualizar apertura
      await db('aperturas_caja').where('id', apertura.id).update({
        estado: 'cerrada',
        activa: false,
        updated_at: new Date(),
      });

      console.log(`🔴 CAJA CERRADA - Total vendido: $${totalVendido}, Diferencia: $${diferencia}`);

      return res.json({
        success: true,
        message: 'Caja cerrada exitosamente',
        data: {
          cierre,
          resumen: {
            monto_inicial: montoInicial,
            total_vendido: totalVendido,
            devoluciones: egresos,
            total_esperado: totalEsperado,
            saldo_final: Number(saldo_final) || 0,
            diferencia,
          },
        },
      });
    } catch (err) {
      console.error('❌ Error en cerrarCaja:', err);
      return res.status(500).json({
        error: 'Error al cerrar caja',
        message: err.message,
      });
    }
  }

  /**
   * GET /caja/metodos-pago
   * Obtener métodos de pago disponibles
   */
  static async getMetodosPago(req, res) {
    try {
      // Globales (cliente_id NULL, los "de fábrica") + los propios de la
      // empresa del usuario, si algún día se crean métodos personalizados.
      const clienteId = req.usuario?.cliente_id ?? null;
      const metodos = await db('metodos_pago')
        .where('activo', true)
        .andWhere((q) => {
          q.whereNull('cliente_id');
          if (clienteId != null) q.orWhere('cliente_id', clienteId);
        })
        .orderBy('id', 'asc');

      return res.json({
        success: true,
        data: metodos,
      });
    } catch (err) {
      console.error('❌ Error en getMetodosPago:', err.message);
      return res.status(500).json({
        error: 'Error al obtener métodos de pago',
        message: err.message,
      });
    }
  }

  /**
   * GET /caja/facturas/:sedeId
   * Obtener todas las facturas/pagos de una sede
   */
  static async getFacturasBySede(req, res) {
    try {
      const permisoSede = await validarSedeDeReq(req, req.params.sedeId);
      if (!permisoSede.ok) return res.status(permisoSede.status).json({ error: permisoSede.error });
      const sedeId = permisoSede.sedeId;
      const { fecha_inicio, fecha_fin } = req.query;

      let query = db('facturas').where('sede_id', sedeId);

      if (fecha_inicio && fecha_fin) {
        query = query
          .where('created_at', '>=', fecha_inicio)
          .where('created_at', '<=', fecha_fin);
      }

      const facturas = await query.orderBy('created_at', 'desc');

      return res.json({
        success: true,
        data: facturas,
        total: facturas.length,
      });
    } catch (err) {
      console.error('❌ Error en getFacturasBySede:', err.message);
      return res.status(500).json({
        error: 'Error al obtener facturas',
        message: err.message,
      });
    }
  }

  /**
   * Resumen de dinero efectivamente cobrado en una sede.
   *
   * Se calcula sobre `pago_facturas` (el detalle real de cobro) y no sobre
   * `facturas`: esa tabla no tiene columnas `metodo_pago` ni `propina`, y su
   * estado no incluye 'pagada' — una factura saldada queda como 'cancelada'
   * (deuda cancelada) y una devuelta como 'anulada'. Aquí se suman los pagos
   * y solo se descartan los de facturas anuladas.
   *
   * Nota: el sistema no modela propinas en ninguna tabla, por eso no se
   * devuelven; si se necesitan habría que añadir la columna primero.
   */
  static async resumenDePagos({ sedeId, desde = null, hasta = null }) {
    const base = () => {
      let q = db('pago_facturas as pf')
        .innerJoin('facturas as f', 'pf.factura_id', 'f.id')
        .where('f.sede_id', sedeId)
        .whereNot('f.estado', 'anulada')
        .whereNull('f.deleted_at')
        .whereNull('pf.deleted_at');
      if (desde) q = q.where('pf.created_at', '>=', desde);
      if (hasta) q = q.where('pf.created_at', '<', hasta);
      return q;
    };

    const totales = await base()
      .sum('pf.monto as total')
      .countDistinct('f.id as facturas')
      .first();

    const porMetodo = await base()
      .leftJoin('metodos_pago as mp', 'pf.metodo_pago_id', 'mp.id')
      .select('mp.id as metodo_pago_id', 'mp.nombre as metodo_pago')
      .sum('pf.monto as total')
      .groupBy('mp.id', 'mp.nombre')
      .orderBy('total', 'desc');

    // PostgreSQL devuelve sum() y count() como string: hay que convertirlos.
    const totalVentas = Number(totales?.total) || 0;
    const totalTransacciones = Number(totales?.facturas) || 0;

    return {
      totalVentas,
      totalTransacciones,
      ticketPromedio: totalTransacciones > 0
        ? Number((totalVentas / totalTransacciones).toFixed(2))
        : 0,
      ventasPorMetodo: porMetodo.map((m) => ({
        metodo_pago_id: m.metodo_pago_id,
        metodo_pago: m.metodo_pago || 'Sin especificar',
        total: Number(m.total) || 0,
      })),
    };
  }

  /**
   * GET /caja/resumen/:sedeId
   * Obtener resumen de caja por sede
   */
  static async getResumenCaja(req, res) {
    try {
      const permisoSede = await validarSedeDeReq(req, req.params.sedeId);
      if (!permisoSede.ok) return res.status(permisoSede.status).json({ error: permisoSede.error });
      const sedeId = permisoSede.sedeId;

      const resumen = await CajaController.resumenDePagos({ sedeId });

      return res.json({
        success: true,
        data: {
          total_ventas: resumen.totalVentas,
          total_transacciones: resumen.totalTransacciones,
          ticket_promedio: resumen.ticketPromedio,
          ventas_por_metodo: resumen.ventasPorMetodo,
        },
      });
    } catch (err) {
      console.error('❌ Error en getResumenCaja:', err.message);
      return res.status(500).json({
        error: 'Error al obtener resumen de caja',
        message: err.message,
      });
    }
  }

  /**
   * GET /caja/resumen-hoy/:sedeId
   * Obtener resumen de caja del día
   */
  static async getResumenHoy(req, res) {
    try {
      const permisoSede = await validarSedeDeReq(req, req.params.sedeId);
      if (!permisoSede.ok) return res.status(permisoSede.status).json({ error: permisoSede.error });
      const sedeId = permisoSede.sedeId;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const resumen = await CajaController.resumenDePagos({
        sedeId,
        desde: hoy,
        hasta: mañana,
      });

      return res.json({
        success: true,
        data: {
          fecha: hoy.toISOString().split('T')[0],
          total_ventas: resumen.totalVentas,
          total_transacciones: resumen.totalTransacciones,
          ticket_promedio: resumen.ticketPromedio,
          metodos_pago: resumen.ventasPorMetodo,
        },
      });
    } catch (err) {
      console.error('❌ Error en getResumenHoy:', err.message);
      return res.status(500).json({
        error: 'Error al obtener resumen del día',
        message: err.message,
      });
    }
  }

  /**
   * POST /caja/devoluciones
   * Registrar devolución/anulación de pago
   * Cuerpo: { factura_id, motivo }
   */
  static async crearDevolucion(req, res) {
    try {
      const { factura_id, motivo } = req.body;

      const factura = await db('facturas').where('id', factura_id).first();
      if (!factura) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      // Crear registro de devolución
      const [devolucionId] = await db('devoluciones').insert({
        factura_id,
        orden_id: factura.orden_id,
        monto: factura.total,
        motivo,
        estado: 'completada',
        created_at: new Date(),
      }).returning('id');

      // Actualizar factura
      await db('facturas').where('id', factura_id).update({
        estado: 'anulada',
        updated_at: new Date(),
      });

      // Actualizar orden
      await db('ordenes').where('id', factura.orden_id).update({
        estado: 'anulada',
        updated_at: new Date(),
      });

      // Liberar mesa si existe
      const orden = await db('ordenes').where('id', factura.orden_id).first();
      if (orden && orden.mesa_id) {
        await db('mesas').where('id', orden.mesa_id).update({
          estado: 'disponible',
          updated_at: new Date(),
        });
      }

      return res.json({
        success: true,
        message: 'Devolución registrada',
        data: {
          devolucion_id: devolucionId,
          factura_id,
          monto: factura.total,
        },
      });
    } catch (err) {
      console.error('❌ Error al crear devolución:', err.message);
      return res.status(500).json({
        error: 'Error al crear devolución',
        message: err.message,
      });
    }
  }
}

module.exports = CajaController;
