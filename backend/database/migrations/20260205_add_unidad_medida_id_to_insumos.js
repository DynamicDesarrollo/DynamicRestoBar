// Migration to add 'unidad_medida_id' and 'proveedor_id' columns to 'insumos' table if missing
exports.up = async function(knex) {
  const hasUnidad = await knex.schema.hasColumn('insumos', 'unidad_medida_id');
  const hasProveedor = await knex.schema.hasColumn('insumos', 'proveedor_id');

  if (!hasUnidad) {
    await knex.schema.alterTable('insumos', function(table) {
      table.integer('unidad_medida_id').unsigned();
    });
  }

  if (!hasProveedor) {
    await knex.schema.alterTable('insumos', function(table) {
      table.integer('proveedor_id').unsigned();
    });
  }

  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'insumos_unidad_medida_id_foreign'
      ) THEN
        ALTER TABLE insumos
        ADD CONSTRAINT insumos_unidad_medida_id_foreign
        FOREIGN KEY (unidad_medida_id) REFERENCES unidad_medida(id) ON DELETE RESTRICT;
      END IF;
    END $$;
  `);

  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'insumos_proveedor_id_foreign'
      ) THEN
        ALTER TABLE insumos
        ADD CONSTRAINT insumos_proveedor_id_foreign
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);
};

exports.down = async function(knex) {
  await knex.raw('ALTER TABLE insumos DROP CONSTRAINT IF EXISTS insumos_unidad_medida_id_foreign');
  await knex.raw('ALTER TABLE insumos DROP CONSTRAINT IF EXISTS insumos_proveedor_id_foreign');

  const hasUnidad = await knex.schema.hasColumn('insumos', 'unidad_medida_id');
  if (hasUnidad) {
    await knex.schema.alterTable('insumos', function(table) {
      table.dropColumn('unidad_medida_id');
    });
  }

  const hasProveedor = await knex.schema.hasColumn('insumos', 'proveedor_id');
  if (hasProveedor) {
    await knex.schema.alterTable('insumos', function(table) {
      table.dropColumn('proveedor_id');
    });
  }
};
