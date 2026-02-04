const axios = require('axios');

const API_URL = 'http://192.168.1.34:5000/api/v1';

(async () => {
  try {
    console.log('\n=== PROBANDO ENDPOINTS KDS ===\n');
    
    // Login para obtener token
    console.log('🔐 Logueando...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'barman@test.com',
      password: 'password'
    });
    
    const token = loginRes.data.data.token;
    const sedeId = loginRes.data.data.usuario.sedeId;
    console.log(`✅ Token obtenido para sede ${sedeId}\n`);
    
    // Crear headers con token
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // GET /kds/estaciones/:sedeId
    console.log(`📍 GET /kds/estaciones/${sedeId}`);
    const estacionesRes = await axios.get(`${API_URL}/kds/estaciones/${sedeId}`, { headers });
    const estaciones = estacionesRes.data.data;
    console.log(`✅ Estaciones encontradas: ${estaciones.length}`);
    estaciones.forEach(e => console.log(`   - ${e.nombre} (ID: ${e.id})`));
    console.log();
    
    // GET /kds/estacion/:estacionId para la primera estación
    if (estaciones.length > 0) {
      const estacionId = estaciones[0].id;
      console.log(`🍳 GET /kds/estacion/${estacionId}`);
      const comandasRes = await axios.get(`${API_URL}/kds/estacion/${estacionId}`, { headers });
      const comandas = comandasRes.data.data;
      console.log(`✅ Comandas encontradas: ${comandas.length}`);
      
      if (comandas.length > 0) {
        comandas.forEach(cmd => {
          console.log(`\n   📋 ${cmd.numero_comanda}`);
          console.log(`      Mesa: ${cmd.mesa_numero}`);
          console.log(`      Estado: ${cmd.estado}`);
          console.log(`      Items: ${cmd.items ? cmd.items.length : 0}`);
          if (cmd.items) {
            cmd.items.forEach(item => {
              console.log(`        - ${item.nombre || 'Sin nombre'} x${item.cantidad}`);
            });
          }
        });
      } else {
        console.log('   ⚠️  No hay comandas pendientes');
      }
    }
    
    console.log('\n✅ Prueba completada\n');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    }
    process.exit(1);
  }
})();
