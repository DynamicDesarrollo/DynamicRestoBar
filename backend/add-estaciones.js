const db = require('./src/config/database');

async function agregarEstaciones() {
  try {
    // Verificar si ya existen
    const existentes = await db('estaciones').select('*');
    console.log('Estaciones existentes:', existentes.length);

    if (existentes.length === 0) {
      const estaciones = await db('estaciones').insert([
        {
          sede_id: 3,
          nombre: 'Cocina',
          descripcion: 'Estación de cocina principal',
          activa: true
        },
        {
          sede_id: 3,
          nombre: 'Bar',
          descripcion: 'Estación de bar',
          activa: true
        },
        {
          sede_id: 3,
          nombre: 'Pastelería',
          descripcion: 'Estación de pastelería',
          activa: true
        }
      ]).returning('*');

      console.log('✅ Estaciones creadas:', estaciones.map(e => e.nombre));
    } else {
      console.log('ℹ️ Ya existen estaciones en la BD');
      console.table(existentes);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

agregarEstaciones();
