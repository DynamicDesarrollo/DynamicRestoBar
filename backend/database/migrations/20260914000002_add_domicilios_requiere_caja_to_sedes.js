/**
 * A diferencia de estilo_catalogo (que solo edita el super-admin), esta la
 * decide el propio restaurante: si cobrar domicilios exige una caja abierta
 * (mismo flujo /caja/pago de siempre, entra al corte) o si puede cobrarse
 * sin turno de caja activo (restaurante "solo domicilios", sin mesero/caja
 * en uso). Ver DomiciliosController.registrarPago.
 */
exports.up = async function (knex) {
  const yaExiste = await knex.schema.hasColumn('sedes', 'domicilios_requiere_caja');
  if (!yaExiste) {
    await knex.schema.alterTable('sedes', (table) => {
      table.boolean('domicilios_requiere_caja').notNullable().defaultTo(true);
    });
  }
};

exports.down = async function (knex) {
  const existe = await knex.schema.hasColumn('sedes', 'domicilios_requiere_caja');
  if (existe) {
    await knex.schema.alterTable('sedes', (table) => {
      table.dropColumn('domicilios_requiere_caja');
    });
  }
};
