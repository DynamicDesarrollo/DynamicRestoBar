/**
 * Domicilios es un valor agregado que se activa por empresa (cliente del
 * SaaS), igual que menu_digital_habilitado / factura_electronica_habilitada
 * — lo decide el super-admin al crear o editar el cliente (ver
 * ClientesController.js), el admin del restaurante nunca lo toca.
 */
exports.up = async function (knex) {
  const yaExiste = await knex.schema.hasColumn('clientes', 'domicilio_habilitado');
  if (!yaExiste) {
    await knex.schema.alterTable('clientes', (table) => {
      table.boolean('domicilio_habilitado').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function (knex) {
  const existe = await knex.schema.hasColumn('clientes', 'domicilio_habilitado');
  if (existe) {
    await knex.schema.alterTable('clientes', (table) => {
      table.dropColumn('domicilio_habilitado');
    });
  }
};
