/**
 * Script para insertar métodos de pago iniciales
 */

const db = require('./src/config/database');

async function crearMetodosPago() {
  try {
    console.log('📝 Inserting payment methods...\n');

    const metodos = [
      {
        nombre: 'Efectivo',
        requiere_referencia: false,
        sede_id: 3,
      },
      {
        nombre: 'Tarjeta Débito',
        requiere_referencia: true,
        sede_id: 3,
      },
      {
        nombre: 'Tarjeta Crédito',
        requiere_referencia: true,
        sede_id: 3,
      },
      {
        nombre: 'Transferencia',
        requiere_referencia: true,
        sede_id: 3,
      },
      {
        nombre: 'Nequi',
        requiere_referencia: true,
        sede_id: 3,
      },
      {
        nombre: 'Daviplata',
        requiere_referencia: true,
        sede_id: 3,
      },
      {
        nombre: 'Cheque',
        requiere_referencia: true,
        sede_id: 3,
      },
    ];

    for (const metodo of metodos) {
      const existe = await db('metodos_pago').where('nombre', metodo.nombre).first();
      if (!existe) {
        await db('metodos_pago').insert({
          ...metodo,
          activo: true,
        });
        console.log(`✅ ${metodo.nombre}`);
      } else {
        console.log(`⏭️  ${metodo.nombre} (already exists)`);
      }
    }

    console.log('\n✨ Payment methods created successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

crearMetodosPago();
