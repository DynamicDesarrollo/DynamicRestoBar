const db = require('./backend/src/config/database');

(async () => {
  try {
    const usuarios = await db('usuarios').select('id', 'nombre', 'email', 'pin', 'estado', 'sede_id');
    console.log('\n=== USUARIOS ===\n');
    usuarios.forEach(u => {
      console.log(`${u.nombre} (${u.email}) - PIN: ${u.pin} - estado: ${u.estado} - sede_id: ${u.sede_id}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
