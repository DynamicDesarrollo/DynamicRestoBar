/**
 * DomiciliosController
 *
 * Crea y gestiona órdenes de domicilio. A diferencia de OrdenesController.crear
 * (pensado para mesas: busca orden abierta por mesa_id, exige mesa, actualiza
 * su estado), un domicilio SIEMPRE es una orden nueva sin mesa — reusa las
 * mismas funciones de generación de comandas (OrdenesController.obtenerEstacionPorProducto
 * / obtenerOCrearComanda) para que la orden aparezca en KDS exactamente igual
 * que una de mesa, sin duplicar esa lógica.
 */
const crypto = require('crypto');
const db = require('../config/database');
const OrdenesController = require('./OrdenesController');
const {
  sedesDelCliente,
  sedePerteneceACliente,
} = require('../utils/tenantScope');

const CANAL_DOMICILIO_NOMBRE = 'domicilio';
const ESTADOS_ENTREGA_VALIDOS = ['pendiente', 'confirmada', 'en_camino', 'entregada', 'fallida', 'anulada'];

const obtenerCanalDomicilioId = async () => {
  const canal = await db('canales').whereRaw('LOWER(nombre) = ?', [CANAL_DOMICILIO_NOMBRE]).first();
  return canal?.id || null;
};

// Trae la entrega + la orden asociada (para poder validar sede/tenant, que
// domicilio_entregas no guarda directamente) en una sola consulta.
const obtenerDomicilioConOrden = async (id) => {
  return db('domicilio_entregas as de')
    .join('ordenes as o', 'de.orden_id', 'o.id')
    .leftJoin('repartidores as r', 'de.repartidor_id', 'r.id')
    .select(
      'de.*',
      'o.sede_id', 'o.numero_orden', 'o.total', 'o.estado as orden_estado',
      'r.nombre as repartidor_nombre', 'r.telefono as repartidor_telefono'
    )
    .where('de.id', id)
    .whereNull('de.deleted_at')
    .first();
};

// El repartidor logueado solo ve/gestiona SUS entregas; el resto de roles
// (Administrador, Gerente, Caja) ve todas las de su empresa.
const construirScope = async (req) => {
  const clienteId = req.usuario?.cliente_id;
  const sedeIds = await sedesDelCliente(clienteId);
  const esRepartidor = req.usuario?.rol === 'Repartidor' || req.usuario?.roleName === 'Repartidor';
  return { sedeIds, esRepartidor, repartidorId: req.usuario?.repartidorId || null };
};

const DomiciliosController = {
  async crearDomicilio(req, res) {
    try {
      const sede_id = req.usuario?.sedeId || req.usuario?.sede_id;
      const usuario_id = req.usuario?.userId;
      const {
        items, direccion_entrega, referencia, nombre_destinatario,
        telefono_destinatario, zona_entrega_id, costo_entrega,
      } = req.body;

      if (!sede_id || !usuario_id) {
        return res.status(400).json({ error: 'Tu usuario no tiene una sede asociada' });
      }
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Se requiere al menos un producto' });
      }
      if (!direccion_entrega) {
        return res.status(400).json({ error: 'La dirección de entrega es requerida' });
      }

      if (zona_entrega_id) {
        const zona = await db('zona_entrega').where({ id: zona_entrega_id, sede_id }).first();
        if (!zona) {
          return res.status(400).json({ error: 'Esa zona de entrega no pertenece a tu sede' });
        }
      }

      const canalId = await obtenerCanalDomicilioId();
      const numeroOrden = `ORD-${Date.now()}-${Math.floor(Math.random() * 100)}`;
      const costoEntregaFinal = Number(costo_entrega) || 0;

      // Sin transacción envolvente a propósito — mismo patrón que
      // OrdenesController.crear (inserts secuenciales sobre la conexión
      // global), porque obtenerEstacionPorProducto/obtenerOCrearComanda ya
      // corren sobre esa misma conexión: envolver esto en una `trx` aparte
      // dejaba la orden invisible para esas funciones hasta el commit y
      // reventaba la FK de comandas.orden_id.
      const [orden] = await db('ordenes').insert({
        numero_orden: numeroOrden,
        mesa_id: null,
        usuario_id,
        sede_id,
        canal_id: canalId,
        zona_entrega_id: zona_entrega_id || null,
        estado: 'abierta',
        costo_entrega: costoEntregaFinal,
        total: 0,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('*');

      let subtotalOrden = 0;
      for (const item of items) {
        const productoConEstacion = await OrdenesController.obtenerEstacionPorProducto(item.producto_id, sede_id);
        if (!productoConEstacion?.estacion_id) {
          return res.status(400).json({ error: `No se pudo determinar la estación para el producto ${item.producto_id}` });
        }

        const comanda = await OrdenesController.obtenerOCrearComanda({
          ordenId: orden.id,
          estacionId: productoConEstacion.estacion_id,
          numeroOrden,
        });

        const subtotalItem = Number(item.cantidad) * Number(item.precio_unitario);
        subtotalOrden += subtotalItem;

        const [ordenItem] = await db('orden_items').insert({
          orden_id: orden.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: subtotalItem,
          notas_especiales: item.observaciones || null,
          estado: 'pendiente',
          created_at: new Date(),
          updated_at: new Date(),
        }).returning('*');

        if (item.modificadores?.length > 0) {
          await db('orden_item_modificador').insert(item.modificadores.map((mod) => ({
            orden_item_id: ordenItem.id,
            modificador_opcion_id: mod.id,
            precio_adicional: mod.precio_adicional || 0,
            created_at: new Date(),
            updated_at: new Date(),
          })));
        }

        await db('comanda_items').insert({
          comanda_id: comanda.id,
          orden_item_id: ordenItem.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          notas_especiales: item.observaciones || null,
          estado: 'pendiente',
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      const totalOrden = subtotalOrden + costoEntregaFinal;
      await db('ordenes').where('id', orden.id).update({ total: totalOrden, updated_at: new Date() });

      const trackingToken = crypto.randomUUID();
      const [entrega] = await db('domicilio_entregas').insert({
        orden_id: orden.id,
        zona_entrega_id: zona_entrega_id || null,
        direccion_entrega,
        referencia: referencia || null,
        nombre_destinatario: nombre_destinatario || null,
        telefono_destinatario: telefono_destinatario || null,
        estado: 'pendiente',
        costo_entrega: costoEntregaFinal,
        tracking_token: trackingToken,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('*');

      return res.status(201).json({
        success: true,
        data: { ...entrega, orden_id: orden.id, numero_orden: numeroOrden, total: totalOrden },
      });
    } catch (err) {
      console.error('❌ Error en crearDomicilio:', err.message);
      return res.status(500).json({ error: 'Error al crear el domicilio', message: err.message });
    }
  },

  async listarDomicilios(req, res) {
    try {
      const { sedeIds, esRepartidor, repartidorId } = await construirScope(req);
      const { estado, sedeId } = req.query;

      if (esRepartidor && !repartidorId) {
        return res.json({ success: true, data: [] });
      }

      let query = db('domicilio_entregas as de')
        .join('ordenes as o', 'de.orden_id', 'o.id')
        .leftJoin('repartidores as r', 'de.repartidor_id', 'r.id')
        .select(
          'de.*',
          'o.numero_orden', 'o.total', 'o.sede_id', 'o.estado as orden_estado',
          'r.nombre as repartidor_nombre',
          // "Entregada" (repartidor) y "pagada" son cosas distintas — el
          // domiciliario puede marcar la entrega antes de que quede
          // registrado el cobro. El front usa esto (no orden_estado) para
          // decidir si todavía puede mostrar el botón "Cobrar".
          db.raw(`COALESCE((
            SELECT SUM(pf.monto) FROM pago_facturas pf
            JOIN facturas f ON f.id = pf.factura_id
            WHERE f.orden_id = o.id
          ), 0) >= o.total as pagado`)
        )
        .whereIn('o.sede_id', sedeIds)
        .whereNull('de.deleted_at');

      if (esRepartidor) {
        query = query.andWhere('de.repartidor_id', repartidorId);
      }
      if (estado && ESTADOS_ENTREGA_VALIDOS.includes(estado)) {
        query = query.andWhere('de.estado', estado);
      }
      if (sedeId && sedePerteneceACliente(sedeId, sedeIds)) {
        query = query.andWhere('o.sede_id', sedeId);
      }

      const entregas = await query.orderBy('de.created_at', 'desc');
      return res.json({ success: true, data: entregas });
    } catch (err) {
      console.error('❌ Error en listarDomicilios:', err.message);
      return res.status(500).json({ error: 'Error al obtener domicilios', message: err.message });
    }
  },

  async asignarRepartidor(req, res) {
    try {
      const { id } = req.params;
      const { repartidor_id } = req.body;
      const { sedeIds } = await construirScope(req);

      const entrega = await obtenerDomicilioConOrden(id);
      if (!entrega) return res.status(404).json({ error: 'Domicilio no encontrado' });
      if (!sedePerteneceACliente(entrega.sede_id, sedeIds)) {
        return res.status(403).json({ error: 'Ese domicilio no pertenece a tu empresa' });
      }

      const repartidor = await db('repartidores')
        .where({ id: repartidor_id, sede_id: entrega.sede_id })
        .whereNull('deleted_at')
        .first();
      if (!repartidor) {
        return res.status(400).json({ error: 'Ese repartidor no pertenece a esta sede' });
      }
      if (repartidor.estado !== 'disponible') {
        return res.status(409).json({ error: 'Ese repartidor no está disponible' });
      }

      await db('domicilio_entregas').where('id', id).update({
        repartidor_id,
        estado: 'confirmada',
        hora_asignacion: new Date(),
        updated_at: new Date(),
      });
      await db('repartidores').where('id', repartidor_id).update({ estado: 'en_domicilio' });

      const actualizado = await obtenerDomicilioConOrden(id);
      return res.json({ success: true, data: actualizado });
    } catch (err) {
      console.error('❌ Error en asignarRepartidor:', err.message);
      return res.status(500).json({ error: 'Error al asignar repartidor', message: err.message });
    }
  },

  async actualizarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const { sedeIds, esRepartidor, repartidorId } = await construirScope(req);

      if (!ESTADOS_ENTREGA_VALIDOS.includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      const entrega = await obtenerDomicilioConOrden(id);
      if (!entrega) return res.status(404).json({ error: 'Domicilio no encontrado' });
      if (!sedePerteneceACliente(entrega.sede_id, sedeIds)) {
        return res.status(403).json({ error: 'Ese domicilio no pertenece a tu empresa' });
      }
      if (esRepartidor && entrega.repartidor_id !== repartidorId) {
        return res.status(403).json({ error: 'Esa entrega no está asignada a ti' });
      }

      const updateData = { estado, updated_at: new Date() };
      if (estado === 'en_camino') updateData.hora_salida = new Date();
      if (estado === 'entregada') {
        updateData.hora_entrega = new Date();
        await db('ordenes').where('id', entrega.orden_id).update({ estado: 'entregada', updated_at: new Date() });
      }

      await db('domicilio_entregas').where('id', id).update(updateData);

      if (['entregada', 'fallida', 'anulada'].includes(estado) && entrega.repartidor_id) {
        await db('repartidores').where('id', entrega.repartidor_id).update({ estado: 'disponible' });
      }

      const actualizado = await obtenerDomicilioConOrden(id);
      return res.json({ success: true, data: actualizado });
    } catch (err) {
      console.error('❌ Error en actualizarEstado (domicilio):', err.message);
      return res.status(500).json({ error: 'Error al actualizar el estado', message: err.message });
    }
  },

  /**
   * POST /domicilios/:id/pagar
   * Espejo simplificado de CajaController.registrarPago (sin abonos ni
   * factura electrónica) para no duplicar esa lógica financiera más de lo
   * necesario. Si la sede exige caja abierta (sedes.domicilios_requiere_caja,
   * default true), sigue exactamente el mismo camino de siempre: exige
   * apertura de caja y registra el ingreso en caja_movimientos. Si la sede
   * la desactivó (restaurante "solo domicilios", sin turno formal), se salta
   * esa exigencia — la venta igual queda registrada en facturas/pago_facturas,
   * solo que sin caja_movimientos porque no hay apertura a la cual atribuirlo.
   */
  async registrarPago(req, res) {
    try {
      const { id } = req.params;
      const { metodo_pago_id, referencia } = req.body;
      const usuario_id = req.usuario?.userId;
      const { sedeIds } = await construirScope(req);
      const now = new Date();

      if (!metodo_pago_id) {
        return res.status(400).json({ error: 'metodo_pago_id es requerido' });
      }

      const entrega = await obtenerDomicilioConOrden(id);
      if (!entrega) return res.status(404).json({ error: 'Domicilio no encontrado' });
      if (!sedePerteneceACliente(entrega.sede_id, sedeIds)) {
        return res.status(403).json({ error: 'Ese domicilio no pertenece a tu empresa' });
      }

      const sede = await db('sedes').where('id', entrega.sede_id).first();
      const requiereCaja = sede?.domicilios_requiere_caja !== false;

      let apertura = null;
      if (requiereCaja) {
        apertura = await db('aperturas_caja')
          .where('usuario_id', usuario_id)
          .where('estado', 'abierta')
          .where('activa', true)
          .first();
        if (!apertura) {
          return res.status(400).json({ error: 'No hay caja abierta' });
        }
      }

      const totalOrden = parseFloat(entrega.total);

      let factura = await db('facturas').where('orden_id', entrega.orden_id).first();
      if (!factura) {
        const [nuevaFactura] = await db('facturas').insert({
          numero_factura: `FAC-${Date.now()}`,
          orden_id: entrega.orden_id,
          sede_id: entrega.sede_id,
          subtotal: totalOrden,
          total: totalOrden,
          estado: 'cancelada',
          fecha_emision: now,
          created_at: now,
          updated_at: now,
        }).returning('*');
        factura = nuevaFactura;
      }

      await db('pago_facturas').insert({
        factura_id: factura.id,
        metodo_pago_id,
        monto: totalOrden,
        referencia: referencia || null,
        fecha_pago: now,
        created_at: now,
        updated_at: now,
      });
      await db('facturas').where('id', factura.id).update({ estado: 'cancelada', updated_at: now });

      if (requiereCaja) {
        await db('caja_movimientos').insert({
          apertura_caja_id: apertura.id,
          tipo: 'ingreso',
          monto: totalOrden,
          concepto: `Domicilio - Orden #${entrega.numero_orden} - $${totalOrden}`,
          metodo_pago_id,
          orden_id: entrega.orden_id,
          usuario_id,
          created_at: now,
          updated_at: now,
        });
      }

      await db('ordenes').where('id', entrega.orden_id).update({ estado: 'entregada', updated_at: now });

      return res.json({ success: true, data: { factura_id: factura.id, con_caja: requiereCaja } });
    } catch (err) {
      console.error('❌ Error en registrarPago (domicilio):', err.message);
      return res.status(500).json({ error: 'Error al registrar el pago', message: err.message });
    }
  },
};

module.exports = DomiciliosController;
