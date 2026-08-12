/**
 * Script para insertar o actualizar métodos de pago por sede.
 * Uso:
 *   node seed-metodos-pago.js --sede-id=24
 *   node seed-metodos-pago.js
 */

const db = require('./src/config/database');

const defaultSedeId = Number(process.env.SEDE_ID || process.env.SedeId || 24);

const parseSedeId = () => {
  const arg = process.argv.find((item) => item.startsWith('--sede-id='));
  if (arg) {
    const value = Number(arg.split('=')[1]);
    if (!Number.isNaN(value)) return value;
  }
  return defaultSedeId;
};

const metodosBase = [
  { nombre: 'Efectivo', requiere_referencia: false },
  { nombre: 'Tarjeta Débito', requiere_referencia: true },
  { nombre: 'Tarjeta Crédito', requiere_referencia: true },
  { nombre: 'Transferencia', requiere_referencia: true },
  { nombre: 'Nequi', requiere_referencia: true },
  { nombre: 'Daviplata', requiere_referencia: true },
  { nombre: 'PSE', requiere_referencia: true },
  { nombre: 'Cheque', requiere_referencia: true },
];

async function crearMetodosPago() {
  const sedeId = parseSedeId();

  try {
    console.log(`📝 Verificando métodos de pago para la sede ${sedeId}...\n`);

    for (const metodo of metodosBase) {
      const existe = await db('metodos_pago')
        .where({ sede_id: sedeId, nombre: metodo.nombre })
        .first();

      if (!existe) {
        await db('metodos_pago').insert({
          sede_id: sedeId,
          nombre: metodo.nombre,
          requiere_referencia: metodo.requiere_referencia,
          activo: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
        console.log(`✅ ${metodo.nombre} -> creado`);
      } else {
        await db('metodos_pago')
          .where({ id: existe.id })
          .update({
            requiere_referencia: metodo.requiere_referencia,
            activo: true,
            updated_at: new Date(),
          });
        console.log(`♻️  ${metodo.nombre} -> actualizado`);
      }
    }

    console.log(`\n✨ Métodos de pago listos para sede ${sedeId}.\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

crearMetodosPago();
