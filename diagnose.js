#!/usr/bin/env node

const db = require('./backend/src/config/database');

async function main() {
  try {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║         DIAGNÓSTICO DEL SISTEMA                     ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Usuarios
    console.log('📊 USUARIOS:');
    const usuarios = await db('usuarios').select('id', 'nombre', 'email', 'sede_id');
    usuarios.forEach(u => {
      console.log(`  • ${u.nombre} (${u.email}) → Sede: ${u.sede_id}`);
    });

    // Estaciones
    console.log('\n📊 ESTACIONES:');
    const estaciones = await db('estaciones').select('id', 'sede_id', 'nombre', 'activa');
    estaciones.forEach(e => {
      console.log(`  • ID ${e.id}: ${e.nombre} (Sede: ${e.sede_id}, Activa: ${e.activa})`);
    });

    // Mesas
    console.log('\n📊 MESAS:');
    const mesas = await db('mesas').select('id', 'numero', 'estado', 'sede_id');
    mesas.forEach(m => {
      console.log(`  • Mesa ${m.numero} (ID: ${m.id}) → ${m.estado} (Sede: ${m.sede_id})`);
    });

    // Órdenes
    console.log('\n📊 ÓRDENES:');
    const ordenes = await db('ordenes')
      .select('ordenes.id', 'ordenes.numero_orden', 'ordenes.estado', 'mesas.numero as mesa_numero')
      .leftJoin('mesas', 'ordenes.mesa_id', '=', 'mesas.id');
    ordenes.forEach(o => {
      console.log(`  • ${o.numero_orden} (Mesa ${o.mesa_numero}) → ${o.estado}`);
    });

    // Comandas
    console.log('\n📊 COMANDAS:');
    const comandas = await db('comandas')
      .select('comandas.id', 'comandas.numero_comanda', 'comandas.estado', 'estaciones.nombre as estacion_nombre')
      .leftJoin('estaciones', 'comandas.estacion_id', '=', 'estaciones.id');
    comandas.forEach(c => {
      console.log(`  • ${c.numero_comanda} (Estación: ${c.estacion_nombre || 'N/A'}) → ${c.estado}`);
    });

    console.log('\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
