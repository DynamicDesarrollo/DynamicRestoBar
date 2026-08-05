exports.up = async function(knex) {
  const usuariosExists = await knex.schema.hasTable('usuarios');
  if (!usuariosExists) {
    await knex.schema.createTable('usuarios', function(table) {
      table.increments('id').primary();
      table.integer('empresa_id').unsigned().references('id').inTable('clientes').onDelete('CASCADE').nullable();
      table.string('nombre', 100).notNullable();
      table.string('email', 150).notNullable().unique();
      table.string('password_hash', 255);
      table.string('rol', 30).notNullable();
      table.boolean('activo').defaultTo(false);
      table.boolean('email_verificado').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const tokensExists = await knex.schema.hasTable('tokens_activacion');
  if (!tokensExists) {
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
