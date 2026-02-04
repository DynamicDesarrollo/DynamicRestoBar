const db = require('./src/config/database');

async function addColumn() {
  try {
    // Intentar agregar la columna costo_total
    const hasColumn = await db.schema.hasColumn('recetas', 'costo_total');
    
    if (!hasColumn) {
      await db.schema.table('recetas', table => {
        table.decimal('costo_total', 10, 2).nullable();
      });
      console.log('✅ Columna costo_total agregada a la tabla recetas');
    } else {
      console.log('ℹ️ La columna costo_total ya existe');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

addColumn();
