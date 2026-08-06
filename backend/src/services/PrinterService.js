/**
 * PrinterService — Envío de comandas a impresoras térmicas via TCP (ESC/POS)
 * Compatible con DigitalPOS DIG-E200I y cualquier impresora ESC/POS en red.
 * No requiere dependencias externas (usa el módulo net de Node.js).
 */
const net = require('net');

// ── Constantes ESC/POS ──────────────────────────────────────────────────────
const ESC  = 0x1B;
const GS   = 0x1D;
const LF   = 0x0A;
const INIT           = Buffer.from([ESC, 0x40]);            // Inicializar
const BOLD_ON        = Buffer.from([ESC, 0x45, 0x01]);
const BOLD_OFF       = Buffer.from([ESC, 0x45, 0x00]);
const ALIGN_LEFT     = Buffer.from([ESC, 0x61, 0x00]);
const ALIGN_CENTER   = Buffer.from([ESC, 0x61, 0x01]);
const ALIGN_RIGHT    = Buffer.from([ESC, 0x61, 0x02]);
const FONT_NORMAL    = Buffer.from([ESC, 0x21, 0x00]);
const FONT_DOUBLE    = Buffer.from([ESC, 0x21, 0x30]);      // doble ancho + alto
const CUT            = Buffer.from([GS, 0x56, 0x42, 0x00]); // corte parcial
const FEED           = (n = 3) => Buffer.from([ESC, 0x64, n]);

const line = (text = '') => Buffer.from(text + '\n', 'latin1');
const divider = (char = '-', len = 32) => line(char.repeat(len));
const toSafeText = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, '');
const money = (value = 0) => `$${Number(value || 0).toLocaleString('es-CO')}`;

// ── Función principal de envío ────────────────────────────────────────────────
/**
 * Envía un buffer a la impresora vía TCP.
 * @param {string} ip
 * @param {number} port
 * @param {Buffer} data
 * @returns {Promise<void>}
 */
function sendToSocket(ip, port, data) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = 7000;
    let settled = false;

    const finishOk = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const finishError = (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    const safePort = parseInt(port, 10);
    if (!ip || Number.isNaN(safePort) || safePort <= 0) {
      return finishError(new Error(`Configuracion de impresora invalida: ${ip}:${port}`));
    }

    socket.setTimeout(timeout);
    socket.setNoDelay(true);

    socket.connect(safePort, ip, () => {
      socket.end(data, (err) => {
        if (err) {
          socket.destroy();
          return finishError(err);
        }
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      finishError(new Error(`Timeout conectando a ${ip}:${safePort}`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      finishError(err);
    });

    socket.on('close', (hadError) => {
      if (!hadError) {
        finishOk();
      }
    });
  });
}

// ── Construcción de la comanda ─────────────────────────────────────────────────
/**
 * Imprime una comanda de cocina/bar.
 * @param {object} impresora  - { ip_address, puerto }
 * @param {object} comanda    - { numero_orden, mesa, zona, mesero, items, observaciones, estacion }
 */
async function imprimirComanda(impresora, comanda) {
  const { ip_address, puerto = 9100 } = impresora;
  const {
    numero_orden = '',
    mesa = '',
    zona = '',
    mesero = '',
    items = [],
    observaciones = '',
    estacion = '',
    hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    fecha = new Date().toLocaleDateString('es-CO'),
  } = comanda;

  const chunks = [
    INIT,
    ALIGN_CENTER,
    FONT_DOUBLE,
    BOLD_ON,
    line(`*** ${estacion.toUpperCase() || 'COMANDA'} ***`),
    FONT_NORMAL,
    BOLD_OFF,
    line(`Orden: ${numero_orden}`),
    line(`${fecha}  ${hora}`),
    ALIGN_LEFT,
    divider(),
    BOLD_ON,
    line(`Mesa  : ${mesa}${zona ? ' - ' + zona : ''}`),
    line(`Mesero: ${mesero}`),
    BOLD_OFF,
    divider(),
  ];

  // Items
  for (const item of items) {
    const accion = String(item.accion || '').toLowerCase();
    const prefijoAccion = accion === 'cancelado'
      ? 'X CANCELAR '
      : accion === 'reducido'
      ? '- AJUSTE '
      : accion === 'agregado'
      ? '+ '
      : '';

    chunks.push(BOLD_ON);
    chunks.push(line(`${prefijoAccion}${item.cantidad}x  ${item.nombre}`));
    chunks.push(BOLD_OFF);
    if (item.modificadores && item.modificadores.length > 0) {
      for (const mod of item.modificadores) {
        chunks.push(line(`     + ${mod}`));
      }
    }
    if (item.observaciones) {
      chunks.push(line(`     * ${item.observaciones}`));
    }
  }

  chunks.push(divider());

  if (observaciones) {
    chunks.push(BOLD_ON);
    chunks.push(line('NOTA:'));
    chunks.push(BOLD_OFF);
    chunks.push(line(observaciones));
    chunks.push(divider());
  }

  chunks.push(FEED(4));
  chunks.push(CUT);

  const data = Buffer.concat(chunks);
  await sendToSocket(ip_address, parseInt(puerto), data);
}

/**
 * Imprime una página de prueba.
 * @param {object} impresora - { ip_address, puerto, nombre }
 */
async function imprimirPrueba(impresora) {
  const { ip_address, puerto = 9100, nombre = 'Impresora' } = impresora;

  const data = Buffer.concat([
    INIT,
    ALIGN_CENTER,
    FONT_DOUBLE,
    BOLD_ON,
    line('DynamicRestoBar'),
    FONT_NORMAL,
    BOLD_OFF,
    divider(),
    line(`Impresora: ${nombre}`),
    line(`IP: ${ip_address}:${puerto}`),
    line(new Date().toLocaleString('es-CO')),
    divider(),
    BOLD_ON,
    line('** PRUEBA OK **'),
    BOLD_OFF,
    FEED(4),
    CUT,
  ]);

  await sendToSocket(ip_address, parseInt(puerto), data);
}

/**
 * Imprime una factura por red en formato tirilla ESC/POS.
 * @param {object} impresora - { ip_address, puerto, nombre }
 * @param {object} facturaData
 */
async function imprimirFactura(impresora, facturaData = {}) {
  const { ip_address, puerto = 9100 } = impresora;
  const {
    tipoDocumento = 'FACTURA',
    negocio = {},
    numeroFactura = 'N/A',
    fecha = new Date().toLocaleString('es-CO'),
    ordenNumero = '',
    mesa = '',
    mesero = '',
    items = [],
    subtotal = 0,
    impuestos = 0,
    total = 0,
    montoPagado = 0,
    cambio = 0,
    saldoPendiente = 0,
    pagos = [],
  } = facturaData;

  const nombreNegocio = toSafeText(negocio.nombre || 'DynamicRestoBar');
  const direccionNegocio = toSafeText(negocio.direccion || '');
  const ciudadNegocio = toSafeText(negocio.ciudad || '');
  const telefonoNegocio = toSafeText(negocio.telefono || '');
  const nitNegocio = toSafeText(negocio.nit || '');
  const webNegocio = toSafeText(negocio.web || '');
  const resolucionNegocio = toSafeText(negocio.resolucion || '');

  const chunks = [
    INIT,
    ALIGN_CENTER,
    FONT_DOUBLE,
    BOLD_ON,
    line(nombreNegocio.toUpperCase()),
    FONT_NORMAL,
    BOLD_OFF,
    ...(direccionNegocio ? [line(direccionNegocio)] : []),
    ...(ciudadNegocio ? [line(ciudadNegocio)] : []),
    ...(telefonoNegocio ? [line(`Tel: ${telefonoNegocio}`)] : []),
    ...(nitNegocio ? [line(`NIT: ${nitNegocio}`)] : []),
    line(toSafeText(tipoDocumento || 'FACTURA')),
    divider('='),
    ALIGN_LEFT,
    BOLD_ON,
    line(`Factura: ${toSafeText(numeroFactura)}`),
    BOLD_OFF,
    line(`Fecha  : ${toSafeText(fecha)}`),
    line(`Orden  : ${toSafeText(ordenNumero)}`),
    line(`Mesa   : ${toSafeText(mesa || 'N/A')}`),
    line(`Mesero : ${toSafeText(mesero || 'N/A')}`),
    divider(),
  ];

  for (const item of items) {
    const cantidad = Number(item.cantidad || 0);
    const nombre = toSafeText(item.producto_nombre || item.nombre || 'Producto');
    const valor = Number(item.cantidad || 0) * Number(item.precio_unitario || 0);

    chunks.push(BOLD_ON);
    chunks.push(line(`${cantidad}x ${nombre}`));
    chunks.push(BOLD_OFF);
    chunks.push(line(`    ${money(valor)}`));

    if (item.modificadores && item.modificadores.length > 0) {
      for (const mod of item.modificadores) {
        const modNombre = toSafeText(mod.nombre || mod);
        chunks.push(line(`    + ${modNombre}`));
      }
    }

    if (item.observaciones) {
      chunks.push(line(`    * ${toSafeText(item.observaciones)}`));
    }
  }

  chunks.push(divider());
  chunks.push(line(`Subtotal: ${money(subtotal)}`));
  if (Number(impuestos || 0) > 0) {
    chunks.push(line(`Impuesto: ${money(impuestos)}`));
  }
  chunks.push(BOLD_ON);
  chunks.push(line(`TOTAL   : ${money(total)}`));
  chunks.push(BOLD_OFF);
  chunks.push(divider());

  if (pagos.length > 0) {
    chunks.push(BOLD_ON);
    chunks.push(line('PAGOS:'));
    chunks.push(BOLD_OFF);
    for (const pago of pagos) {
      chunks.push(line(`- ${toSafeText(pago.metodo_nombre || 'Efectivo')}: ${money(pago.monto)}`));
      if (pago.referencia) {
        chunks.push(line(`  Ref: ${toSafeText(pago.referencia)}`));
      }
    }
  }

  chunks.push(line(`Pagado : ${money(montoPagado)}`));
  if (Number(saldoPendiente || 0) > 0) {
    chunks.push(BOLD_ON);
    chunks.push(line(`Saldo  : ${money(saldoPendiente)}`));
    chunks.push(BOLD_OFF);
  }
  if (Number(cambio || 0) > 0) {
    chunks.push(line(`Cambio : ${money(cambio)}`));
  }

  chunks.push(divider('='));
  chunks.push(ALIGN_CENTER);
  if (resolucionNegocio) {
    chunks.push(line(`Resolucion: ${resolucionNegocio}`));
  }
  if (webNegocio) {
    chunks.push(line(webNegocio));
  }
  chunks.push(BOLD_ON);
  chunks.push(line('GRACIAS POR SU VISITA'));
  chunks.push(BOLD_OFF);
  chunks.push(FEED(4));
  chunks.push(CUT);

  const data = Buffer.concat(chunks);
  await sendToSocket(ip_address, parseInt(puerto), data);
}

module.exports = { imprimirComanda, imprimirPrueba, imprimirFactura, sendToSocket };
