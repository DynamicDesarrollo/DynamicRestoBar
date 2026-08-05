exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('usuarios', 'cliente_id');
  if (!exists) {
    await knex.schema.alterTable('usuarios', function(table) {
      table.integer('cliente_id').unsigned().references('id').inTable('clientes').onDelete('CASCADE').nullable();
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('usuarios', 'cliente_id');
  if (exists) {
    await knex.schema.alterTable('usuarios', function(table) {
      table.dropColumn('cliente_id');
    });
  }
};
