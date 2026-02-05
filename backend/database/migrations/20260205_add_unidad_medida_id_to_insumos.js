// Migration to add 'unidad_medida_id' and 'proveedor_id' columns to 'insumos' table if missing
exports.up = async function(knex) {
  await knex.schema.alterTable('insumos', function(table) {
    if (!table.integer) return; // safeguard
    table.integer('unidad_medida_id').unsigned();
    table.integer('proveedor_id').unsigned();
    table.foreign('unidad_medida_id').references('id').inTable('unidad_medida').onDelete('RESTRICT');
    table.foreign('proveedor_id').references('id').inTable('proveedores').onDelete('SET NULL');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('insumos', function(table) {
    table.dropForeign('unidad_medida_id');
    table.dropForeign('proveedor_id');
    table.dropColumn('unidad_medida_id');
    table.dropColumn('proveedor_id');
  });
};
