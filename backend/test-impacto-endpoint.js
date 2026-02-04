const axios = require('axios');

async function testImpactoEndpoint() {
  try {
    console.log('🧪 Probando endpoint de impacto de ventas...\n');

    // Primero, necesitamos hacer login para obtener el token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login-pin', {
      pin: '1234' // Ajusta según tu PIN de admin
    });

    const token = loginRes.data.token;
    console.log('✅ Login exitoso\n');

    // Ahora llamar al endpoint de impacto
    const impactoRes = await axios.get('http://localhost:5000/api/admin/informes/impacto-ventas', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-26'
      }
    });

    console.log('📊 RESPUESTA DEL ENDPOINT:');
    console.log(JSON.stringify(impactoRes.data, null, 2));

    if (impactoRes.data.success) {
      console.log('\n✅ Endpoint funcionando correctamente');
      console.log(`   Resumen: ${impactoRes.data.data.resumen?.length || 0} insumos`);
      console.log(`   Detalle: ${impactoRes.data.data.detalle?.length || 0} registros`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Respuesta del servidor:', err.response.data);
    }
  }
}

testImpactoEndpoint();
