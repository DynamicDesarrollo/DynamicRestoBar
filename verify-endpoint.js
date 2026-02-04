const db = require('./backend/src/config/database');

(async () => {
  try {
    console.log('\n=== VERIFICAR COMANDAS EN COCINA ===\n');
    
    // Obtener todas las comandas sin filtro
    const todasComandas = await db('comandas')
      .select('*')
      .orderBy('created_at', 'desc');
    
    console.log(`📊 Total de comandas en BD: ${todasComandas.length}\n`);
    todasComandas.forEach(cmd => {
      console.log(`${cmd.numero_comanda} → ${cmd.estado} (Estación: ${cmd.estacion_id})`);
    });
    
    // Obtener comandas de estación 8 (Cocina) - como lo hace el endpoint
    console.log('\n=== COMANDAS QUE DEVUELVE EL ENDPOINT /kds/estacion/8 ===\n');
    
    const comandasEstacion8 = await db('comandas')
      .select('comandas.*', 'mesas.numero as mesa_numero')
      .leftJoin('ordenes', 'comandas.orden_id', '=', 'ordenes.id')
      .leftJoin('mesas', 'ordenes.mesa_id', '=', 'mesas.id')
      .where('comandas.estacion_id', 8)
      .orderBy('comandas.created_at', 'asc');
    
    console.log(`Comandas para estación 8: ${comandasEstacion8.length}\n`);
    comandasEstacion8.forEach(cmd => {
      console.log(`${cmd.numero_comanda} (Mesa ${cmd.mesa_numero}) → ${cmd.estado}`);
    });
    
    // Filtrar por estado
    console.log('\n=== RESUMEN POR ESTADO ===\n');
    const pendientes = comandasEstacion8.filter(c => c.estado === 'pendiente').length;
    const preparacion = comandasEstacion8.filter(c => c.estado === 'en_preparacion').length;
    const listas = comandasEstacion8.filter(c => c.estado === 'lista').length;
    const entregadas = comandasEstacion8.filter(c => c.estado === 'entregada').length;
    
    console.log(`Pendientes: ${pendientes}`);
    console.log(`En preparación: ${preparacion}`);
    console.log(`Listas: ${listas}`);
    console.log(`Entregadas: ${entregadas}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
