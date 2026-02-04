const knex = require('knex');
const config = require('./src/config/knexfile');

const db = knex(config.development);

async function setupZonas() {
  try {
    console.log('Verificando zonas...\n');
    
    // Obtener la primera sede
    const sede = await db('sedes').first();
    if (!sede) {
      console.error('❌ No hay sedes en la base de datos');
      process.exit(1);
    }

    console.log(`Usando sede: ${sede.nombre} (ID: ${sede.id})`);
    
    // Obtener zonas existentes
    const zonasExistentes = await db('zonas').where('sede_id', sede.id).select('*');
    console.log('Zonas existentes:');
    console.log(zonasExistentes);

    // Si no existen, crearlas
    if (zonasExistentes.length === 0) {
      console.log('\n📝 Creando zonas por defecto...');
      const zonasDefault = [
        { nombre: 'Zona 1: Comedor', descripcion: 'Mesas de comedor principal', sede_id: sede.id },
        { nombre: 'Zona 2: Terraza', descripcion: 'Mesas en terraza', sede_id: sede.id },
        { nombre: 'Zona 3: Barra', descripcion: 'Asientos en barra', sede_id: sede.id },
      ];

      await db('zonas').insert(zonasDefault);
      console.log('✅ Zonas creadas exitosamente');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setupZonas();
