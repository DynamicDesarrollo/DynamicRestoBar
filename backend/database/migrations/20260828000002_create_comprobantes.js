exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('comprobantes');
  if (exists) return;
  await knex.schema.createTable('comprobantes', (table) => {
    table.increments('id').primary();
    table.integer('cliente_id').notNullable().index()
      .references('id').inTable('clientes').onDelete('CASCADE');
    table.integer('sede_id').notNullable().index()
      .references('id').inTable('sedes').onDelete('CASCADE');
    table.integer('concepto_id').notNullable().index()
      .references('id').inTable('conceptos_movimiento').onDelete('RESTRICT');
    table.string('tipo', 20).notNullable().index(); // 'ingreso' | 'egreso'
    table.date('fecha').notNullable().defaultTo(knex.fn.now());
    table.decimal('monto', 12, 2).notNullable();
    table.string('beneficiario', 255).nullable();
    table.integer('metodo_pago_id').nullable()
      .references('id').inTable('metodos_pago').onDelete('SET NULL');
    table.string('referencia', 255).nullable();
    table.text('observaciones').nullable();
    table.string('adjunto_url', 500).nullable();
    table.integer('usuario_id').notNullable()
      .references('id').inTable('usuarios').onDelete('RESTRICT');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('comprobantes');
};
