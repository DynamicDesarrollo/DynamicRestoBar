const knex = require('knex');
const config = require('./src/config/knexfile');

const db = knex(config.development);

async function checkMesas() {
  try {
    console.log('Verificando mesas y sedes...\n');
    
    // Obtener todas las sedes
    const sedes = await db('sedes').select('*');
    console.log('📍 Sedes en la BD:');
    console.log(sedes);
    
    console.log('\n');
    
    // Obtener todas las mesas con su sede
    const mesas = await db('mesas')
      .leftJoin('sedes', 'mesas.sede_id', 'sedes.id')
      .select('mesas.*', 'sedes.nombre as sede_nombre')
      .orderBy('mesas.sede_id', 'asc');
    
    console.log('🪑 Mesas en la BD:');
    console.log(mesas);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkMesas();
