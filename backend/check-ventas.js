const db = require('./src/config/database');

async function checkVentasData() {
  try {
    console.log('🔍 Verificando datos de ventas...\n');

    // Verificar órdenes
    const ordenes = await db('ordenes')
      .select('id', 'numero_orden', 'estado', 'total', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(10);

    console.log(`📊 Total órdenes: ${ordenes.length}`);
    ordenes.forEach(o => {
      console.log(`   - Orden #${o.numero_orden}: ${o.estado} - $${o.total} (${new Date(o.created_at).toLocaleDateString()})`);
    });

    // Verificar facturas
    const facturas = await db('facturas')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(5);

    console.log(`\n💰 Total facturas: ${facturas.length}`);
    facturas.forEach(f => {
      console.log(`   - Factura #${f.numero_factura}: Orden ${f.orden_id} - Total: $${f.total}`);
    });

    // Verificar pagos
    const pagos = await db('pago_facturas')
      .leftJoin('facturas', 'pago_facturas.factura_id', 'facturas.id')
      .leftJoin('metodos_pago', 'pago_facturas.metodo_pago_id', 'metodos_pago.id')
      .select(
        'pago_facturas.*',
        'facturas.numero_factura',
        'facturas.orden_id',
        'metodos_pago.nombre as metodo_nombre'
      )
      .orderBy('pago_facturas.created_at', 'desc')
      .limit(5);

    console.log(`\n💵 Total pagos: ${pagos.length}`);
    pagos.forEach(p => {
      console.log(`   - Pago: Orden ${p.orden_id} - $${p.monto} (${p.metodo_nombre})`);
    });

    // Verificar recetas
    const recetas = await db('recetas')
      .leftJoin('productos', 'recetas.producto_id', 'productos.id')
      .select('recetas.*', 'productos.nombre as producto_nombre')
      .limit(5);

    console.log(`\n🍽️  Recetas encontradas: ${recetas.length}`);
    recetas.forEach(r => {
      console.log(`   - ${r.producto_nombre} (Receta ID: ${r.id})`);
    });

    // Verificar insumos de recetas
    if (recetas.length > 0) {
      const insumosReceta = await db('receta_insumos')
        .where('receta_id', recetas[0].id)
        .leftJoin('insumos', 'receta_insumos.insumo_id', 'insumos.id')
        .select('receta_insumos.*', 'insumos.nombre as insumo_nombre');

      console.log(`\n📦 Insumos de "${recetas[0].producto_nombre}":`);
      insumosReceta.forEach(i => {
        console.log(`   - ${i.insumo_nombre}: ${i.cantidad} unidades`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

checkVentasData();
