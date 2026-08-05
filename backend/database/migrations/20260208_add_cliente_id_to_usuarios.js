exports.up = async function(knex) {
  await knex.schema.alterTable('usuarios', function(table) {
    table.integer('cliente_id').unsigned().references('id').inTable('clientes').onDelete('CASCADE').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('usuarios', function(table) {
    table.dropColumn('cliente_id');
  });
};
