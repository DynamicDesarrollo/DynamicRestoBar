/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../src/config/database');

const CONFIRM_PHRASE = 'RESET_SEDE';

function parseArgs(argv) {
  const args = {
    sedeId: null,
    execute: false,
    confirm: '',
  };

  for (const raw of argv) {
    if (raw === '--execute') {
      args.execute = true;
      continue;
    }

    if (raw.startsWith('--sedeId=')) {
      const value = raw.split('=')[1];
      args.sedeId = Number(value);
      continue;
    }

    if (raw.startsWith('--confirm=')) {
      args.confirm = raw.split('=')[1] || '';
      continue;
    }
  }

  return args;
}

function usageAndExit(message = '') {
  if (message) {
    console.error(`\n❌ ${message}\n`);
  }

  console.log('Uso:');
  console.log('  node scripts/reset-sede-data.js --sedeId=19');
  console.log('  node scripts/reset-sede-data.js --sedeId=19 --execute --confirm=RESET_SEDE');
  console.log('');
  console.log('Notas:');
  console.log('  - Sin --execute corre en DRY-RUN (no borra nada).');
  console.log('  - Solo limpia datos operativos de la sede indicada.');
  console.log('  - No toca catalogos base (productos, categorias, usuarios, impresoras, estaciones).');
  process.exit(message ? 1 : 0);
}

async function sedeExists(sedeId) {
  const exists = await db.schema.hasTable('sedes');
  if (!exists) return false;
  const row = await db('sedes').where('id', sedeId).first('id');
  return Boolean(row);
}

async function dryRunSummary(sedeId) {
  const resumen = {};

  const ordenes = await db('ordenes').where('sede_id', sedeId).count('* as total').first();
  resumen.ordenes = Number(ordenes?.total || 0);

  const ordenItems = await db('orden_items as oi')
    .join('ordenes as o', 'o.id', 'oi.orden_id')
    .where('o.sede_id', sedeId)
    .count('* as total')
    .first();
  resumen.orden_items = Number(ordenItems?.total || 0);

  const comandas = await db('comandas as c')
    .join('ordenes as o', 'o.id', 'c.orden_id')
    .where('o.sede_id', sedeId)
    .count('* as total')
    .first();
  resumen.comandas = Number(comandas?.total || 0);

  const comandaItems = await db('comanda_items as ci')
    .join('comandas as c', 'c.id', 'ci.comanda_id')
    .join('ordenes as o', 'o.id', 'c.orden_id')
    .where('o.sede_id', sedeId)
    .count('* as total')
    .first();
  resumen.comanda_items = Number(comandaItems?.total || 0);

  const facturas = await db('facturas').where('sede_id', sedeId).count('* as total').first();
  resumen.facturas = Number(facturas?.total || 0);

  const pagosFactura = await db('pago_facturas as pf')
    .join('facturas as f', 'f.id', 'pf.factura_id')
    .where('f.sede_id', sedeId)
    .count('* as total')
    .first();
  resumen.pago_facturas = Number(pagosFactura?.total || 0);

  const aperturas = await db('aperturas_caja').where('sede_id', sedeId).count('* as total').first();
  resumen.aperturas_caja = Number(aperturas?.total || 0);

  const movimientosCaja = await db('caja_movimientos as cm')
    .join('aperturas_caja as ac', 'ac.id', 'cm.apertura_caja_id')
    .where('ac.sede_id', sedeId)
    .count('* as total')
    .first();
  resumen.caja_movimientos = Number(movimientosCaja?.total || 0);

  const cierresCaja = await db('cierres_caja as cc')
    .join('aperturas_caja as ac', 'ac.id', 'cc.apertura_caja_id')
    .where('ac.sede_id', sedeId)
    .count('* as total')
    .first();
  resumen.cierres_caja = Number(cierresCaja?.total || 0);

  const printJobsExists = await db.schema.hasTable('print_jobs');
  if (printJobsExists) {
    const printJobs = await db('print_jobs').where('sede_id', sedeId).count('* as total').first();
    resumen.print_jobs = Number(printJobs?.total || 0);
  }

  const auditoriaExists = await db.schema.hasTable('auditoria_eventos');
  if (auditoriaExists) {
    const auditoria = await db('auditoria_eventos').where('sede_id', sedeId).count('* as total').first();
    resumen.auditoria_eventos = Number(auditoria?.total || 0);
  }

  const domicilioExists = await db.schema.hasTable('domicilio_entregas');
  if (domicilioExists) {
    const domicilio = await db('domicilio_entregas as de')
      .join('ordenes as o', 'o.id', 'de.orden_id')
      .where('o.sede_id', sedeId)
      .count('* as total')
      .first();
    resumen.domicilio_entregas = Number(domicilio?.total || 0);
  }

  return resumen;
}

async function runDeleteBySede(sedeId) {
  await db.transaction(async (trx) => {
    await trx.raw(
      `DELETE FROM comanda_items ci
       USING comandas c, ordenes o
       WHERE ci.comanda_id = c.id
         AND c.orden_id = o.id
         AND o.sede_id = ?`,
      [sedeId]
    );

    await trx.raw(
      `DELETE FROM orden_item_modificador oim
       USING orden_items oi, ordenes o
       WHERE oim.orden_item_id = oi.id
         AND oi.orden_id = o.id
         AND o.sede_id = ?`,
      [sedeId]
    );

    const domicilioExists = await trx.schema.hasTable('domicilio_entregas');
    if (domicilioExists) {
      await trx.raw(
        `DELETE FROM domicilio_entregas de
         USING ordenes o
         WHERE de.orden_id = o.id
           AND o.sede_id = ?`,
        [sedeId]
      );
    }

    await trx.raw(
      `DELETE FROM pago_facturas pf
       USING facturas f
       WHERE pf.factura_id = f.id
         AND f.sede_id = ?`,
      [sedeId]
    );

    await trx('facturas').where('sede_id', sedeId).del();

    await trx.raw(
      `DELETE FROM cierres_caja cc
       USING aperturas_caja ac
       WHERE cc.apertura_caja_id = ac.id
         AND ac.sede_id = ?`,
      [sedeId]
    );

    await trx.raw(
      `DELETE FROM caja_movimientos cm
       USING aperturas_caja ac
       WHERE cm.apertura_caja_id = ac.id
         AND ac.sede_id = ?`,
      [sedeId]
    );

    await trx('aperturas_caja').where('sede_id', sedeId).del();

    const printJobsExists = await trx.schema.hasTable('print_jobs');
    if (printJobsExists) {
      await trx('print_jobs').where('sede_id', sedeId).del();
    }

    const auditoriaExists = await trx.schema.hasTable('auditoria_eventos');
    if (auditoriaExists) {
      await trx('auditoria_eventos').where('sede_id', sedeId).del();
    }

    await trx.raw(
      `DELETE FROM comandas c
       USING ordenes o
       WHERE c.orden_id = o.id
         AND o.sede_id = ?`,
      [sedeId]
    );

    await trx.raw(
      `DELETE FROM orden_items oi
       USING ordenes o
       WHERE oi.orden_id = o.id
         AND o.sede_id = ?`,
      [sedeId]
    );

    await trx('ordenes').where('sede_id', sedeId).del();

    await trx('mesas')
      .where('sede_id', sedeId)
      .update({ estado: 'disponible', updated_at: new Date() });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.sedeId || Number.isNaN(args.sedeId) || args.sedeId <= 0) {
    usageAndExit('Debes indicar --sedeId con un numero valido.');
  }

  const exists = await sedeExists(args.sedeId);
  if (!exists) {
    throw new Error(`No existe la sede ${args.sedeId}.`);
  }

  console.log('==============================================');
  console.log(' DynamicRestoBar - Reset por Sede');
  console.log('==============================================');
  console.log(`Sede   : ${args.sedeId}`);
  console.log(`Modo   : ${args.execute ? 'EJECUTAR' : 'DRY-RUN'}`);
  console.log('');

  const resumen = await dryRunSummary(args.sedeId);
  console.log('Resumen de filas objetivo:');
  Object.entries(resumen).forEach(([tabla, total]) => {
    console.log(`  - ${tabla}: ${total}`);
  });
  console.log('');

  if (!args.execute) {
    console.log('DRY-RUN completado. No se borraron datos.');
    console.log('Para ejecutar de verdad usa: --execute --confirm=RESET_SEDE');
    return;
  }

  if (args.confirm !== CONFIRM_PHRASE) {
    throw new Error(`Confirmacion invalida. Usa --confirm=${CONFIRM_PHRASE}`);
  }

  await runDeleteBySede(args.sedeId);

  console.log('✅ Limpieza por sede completada.');
}

main()
  .catch((err) => {
    console.error(`\n❌ Error: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
