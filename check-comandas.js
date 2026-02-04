const db = require('./backend/src/config/database');

(async () => {
  try {
    console.log('\n=== ESTADO DE COMANDAS ===\n');
    
    const comandas = await db('comandas')
      .select('comandas.*', 'ordenes.numero_orden', 'mesas.numero as mesa_numero')
      .leftJoin('ordenes', 'comandas.orden_id', '=', 'ordenes.id')
      .leftJoin('mesas', 'ordenes.mesa_id', '=', 'mesas.id')
      .orderBy('comandas.created_at', 'desc')
      .limit(10);
    
    console.log(`📊 Total de comandas: ${comandas.length}\n`);
    
    comandas.forEach(cmd => {
      console.log(`🍽️  ${cmd.numero_comanda}`);
      console.log(`   Orden: ${cmd.numero_orden}`);
      console.log(`   Mesa: ${cmd.mesa_numero}`);
      console.log(`   Estación: ${cmd.estacion_id}`);
      console.log(`   Estado: ${cmd.estado}`);
      console.log(`   Creada: ${cmd.created_at}\n`);
    });
    
    // Agrupar por estado
    const porEstado = {};
    comandas.forEach(cmd => {
      porEstado[cmd.estado] = (porEstado[cmd.estado] || 0) + 1;
    });
    
    console.log('\n=== RESUMEN POR ESTADO ===\n');
    Object.entries(porEstado).forEach(([estado, count]) => {
      console.log(`${estado}: ${count}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
