exports.up = async function(knex) {
  await knex.schema.alterTable('clientes', function(table) {
    table.decimal('valor_plan', 12, 2).defaultTo(0);
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('clientes', function(table) {
    table.dropColumn('valor_plan');
  });
};
