/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../src/config/database');

const CONFIRM_PHRASE = 'PURGE_CLIENTES_KEEP_CATALOGOS';
const CONFIRM_CORE_PHRASE = 'PURGE_CLIENTES_Y_CORE';

const OPERATIONAL_TABLES = [
  'print_jobs',
  'pago_facturas',
  'facturas',
  'cierres_caja',
  'caja_movimientos',
  'aperturas_caja',
  'comanda_items',
  'comandas',
  'orden_item_modificador',
  'orden_items',
  'domicilio_entregas',
  'ordenes',
  'auditoria_eventos',
  'kardex_movimientos',
  'compra_items',
  'compras',
  'movimientos_inventario',
  'pagos_clientes',
];

const CORE_WIPE_TABLES = [
  'receta_insumos',
  'recetas',
  'producto_variante',
  'producto_modificador',
  'combo_items',
  'combos',
  'productos',
  'insumos',
  'mesas',
];

function parseArgs(argv) {
  const args = {
    execute: false,
    confirm: '',
    wipeCore: false,
  };

  for (const raw of argv) {
    if (raw === '--execute') {
      args.execute = true;
      continue;
    }

    if (raw.startsWith('--confirm=')) {
      args.confirm = raw.split('=')[1] || '';
      continue;
    }

    if (raw === '--wipe-core') {
      args.wipeCore = true;
      continue;
    }
  }

  return args;
}

async function tableExists(name) {
  return db.schema.hasTable(name);
}

async function columnExists(tableName, columnName) {
  const hasTable = await tableExists(tableName);
  if (!hasTable) return false;
  return db.schema.hasColumn(tableName, columnName);
}

async function existingTables(candidates) {
  const found = [];
  for (const tableName of candidates) {
    // eslint-disable-next-line no-await-in-loop
    if (await tableExists(tableName)) found.push(tableName);
  }
  return found;
}

function printHeader(args) {
  console.log('==========================================================');
  console.log(' DynamicRestoBar - Purga de Cliente Anterior (Safe Mode)');
  console.log('==========================================================');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`Modo    : ${args.execute ? 'EJECUTAR' : 'DRY-RUN'}`);
  console.log(`Core    : ${args.wipeCore ? 'BORRAR productos/insumos/recetas/mesas' : 'Conservar catalogos core'}`);
  console.log('');
}

function printUsageAndExit(message = '') {
  if (message) {
    console.error(`\n❌ ${message}\n`);
  }

  console.log('Uso:');
  console.log('  node scripts/purge-old-clients-keep-catalogs.js');
  console.log('  node scripts/purge-old-clients-keep-catalogs.js --execute --confirm=PURGE_CLIENTES_KEEP_CATALOGOS');
  console.log('  node scripts/purge-old-clients-keep-catalogs.js --wipe-core --execute --confirm=PURGE_CLIENTES_Y_CORE');
  console.log('');
  console.log('Este script:');
  console.log('  1) Limpia datos operativos transaccionales.');
  console.log('  2) Elimina registros de clientes anteriores.');
  console.log('  3) Conserva catalogos (productos, categorias, insumos, recetas, etc).');
  console.log('  4) Con --wipe-core, tambien borra productos, insumos, recetas y mesas.');
  process.exit(message ? 1 : 0);
}

async function getSummary(args) {
  const summary = {};

  if (await tableExists('clientes')) {
    const row = await db('clientes').count('* as total').first();
    summary.clientes = Number(row?.total || 0);
  }

  if (await columnExists('sedes', 'cliente_id')) {
    const row = await db('sedes').whereNotNull('cliente_id').count('* as total').first();
    summary.sedes_con_cliente_id = Number(row?.total || 0);
  }

  if (await columnExists('usuarios', 'cliente_id')) {
    const row = await db('usuarios').whereNotNull('cliente_id').count('* as total').first();
    summary.usuarios_con_cliente_id = Number(row?.total || 0);
  }

  for (const tableName of await existingTables(OPERATIONAL_TABLES)) {
    // eslint-disable-next-line no-await-in-loop
    const row = await db(tableName).count('* as total').first();
    summary[tableName] = Number(row?.total || 0);
  }

  if (args.wipeCore) {
    for (const tableName of await existingTables(CORE_WIPE_TABLES)) {
      // eslint-disable-next-line no-await-in-loop
      const row = await db(tableName).count('* as total').first();
      summary[`${tableName}_core`] = Number(row?.total || 0);
    }
  }

  return summary;
}

async function runPurge(args) {
  const existingOperationalTables = await existingTables(OPERATIONAL_TABLES);
  const existingCoreTables = args.wipeCore ? await existingTables(CORE_WIPE_TABLES) : [];
  const hasClientes = await tableExists('clientes');
  const sedesHasClienteId = await columnExists('sedes', 'cliente_id');
  const usuariosHasClienteId = await columnExists('usuarios', 'cliente_id');

  if (!hasClientes) {
    throw new Error('No existe la tabla clientes.');
  }

  await db.transaction(async (trx) => {
    for (const tableName of existingOperationalTables) {
      // eslint-disable-next-line no-await-in-loop
      await trx.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
      console.log(`   ✅ ${tableName} truncada`);
    }

    if (args.wipeCore) {
      for (const tableName of existingCoreTables) {
        // eslint-disable-next-line no-await-in-loop
        await trx.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
        console.log(`   ✅ ${tableName} truncada (core)`);
      }
    }

    if (sedesHasClienteId) {
      try {
        const updated = await trx('sedes').whereNotNull('cliente_id').update({ cliente_id: null, updated_at: new Date() });
        console.log(`   ✅ sedes.cliente_id limpiado en ${updated} fila(s)`);
      } catch (e) {
        throw new Error(`No se pudo limpiar sedes.cliente_id: ${e.message}`);
      }
    }

    if (usuariosHasClienteId) {
      const deletedUsers = await trx('usuarios').whereNotNull('cliente_id').del();
      console.log(`   ✅ usuarios de cliente eliminados: ${deletedUsers}`);
    }

    const hasClienteDirecciones = await trx.schema.hasTable('cliente_direcciones');
    if (hasClienteDirecciones) {
      const deletedAddr = await trx('cliente_direcciones').del();
      console.log(`   ✅ cliente_direcciones eliminadas: ${deletedAddr}`);
    }

    const deletedClientes = await trx('clientes').del();
    console.log(`   ✅ clientes eliminados: ${deletedClientes}`);

    const hasMesas = await trx.schema.hasTable('mesas');
    if (hasMesas && !args.wipeCore) {
      const mesasUpdated = await trx('mesas').update({ estado: 'disponible', updated_at: new Date() });
      console.log(`   ✅ mesas en disponible: ${mesasUpdated}`);
    }
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsageAndExit();
    return;
  }

  printHeader(args);

  const summary = await getSummary(args);
  console.log('Resumen previo:');
  Object.entries(summary).forEach(([k, v]) => console.log(`  - ${k}: ${v}`));
  console.log('');

  if (!args.execute) {
    const expectedConfirm = args.wipeCore ? CONFIRM_CORE_PHRASE : CONFIRM_PHRASE;
    console.log('DRY-RUN completado. No se realizaron cambios.');
    console.log(`Para ejecutar usa: --execute --confirm=${expectedConfirm}`);
    return;
  }

  const expectedConfirm = args.wipeCore ? CONFIRM_CORE_PHRASE : CONFIRM_PHRASE;
  if (args.confirm !== expectedConfirm) {
    printUsageAndExit(`Confirmacion invalida. Debe ser: ${expectedConfirm}`);
    return;
  }

  console.log('⚠️ Ejecutando purga real...');
  await runPurge(args);
  console.log('');
  console.log('🎉 Purga completada. Puedes crear cliente nuevo desde cero.');
}

main()
  .catch((err) => {
    console.error(`\n❌ Error: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
