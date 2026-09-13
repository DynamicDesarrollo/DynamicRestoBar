/**
 * Un comensal usando el menú digital público (sin login) puede pedir que su
 * mesero venga a la mesa. No se toca ninguna tabla operativa existente
 * (ordenes/comandas) porque esto no es un pedido real todavía — solo un
 * aviso que el mesero atiende manualmente, igual que hoy.
 */
exports.up = async function (knex) {
  const existe = await knex.schema.hasTable('llamados_mesero');
  if (existe) return;

  await knex.schema.createTable('llamados_mesero', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').notNullable()
      .references('id').inTable('sedes').onDelete('CASCADE');
    table.string('mesa_numero', 50).notNullable();
    table.text('mensaje').nullable();
    table.string('estado', 20).notNullable().defaultTo('pendiente');
    table.integer('atendido_por').nullable()
      .references('id').inTable('usuarios').onDelete('SET NULL');
    table.timestamp('atendido_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE llamados_mesero
    ADD CONSTRAINT llamados_mesero_estado_check
    CHECK (estado IN ('pendiente', 'atendido'))
  `);

  await knex.schema.alterTable('llamados_mesero', (table) => {
    table.index(['sede_id', 'estado']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('llamados_mesero');
};
