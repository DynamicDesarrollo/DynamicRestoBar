/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../src/config/database');

const CONFIRM_PHRASE = 'RESET_PRODUCCION';

const PROFILES = {
  operacion: [
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
  ],
  total: [
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
  ],
};

function parseArgs(argv) {
  const args = {
    execute: false,
    profile: 'operacion',
    confirm: '',
  };

  for (const raw of argv) {
    if (raw === '--execute') {
      args.execute = true;
      continue;
    }

    if (raw.startsWith('--profile=')) {
      args.profile = raw.split('=')[1] || args.profile;
      continue;
    }

    if (raw.startsWith('--confirm=')) {
      args.confirm = raw.split('=')[1] || '';
      continue;
    }
  }

  return args;
}

async function existingTables(candidates) {
  const found = [];
  for (const tableName of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await db.schema.hasTable(tableName);
    if (exists) found.push(tableName);
  }
  return found;
}

function printHeader(args) {
  console.log('==============================================');
  console.log(' DynamicRestoBar - Reset de Datos Produccion');
  console.log('==============================================');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`Perfil  : ${args.profile}`);
  console.log(`Modo    : ${args.execute ? 'EJECUTAR' : 'DRY-RUN'}`);
  console.log('');
}

function printUsageAndExit(message = '') {
  if (message) {
    console.error(`\n❌ ${message}\n`);
  }

  console.log('Uso:');
  console.log('  node scripts/reset-production-data.js --profile=operacion');
  console.log('  node scripts/reset-production-data.js --profile=operacion --execute --confirm=RESET_PRODUCCION');
  console.log('  node scripts/reset-production-data.js --profile=total --execute --confirm=RESET_PRODUCCION');
  console.log('');
  console.log('Perfiles:');
  console.log('  operacion -> limpia ventas/comandas/caja/print_jobs y auditoria.');
  console.log('  total     -> operacion + compras/kardex/movimientos extra.');
  console.log('');
  console.log('Tablas preservadas (no se tocan): usuarios, productos, categorias, mesas (solo estado),');
  console.log('sedes, estaciones, impresoras, configuracion, recetas, insumos y catalogos base.');
  process.exit(message ? 1 : 0);
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  if (!PROFILES[args.profile]) {
    printUsageAndExit(`Perfil invalido: ${args.profile}`);
  }

  printHeader(args);

  const targetTables = PROFILES[args.profile];
  const tables = await existingTables(targetTables);

  console.log('Tablas objetivo encontradas:');
  for (const tableName of tables) {
    console.log(`  - ${tableName}`);
  }

  if (tables.length === 0) {
    throw new Error('No se encontro ninguna tabla objetivo para limpiar.');
  }

  console.log('');

  if (!args.execute) {
    console.log('DRY-RUN completado. No se ejecuto ningun cambio.');
    console.log('Para ejecutar de verdad usa: --execute --confirm=RESET_PRODUCCION');
    return;
  }

  if (args.confirm !== CONFIRM_PHRASE) {
    throw new Error(`Confirmacion invalida. Debes usar --confirm=${CONFIRM_PHRASE}`);
  }

  console.log('⚠️  Ejecutando limpieza REAL...');

  await db.transaction(async (trx) => {
    for (const tableName of tables) {
      // eslint-disable-next-line no-await-in-loop
      await trx.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
      console.log(`   ✅ ${tableName} truncada`);
    }

    if (await trx.schema.hasTable('mesas')) {
      const now = new Date();
      const updated = await trx('mesas').update({
        estado: 'disponible',
        updated_at: now,
      });
      console.log(`   ✅ mesas reseteadas a disponible (${updated})`);
    }
  });

  console.log('');
  console.log('🎉 Limpieza finalizada correctamente.');
}

run()
  .catch((error) => {
    console.error('');
    console.error(`❌ Error: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
