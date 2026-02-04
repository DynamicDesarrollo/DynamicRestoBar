const db = require('./backend/src/config/database');

(async () => {
  try {
    console.log('=== Verificando estado actual ===\n');
    
    // Mesas
    const mesas = await db('mesas').select('*');
    console.log(`📊 Mesas: ${mesas.length} registros`);
    mesas.forEach(m => console.log(`  - Mesa ${m.numero} (ID: ${m.id}): ${m.estado}`));
    
    // Órdenes
    const ordenes = await db('ordenes').select('*');
    console.log(`\n📋 Órdenes: ${ordenes.length} registros`);
    ordenes.forEach(o => console.log(`  - ${o.numero_orden} (Mesa: ${o.mesa_id}, Estado: ${o.estado})`));
    
    // Comandas
    const comandas = await db('comandas').select('*');
    console.log(`\n🍽️  Comandas: ${comandas.length} registros`);
    comandas.forEach(c => console.log(`  - ${c.numero_comanda} (Orden: ${c.orden_id}, Estación: ${c.estacion_id}, Estado: ${c.estado})`));
    
    // Estaciones
    const estaciones = await db('estaciones').select('*');
    console.log(`\n🏪 Estaciones: ${estaciones.length} registros`);
    estaciones.forEach(e => console.log(`  - ID: ${e.id}, Nombre: ${e.nombre}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
