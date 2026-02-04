const db = require('./src/config/database');

async function addColumns() {
  try {
    await db.schema.table('recetas', table => {
      // Agregar columnas que puedan no existir
      if (!table.hasColumn) {
        try {
          table.text('descripcion').nullable();
          console.log('✅ Columna descripcion agregada');
        } catch (e) {}
      }
    });

    // Verificar cada columna individualmente
    const hasDescripcion = await db.schema.hasColumn('recetas', 'descripcion');
    const hasUnidadRendimiento = await db.schema.hasColumn('recetas', 'unidad_rendimiento_id');
    const hasRendimiento = await db.schema.hasColumn('recetas', 'rendimiento');
    const hasCostoTotal = await db.schema.hasColumn('recetas', 'costo_total');

    console.log('Estado de columnas:');
    console.log('- descripcion:', hasDescripcion ? '✅ existe' : '❌ falta');
    console.log('- unidad_rendimiento_id:', hasUnidadRendimiento ? '✅ existe' : '❌ falta');
    console.log('- rendimiento:', hasRendimiento ? '✅ existe' : '❌ falta');
    console.log('- costo_total:', hasCostoTotal ? '✅ existe' : '❌ falta');

    // Agregar las que falten
    if (!hasDescripcion || !hasRendimiento) {
      await db.schema.table('recetas', table => {
        if (!hasDescripcion) {
          table.text('descripcion').nullable();
          console.log('✅ Agregada: descripcion');
        }
        if (!hasRendimiento) {
          table.decimal('rendimiento', 10, 2).defaultTo(1);
          console.log('✅ Agregada: rendimiento');
        }
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

addColumns();
