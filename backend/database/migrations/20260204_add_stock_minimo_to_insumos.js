exports.up = async function(knex) {
  await knex.schema.alterTable('insumos', function(table) {
    table.decimal('stock_minimo', 12, 2).defaultTo(0);
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('insumos', function(table) {
    table.dropColumn('stock_minimo');
  });
};
// MIGRACIÓN COMENTADA TEMPORALMENTE PARA DESBLOQUEAR MIGRACIONES DE CLIENTES
// exports.up = async function(knex) {
//   await knex.schema.alterTable('insumos', function(table) {
//     table.decimal('stock_minimo', 12, 2).defaultTo(0);
//   });
// };
// 
// exports.down = async function(knex) {
//   await knex.schema.alterTable('insumos', function(table) {
//     table.dropColumn('stock_minimo');
//   });
// };
