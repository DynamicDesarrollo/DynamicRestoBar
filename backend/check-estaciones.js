const knex = require('knex');
const config = require('./src/config/knexfile');

const db = knex(config.development);

async function checkEstaciones() {
  try {
    console.log('Verificando estaciones...\n');
    
    const estaciones = await db('estaciones').select('*');
    console.log('Estaciones en la BD:');
    console.log(estaciones);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkEstaciones();
