// Migration to add 'stock_maximo' column to 'insumos' table
exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('insumos', 'stock_maximo');
  if (!exists) {
    await knex.schema.alterTable('insumos', function(table) {
      table.decimal('stock_maximo', 12, 2).defaultTo(0);
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('insumos', 'stock_maximo');
  if (exists) {
    await knex.schema.alterTable('insumos', function(table) {
      table.dropColumn('stock_maximo');
    });
  }
};
