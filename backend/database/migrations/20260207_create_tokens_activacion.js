exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('tokens_activacion');
  if (!exists) {
    await knex.schema.createTable('tokens_activacion', function(table) {
      table.increments('id').primary();
      table.integer('usuario_id').unsigned().notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
      table.string('token', 255).notNullable().unique();
      table.timestamp('expira_en').notNullable();
      table.boolean('usado').defaultTo(false);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('tokens_activacion');
};
