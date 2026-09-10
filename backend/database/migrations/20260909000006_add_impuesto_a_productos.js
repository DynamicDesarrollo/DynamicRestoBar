/**
 * Para discriminar impuestos por ítem en una factura electrónica hace
 * falta saber el régimen de cada producto. Se deja SIN valor por defecto
 * a propósito: el régimen (IVA 19% vs INC 8%, típico en restaurantes sin
 * franquicia) lo debe confirmar el contador de cada cliente antes de
 * emitir la primera factura real — asumir uno acá sería adivinar en un
 * campo que después alimenta un documento fiscal.
 */
exports.up = async function (knex) {
  const tieneTipo = await knex.schema.hasColumn('productos', 'tipo_impuesto');
  const tienePorcentaje = await knex.schema.hasColumn('productos', 'porcentaje_impuesto');

  if (!tieneTipo || !tienePorcentaje) {
    await knex.schema.alterTable('productos', (table) => {
      if (!tieneTipo) {
        // 'iva' | 'inc' | 'excluido' | NULL (sin definir todavía)
        table.string('tipo_impuesto', 20).nullable();
      }
      if (!tienePorcentaje) {
        table.decimal('porcentaje_impuesto', 5, 2).nullable();
      }
    });
  }

  await knex.raw(`
    ALTER TABLE productos
    ADD CONSTRAINT productos_tipo_impuesto_check
    CHECK (tipo_impuesto IS NULL OR tipo_impuesto IN ('iva', 'inc', 'excluido'))
  `).catch(() => {});
};

exports.down = async function (knex) {
  await knex.raw('ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_tipo_impuesto_check');
  const tieneTipo = await knex.schema.hasColumn('productos', 'tipo_impuesto');
  const tienePorcentaje = await knex.schema.hasColumn('productos', 'porcentaje_impuesto');
  if (tieneTipo || tienePorcentaje) {
    await knex.schema.alterTable('productos', (table) => {
      if (tieneTipo) table.dropColumn('tipo_impuesto');
      if (tienePorcentaje) table.dropColumn('porcentaje_impuesto');
    });
  }
};
