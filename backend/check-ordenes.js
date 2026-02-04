const db = require('./src/config/database');

async function checkOrdenes() {
  try {
    // Ver todas las órdenes
    const ordenes = await db('ordenes')
      .select('id', 'numero_orden', 'estado', 'total', 'mesa_id', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(10);
    
    console.log('📋 Últimas 10 órdenes:');
    for (const orden of ordenes) {
      // Calcular monto pagado desde pago_facturas
      const result = await db.raw(`
        SELECT COALESCE(SUM(pf.monto), 0) as total_pagado
        FROM pago_facturas pf
        INNER JOIN facturas f ON pf.factura_id = f.id
        WHERE f.orden_id = ?
      `, [orden.id]);
      
      const montoPagado = result.rows[0]?.total_pagado || 0;
      
      console.log(`  - #${orden.numero_orden} | Estado: ${orden.estado} | Total: $${orden.total} | Pagado: $${montoPagado} | Mesa: ${orden.mesa_id}`);
    }
    
    // Contar por estado
    const porEstado = await db('ordenes')
      .select('estado')
      .count('* as cantidad')
      .groupBy('estado');
    
    console.log('\n📊 Órdenes por estado:');
    porEstado.forEach(e => {
      console.log(`  - ${e.estado}: ${e.cantidad}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkOrdenes();
