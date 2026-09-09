/**
 * sedes.cliente_id nunca pasó por una migración: se agregó a mano en el
 * entorno de desarrollo en algún momento, y producción (Neon) nunca la tuvo.
 * Todo el aislamiento multi-tenant (sedesDelCliente y cada controlador que
 * lo usa) depende de esta columna — sin ella, esas rutas fallan o, peor,
 * devuelven "vacío" para todo (ver el guard hasColumn en
 * controllers/admin/SedesController.js, que hasta ahora compensaba esto
 * ocultando el módulo de sedes en vez de resolverlo).
 */
exports.up = async function (knex) {
  const yaExiste = await knex.schema.hasColumn('sedes', 'cliente_id');
  if (!yaExiste) {
    await knex.schema.alterTable('sedes', (table) => {
      table.integer('cliente_id').nullable().index()
        .references('id').inTable('clientes');
    });
  }

  // Backfill a partir de usuarios: para cada sede, si TODOS los usuarios
  // activos que apuntan a ella pertenecen al mismo cliente, se asigna esa
  // sede a ese cliente. Se usa usuarios (evidencia real de operación) y no
  // clientes.sede_id (que puede estar vacío o desactualizado). Una sede sin
  // usuarios, o con usuarios de más de un cliente, se deja sin asignar en
  // vez de adivinar — queda cliente_id NULL, que el código ya trata como
  // "sin dueño" de forma segura, nunca como fuga entre clientes.
  await knex.raw(`
    UPDATE sedes s
    SET cliente_id = sub.cliente_id
    FROM (
      SELECT u.sede_id, MIN(u.cliente_id) AS cliente_id
      FROM usuarios u
      WHERE u.deleted_at IS NULL
        AND u.cliente_id IS NOT NULL
        AND u.sede_id IS NOT NULL
      GROUP BY u.sede_id
      HAVING COUNT(DISTINCT u.cliente_id) = 1
    ) sub
    WHERE s.id = sub.sede_id AND s.cliente_id IS NULL
  `);
};

exports.down = async function (knex) {
  const existe = await knex.schema.hasColumn('sedes', 'cliente_id');
  if (existe) {
    await knex.schema.alterTable('sedes', (table) => {
      table.dropColumn('cliente_id');
    });
  }
};
