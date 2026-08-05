exports.up = async function(knex) {
  await knex.schema.alterTable('caja_movimientos', (table) => {
    table.timestamp('created_at').defaultTo(knex.fn.now()).alter();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).alter();
  });

  await knex('caja_movimientos')
    .whereNull('created_at')
    .update({ created_at: knex.fn.now() });

  await knex('caja_movimientos')
    .whereNull('updated_at')
    .update({ updated_at: knex.fn.now() });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('caja_movimientos', (table) => {
    table.timestamp('created_at').nullable().alter();
    table.timestamp('updated_at').nullable().alter();
  });
};
