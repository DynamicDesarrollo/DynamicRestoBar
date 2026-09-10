/**
 * requiere_electronica: el comensal pidió factura electrónica en esta venta
 * puntual (se marca en Caja al cobrar — ver Fase 2 del plan). Independiente
 * de si la empresa tiene el servicio habilitado (clientes.factura_electronica_habilitada):
 * la empresa puede tener el servicio activo y aun así la mayoría de ventas
 * no la piden.
 *
 * estado_envio_dian: en qué punto va esta factura respecto al envío real.
 * Hoy nadie la envía a ningún lado (no existe la integración todavía) —
 * este estado solo deja registrado cuáles quedaron "listas para mandar"
 * el día que exista la app puente con Aliaddo.
 */
exports.up = async function (knex) {
  const tieneRequiere = await knex.schema.hasColumn('facturas', 'requiere_electronica');
  const tieneEstadoEnvio = await knex.schema.hasColumn('facturas', 'estado_envio_dian');

  if (!tieneRequiere || !tieneEstadoEnvio) {
    await knex.schema.alterTable('facturas', (table) => {
      if (!tieneRequiere) {
        table.boolean('requiere_electronica').notNullable().defaultTo(false);
      }
      if (!tieneEstadoEnvio) {
        table.string('estado_envio_dian', 20).notNullable().defaultTo('no_aplica');
      }
    });
  }

  await knex.raw(`
    ALTER TABLE facturas
    ADD CONSTRAINT facturas_estado_envio_dian_check
    CHECK (estado_envio_dian IN ('no_aplica', 'pendiente', 'enviada', 'rechazada'))
  `).catch(() => {
    // Ya existe la restricción (migración corrida antes) — no pasa nada.
  });
};

exports.down = async function (knex) {
  await knex.raw('ALTER TABLE facturas DROP CONSTRAINT IF EXISTS facturas_estado_envio_dian_check');
  const tieneRequiere = await knex.schema.hasColumn('facturas', 'requiere_electronica');
  const tieneEstadoEnvio = await knex.schema.hasColumn('facturas', 'estado_envio_dian');
  if (tieneRequiere || tieneEstadoEnvio) {
    await knex.schema.alterTable('facturas', (table) => {
      if (tieneRequiere) table.dropColumn('requiere_electronica');
      if (tieneEstadoEnvio) table.dropColumn('estado_envio_dian');
    });
  }
};
