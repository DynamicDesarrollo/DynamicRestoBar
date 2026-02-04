const db = require('./backend/src/config/database');

(async () => {
  try {
    const usuarios = await db('usuarios').select('id', 'nombre', 'email', 'sedeId');
    console.log('\n=== USUARIOS ===\n');
    usuarios.forEach(u => {
      console.log(`${u.nombre} (${u.email}) - sedeId: ${u.sedeId}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
