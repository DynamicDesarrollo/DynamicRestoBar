const knex = require('knex');
const config = require('./src/config/knexfile');

const db = knex(config.development);

async function checkColumns() {
  try {
    console.log('Verificando estructura de receta_insumos...\n');
    const info = await db('receta_insumos').columnInfo();
    console.log('Columnas en receta_insumos:');
    console.log(info);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkColumns();
