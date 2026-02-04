const db = require('./src/config/database');

async function actualizarPan() {
  try {
    const result = await db('insumos')
      .where('nombre', 'Pan Tajado Artesanal')
      .update({ 
        costo_unitario: 200, 
        costo_promedio: 200 
      });

    console.log('✅ Costo actualizado a $200 por pieza');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

actualizarPan();
