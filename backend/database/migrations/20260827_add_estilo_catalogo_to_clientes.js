exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('clientes', 'estilo_catalogo');
  if (!exists) {
    await knex.schema.alterTable('clientes', function(table) {
      table.string('estilo_catalogo', 20).notNullable().defaultTo('clasico');
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('clientes', 'estilo_catalogo');
  if (exists) {
    await knex.schema.alterTable('clientes', function(table) {
      table.dropColumn('estilo_catalogo');
    });
  }
};
