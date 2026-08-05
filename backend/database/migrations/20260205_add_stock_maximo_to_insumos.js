// Migration to add 'stock_maximo' column to 'insumos' table
exports.up = async function(knex) {
  await knex.schema.alterTable('insumos', function(table) {
    table.decimal('stock_maximo', 12, 2).defaultTo(0);
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('insumos', function(table) {
    table.dropColumn('stock_maximo');
  });
};
