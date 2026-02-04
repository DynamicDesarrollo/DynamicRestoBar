const db = require('./backend/src/config/database');

(async () => {
  try {
    const cols = await db.raw("SELECT column_name FROM information_schema.columns WHERE table_name = 'orden_items' ORDER BY ordinal_position;");
    console.log('Columnas de orden_items:');
    cols.rows.forEach(r => console.log('  -', r.column_name));
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
