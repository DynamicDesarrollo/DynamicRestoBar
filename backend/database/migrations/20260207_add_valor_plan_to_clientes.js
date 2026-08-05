exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('clientes', 'valor_plan');
  if (!exists) {
    await knex.schema.alterTable('clientes', function(table) {
      table.decimal('valor_plan', 12, 2).defaultTo(0);
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('clientes', 'valor_plan');
  if (exists) {
    await knex.schema.alterTable('clientes', function(table) {
      table.dropColumn('valor_plan');
    });
  }
};
