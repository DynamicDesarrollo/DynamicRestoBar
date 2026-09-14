/**
 * direccion_entrega es texto libre — sin coordenadas, ni el pin de destino
 * ni la ruta calculada (OSRM) en el mapa son posibles. Se geocodifica la
 * dirección al crear el domicilio (Nominatim/OpenStreetMap, gratis, sin
 * key); si falla, quedan NULL y el mapa simplemente no dibuja el pin de
 * destino — no bloquea la creación del domicilio.
 */
exports.up = async function (knex) {
  const tieneLat = await knex.schema.hasColumn('domicilio_entregas', 'latitud_destino');
  const tieneLng = await knex.schema.hasColumn('domicilio_entregas', 'longitud_destino');
  if (!tieneLat || !tieneLng) {
    await knex.schema.alterTable('domicilio_entregas', (table) => {
      if (!tieneLat) table.decimal('latitud_destino', 11, 8).nullable();
      if (!tieneLng) table.decimal('longitud_destino', 11, 8).nullable();
    });
  }
};

exports.down = async function (knex) {
  const tieneLat = await knex.schema.hasColumn('domicilio_entregas', 'latitud_destino');
  const tieneLng = await knex.schema.hasColumn('domicilio_entregas', 'longitud_destino');
  if (tieneLat || tieneLng) {
    await knex.schema.alterTable('domicilio_entregas', (table) => {
      if (tieneLat) table.dropColumn('latitud_destino');
      if (tieneLng) table.dropColumn('longitud_destino');
    });
  }
};
