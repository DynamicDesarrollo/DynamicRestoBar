const db = require('./src/config/database');

async function checkColumns() {
  try {
    const columns = await db('recetas').columnInfo();
    console.log('Columnas de recetas:');
    console.table(Object.keys(columns));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkColumns();
