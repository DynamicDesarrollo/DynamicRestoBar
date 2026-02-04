const db = require('./backend/src/config/database');

(async () => {
  try {
    console.log('\n=== LIMPIANDO DATOS ANTERIORES ===\n');
    
    // Limpiar datos anteriores
    await db('comanda_items').del();
    await db('comandas').del();
    await db('orden_items').del();
    await db('ordenes').del();
    
    // Mesas a disponible
    await db('mesas').update({ estado: 'disponible' });
    
    console.log('✅ BD limpiada\n');
    
    // Obtener datos necesarios
    const usuario = await db('usuarios').first();
    const mesa = await db('mesas').where('sede_id', 3).first();
    const producto = await db('productos').first();
    const sede = await db('sedes').first();
    const estacionCocina = await db('estaciones').where('nombre', 'Cocina').first();
    
    console.log('=== DATOS BASE ===');
    console.log(`👤 Usuario: ${usuario.nombre} (ID: ${usuario.id})`);
    console.log(`🏢 Sede: ${sede.nombre} (ID: ${sede.id})`);
    console.log(`🏪 Mesa: ${mesa.numero} (ID: ${mesa.id})`);
    console.log(`🍔 Producto: ${producto.nombre} (ID: ${producto.id})`);
    console.log(`🏪 Estación Cocina: ID ${estacionCocina.id}\n`);
    
    // Crear orden
    console.log('=== CREANDO ORDEN ===\n');
    
    const numeroOrden = `ORD-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    const ordenResult = await db('ordenes').insert({
      numero_orden: numeroOrden,
      mesa_id: mesa.id,
      usuario_id: usuario.id,
      sede_id: sede.id,
      canal_id: 1,
      estado: 'abierta',
      total: 100000,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('id');
    
    const ordenId = Array.isArray(ordenResult) ? ordenResult[0].id : ordenResult.id;
    console.log(`✅ Orden creada: ${numeroOrden} (ID: ${ordenId})`);
    
    // Crear comanda
    const numeroComanda = `CMD-${Date.now()}`;
    const comandaResult = await db('comandas').insert({
      numero_comanda: numeroComanda,
      orden_id: ordenId,
      estacion_id: estacionCocina.id,
      estado: 'pendiente',
      tiempo_preparacion_estimado: 15,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('id');
    
    const comandaId = Array.isArray(comandaResult) ? comandaResult[0].id : comandaResult.id;
    console.log(`✅ Comanda creada: ${numeroComanda} (ID: ${comandaId})`);
    
    // Crear orden_items
    const itemResult = await db('orden_items').insert({
      orden_id: ordenId,
      producto_id: producto.id,
      cantidad: 2,
      precio_unitario: 50000,
      subtotal: 100000,
      estado: 'pendiente',
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('id');
    
    const itemId = Array.isArray(itemResult) ? itemResult[0].id : itemResult.id;
    console.log(`✅ Orden Item creado (ID: ${itemId})`);
    
    // Crear comanda_items
    await db('comanda_items').insert({
      comanda_id: comandaId,
      orden_item_id: itemId,
      producto_id: producto.id,
      cantidad: 2,
      notas_especiales: null,
      estado: 'pendiente',
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    console.log(`✅ Comanda Item creado\n`);
    
    // Actualizar mesa a ocupada
    await db('mesas').where('id', mesa.id).update({
      estado: 'ocupada',
      updated_at: new Date(),
    });
    console.log(`✅ Mesa ${mesa.numero} actualizada a 'ocupada'\n`);
    
    // Verificar estado final
    console.log('=== ESTADO EN BD ===\n');
    
    const mesaFinal = await db('mesas').where('id', mesa.id).first();
    console.log(`📍 Mesa ${mesaFinal.numero}: ${mesaFinal.estado}`);
    
    const ordenFinal = await db('ordenes').where('id', ordenId).first();
    console.log(`📋 Orden ${ordenFinal.numero_orden}: ${ordenFinal.estado}`);
    
    const comandaFinal = await db('comandas').where('id', comandaId).first();
    console.log(`🍽️  Comanda ${comandaFinal.numero_comanda}: ${comandaFinal.estado} (Estación: ${comandaFinal.estacion_id})`);
    
    // Simular GET al endpoint KDS
    console.log('\n=== SIMULANDO GET /kds/estacion/' + estacionCocina.id + ' ===\n');
    
    const comandas = await db('comandas')
      .select('comandas.*', 'mesas.numero as mesa_numero')
      .leftJoin('ordenes', 'comandas.orden_id', '=', 'ordenes.id')
      .leftJoin('mesas', 'ordenes.mesa_id', '=', 'mesas.id')
      .where('comandas.estacion_id', estacionCocina.id)
      .whereNotIn('comandas.estado', ['entregada'])
      .orderBy('comandas.created_at', 'asc');
    
    console.log(`✅ Comandas encontradas: ${comandas.length}`);
    
    for (const cmd of comandas) {
      console.log(`  - ${cmd.numero_comanda} (Mesa ${cmd.mesa_numero}, Estado: ${cmd.estado})`);
      
      // Obtener items de la comanda
      const items = await db('comanda_items')
        .select(
          'comanda_items.*',
          'orden_items.producto_id',
          'orden_items.cantidad',
          'productos.nombre'
        )
        .leftJoin('orden_items', 'comanda_items.orden_item_id', '=', 'orden_items.id')
        .leftJoin('productos', 'orden_items.producto_id', '=', 'productos.id')
        .where('comanda_items.comanda_id', cmd.id);
      
      console.log(`    Items: ${items.length}`);
      for (const item of items) {
        console.log(`      - ${item.nombre} x${item.cantidad}`);
      }
    }
    
    console.log('\n✅ Prueba completada exitosamente\n');
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
