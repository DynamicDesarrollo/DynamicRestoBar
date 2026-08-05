exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('print_jobs');
  if (exists) return;
  await knex.schema.createTable('print_jobs', (table) => {
    table.increments('id').primary();
    table.integer('cliente_id').nullable().index();
    table.integer('sede_id').notNullable().index();
    table.integer('impresora_id').nullable().index();
    table.string('tipo', 30).notNullable().index();
    table.jsonb('payload').notNullable();
    table.string('estado', 20).notNullable().defaultTo('pendiente').index();
    table.integer('intentos').notNullable().defaultTo(0);
    table.integer('max_intentos').notNullable().defaultTo(5);
    table.string('agente_id', 120).nullable().index();
    table.timestamp('locked_at').nullable();
    table.timestamp('procesado_at').nullable();
    table.text('ultimo_error').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('print_jobs');
};
