/**
 * Vincula el login (usuarios, rol Repartidor) con su ficha operativa
 * (repartidores — vehículo, placa, estado disponible/en_domicilio). Sin
 * esto, para saber "cuáles son MIS entregas" habría que emparejar por
 * email/documento, frágil si no coinciden exactamente.
 */
exports.up = async function (knex) {
  const yaExiste = await knex.schema.hasColumn('usuarios', 'repartidor_id');
  if (!yaExiste) {
    await knex.schema.alterTable('usuarios', (table) => {
      table.integer('repartidor_id').unsigned().nullable()
        .references('id').inTable('repartidores').onDelete('SET NULL');
    });
  }
};

exports.down = async function (knex) {
  const existe = await knex.schema.hasColumn('usuarios', 'repartidor_id');
  if (existe) {
    await knex.schema.alterTable('usuarios', (table) => {
      table.dropColumn('repartidor_id');
    });
  }
};
