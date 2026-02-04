const db = require('./src/config/database');

async function seedMovimientosInventario() {
  try {
    console.log('🔍 Verificando datos en kardex_movimientos...');

    // Verificar movimientos existentes
    const movimientos = await db('kardex_movimientos').select('*');
    console.log(`📊 Movimientos existentes: ${movimientos.length}`);

    if (movimientos.length > 0) {
      console.log('✅ Ya existen movimientos en kardex_movimientos');
      console.log('Movimientos:', movimientos);
      process.exit(0);
    }

    // Obtener insumos existentes
    const insumos = await db('insumos').select('*').where('activo', true);
    console.log(`📦 Insumos encontrados: ${insumos.length}`);

    if (insumos.length === 0) {
      console.log('❌ No hay insumos en la base de datos');
      process.exit(1);
    }

    // Obtener un usuario válido
    const usuario = await db('usuarios').select('id').first();
    if (!usuario) {
      console.log('❌ No hay usuarios en la base de datos');
      process.exit(1);
    }
    console.log(`👤 Usuario encontrado: ID ${usuario.id}`);

    // Crear movimientos de entrada para cada insumo
    const movimientosData = [];
    const sedeId = 3; // Sede actual

    for (const insumo of insumos) {
      // Entrada inicial (compra)
      movimientosData.push({
        insumo_id: insumo.id,
        sede_id: sedeId,
        tipo: 'entrada',
        cantidad: insumo.stock_actual || 10,
        precio_unitario: insumo.costo_unitario,
        costo_total: (insumo.stock_actual || 10) * insumo.costo_unitario,
        referencia: `COMPRA-INICIAL-${insumo.id}`,
        observaciones: 'Entrada inicial de inventario',
        usuario_id: usuario.id,
      });

      // Salida de prueba (consumo)
      if (insumo.stock_actual > 5) {
        movimientosData.push({
          insumo_id: insumo.id,
          sede_id: sedeId,
          tipo: 'salida',
          cantidad: 2,
          precio_unitario: insumo.costo_unitario,
          costo_total: 2 * insumo.costo_unitario,
          referencia: 'CONSUMO-PRODUCCION',
          observaciones: 'Consumo para producción de platos',
          usuario_id: usuario.id,
        });
      }
    }

    console.log(`📝 Insertando ${movimientosData.length} movimientos...`);
    await db('kardex_movimientos').insert(movimientosData);

    console.log('✅ Movimientos de inventario creados exitosamente');
    
    // Mostrar resumen
    const totalEntradas = await db('kardex_movimientos')
      .where('tipo', 'entrada')
      .count('* as total');
    const totalSalidas = await db('kardex_movimientos')
      .where('tipo', 'salida')
      .count('* as total');
    
    console.log('\n📊 RESUMEN:');
    console.log(`   Entradas: ${totalEntradas[0].total}`);
    console.log(`   Salidas: ${totalSalidas[0].total}`);
    console.log(`   Total movimientos: ${movimientosData.length}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seedMovimientosInventario();
