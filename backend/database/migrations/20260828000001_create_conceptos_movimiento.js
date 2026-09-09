exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('conceptos_movimiento');
  if (exists) return;
  await knex.schema.createTable('conceptos_movimiento', (table) => {
    table.increments('id').primary();
    table.integer('cliente_id').notNullable().index()
      .references('id').inTable('clientes').onDelete('CASCADE');
    // null = visible en todas las sedes de este cliente (nunca de otros clientes)
    table.integer('sede_id').nullable().index()
      .references('id').inTable('sedes').onDelete('CASCADE');
    table.string('nombre', 150).notNullable();
    table.string('tipo', 20).notNullable().index(); // 'ingreso' | 'egreso'
    table.text('descripcion').nullable();
    table.boolean('activo').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('conceptos_movimiento');
};
