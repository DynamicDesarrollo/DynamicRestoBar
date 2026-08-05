// 20240610_add_estado_plan_fechacorte_to_clientes.js

exports.up = async function(knex) {
  const hasPlan = await knex.schema.hasColumn('clientes', 'plan');
  const hasEstado = await knex.schema.hasColumn('clientes', 'estado');
  const hasFechaCorte = await knex.schema.hasColumn('clientes', 'fecha_corte');

  await knex.schema.table('clientes', function(table) {
    if (!hasPlan) table.string('plan', 50);
    if (!hasEstado) table.string('estado', 20).defaultTo('activo');
    if (!hasFechaCorte) table.date('fecha_corte');
  });
};

exports.down = async function(knex) {
  const hasPlan = await knex.schema.hasColumn('clientes', 'plan');
  const hasEstado = await knex.schema.hasColumn('clientes', 'estado');
  const hasFechaCorte = await knex.schema.hasColumn('clientes', 'fecha_corte');

  await knex.schema.table('clientes', function(table) {
    if (hasPlan) table.dropColumn('plan');
    if (hasEstado) table.dropColumn('estado');
    if (hasFechaCorte) table.dropColumn('fecha_corte');
  });
};
