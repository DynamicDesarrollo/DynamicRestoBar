const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function crearSuperAdmin() {
  const email = 'superadmin@dynamicrestobar.com';
  const password = 'superadmin123';
  const hashed = await bcrypt.hash(password, 10);
  const nombre = 'Super Admin';
  const rol = 'SUPER_ADMIN';
  const sede_id = 1; // Ajusta según tu estructura

  // Verifica si ya existe
  const existe = await db('usuarios').where({ email }).first();
  if (existe) {
    console.log('Ya existe un usuario SUPER_ADMIN con ese email');
    process.exit(0);
  }

  await db('usuarios').insert({
    nombre,
    email,
    contraseña: hashed,
    rol,
    sede_id
  });
  console.log('Usuario SUPER_ADMIN creado:');
  console.log('Email:', email);
  console.log('Password:', password);
  process.exit(0);
}

crearSuperAdmin();
