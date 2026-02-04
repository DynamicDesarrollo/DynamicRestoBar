const knex = require('knex');
const config = require('./src/config/knexfile');

const db = knex(config.development);

async function addUnits() {
  try {
    // Unidades a agregar
    const newUnits = [
      { nombre: 'Pieza', simbolo: 'pz' },
      { nombre: 'Bolsa', simbolo: 'bol' },
      { nombre: 'Centilitro', simbolo: 'cl' },
      { nombre: 'Miligramo', simbolo: 'mg' },
    ];

    for (const unit of newUnits) {
      try {
        await db('unidad_medida').insert(unit);
        console.log(`✅ Unidad "${unit.nombre}" agregada`);
      } catch (err) {
        if (err.message.includes('duplicada') || err.message.includes('unique')) {
          console.log(`⚠️ Unidad "${unit.nombre}" ya existe`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Unidades procesadas');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

addUnits();
