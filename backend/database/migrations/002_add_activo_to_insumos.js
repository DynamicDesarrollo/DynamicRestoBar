// Migration to add 'activo' column to 'insumos' table
exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('insumos', 'activo');
  if (!exists) {
    await knex.schema.alterTable('insumos', function(table) {
      table.boolean('activo').defaultTo(true);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('insumos', function(table) {
    table.dropColumn('activo');
  });
};
