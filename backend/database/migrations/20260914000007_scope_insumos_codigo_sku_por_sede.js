/**
 * insumos.codigo_sku tenía un UNIQUE global en toda la tabla — cualquier
 * cliente nuevo que intentara usar un código de insumo (ej. "C001") ya
 * usado por OTRO cliente (ej. Villa Sara) chocaba con esa restricción a
 * nivel de base de datos, aunque el chequeo de la app ya estuviera
 * acotado por sede/cliente. Se reemplaza por un UNIQUE compuesto
 * (sede_id, codigo_sku): el mismo código sigue sin poder repetirse DENTRO
 * de una misma empresa, pero ya no choca entre empresas distintas.
 */
exports.up = async function (knex) {
  try {
    await knex.schema.alterTable('insumos', (table) => {
      table.dropUnique(['codigo_sku']);
    });
  } catch (err) {
    // Ya no existía ese constraint (migración re-ejecutada) — seguir.
  }
  try {
    await knex.schema.alterTable('insumos', (table) => {
      table.unique(['sede_id', 'codigo_sku']);
    });
  } catch (err) {
    // Ya existía el constraint compuesto — seguir.
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.alterTable('insumos', (table) => {
      table.dropUnique(['sede_id', 'codigo_sku']);
    });
  } catch (err) {
    // no-op
  }
  try {
    await knex.schema.alterTable('insumos', (table) => {
      table.unique(['codigo_sku']);
    });
  } catch (err) {
    // no-op
  }
};
