/**
 * Código oficial de "medio de pago" de DIAN (catálogo 5.6) para cada
 * método interno — lo pedirá cualquier proveedor de facturación
 * electrónica. Se deja sin llenar: Efectivo/Tarjeta débito/crédito son
 * inequívocos (10/49/48), pero billeteras como Nequi o Daviplata no
 * tienen un código propio en el catálogo DIAN y requieren que Aliaddo (o
 * el contador) confirme cuál usar antes de fijarlo.
 */
exports.up = async function (knex) {
  const yaExiste = await knex.schema.hasColumn('metodos_pago', 'codigo_dian');
  if (!yaExiste) {
    await knex.schema.alterTable('metodos_pago', (table) => {
      table.string('codigo_dian', 5).nullable();
    });
  }
};

exports.down = async function (knex) {
  const existe = await knex.schema.hasColumn('metodos_pago', 'codigo_dian');
  if (existe) {
    await knex.schema.alterTable('metodos_pago', (table) => {
      table.dropColumn('codigo_dian');
    });
  }
};
