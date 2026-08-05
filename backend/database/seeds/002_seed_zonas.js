// Seed para poblar la tabla zonas con datos de ejemplo
exports.seed = async function(knex) {
  // Elimina zonas existentes
  await knex('zonas').del();

  // Obtén las sedes existentes para asignar zonas
  const sedes = await knex('sedes').select('id');
  if (sedes.length === 0) return;

  // Crea zonas de ejemplo para cada sede
  const zonas = [];
  sedes.forEach((sede, idx) => {
    zonas.push({
      sede_id: sede.id,
      nombre: `Zona Principal ${idx+1}`,
      descripcion: 'Zona principal de la sede',
      numero_mesas: 10,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
    zonas.push({
      sede_id: sede.id,
      nombre: `Terraza ${idx+1}`,
      descripcion: 'Zona terraza',
      numero_mesas: 5,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  });

  await knex('zonas').insert(zonas);
};
