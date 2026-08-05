/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { imprimirComanda, imprimirPrueba, imprimirFactura } = require('../src/services/PrinterService');

const BRIDGE_API_URL = process.env.BRIDGE_API_URL;
const BRIDGE_TOKEN = process.env.PRINT_BRIDGE_TOKEN;
const BRIDGE_SEDE_ID = Number(process.env.BRIDGE_SEDE_ID || 0);
const BRIDGE_AGENT_ID = process.env.BRIDGE_AGENT_ID || `bridge-${require('os').hostname()}`;
const POLL_MS = Number(process.env.BRIDGE_POLL_MS || 2500);

if (!BRIDGE_API_URL || !BRIDGE_TOKEN || !BRIDGE_SEDE_ID) {
  console.error('❌ Configuración incompleta para print bridge agent.');
  console.error('   Requiere BRIDGE_API_URL, PRINT_BRIDGE_TOKEN y BRIDGE_SEDE_ID.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callBridge(path, options = {}) {
  const res = await fetch(`${BRIDGE_API_URL}${path}`, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bridge-token': BRIDGE_TOKEN,
      'x-bridge-id': BRIDGE_AGENT_ID,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bridge API ${res.status}: ${text}`);
  }

  return res.json();
}

async function processJob(job) {
  const payload = job.payload || {};
  const impresora = payload.impresora;

  if (!impresora?.ip_address || !impresora?.puerto) {
    throw new Error('Job inválido: falta impresora.ip_address/puerto');
  }

  if (job.tipo === 'prueba') {
    await imprimirPrueba(impresora);
    return;
  }

  if (job.tipo === 'comanda') {
    await imprimirComanda(impresora, payload.comanda || {});
    return;
  }

  if (job.tipo === 'factura') {
    await imprimirFactura(impresora, payload.factura || {});
    return;
  }

  throw new Error(`Tipo de job no soportado: ${job.tipo}`);
}

async function main() {
  console.log('==========================================');
  console.log(' DynamicRestoBar Print Bridge Agent');
  console.log('==========================================');
  console.log(`API: ${BRIDGE_API_URL}`);
  console.log(`SEDE: ${BRIDGE_SEDE_ID}`);
  console.log(`AGENT: ${BRIDGE_AGENT_ID}`);
  console.log(`POLL: ${POLL_MS}ms`);

  while (true) {
    try {
      const next = await callBridge(`/jobs/next/${BRIDGE_SEDE_ID}`);
      const job = next?.data;

      if (!job) {
        await sleep(POLL_MS);
        continue;
      }

      console.log(`🧾 Job #${job.id} (${job.tipo}) recibido...`);

      try {
        await processJob(job);
        await callBridge(`/jobs/${job.id}/done`, { method: 'POST' });
        console.log(`✅ Job #${job.id} completado`);
      } catch (jobErr) {
        await callBridge(`/jobs/${job.id}/failed`, {
          method: 'POST',
          body: { error: jobErr.message || 'Error de impresión' },
        });
        console.error(`❌ Job #${job.id} falló: ${jobErr.message}`);
      }
    } catch (err) {
      console.error(`⚠️ Error consultando bridge: ${err.message}`);
      await sleep(Math.max(POLL_MS, 5000));
    }
  }
}

main();
