// Migration to add 'activo' column to 'insumos' table
exports.up = function(knex) {
  return knex.schema.alterTable('insumos', function(table) {
    table.boolean('activo').defaultTo(true);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('insumos', function(table) {
    table.dropColumn('activo');
  });
};
