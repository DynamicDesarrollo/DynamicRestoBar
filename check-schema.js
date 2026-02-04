const db = require('./backend/src/config/database');

(async () => {
  try {
    // Obtener info de la tabla comanda_items
    const result = await db.raw(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'comanda_items'
      ORDER BY ordinal_position
    `);
    
    console.log('=== Estructura de tabla comanda_items ===\n');
    result.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
