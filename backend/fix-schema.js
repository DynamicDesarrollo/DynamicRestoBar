const knex = require('./src/config/database');

async function fixSchema() {
  try {
    console.log('🔧 Fixing schema...');
    
    // Agregar columnas faltantes
    const hasCodigoSku = await knex.schema.hasColumn('insumos', 'codigo_sku');
    if (!hasCodigoSku) {
      await knex.schema.table('insumos', (table) => {
        table.string('codigo_sku', 100).unique();
      });
      console.log('✅ Added codigo_sku column');
    }

    const hasProveedorId = await knex.schema.hasColumn('insumos', 'proveedor_principal_id');
    if (!hasProveedorId) {
      await knex.schema.table('insumos', (table) => {
        table.integer('proveedor_principal_id').unsigned();
        table.foreign('proveedor_principal_id').references('id').inTable('proveedores').onDelete('SET NULL');
      });
      console.log('✅ Added proveedor_principal_id column');
    }

    const hasStockActual = await knex.schema.hasColumn('insumos', 'stock_actual');
    if (!hasStockActual) {
      await knex.schema.table('insumos', (table) => {
        table.decimal('stock_actual', 12, 2).defaultTo(0);
      });
      console.log('✅ Added stock_actual column');
    }

    const hasStockMinimo = await knex.schema.hasColumn('insumos', 'stock_minimo');
    if (!hasStockMinimo) {
      await knex.schema.table('insumos', (table) => {
        table.decimal('stock_minimo', 12, 2).defaultTo(0);
      });
      console.log('✅ Added stock_minimo column');
    }

    const hasStockMaximo = await knex.schema.hasColumn('insumos', 'stock_maximo');
    if (!hasStockMaximo) {
      await knex.schema.table('insumos', (table) => {
        table.decimal('stock_maximo', 12, 2).defaultTo(0);
      });
      console.log('✅ Added stock_maximo column');
    }

    const hasCostoUnitario = await knex.schema.hasColumn('insumos', 'costo_unitario');
    if (!hasCostoUnitario) {
      await knex.schema.table('insumos', (table) => {
        table.decimal('costo_unitario', 10, 2).defaultTo(0);
      });
      console.log('✅ Added costo_unitario column');
    }

    const hasActivo = await knex.schema.hasColumn('insumos', 'activo');
    if (!hasActivo) {
      await knex.schema.table('insumos', (table) => {
        table.boolean('activo').defaultTo(true);
      });
      console.log('✅ Added activo column');
    }

    // Insertar unidades de medida
    const unidadesCount = await knex('unidad_medida').count('* as cnt').first();
    if (unidadesCount.cnt === 0) {
      await knex('unidad_medida').insert([
        { nombre: 'Kilogramo', simbolo: 'kg' },
        { nombre: 'Litro', simbolo: 'lt' },
        { nombre: 'Unidad', simbolo: 'un' },
        { nombre: 'Porción', simbolo: 'por' },
        { nombre: 'Gramo', simbolo: 'g' },
        { nombre: 'Mililitro', simbolo: 'ml' },
      ]);
      console.log('✅ Inserted measurement units');
    }

    console.log('✨ Schema fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing schema:', err.message);
    process.exit(1);
  }
}

fixSchema();
