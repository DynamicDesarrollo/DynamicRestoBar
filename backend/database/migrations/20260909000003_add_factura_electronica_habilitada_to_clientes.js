/**
 * Facturación electrónica es un servicio que se activa por empresa (cliente
 * del SaaS), no algo que cada restaurante prenda solo. Igual que
 * estilo_catalogo, la decide el super-admin al crear o editar el cliente
 * (ver ClientesController.js) — el admin del restaurante nunca la toca.
 */
exports.up = async function (knex) {
  const yaExiste = await knex.schema.hasColumn('clientes', 'factura_electronica_habilitada');
  if (!yaExiste) {
    await knex.schema.alterTable('clientes', (table) => {
      table.boolean('factura_electronica_habilitada').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function (knex) {
  const existe = await knex.schema.hasColumn('clientes', 'factura_electronica_habilitada');
  if (existe) {
    await knex.schema.alterTable('clientes', (table) => {
      table.dropColumn('factura_electronica_habilitada');
    });
  }
};
