const { imprimirComanda, imprimirPrueba } = require('./PrinterService');
const PrintJobService = require('./PrintJobService');

const isBridgeMode = () => (process.env.PRINT_DELIVERY_MODE || '').toLowerCase() === 'bridge';

class PrintDispatchService {
  static async dispatchPrueba({ impresora, sedeId, clienteId = null }) {
    if (!isBridgeMode()) {
      await imprimirPrueba(impresora);
      return { mode: 'direct' };
    }

    const job = await PrintJobService.enqueue({
      clienteId,
      sedeId,
      impresoraId: impresora.id,
      tipo: 'prueba',
      payload: {
        impresora,
      },
    });

    return { mode: 'bridge', jobId: job.id };
  }

  static async dispatchComanda({ impresora, payload, sedeId, clienteId = null }) {
    if (!isBridgeMode()) {
      await imprimirComanda(impresora, payload);
      return { mode: 'direct' };
    }

    const job = await PrintJobService.enqueue({
      clienteId,
      sedeId,
      impresoraId: impresora.id,
      tipo: 'comanda',
      payload: {
        impresora,
        comanda: payload,
      },
    });

    return { mode: 'bridge', jobId: job.id };
  }
}

module.exports = PrintDispatchService;
