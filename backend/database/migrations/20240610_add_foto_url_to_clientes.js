// 20240610_add_foto_url_to_clientes.js

exports.up = async function(knex) {
  await knex.schema.table('clientes', function(table) {
    table.string('foto_url', 500);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('clientes', function(table) {
    table.dropColumn('foto_url');
  });
};
