/**
 * Quién compró, para la factura electrónica. No existía en ningún lado:
 * facturas.cliente_id apunta a la EMPRESA dueña del restaurante (el
 * tenant del SaaS), nunca al comensal que pidió la cuenta. Se modela
 * aparte (1 a 1 con facturas) y solo se crea la fila cuando alguien
 * realmente pide factura electrónica — la inmensa mayoría de ventas no
 * la piden y no deben cargar con este dato.
 */
exports.up = async function (knex) {
  const existe = await knex.schema.hasTable('factura_compradores');
  if (existe) return;

  await knex.schema.createTable('factura_compradores', (table) => {
    table.increments('id').primary();
    table.integer('factura_id').notNullable().unique()
      .references('id').inTable('facturas').onDelete('CASCADE');

    // CC, NIT, CE, PAS, o 'consumidor_final' (DIAN permite identificar así
    // a quien no quiere dar sus datos: NIT genérico 222222222222).
    table.string('tipo_documento', 20).notNullable();
    table.string('numero_documento', 30).notNullable();
    table.string('nombre_razon_social', 255).notNullable();
    table.string('email', 255).nullable();
    table.string('telefono', 20).nullable();
    table.string('direccion', 500).nullable();

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('factura_compradores');
};
