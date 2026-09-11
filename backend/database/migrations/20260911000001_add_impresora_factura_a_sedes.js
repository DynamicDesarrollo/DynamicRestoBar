/**
 * Hoy la impresora que recibe la factura final se elige adivinando por
 * palabras clave en el nombre/modelo ("bar", "caja", "bebida") — frágil y
 * nada configurable. Se agrega una referencia explícita a qué impresora
 * de la sede debe recibirla (cocina o bar, lo que el admin decida).
 *
 * Nullable a propósito: mientras nadie la configure, CajaController sigue
 * cayendo al comportamiento heurístico de siempre — no se rompe nada para
 * las sedes que ya funcionan hoy sin tocar esta configuración.
 */
exports.up = async function (knex) {
  const yaExiste = await knex.schema.hasColumn('sedes', 'impresora_factura_id');
  if (!yaExiste) {
    await knex.schema.alterTable('sedes', (table) => {
      table.integer('impresora_factura_id').nullable()
        .references('id').inTable('impresoras').onDelete('SET NULL');
    });
  }
};

exports.down = async function (knex) {
  const existe = await knex.schema.hasColumn('sedes', 'impresora_factura_id');
  if (existe) {
    await knex.schema.alterTable('sedes', (table) => {
      table.dropColumn('impresora_factura_id');
    });
  }
};
