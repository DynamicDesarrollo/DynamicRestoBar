/**
 * FacturaElectronicaService
 *
 * Arma el JSON de una factura (emisor, comprador, ítems, pagos) y lo envía
 * por POST a la app puente que integra con Aliaddo. Esa app todavía no
 * existe — la URL y la API key se leen de variables de entorno que hoy
 * están vacías; mientras no se configuren, el envío simplemente se omite
 * y la factura queda "pendiente" (nunca rota, nunca bloquea el cobro).
 *
 * A propósito NO firma nada, no calcula CUFE ni genera XML — eso lo hace
 * el proveedor tecnológico autorizado (Aliaddo) del otro lado. Aquí solo
 * se entrega el dato limpio.
 */

const axios = require('axios');
const db = require('../config/database');

const BRIDGE_URL = process.env.FACTURACION_BRIDGE_URL || '';
const BRIDGE_API_KEY = process.env.FACTURACION_BRIDGE_API_KEY || '';

const construirPayload = async (facturaId) => {
  const factura = await db('facturas').where('id', facturaId).first();
  if (!factura) {
    throw new Error(`Factura #${facturaId} no encontrada`);
  }

  const comprador = await db('factura_compradores').where('factura_id', facturaId).first();
  if (!comprador) {
    throw new Error(`La factura #${facturaId} no tiene comprador capturado`);
  }

  const orden = await db('ordenes').where('id', factura.orden_id).first();

  const sede = await db('sedes').where('id', factura.sede_id).whereNull('deleted_at').first();

  // El emisor (la empresa dueña del restaurante) se resuelve por
  // sede.cliente_id, no por búsquedas ambiguas — esa columna existe y es
  // confiable desde la migración 20260909000001.
  const clienteEmpresa = sede?.cliente_id
    ? await db('clientes').where('id', sede.cliente_id).whereNull('deleted_at').first()
    : null;

  const configRows = await db('configuracion')
    .select('clave', 'valor')
    .where('sede_id', factura.sede_id)
    .whereIn('clave', ['nombre_negocio', 'nit', 'numero_nit', 'numero_resolucion', 'web']);
  const config = configRows.reduce((acc, row) => ({ ...acc, [row.clave]: row.valor }), {});

  const items = await db('orden_items as oi')
    .select(
      'oi.cantidad',
      'oi.precio_unitario',
      'oi.subtotal',
      'p.nombre as producto_nombre',
      'p.tipo_impuesto',
      'p.porcentaje_impuesto'
    )
    .leftJoin('productos as p', 'oi.producto_id', 'p.id')
    .where('oi.orden_id', factura.orden_id);

  const pagos = await db('pago_facturas as pf')
    .select(
      'pf.monto',
      'pf.referencia',
      'pf.fecha_pago',
      'mp.nombre as metodo_nombre',
      'mp.codigo_dian'
    )
    .leftJoin('metodos_pago as mp', 'pf.metodo_pago_id', 'mp.id')
    .where('pf.factura_id', facturaId)
    .orderBy('pf.fecha_pago', 'asc');

  return {
    // Ids internos de DynamicRestoBar, para que la app puente pueda
    // avisar de vuelta a qué factura corresponde una respuesta (CUFE,
    // estado DIAN, etc.) cuando exista ese camino de vuelta.
    referenciaInterna: {
      facturaId: factura.id,
      ordenId: factura.orden_id,
      sedeId: factura.sede_id,
      clienteId: sede?.cliente_id || null,
    },
    emisor: {
      nombre: config.nombre_negocio || sede?.nombre || clienteEmpresa?.nombre || '',
      nit: config.nit || config.numero_nit || clienteEmpresa?.documento || '',
      direccion: sede?.direccion || '',
      ciudad: sede?.ciudad || '',
      telefono: sede?.telefono || clienteEmpresa?.telefono || '',
      email: sede?.email || clienteEmpresa?.email || '',
      resolucionDian: config.numero_resolucion || '',
    },
    comprador: {
      tipoDocumento: comprador.tipo_documento,
      numeroDocumento: comprador.numero_documento,
      nombreRazonSocial: comprador.nombre_razon_social,
      email: comprador.email || null,
      telefono: comprador.telefono || null,
      direccion: comprador.direccion || null,
    },
    factura: {
      numero: factura.numero_factura,
      fechaEmision: factura.fecha_emision,
      subtotal: Number(factura.subtotal) || 0,
      total: Number(factura.total) || 0,
      moneda: 'COP',
    },
    items: items.map((it) => ({
      descripcion: it.producto_nombre || 'Producto',
      cantidad: Number(it.cantidad) || 0,
      precioUnitario: Number(it.precio_unitario) || 0,
      subtotal: Number(it.subtotal) || 0,
      // null hasta que el contador confirme el régimen (ver migración
      // 20260909000006) — la app puente debe tratar null como "sin
      // definir", nunca asumir 0% ni excluido.
      tipoImpuesto: it.tipo_impuesto || null,
      porcentajeImpuesto: it.porcentaje_impuesto != null ? Number(it.porcentaje_impuesto) : null,
    })),
    pagos: pagos.map((p) => ({
      monto: Number(p.monto) || 0,
      metodoPago: p.metodo_nombre || 'Sin especificar',
      // null hasta confirmar con Aliaddo el código de billeteras (Nequi/
      // Daviplata) — ver migración 20260909000007.
      codigoDian: p.codigo_dian || null,
      referencia: p.referencia || null,
      fecha: p.fecha_pago,
    })),
    orden: orden
      ? { numeroOrden: orden.numero_orden }
      : null,
  };
};

class FacturaElectronicaService {
  /** Solo arma y devuelve el JSON — no envía nada. Útil para inspeccionar. */
  static async construirPayload(facturaId) {
    return construirPayload(facturaId);
  }

  /**
   * Arma el payload y lo envía a la app puente. Nunca lanza para el
   * llamador "en caliente" (registrarPago) — cualquier falla se atrapa,
   * se registra en log y la factura queda 'pendiente' para reintentar
   * (nunca 'rechazada': eso se reserva para cuando el puente devuelva un
   * rechazo real, no para un simple error de red).
   */
  static async enviarFactura(facturaId) {
    let payload;
    try {
      payload = await construirPayload(facturaId);
    } catch (err) {
      console.error(`❌ No se pudo armar el payload de factura electrónica #${facturaId}:`, err.message);
      return { enviado: false, motivo: err.message };
    }

    if (!BRIDGE_URL) {
      console.warn(`⚠️ FACTURACION_BRIDGE_URL no configurada — factura #${facturaId} queda pendiente de envío.`);
      return { enviado: false, motivo: 'bridge_no_configurado', payload };
    }

    try {
      const response = await axios.post(BRIDGE_URL, payload, {
        headers: BRIDGE_API_KEY ? { Authorization: `Bearer ${BRIDGE_API_KEY}` } : {},
        timeout: 10000,
      });

      await db('facturas').where('id', facturaId).update({
        estado_envio_dian: 'enviada',
        updated_at: new Date(),
      });

      console.log(`🧾 Factura electrónica #${facturaId} enviada a la app puente.`);
      return { enviado: true, respuesta: response.data, payload };
    } catch (err) {
      console.error(`❌ Error enviando factura electrónica #${facturaId} a la app puente:`, err.message);
      return { enviado: false, motivo: err.message, payload };
    }
  }
}

module.exports = FacturaElectronicaService;
