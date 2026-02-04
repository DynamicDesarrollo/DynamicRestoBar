const knex = require('knex');
const config = require('./src/config/knexfile');

const db = knex(config.development);

async function fixPins() {
  try {
    // Usuarios con sus PINs correctos
    const usuariosActualizar = [
      { email: 'admin@dynamicrestobar.com', pin: '1111' },
      { email: 'juan@dynamicrestobar.com', pin: '5678' },
      { email: 'cocina@dynamicrestobar.com', pin: '9999' },
      { email: 'bar@dynamicrestobar.com', pin: '8888' },
      { email: 'caja@dynamicrestobar.com', pin: '7777' },
      { email: 'repartidor@dynamicrestobar.com', pin: '6666' },
      { email: 'gerente@dynamicrestobar.com', pin: '4444' },
    ];

    for (const usuario of usuariosActualizar) {
      await db('usuarios')
        .where('email', usuario.email)
        .update({ pin: usuario.pin });
      console.log(`✅ PIN actualizado para ${usuario.email}`);
    }

    // Verificar PINs
    console.log('\n📋 Usuarios actuales:');
    const usuarios = await db('usuarios')
      .select('id', 'nombre', 'email', 'pin')
      .orderBy('id');
    
    usuarios.forEach(u => {
      console.log(`  ${u.nombre} (${u.email}): PIN ${u.pin}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixPins();
