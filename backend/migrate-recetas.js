const db = require('./src/config/database');

async function fixTable() {
  try {
    // Verificar estructura actual
    const columnas = await db('recetas').columnInfo();
    console.log('Columnas actuales:', Object.keys(columnas));

    // Intentar agregar descripcion
    try {
      await db.schema.table('recetas', table => {
        table.text('descripcion').nullable();
      });
      console.log('✅ descripcion agregada');
    } catch (e) {
      console.log('descripcion ya existe o error:', e.message.substring(0, 50));
    }

    // Intentar agregar rendimiento si no existe
    try {
      await db.schema.table('recetas', table => {
        table.decimal('rendimiento', 10, 2).defaultTo(1);
      });
      console.log('✅ rendimiento agregada');
    } catch (e) {
      console.log('rendimiento ya existe o error:', e.message.substring(0, 50));
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error general:', err.message);
    process.exit(1);
  }
}

fixTable();
