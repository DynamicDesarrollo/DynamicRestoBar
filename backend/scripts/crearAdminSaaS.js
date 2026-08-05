const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function crearAdmin() {
  const email = 'adminsaas@dynamicrestobar.com';
  const password = 'adminsaas123';
  const hashed = await bcrypt.hash(password, 10);
  const nombre = 'Admin SaaS';
  const rol_id = 8; // Administrador

  // Buscar un sede_id válido
  const sede = await db('sedes').first();
  if (!sede) {
    console.log('No existe ninguna sede. Crea una sede primero.');
    process.exit(1);
  }
  const sede_id = sede.id;

  // Verifica si ya existe
  const existe = await db('usuarios').where({ email }).first();
  if (existe) {
    console.log('Ya existe un usuario con ese email');
    process.exit(0);
  }

  await db('usuarios').insert({
    nombre,
    email,
    contraseña: hashed,
    rol_id,
    sede_id,
    pin: 9999
  });
  console.log('Usuario ADMINISTRADOR creado:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('sede_id:', sede_id);
  process.exit(0);
}

crearAdmin();
