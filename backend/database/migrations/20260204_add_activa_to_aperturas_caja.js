/**
 * Migration: add_activa_to_aperturas_caja.js
 * Agrega la columna booleana 'activa' a la tabla aperturas_caja si no existe.
 */

exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('aperturas_caja', 'activa');
  if (!exists) {
    await knex.schema.alterTable('aperturas_caja', function(table) {
      table.boolean('activa').defaultTo(true);
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('aperturas_caja', 'activa');
  if (exists) {
    await knex.schema.alterTable('aperturas_caja', function(table) {
      table.dropColumn('activa');
    });
  }
};
