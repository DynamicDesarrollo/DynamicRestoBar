/**
 * Script para verificar y actualizar tabla aperturas_caja
 */

const db = require('./src/config/database');

async function verificarTabla() {
  try {
    console.log('🔍 Verificando tabla aperturas_caja...\n');

    // Verificar estructura de la tabla
    const columnInfo = await db.raw(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'aperturas_caja'
      ORDER BY ordinal_position
    `);

    console.log('📋 Columnas actuales:');
    columnInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Verificar si existe la columna activa
    const tieneActiva = columnInfo.rows.some(col => col.column_name === 'activa');
    
    if (!tieneActiva) {
      console.log('\n⚠️  Columna "activa" no existe. Agregando...\n');
      
      await db.raw(`
        ALTER TABLE aperturas_caja
        ADD COLUMN activa BOOLEAN DEFAULT true
      `);
      
      console.log('✅ Columna "activa" agregada correctamente\n');
    } else {
      console.log('\n✅ Columna "activa" ya existe\n');
    }

    // Verificar datos existentes
    const count = await db('aperturas_caja').count('* as total').first();
    console.log(`📊 Total de registros: ${count.total}\n`);

    console.log('✨ Verificación completada\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verificarTabla();
