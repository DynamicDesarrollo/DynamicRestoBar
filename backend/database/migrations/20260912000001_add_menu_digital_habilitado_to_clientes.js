/**
 * Menú digital (QR/link para que el comensal vea el menú desde su celular)
 * es un valor agregado que se activa por empresa (cliente del SaaS), igual
 * que factura_electronica_habilitada — lo decide el super-admin al crear o
 * editar el cliente (ver ClientesController.js), el admin del restaurante
 * nunca lo toca.
 */
exports.up = async function (knex) {
  const yaExiste = await knex.schema.hasColumn('clientes', 'menu_digital_habilitado');
  if (!yaExiste) {
    await knex.schema.alterTable('clientes', (table) => {
      table.boolean('menu_digital_habilitado').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function (knex) {
  const existe = await knex.schema.hasColumn('clientes', 'menu_digital_habilitado');
  if (existe) {
    await knex.schema.alterTable('clientes', (table) => {
      table.dropColumn('menu_digital_habilitado');
    });
  }
};
