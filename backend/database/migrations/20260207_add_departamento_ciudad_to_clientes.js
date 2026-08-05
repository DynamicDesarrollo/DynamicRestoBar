exports.up = async function(knex) {
  const hasDepartamento = await knex.schema.hasColumn('clientes', 'departamento');
  const hasCiudad = await knex.schema.hasColumn('clientes', 'ciudad');

  await knex.schema.alterTable('clientes', function(table) {
    if (!hasDepartamento) table.string('departamento', 100);
    if (!hasCiudad) table.string('ciudad', 100);
  });
};

exports.down = async function(knex) {
  const hasDepartamento = await knex.schema.hasColumn('clientes', 'departamento');
  const hasCiudad = await knex.schema.hasColumn('clientes', 'ciudad');

  await knex.schema.alterTable('clientes', function(table) {
    if (hasDepartamento) table.dropColumn('departamento');
    if (hasCiudad) table.dropColumn('ciudad');
  });
};
