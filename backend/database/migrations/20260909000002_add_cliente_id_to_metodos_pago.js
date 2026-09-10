/**
 * metodos_pago no tenía cliente_id: GET /caja/metodos-pago devolvía TODOS
 * los métodos activos del sistema a cualquier usuario autenticado, sin
 * distinguir empresa. Hoy es inofensivo porque los únicos registros son
 * los 6 métodos "de fábrica" (Efectivo, Nequi, etc.) compartidos por
 * todos, pero si algún cliente llegara a crear uno propio, todos los
 * demás lo verían y ninguno tendría dueño claro para editarlo/borrarlo.
 *
 * cliente_id NULL = método global (visible para todos, igual que hoy).
 * cliente_id con valor = propio de esa empresa únicamente. Mismo patrón
 * ya usado en conceptos_movimiento.
 */
exports.up = async function (knex) {
  const yaExiste = await knex.schema.hasColumn('metodos_pago', 'cliente_id');
  if (!yaExiste) {
    await knex.schema.alterTable('metodos_pago', (table) => {
      table.integer('cliente_id').nullable().index()
        .references('id').inTable('clientes');
    });
  }
  // Las filas existentes son los métodos de fábrica: se quedan con
  // cliente_id NULL (globales), no se backfillea nada.
};

exports.down = async function (knex) {
  const existe = await knex.schema.hasColumn('metodos_pago', 'cliente_id');
  if (existe) {
    await knex.schema.alterTable('metodos_pago', (table) => {
      table.dropColumn('cliente_id');
    });
  }
};
