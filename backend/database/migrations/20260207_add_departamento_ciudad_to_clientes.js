exports.up = async function(knex) {
  await knex.schema.alterTable('clientes', function(table) {
    table.string('departamento', 100);
    table.string('ciudad', 100);
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('clientes', function(table) {
    table.dropColumn('departamento');
    table.dropColumn('ciudad');
  });
};
