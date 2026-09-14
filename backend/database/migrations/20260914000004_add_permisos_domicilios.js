/**
 * Los permisos hoy no se enforced en ningún middleware (solo el nombre del
 * rol vía allowRoles/ProtectedRoute) — esto es catálogo/consistencia con el
 * resto de módulos, no un requisito funcional para que domicilios funcione.
 */
exports.up = async function (knex) {
  const permisosNuevos = [
    { nombre: 'ver_domicilios', modulo: 'domicilios', descripcion: 'Ver domicilios' },
    { nombre: 'actualizar_domicilios', modulo: 'domicilios', descripcion: 'Asignar repartidor y actualizar estado de domicilios' },
  ];

  for (const permiso of permisosNuevos) {
    const existe = await knex('permisos').where('nombre', permiso.nombre).first();
    if (!existe) {
      await knex('permisos').insert(permiso);
    }
  }

  const permisoIds = await knex('permisos')
    .whereIn('nombre', permisosNuevos.map((p) => p.nombre))
    .select('id', 'nombre');

  const roles = await knex('roles')
    .whereIn('nombre', ['Administrador', 'Gerente', 'Caja', 'Repartidor'])
    .select('id', 'nombre');

  for (const rol of roles) {
    for (const permiso of permisoIds) {
      const yaAsignado = await knex('rol_permiso')
        .where({ rol_id: rol.id, permiso_id: permiso.id })
        .first();
      if (!yaAsignado) {
        await knex('rol_permiso').insert({ rol_id: rol.id, permiso_id: permiso.id });
      }
    }
  }
};

exports.down = async function (knex) {
  const permisos = await knex('permisos')
    .whereIn('nombre', ['ver_domicilios', 'actualizar_domicilios'])
    .select('id');
  const permisoIds = permisos.map((p) => p.id);
  if (permisoIds.length) {
    await knex('rol_permiso').whereIn('permiso_id', permisoIds).del();
    await knex('permisos').whereIn('id', permisoIds).del();
  }
};
