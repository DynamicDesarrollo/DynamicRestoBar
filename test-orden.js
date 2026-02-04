const db = require('./backend/src/config/database');

(async () => {
  try {
    // Limpiar datos anteriores
    await db('comanda_items').del();
    await db('comandas').del();
    await db('orden_items').del();
    await db('ordenes').del();
    
    // Mesas a disponible
    await db('mesas').update({ estado: 'disponible' });
    
    console.log('📦 Limpiado estado anterior\n');
    
    // Obtener datos necesarios
    const usuario = await db('usuarios').first();
    const mesa = await db('mesas').first();
    const producto = await db('productos').first();
    const sede = await db('sedes').first();
    
    console.log(`👤 Usuario: ${usuario.id}`);
    console.log(`🏢 Sede: ${sede.id}`);
    console.log(`🏪 Mesa: ${mesa.id}`);
    console.log(`🍔 Producto: ${producto.id}\n`);
    
    // Simular POST a /ordenes
    console.log('📝 Simulando creación de orden...\n');
    
    const ordenData = {
      mesa_id: mesa.id,
      usuario_id: usuario.id,
      sede_id: sede.id,
      items: [
        {
          producto_id: producto.id,
          cantidad: 2,
          precio_unitario: 50000,
          subtotal: 100000
        }
      ],
      total: 100000
    };
    
    console.log('📨 Datos enviados:', JSON.stringify(ordenData, null, 2));
    console.log('\n');
    
    // Crear orden en DB (simulando el controlador)
    const numeroOrden = `ORD-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    const ordenResult = await db('ordenes').insert({
      numero_orden: numeroOrden,
      mesa_id: ordenData.mesa_id,
      usuario_id: ordenData.usuario_id,
      sede_id: ordenData.sede_id,
      canal_id: 1,
      estado: 'abierta',
      total: ordenData.total,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('id');
    
    const ordenId = Array.isArray(ordenResult) ? ordenResult[0].id : ordenResult.id;
    console.log(`✅ Orden creada: ID ${ordenId}, Número: ${numeroOrden}`);
    
    // Obtener estación del producto
    const primerProducto = await db('productos')
      .where('id', ordenData.items[0].producto_id)
      .first();
    
    let estacionId;
    if (primerProducto && primerProducto.estacion_id) {
      estacionId = primerProducto.estacion_id;
      console.log(`✅ Estación obtenida del producto: ${estacionId}`);
    } else {
      const estacionDisponible = await db('estaciones')
        .where('sede_id', ordenData.sede_id)
        .where('activa', true)
        .first();
      estacionId = estacionDisponible.id;
      console.log(`✅ Estación por defecto: ${estacionId}`);
    }
    
    // Crear comanda
    const numeroComanda = `CMD-${Date.now()}`;
    const comandaResult = await db('comandas').insert({
      numero_comanda: numeroComanda,
      orden_id: ordenId,
      estacion_id: estacionId,
      estado: 'pendiente',
      tiempo_preparacion_estimado: 15,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('id');
    
    const comandaId = Array.isArray(comandaResult) ? comandaResult[0].id : comandaResult.id;
    console.log(`✅ Comanda creada: ID ${comandaId}, Número: ${numeroComanda}\n`);
    
    // Actualizar mesa a ocupada
    console.log(`🔄 Actualizando mesa ${ordenData.mesa_id} a 'ocupada'...`);
    const updateResult = await db('mesas').where('id', ordenData.mesa_id).update({
      estado: 'ocupada',
      updated_at: new Date(),
    });
    console.log(`✅ Mesa actualizada (${updateResult} registro/s afectado/s)\n`);
    
    // Crear orden_items
    for (const item of ordenData.items) {
      const itemResult = await db('orden_items').insert({
        orden_id: ordenId,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        estado: 'pendiente',
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');
      
      const itemId = Array.isArray(itemResult) ? itemResult[0].id : itemResult.id;
      
      // Crear comanda_items
      await db('comanda_items').insert({
        comanda_id: comandaId,
        orden_item_id: itemId,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        estado: 'pendiente',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
    console.log('✅ Orden items creados\n');
    
    // Verificar estado final
    console.log('=== ESTADO FINAL ===\n');
    
    const mesaFinal = await db('mesas').where('id', ordenData.mesa_id).first();
    console.log(`🏪 Mesa ${mesaFinal.numero} (ID: ${mesaFinal.id}): ${mesaFinal.estado}`);
    
    const ordenFinal = await db('ordenes').where('id', ordenId).first();
    console.log(`📋 Orden ${ordenFinal.numero_orden}: ${ordenFinal.estado}`);
    
    const comandaFinal = await db('comandas').where('id', comandaId).first();
    console.log(`🍽️  Comanda ${comandaFinal.numero_comanda}: ${comandaFinal.estado} (Estación: ${comandaFinal.estacion_id})`);
    
    const ordenItems = await db('orden_items').where('orden_id', ordenId);
    console.log(`📦 Items: ${ordenItems.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
