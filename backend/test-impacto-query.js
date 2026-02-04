const db = require('./src/config/database');

async function testImpactoQuery() {
  try {
    console.log('🔍 Probando consulta de impacto...\n');

    const sedeId = 3;
    const fecha_inicio = '2026-01-01';
    const fecha_fin = '2026-01-26';

    // Obtener productos vendidos
    let query = db('orden_items')
      .leftJoin('ordenes', 'orden_items.orden_id', 'ordenes.id')
      .leftJoin('productos', 'orden_items.producto_id', 'productos.id')
      .where('ordenes.sede_id', sedeId)
      .where('ordenes.estado', 'entregada');

    if (fecha_inicio) {
      query = query.where(db.raw('DATE(ordenes.created_at)'), '>=', fecha_inicio);
    }

    if (fecha_fin) {
      query = query.where(db.raw('DATE(ordenes.created_at)'), '<=', fecha_fin);
    }

    const productosVendidos = await query
      .select(
        'productos.id as producto_id',
        'productos.nombre as producto_nombre',
        db.raw('SUM(orden_items.cantidad) as cantidad_vendida')
      )
      .groupBy('productos.id', 'productos.nombre')
      .orderBy(db.raw('SUM(orden_items.cantidad)'), 'desc');

    console.log(`📊 Productos vendidos: ${productosVendidos.length}`);
    productosVendidos.forEach(p => {
      console.log(`   - ${p.producto_nombre}: ${p.cantidad_vendida} unidades`);
    });

    // Para cada producto, buscar su receta
    console.log('\n🔍 Buscando recetas...');
    for (const producto of productosVendidos) {
      const receta = await db('recetas')
        .where('producto_id', producto.producto_id)
        .first();

      if (receta) {
        console.log(`\n✅ Receta encontrada para ${producto.producto_nombre}:`);
        
        const insumosReceta = await db('receta_insumos')
          .leftJoin('insumos', 'receta_insumos.insumo_id', 'insumos.id')
          .where('receta_insumos.receta_id', receta.id)
          .select(
            'insumos.id as insumo_id',
            'insumos.nombre as insumo_nombre',
            'insumos.stock_actual',
            'insumos.stock_minimo',
            'receta_insumos.cantidad as cantidad_por_unidad'
          );

        console.log(`   Insumos (${insumosReceta.length}):`);
        insumosReceta.forEach(i => {
          const consumo = i.cantidad_por_unidad * producto.cantidad_vendida;
          console.log(`      - ${i.insumo_nombre}: ${i.cantidad_por_unidad} x ${producto.cantidad_vendida} = ${consumo.toFixed(2)} consumido`);
          console.log(`        Stock actual: ${i.stock_actual}, Mínimo: ${i.stock_minimo}`);
        });
      } else {
        console.log(`\n⚠️  NO hay receta para ${producto.producto_nombre}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testImpactoQuery();
