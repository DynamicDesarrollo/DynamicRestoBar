const db = require('./src/config/database');

async function checkKardexStructure() {
  try {
    console.log('🔍 Verificando estructura de kardex_movimientos...');

    // Obtener información de columnas usando información del sistema
    const columns = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'kardex_movimientos'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Columnas de kardex_movimientos:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // Verificar si existe la tabla
    const exists = await db.schema.hasTable('kardex_movimientos');
    console.log(`\n✅ Tabla kardex_movimientos existe: ${exists}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkKardexStructure();
