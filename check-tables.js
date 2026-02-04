const knex = require('knex');
const knexConfig = require('./src/config/knexfile.js');

const db = knex(knexConfig.development);

async function checkTables() {
  try {
    console.log('\n🔍 Verificando tablas en PostgreSQL...\n');

    // Obtener todas las tablas
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tables.rows.length === 0) {
      console.log('❌ NO HAY TABLAS EN LA BASE DE DATOS');
      return;
    }

    console.log(`✅ Tablas encontradas (${tables.rows.length}):\n`);
    tables.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });

    // Detalles de cada tabla
    console.log('\n📋 DETALLES DE TABLAS:\n');
    for (const tableRow of tables.rows) {
      const tableName = tableRow.table_name;
      
      // Obtener columnas
      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ?
        ORDER BY ordinal_position
      `, [tableName]);

      console.log(`\n📌 ${tableName.toUpperCase()}`);
      console.log('─'.repeat(50));
      columns.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)';
        console.log(`  • ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${nullable}`);
      });
    }

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
