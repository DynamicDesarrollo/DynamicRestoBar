exports.up = async function(knex) {
  await knex.schema.createTable('pagos_clientes', function(table) {
    table.increments('id').primary();
    table.integer('cliente_id').unsigned().notNullable();
    table.decimal('monto', 12, 2).notNullable();
    table.date('fecha').notNullable();
    table.string('metodo', 50);
    table.text('observaciones');
    table.timestamps();
    table.foreign('cliente_id').references('id').inTable('clientes').onDelete('CASCADE');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('pagos_clientes');
};
