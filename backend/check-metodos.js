const db = require('./src/config/database');

async function checkMetodos() {
  try {
    // Ver estructura de la tabla
    const columns = await db.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'metodos_pago' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Columnas de metodos_pago:');
    columns.rows.forEach(r => {
      console.log(`  - ${r.column_name} (${r.data_type})`);
    });
    
    // Ver datos existentes
    const metodos = await db('metodos_pago').select('*');
    console.log('\n💳 Métodos de pago existentes:', metodos.length);
    metodos.forEach(m => {
      console.log(`  - ${m.id}: ${m.nombre}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkMetodos();
