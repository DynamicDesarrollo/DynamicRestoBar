const db = require('./backend/src/config/database');

(async () => {
  try {
    const productos = await db('productos').select('id', 'nombre', 'estacion_id').limit(10);
    console.log('=== Productos con estacion_id ===');
    console.log(JSON.stringify(productos, null, 2));
    
    const estaciones = await db('estaciones').select('*');
    console.log('\n=== Estaciones ===');
    console.log(JSON.stringify(estaciones, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
