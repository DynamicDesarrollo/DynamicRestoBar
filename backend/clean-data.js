/**
 * Script para limpiar todos los datos de órdenes, comandas y pagos
 * Mantiene intactos: usuarios, productos, mesas, configuración
 * Pone todas las mesas en estado 'disponible'
 */

const db = require('./src/config/database');

async function limpiarDatos() {
  try {
    console.log('🧹 Iniciando limpieza de datos...\n');

    // 1. Limpiar comanda_items
    console.log('1️⃣ Limpiando comanda_items...');
    try {
      await db('comanda_items').del();
      console.log('   ✅ Items de comandas eliminados\n');
    } catch (e) {
      console.log('   ⚠️  Tabla no existe o error:\n');
    }

    // 2. Limpiar orden_item_modificador
    console.log('2️⃣ Limpiando orden_item_modificador...');
    try {
      await db('orden_item_modificador').del();
      console.log('   ✅ Modificadores de items eliminados\n');
    } catch (e) {
      console.log('   ⚠️  Tabla no existe o error\n');
    }

    // 3. Limpiar orden_items
    console.log('3️⃣ Limpiando orden_items...');
    try {
      await db('orden_items').del();
      console.log('   ✅ Items de órdenes eliminados\n');
    } catch (e) {
      console.log('   ⚠️  Tabla no existe o error\n');
    }

    // 4. Limpiar comandas
    console.log('4️⃣ Limpiando comandas...');
    try {
      await db('comandas').del();
      console.log('   ✅ Comandas eliminadas\n');
    } catch (e) {
      console.log('   ⚠️  Tabla no existe o error\n');
    }

    // 5. Limpiar ordenes
    console.log('5️⃣ Limpiando órdenes...');
    try {
      await db('ordenes').del();
      console.log('   ✅ Órdenes eliminadas\n');
    } catch (e) {
      console.log('   ⚠️  Tabla no existe o error\n');
    }

    // 6. Resetear todas las mesas a 'disponible'
    console.log('6️⃣ Reseteando mesas a disponible...');
    const mesasActualizadas = await db('mesas').update({
      estado: 'disponible',
      updated_at: new Date(),
    });
    console.log(`   ✅ ${mesasActualizadas} mesas actualizadas a "disponible"\n`);

    // 7. Verificar estado final
    console.log('7️⃣ Verificando estado final...');
    const ordenes = await db('ordenes').count('* as count').first();
    const comandas = await db('comandas').count('* as count').first();
    const ordenItems = await db('orden_items').count('* as count').first();
    const mesasDisponibles = await db('mesas')
      .where('estado', 'disponible')
      .count('* as count')
      .first();

    console.log('   📊 ESTADO FINAL:');
    console.log(`      - Órdenes: ${ordenes.count}`);
    console.log(`      - Comandas: ${comandas.count}`);
    console.log(`      - Items de órdenes: ${ordenItems.count}`);
    console.log(`      - Mesas disponibles: ${mesasDisponibles.count}\n`);

    console.log('✨ ¡LIMPIEZA COMPLETADA EXITOSAMENTE!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error durante la limpieza:', err.message);
    console.error(err);
    process.exit(1);
  }
}

limpiarDatos();
