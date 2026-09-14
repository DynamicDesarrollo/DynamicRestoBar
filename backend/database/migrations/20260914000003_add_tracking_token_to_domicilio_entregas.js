/**
 * Token opaco para que la app pública de seguimiento (comensal, sin login)
 * pueda ver el mapa de SU entrega sin exponer el id secuencial de
 * domicilio_entregas (que dejaría adivinar/enumerar entregas ajenas).
 */
exports.up = async function (knex) {
  const yaExiste = await knex.schema.hasColumn('domicilio_entregas', 'tracking_token');
  if (!yaExiste) {
    await knex.schema.alterTable('domicilio_entregas', (table) => {
      table.string('tracking_token', 64).nullable();
    });
  }
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS domicilio_entregas_tracking_token_unique
    ON domicilio_entregas (tracking_token)
    WHERE tracking_token IS NOT NULL
  `);
};

exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS domicilio_entregas_tracking_token_unique');
  const existe = await knex.schema.hasColumn('domicilio_entregas', 'tracking_token');
  if (existe) {
    await knex.schema.alterTable('domicilio_entregas', (table) => {
      table.dropColumn('tracking_token');
    });
  }
};
