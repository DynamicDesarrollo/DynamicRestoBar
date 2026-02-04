const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

(async () => {
  try {
    console.log('\n=== PRUEBA DE UPDATE ESTADO ===\n');

    // Login
    console.log('🔐 Logueando...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, 
      { email: 'barman@test.com', password: 'password' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const token = loginRes.data.data.token;
    console.log(`✅ Logueado: ${loginRes.data.data.usuario.nombre}\n`);

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Obtener comandas actuales
    console.log('📋 Obteniendo comandas de estación 8 (Cocina)...');
    const getRes = await axios.get(`${API_URL}/kds/estacion/8`, { headers });
    const comandas = getRes.data.data;
    console.log(`✅ Encontradas ${comandas.length} comanda(s)\n`);

    if (comandas.length > 0) {
      const comanda = comandas[0];
      console.log(`Comanda: ${comanda.numero_comanda}`);
      console.log(`Estado actual: ${comanda.estado}`);
      console.log(`ID: ${comanda.id}\n`);

      // Actualizar a siguiente estado
      console.log('🔄 Actualizando comanda...');
      const updateRes = await axios.patch(
        `${API_URL}/kds/comanda/${comanda.id}/estado`,
        { estado: 'entregada' },
        { headers }
      );

      console.log(`✅ Respuesta:`, updateRes.data);
      console.log();

      // Verificar que se actualizó
      console.log('🔍 Verificando nueva comanda...');
      const checkRes = await axios.get(`${API_URL}/kds/estacion/8`, { headers });
      const comandaActualizada = checkRes.data.data.find(c => c.id === comanda.id);
      console.log(`✅ Nuevo estado: ${comandaActualizada.estado}`);
    } else {
      console.log('⚠️  No hay comandas para actualizar');
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
