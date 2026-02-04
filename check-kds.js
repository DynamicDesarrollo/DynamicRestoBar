const db = require('./backend/src/config/database');

(async () => {
  try {
    console.log('=== Verificando comandas en KDS ===\n');
    
    // Simular GET /kds/estacion/8 (Cocina)
    const comandas = await db('comandas')
      .select('comandas.*', 'mesas.numero as mesa_numero')
      .leftJoin('ordenes', 'comandas.orden_id', '=', 'ordenes.id')
      .leftJoin('mesas', 'ordenes.mesa_id', '=', 'mesas.id')
      .where('comandas.estacion_id', 8)
      .whereNotIn('comandas.estado', ['entregada'])
      .orderBy('comandas.created_at', 'asc');

    console.log(`📊 Comandas para Estación 8 (Cocina): ${comandas.length}`);
    
    if (comandas.length > 0) {
      comandas.forEach((cmd, idx) => {
        console.log(`\n  ${idx + 1}. ${cmd.numero_comanda}`);
        console.log(`     Mesa: ${cmd.mesa_numero}`);
        console.log(`     Estado: ${cmd.estado}`);
        console.log(`     Orden ID: ${cmd.orden_id}`);
      });
    } else {
      console.log('  ⚠️  No hay comandas pendientes');
    }
    
    // Obtener items de la comanda
    if (comandas.length > 0) {
      console.log('\n\n=== Items de la comanda ===\n');
      const items = await db('comanda_items')
        .select(
          'comanda_items.*',
          'productos.nombre',
          'productos.descripcion'
        )
        .leftJoin('productos', 'comanda_items.producto_id', '=', 'productos.id')
        .where('comanda_items.comanda_id', comandas[0].id);
      
      items.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.nombre} x${item.cantidad}`);
        console.log(`     Notas: ${item.notas_especiales || 'Sin notas'}`);
        console.log(`     Estado: ${item.estado}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
