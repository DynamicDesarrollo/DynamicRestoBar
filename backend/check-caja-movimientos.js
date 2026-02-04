const db = require('./src/config/database');

async function checkCajaMovimientos() {
  try {
    const movimientos = await db('caja_movimientos').limit(3);
    
    if (movimientos.length === 0) {
      console.log('❌ No hay datos en caja_movimientos');
    } else {
      console.log(`✅ Encontrados ${movimientos.length} movimientos`);
      console.log('\n📋 Columnas:', Object.keys(movimientos[0]));
      
      movimientos.forEach((mov, idx) => {
        console.log(`\n🔹 Movimiento ${idx + 1}:`);
        console.log(JSON.stringify(mov, null, 2));
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCajaMovimientos();
