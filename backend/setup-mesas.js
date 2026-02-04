/**
 * Script para verificar y crear mesas de prueba
 */
const db = require('./src/config/database');

async function crearMesasPrueba() {
  try {
    console.log('🔍 Verificando mesas existentes...');
    const mesasExistentes = await db('mesas').select('*');
    console.log(`Mesas encontradas: ${mesasExistentes.length}`);

    if (mesasExistentes.length === 0) {
      console.log('📝 Creando mesas de prueba...');
      
      const mesas = [
        // Zona 1 - Comedor
        { sede_id: 1, zona_id: 1, numero_mesa: 1, capacidad: 2, ubicacion: 'Ventana' },
        { sede_id: 1, zona_id: 1, numero_mesa: 2, capacidad: 4, ubicacion: 'Centro' },
        { sede_id: 1, zona_id: 1, numero_mesa: 3, capacidad: 4, ubicacion: 'Centro' },
        { sede_id: 1, zona_id: 1, numero_mesa: 4, capacidad: 6, ubicacion: 'Esquina' },
        { sede_id: 1, zona_id: 1, numero_mesa: 5, capacidad: 2, ubicacion: 'Entrada' },
        
        // Zona 2 - Terraza
        { sede_id: 1, zona_id: 2, numero_mesa: 6, capacidad: 4, ubicacion: 'Exterior A' },
        { sede_id: 1, zona_id: 2, numero_mesa: 7, capacidad: 6, ubicacion: 'Exterior B' },
        { sede_id: 1, zona_id: 2, numero_mesa: 8, capacidad: 2, ubicacion: 'Exterior C' },
        
        // Zona 3 - Bar
        { sede_id: 1, zona_id: 3, numero_mesa: 9, capacidad: 1, ubicacion: 'Barra A' },
        { sede_id: 1, zona_id: 3, numero_mesa: 10, capacidad: 1, ubicacion: 'Barra B' },
        { sede_id: 1, zona_id: 3, numero_mesa: 11, capacidad: 3, ubicacion: 'Alto' },
      ];

      for (const mesa of mesas) {
        await db('mesas').insert({
          ...mesa,
          estado: 'disponible',
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      console.log(`✅ ${mesas.length} mesas creadas exitosamente`);
    } else {
      console.log('✅ Las mesas ya existen:');
      mesasExistentes.forEach(m => {
        console.log(`  - Mesa #${m.numero_mesa} (Zona ${m.zona_id}) - ${m.estado}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

crearMesasPrueba();
