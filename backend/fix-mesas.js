const db = require('./src/config/database');

async function actualizar() {
  try {
    console.log('🔄 Actualizando mesas 10, 12, 14 a DISPONIBLE...');
    
    const result = await db('mesas')
      .whereIn('numero', [10, 12, 14])
      .update({ estado: 'disponible', updated_at: new Date() });
    
    console.log('✅ Actualizadas:', result, 'mesas');
    
    // Verificar
    const final = await db('mesas').whereIn('numero', [10, 12, 14]).select('numero', 'estado');
    console.log('\n📊 Resultado final:');
    final.forEach(m => console.log('  Mesa', m.numero, '=', m.estado));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

actualizar();
