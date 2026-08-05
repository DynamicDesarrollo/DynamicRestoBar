// 20240610_add_estado_plan_fechacorte_to_clientes.js

exports.up = async function(knex) {
  await knex.schema.table('clientes', function(table) {
    table.string('plan', 50);
    table.string('estado', 20).defaultTo('activo');
    table.date('fecha_corte');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('clientes', function(table) {
    table.dropColumn('plan');
    table.dropColumn('estado');
    table.dropColumn('fecha_corte');
  });
};
