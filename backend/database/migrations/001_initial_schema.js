/**
 * MIGRATION: Initial Database Schema
 * Descripción: Crea todas las tablas, enums, índices y vistas para DynamicRestoBar
 * Fase 1: MVP con mesas, pedidos, comandas, caja y domicilios básicos
 * 
 * Módulos incluidos:
 * - Seguridad (usuarios, roles, permisos)
 * - Sedes (sedes, zonas, estaciones, mesas, impresoras)
 * - Productos (categorías, productos, variantes, modificadores, combos)
 * - Inventario (insumos, recetas, kardex)
 * - Proveedores (proveedores, compras)
 * - Órdenes (órdenes, orden_items, modificadores)
 * - Comandas (comandas, comanda_items, línea de producción)
 * - Caja (facturas, pagos, aperturas/cierres)
 * - Domicilios (repartidores, entregas, tracking)
 */

exports.up = async (knex) => {
  // ========================================
  // 1. ENUMS (Tipos de datos enumerados)
  // ========================================

  // Enum: Estados de mesas
  await knex.raw(`
    CREATE TYPE mesa_estado_enum AS ENUM (
      'disponible',
      'ocupada',
      'en_precuenta',
      'cerrada'
    );
  `);

  // Enum: Estados de órdenes
  await knex.raw(`
    CREATE TYPE orden_estado_enum AS ENUM (
      'abierta',
      'enviada_produccion',
      'en_preparacion',
      'lista_entrega',
      'entregada',
      'anulada'
    );
  `);

  // Enum: Estados de comandas
  await knex.raw(`
    CREATE TYPE comanda_estado_enum AS ENUM (
      'pendiente',
      'en_preparacion',
      'lista',
      'entregada'
    );
  `);

  // Enum: Estados de items en comanda
  await knex.raw(`
    CREATE TYPE item_estado_enum AS ENUM (
      'pendiente',
      'en_preparacion',
      'listo',
      'entregado'
    );
  `);

  // Enum: Canales de venta
  await knex.raw(`
    CREATE TYPE canal_enum AS ENUM (
      'mostrador',
      'domicilio',
      'para_llevar'
    );
  `);

  // Enum: Tipos de movimiento de kardex
  await knex.raw(`
    CREATE TYPE kardex_tipo_enum AS ENUM (
      'entrada',
      'salida',
      'ajuste',
      'merma'
    );
  `);

  // Enum: Estados de compra
  await knex.raw(`
    CREATE TYPE compra_estado_enum AS ENUM (
      'draft',
      'confirmada',
      'recibida',
      'facturada',
      'cancelada'
    );
  `);

  // Enum: Tipos de modificadores
  await knex.raw(`
    CREATE TYPE modificador_tipo_enum AS ENUM (
      'adicional',
      'sustitución',
      'exclusión'
    );
  `);

  // Enum: Estados de repartidores
  await knex.raw(`
    CREATE TYPE repartidor_estado_enum AS ENUM (
      'activo',
      'en_domicilio',
      'disponible',
      'inactivo'
    );
  `);

  // Enum: Estados de caja
  await knex.raw(`
    CREATE TYPE caja_estado_enum AS ENUM (
      'abierta',
      'en_cierre',
      'cerrada'
    );
  `);

  // ========================================
  // 2. TABLAS DE SEGURIDAD
  // ========================================

  // Tabla: roles (DEBE CREARSE PRIMERO antes de usuarios)
  await knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('nombre', 255).unique().notNullable();
    table.text('descripcion');
    table.timestamps();
    table.index('nombre');
  });

  // Tabla: sedes (DEBE CREARSE ANTES de usuarios)
  await knex.schema.createTable('sedes', (table) => {
    table.increments('id').primary();
    table.string('nombre', 255).notNullable();
    table.string('direccion', 500);
    table.string('ciudad', 100);
    table.string('telefono', 20);
    table.string('email', 255);
    table.text('descripcion');
    table.boolean('activa').defaultTo(true);
    table.timestamps();
    table.datetime('deleted_at');
    table.index('nombre');
  });

  // Tabla: usuarios
  await knex.schema.createTable('usuarios', (table) => {
    table.increments('id').primary();
    table.string('nombre', 255).notNullable();
    table.string('email', 255).unique();
    table.string('contraseña', 255).notNullable();
    table.string('pin', 4).notNullable(); // PIN corto para login en tablet
    table.integer('rol_id').unsigned().notNullable();
    table.integer('sede_id').unsigned();
    table.string('foto_url', 500);
    table.enum('estado', ['activo', 'inactivo']).defaultTo('activo');
    table.timestamp('ultimo_login');
    table.timestamps(); // created_at, updated_at
    table.datetime('deleted_at');
    table.foreign('rol_id').references('id').inTable('roles');
    table.foreign('sede_id').references('id').inTable('sedes');
    table.index('email');
    table.index('sede_id');
    table.index('rol_id');
  });

  // Tabla: permisos
  await knex.schema.createTable('permisos', (table) => {
    table.increments('id').primary();
    table.string('nombre', 255).unique().notNullable();
    table.text('descripcion');
    table.string('modulo', 100); // 'productos', 'ordenes', 'caja', 'admin'
    table.timestamps();
    table.index('modulo');
  });

  // Tabla: rol_permiso (relación many-to-many)
  await knex.schema.createTable('rol_permiso', (table) => {
    table.increments('id').primary();
    table.integer('rol_id').unsigned().notNullable();
    table.integer('permiso_id').unsigned().notNullable();
    table.timestamps();
    table.foreign('rol_id').references('id').inTable('roles').onDelete('CASCADE');
    table.foreign('permiso_id').references('id').inTable('permisos').onDelete('CASCADE');
    table.unique(['rol_id', 'permiso_id']);
  });

  // Tabla: auditoria_eventos
  await knex.schema.createTable('auditoria_eventos', (table) => {
    table.increments('id').primary();
    table.integer('usuario_id').unsigned();
    table.string('tabla', 100).notNullable();
    table.enum('accion', ['CREATE', 'UPDATE', 'DELETE']).notNullable();
    table.json('datos_anteriores');
    table.json('datos_nuevos');
    table.string('ip_address', 45);
    table.text('observaciones');
    table.timestamps();
    table.foreign('usuario_id').references('id').inTable('usuarios').onDelete('SET NULL');
    table.index(['tabla', 'accion']);
    table.index('usuario_id');
  });

  // ========================================
  // 3. TABLAS DE SEDES
  // ========================================

  // Tabla: zonas (agrupaciones dentro de una sede)
  await knex.schema.createTable('zonas', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.string('nombre', 255).notNullable();
    table.text('descripcion');
    table.integer('numero_mesas').unsigned();
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.unique(['sede_id', 'nombre']);
    table.index('sede_id');
  });

  // Tabla: estaciones
  await knex.schema.createTable('estaciones', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.string('nombre', 255).notNullable(); // 'Cocina', 'Bar', 'Pastelería'
    table.enum('tipo', ['cocina', 'bar', 'pasteleria', 'otro']).defaultTo('cocina');
    table.text('descripcion');
    table.boolean('activa').defaultTo(true);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.unique(['sede_id', 'nombre']);
    table.index('sede_id');
  });

  // Tabla: mesas
  await knex.schema.createTable('mesas', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.integer('zona_id').unsigned().notNullable();
    table.string('numero', 50).notNullable();
    table.integer('capacidad').unsigned().defaultTo(4);
    table.enum('estado', ['disponible', 'ocupada', 'en_precuenta', 'cerrada']).defaultTo('disponible');
    table.integer('orden_id').unsigned(); // Orden actual si está ocupada
    table.integer('mesero_id').unsigned(); // Mesero asignado
    table.timestamp('hora_ocupacion');
    table.integer('numero_comensales').unsigned();
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.foreign('zona_id').references('id').inTable('zonas').onDelete('RESTRICT');
    table.foreign('mesero_id').references('id').inTable('usuarios').onDelete('SET NULL');
    table.unique(['sede_id', 'numero']);
    table.index('sede_id');
    table.index('zona_id');
    table.index('estado');
  });

  // Tabla: impresoras
  await knex.schema.createTable('impresoras', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.string('nombre', 255).notNullable();
    table.enum('tipo', ['termica', 'laser', 'inyeccion']).defaultTo('termica');
    table.string('modelo', 255);
    table.string('ip_address', 45);
    table.integer('puerto').unsigned().defaultTo(9100);
    table.string('serial', 255);
    table.enum('estado', ['activa', 'inactiva']).defaultTo('activa');
    table.integer('copia_seguridad').unsigned().defaultTo(1); // 1 = única copia, 2 = copia, etc
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.index('sede_id');
  });

  // Tabla: sede_estacion_impresora (relación N:N)
  await knex.schema.createTable('sede_estacion_impresora', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.integer('estacion_id').unsigned().notNullable();
    table.integer('impresora_id').unsigned().notNullable();
    table.integer('orden').unsigned().defaultTo(1); // Prioridad si hay varias impresoras
    table.timestamps();
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.foreign('estacion_id').references('id').inTable('estaciones').onDelete('CASCADE');
    table.foreign('impresora_id').references('id').inTable('impresoras').onDelete('CASCADE');
    table.unique(['estacion_id', 'impresora_id']);
    table.index('sede_id');
    table.index('estacion_id');
  });

  // ========================================
  // 4. TABLAS DE PRODUCTOS
  // ========================================

  // Tabla: categorias
  await knex.schema.createTable('categorias', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned(); // NULL = disponible en todas las sedes
    table.string('nombre', 255).notNullable();
    table.text('descripcion');
    table.string('icono_url', 500);
    table.integer('orden').unsigned().defaultTo(0);
    table.boolean('activa').defaultTo(true);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.index('sede_id');
    table.index('nombre');
  });

  // Tabla: productos
  await knex.schema.createTable('productos', (table) => {
    table.increments('id').primary();
    table.integer('categoria_id').unsigned().notNullable();
    table.integer('sede_id').unsigned();
    table.string('nombre', 255).notNullable();
    table.text('descripcion');
    table.decimal('precio_venta', 10, 2).notNullable();
    table.integer('insumo_id').unsigned(); // Referencia para costing
    table.string('foto_url', 500);
    table.enum('estado', ['activo', 'inactivo']).defaultTo('activo');
    table.boolean('es_combo').defaultTo(false);
    table.integer('estacion_id').unsigned(); // Dónde se prepara (cocina/bar)
    table.integer('tiempo_preparacion').unsigned().defaultTo(15); // Minutos estimados
    table.integer('orden').unsigned().defaultTo(0);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('categoria_id').references('id').inTable('categorias').onDelete('CASCADE');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.foreign('estacion_id').references('id').inTable('estaciones').onDelete('SET NULL');
    table.index('categoria_id');
    table.index('sede_id');
    table.index('estado');
    table.index('estacion_id');
  });

  // Tabla: variantes
  await knex.schema.createTable('variantes', (table) => {
    table.increments('id').primary();
    table.string('nombre', 255).notNullable(); // 'Tamaño', 'Color', etc
    table.text('descripcion');
    table.timestamps();
  });

  // Tabla: producto_variante (relación N:N)
  await knex.schema.createTable('producto_variante', (table) => {
    table.increments('id').primary();
    table.integer('producto_id').unsigned().notNullable();
    table.integer('variante_id').unsigned().notNullable();
    table.string('valor', 255).notNullable(); // 'Pequeño', 'Mediano', 'Grande'
    table.decimal('precio_adicional', 10, 2).defaultTo(0);
    table.timestamps();
    table.foreign('producto_id').references('id').inTable('productos').onDelete('CASCADE');
    table.foreign('variante_id').references('id').inTable('variantes').onDelete('CASCADE');
    table.unique(['producto_id', 'variante_id', 'valor']);
  });

  // Tabla: modificadores
  await knex.schema.createTable('modificadores', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned();
    table.string('nombre', 255).notNullable();
    table.text('descripcion');
    table.enum('tipo', ['adicional', 'sustitución', 'exclusión']).defaultTo('adicional');
    table.boolean('requerido').defaultTo(false); // ¿Obligatorio seleccionar?
    table.integer('maxima_seleccion').unsigned().defaultTo(1); // Cuántas opciones máximo
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.index('sede_id');
  });

  // Tabla: modificador_opciones
  await knex.schema.createTable('modificador_opciones', (table) => {
    table.increments('id').primary();
    table.integer('modificador_id').unsigned().notNullable();
    table.string('nombre', 255).notNullable(); // 'Extra queso', 'Sin cebolla'
    table.decimal('precio_adicional', 10, 2).defaultTo(0);
    table.integer('orden').unsigned().defaultTo(0);
    table.timestamps();
    table.foreign('modificador_id').references('id').inTable('modificadores').onDelete('CASCADE');
    table.index('modificador_id');
  });

  // Tabla: producto_modificador (relación N:N)
  await knex.schema.createTable('producto_modificador', (table) => {
    table.increments('id').primary();
    table.integer('producto_id').unsigned().notNullable();
    table.integer('modificador_id').unsigned().notNullable();
    table.integer('orden').unsigned().defaultTo(0);
    table.timestamps();
    table.foreign('producto_id').references('id').inTable('productos').onDelete('CASCADE');
    table.foreign('modificador_id').references('id').inTable('modificadores').onDelete('CASCADE');
    table.unique(['producto_id', 'modificador_id']);
  });

  // Tabla: combos
  await knex.schema.createTable('combos', (table) => {
    table.increments('id').primary();
    table.integer('categoria_id').unsigned().notNullable();
    table.integer('sede_id').unsigned();
    table.string('nombre', 255).notNullable();
    table.text('descripcion');
    table.decimal('precio_venta', 10, 2).notNullable();
    table.string('foto_url', 500);
    table.boolean('activo').defaultTo(true);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('categoria_id').references('id').inTable('categorias').onDelete('CASCADE');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
  });

  // Tabla: combo_items
  await knex.schema.createTable('combo_items', (table) => {
    table.increments('id').primary();
    table.integer('combo_id').unsigned().notNullable();
    table.integer('producto_id').unsigned().notNullable();
    table.integer('cantidad').unsigned().defaultTo(1);
    table.timestamps();
    table.foreign('combo_id').references('id').inTable('combos').onDelete('CASCADE');
    table.foreign('producto_id').references('id').inTable('productos').onDelete('RESTRICT');
  });

  // ========================================
  // 5. TABLAS DE INVENTARIO
  // ========================================

  // Tabla: unidad_medida
  await knex.schema.createTable('unidad_medida', (table) => {
    table.increments('id').primary();
    table.string('nombre', 50).unique().notNullable(); // 'kg', 'lt', 'unidad', 'metro'
    table.string('simbolo', 10);
    table.timestamps();
  });

  // Tabla: proveedores (MOVIDA ANTES DE INSUMOS)
  await knex.schema.createTable('proveedores', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned();
    table.string('nombre', 255).notNullable();
    table.string('contacto', 255);
    table.string('email', 255);
    table.string('telefono', 20);
    table.string('direccion', 500);
    table.string('rut', 50);
    table.string('ciudad', 100);
    table.text('observaciones');
    table.boolean('activo').defaultTo(true);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.index('nombre');
  });

  // Tabla: insumos
  await knex.schema.createTable('insumos', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned();
    table.string('nombre', 255).notNullable();
    table.string('codigo_sku', 100).unique();
    table.text('descripcion');
    table.integer('unidad_medida_id').unsigned().notNullable();
    table.integer('proveedor_principal_id').unsigned();
    table.decimal('stock_actual', 12, 2).defaultTo(0);
    table.decimal('cantidad_minima', 12, 2).defaultTo(0);
    table.decimal('cantidad_maxima', 12, 2).defaultTo(0);
    table.decimal('costo_unitario', 10, 2).defaultTo(0);
    table.decimal('costo_promedio', 10, 2).defaultTo(0);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.foreign('unidad_medida_id').references('id').inTable('unidad_medida').onDelete('RESTRICT');
    table.foreign('proveedor_principal_id').references('id').inTable('proveedores').onDelete('SET NULL');
    table.index(['sede_id', 'nombre']);
  });

  // Tabla: recetas (fórmula de cómo hacer un producto)
  await knex.schema.createTable('recetas', (table) => {
    table.increments('id').primary();
    table.integer('producto_id').unsigned().notNullable();
    table.integer('sede_id').unsigned();
    table.string('nombre', 255).notNullable();
    table.text('instrucciones');
    table.integer('rendimiento').unsigned(); // Cantidad de porciones
    table.decimal('costo_produccion', 10, 2);
    table.boolean('activa').defaultTo(true);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('producto_id').references('id').inTable('productos').onDelete('CASCADE');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
  });

  // Tabla: receta_insumos
  await knex.schema.createTable('receta_insumos', (table) => {
    table.increments('id').primary();
    table.integer('receta_id').unsigned().notNullable();
    table.integer('insumo_id').unsigned().notNullable();
    table.decimal('cantidad', 10, 2).notNullable();
    table.timestamps();
    table.foreign('receta_id').references('id').inTable('recetas').onDelete('CASCADE');
    table.foreign('insumo_id').references('id').inTable('insumos').onDelete('RESTRICT');
    table.index('receta_id');
  });

  // Tabla: kardex_movimientos
  await knex.schema.createTable('kardex_movimientos', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.integer('insumo_id').unsigned().notNullable();
    table.enum('tipo', ['entrada', 'salida', 'ajuste', 'merma']).notNullable();
    table.decimal('cantidad', 10, 2).notNullable();
    table.decimal('precio_unitario', 10, 2);
    table.decimal('costo_total', 10, 2);
    table.string('referencia', 255); // ID de compra, orden, ajuste, etc
    table.text('observaciones');
    table.integer('usuario_id').unsigned();
    table.timestamps();
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.foreign('insumo_id').references('id').inTable('insumos').onDelete('RESTRICT');
    table.foreign('usuario_id').references('id').inTable('usuarios').onDelete('SET NULL');
    table.index(['sede_id', 'insumo_id']);
    table.index('tipo');
  });



  // Tabla: compras
  await knex.schema.createTable('compras', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.integer('proveedor_id').unsigned().notNullable();
    table.string('numero_orden', 100);
    table.enum('estado', ['draft', 'confirmada', 'recibida', 'facturada', 'cancelada']).defaultTo('draft');
    table.date('fecha_pedido');
    table.date('fecha_recepcion');
    table.decimal('subtotal', 10, 2).defaultTo(0);
    table.decimal('iva', 10, 2).defaultTo(0);
    table.decimal('total', 10, 2).defaultTo(0);
    table.text('observaciones');
    table.integer('usuario_id').unsigned();
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.foreign('proveedor_id').references('id').inTable('proveedores').onDelete('RESTRICT');
    table.foreign('usuario_id').references('id').inTable('usuarios').onDelete('SET NULL');
    table.index('fecha_pedido');
  });

  // Tabla: compra_items
  await knex.schema.createTable('compra_items', (table) => {
    table.increments('id').primary();
    table.integer('compra_id').unsigned().notNullable();
    table.integer('insumo_id').unsigned().notNullable();
    table.decimal('cantidad', 10, 2).notNullable();
    table.decimal('precio_unitario', 10, 2).notNullable();
    table.decimal('subtotal', 10, 2);
    table.integer('cantidad_recibida').unsigned().defaultTo(0);
    table.text('observaciones');
    table.timestamps();
    table.foreign('compra_id').references('id').inTable('compras').onDelete('CASCADE');
    table.foreign('insumo_id').references('id').inTable('insumos').onDelete('RESTRICT');
    table.index('compra_id');
  });

  // ========================================
  // 7. TABLAS DE ÓRDENES
  // ========================================

  // Tabla: canales
  await knex.schema.createTable('canales', (table) => {
    table.increments('id').primary();
    table.string('nombre', 100).unique().notNullable(); // 'Mostrador', 'Domicilio', 'Para llevar'
    table.text('descripcion');
    table.timestamps();
  });

  // Tabla: clientes
  await knex.schema.createTable('clientes', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned();
    table.string('nombre', 255).notNullable();
    table.string('email', 255);
    table.string('telefono', 20);
    table.string('documento', 50);
    table.text('observaciones');
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.index('documento');
  });

  // Tabla: cliente_direcciones
  await knex.schema.createTable('cliente_direcciones', (table) => {
    table.increments('id').primary();
    table.integer('cliente_id').unsigned().notNullable();
    table.string('direccion', 500).notNullable();
    table.string('ciudad', 100);
    table.string('referencia', 255);
    table.boolean('es_predeterminada').defaultTo(false);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('cliente_id').references('id').inTable('clientes').onDelete('CASCADE');
    table.index('cliente_id');
  });

  // Tabla: zona_entrega
  await knex.schema.createTable('zona_entrega', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.string('nombre', 255).notNullable();
    table.decimal('costo_entrega', 10, 2).defaultTo(0);
    table.text('descripcion');
    table.boolean('activa').defaultTo(true);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.unique(['sede_id', 'nombre']);
  });

  // Tabla: órdenes
  await knex.schema.createTable('ordenes', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.integer('mesa_id').unsigned(); // NULL si no es mesa
    table.integer('usuario_id').unsigned(); // Mesero/vendedor
    table.integer('canal_id').unsigned(); // Mostrador, domicilio, etc
    table.integer('cliente_id').unsigned();
    table.integer('zona_entrega_id').unsigned();
    table.string('numero_orden', 100);
    table.enum('estado', ['abierta', 'enviada_produccion', 'en_preparacion', 'lista_entrega', 'entregada', 'anulada']).defaultTo('abierta');
    table.decimal('subtotal', 10, 2).defaultTo(0);
    table.decimal('descuento', 10, 2).defaultTo(0);
    table.decimal('iva', 10, 2).defaultTo(0);
    table.decimal('costo_entrega', 10, 2).defaultTo(0);
    table.decimal('total', 10, 2).defaultTo(0);
    table.text('notas_cliente');
    table.text('notas_cocina');
    table.timestamp('hora_entrega_estimada');
    table.integer('numero_comensales').unsigned();
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.foreign('mesa_id').references('id').inTable('mesas').onDelete('SET NULL');
    table.foreign('usuario_id').references('id').inTable('usuarios').onDelete('SET NULL');
    table.foreign('canal_id').references('id').inTable('canales').onDelete('RESTRICT');
    table.foreign('cliente_id').references('id').inTable('clientes').onDelete('SET NULL');
    table.foreign('zona_entrega_id').references('id').inTable('zona_entrega').onDelete('SET NULL');
    table.index('numero_orden');
    table.index('sede_id');
    table.index('estado');
  });

  // Tabla: orden_items
  await knex.schema.createTable('orden_items', (table) => {
    table.increments('id').primary();
    table.integer('orden_id').unsigned().notNullable();
    table.integer('producto_id').unsigned().notNullable();
    table.integer('cantidad').unsigned().notNullable();
    table.decimal('precio_unitario', 10, 2).notNullable();
    table.decimal('subtotal', 10, 2);
    table.text('notas_especiales');
    table.enum('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado']).defaultTo('pendiente');
    table.timestamps();
    table.foreign('orden_id').references('id').inTable('ordenes').onDelete('CASCADE');
    table.foreign('producto_id').references('id').inTable('productos').onDelete('RESTRICT');
    table.index('orden_id');
  });

  // Tabla: orden_item_modificador
  await knex.schema.createTable('orden_item_modificador', (table) => {
    table.increments('id').primary();
    table.integer('orden_item_id').unsigned().notNullable();
    table.integer('modificador_opcion_id').unsigned().notNullable();
    table.decimal('precio_adicional', 10, 2).defaultTo(0);
    table.timestamps();
    table.foreign('orden_item_id').references('id').inTable('orden_items').onDelete('CASCADE');
    table.foreign('modificador_opcion_id').references('id').inTable('modificador_opciones').onDelete('RESTRICT');
  });

  // ========================================
  // 8. TABLAS DE COMANDAS (Línea de Producción)
  // ========================================

  // Tabla: comandas
  await knex.schema.createTable('comandas', (table) => {
    table.increments('id').primary();
    table.integer('orden_id').unsigned().notNullable();
    table.integer('estacion_id').unsigned().notNullable();
    table.string('numero_comanda', 100);
    table.enum('estado', ['pendiente', 'en_preparacion', 'lista', 'entregada']).defaultTo('pendiente');
    table.integer('usuario_asignado_id').unsigned(); // Cocinero/Barman
    table.timestamp('hora_inicio_preparacion');
    table.timestamp('hora_lista');
    table.integer('tiempo_preparacion_estimado').unsigned().defaultTo(15); // Minutos
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('orden_id').references('id').inTable('ordenes').onDelete('CASCADE');
    table.foreign('estacion_id').references('id').inTable('estaciones').onDelete('RESTRICT');
    table.foreign('usuario_asignado_id').references('id').inTable('usuarios').onDelete('SET NULL');
    table.index(['estacion_id', 'estado']);
    table.index('numero_comanda');
  });

  // Tabla: comanda_items
  await knex.schema.createTable('comanda_items', (table) => {
    table.increments('id').primary();
    table.integer('comanda_id').unsigned().notNullable();
    table.integer('orden_item_id').unsigned().notNullable();
    table.integer('producto_id').unsigned().notNullable();
    table.integer('cantidad').unsigned().notNullable();
    table.text('notas_especiales');
    table.enum('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado']).defaultTo('pendiente');
    table.timestamp('hora_inicio');
    table.timestamp('hora_lista');
    table.timestamps();
    table.foreign('comanda_id').references('id').inTable('comandas').onDelete('CASCADE');
    table.foreign('orden_item_id').references('id').inTable('orden_items').onDelete('CASCADE');
    table.foreign('producto_id').references('id').inTable('productos').onDelete('RESTRICT');
    table.index('comanda_id');
  });

  // ========================================
  // 9. TABLAS DE CAJA
  // ========================================

  // Tabla: metodos_pago
  await knex.schema.createTable('metodos_pago', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned();
    table.string('nombre', 100).notNullable(); // 'Efectivo', 'Tarjeta débito', 'Transferencia'
    table.boolean('requiere_referencia').defaultTo(false); // Número de transacción, cheque, etc
    table.boolean('activo').defaultTo(true);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
  });

  // Tabla: aperturas_caja
  await knex.schema.createTable('aperturas_caja', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.integer('usuario_id').unsigned().notNullable();
    table.decimal('monto_inicial', 10, 2).defaultTo(0);
    table.enum('estado', ['abierta', 'en_cierre', 'cerrada']).defaultTo('abierta');
    table.timestamp('hora_apertura').defaultTo(knex.fn.now());
    table.timestamp('hora_cierre');
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.foreign('usuario_id').references('id').inTable('usuarios').onDelete('RESTRICT');
    table.index('estado');
  });

  // Tabla: caja_movimientos
  await knex.schema.createTable('caja_movimientos', (table) => {
    table.increments('id').primary();
    table.integer('apertura_caja_id').unsigned().notNullable();
    table.integer('orden_id').unsigned();
    table.enum('tipo', ['ingreso', 'egreso']).notNullable();
    table.decimal('monto', 10, 2).notNullable();
    table.string('concepto', 255);
    table.integer('metodo_pago_id').unsigned();
    table.string('referencia', 255);
    table.integer('usuario_id').unsigned();
    table.text('observaciones');
    table.timestamps();
    table.foreign('apertura_caja_id').references('id').inTable('aperturas_caja').onDelete('CASCADE');
    table.foreign('orden_id').references('id').inTable('ordenes').onDelete('SET NULL');
    table.foreign('metodo_pago_id').references('id').inTable('metodos_pago').onDelete('SET NULL');
    table.foreign('usuario_id').references('id').inTable('usuarios').onDelete('SET NULL');
    table.index('apertura_caja_id');
  });

  // Tabla: cierres_caja
  await knex.schema.createTable('cierres_caja', (table) => {
    table.increments('id').primary();
    table.integer('apertura_caja_id').unsigned().notNullable();
    table.integer('usuario_id').unsigned().notNullable();
    table.decimal('monto_inicial', 10, 2).defaultTo(0);
    table.decimal('total_ingresos', 10, 2).defaultTo(0);
    table.decimal('total_egresos', 10, 2).defaultTo(0);
    table.decimal('monto_esperado', 10, 2); // inicial + ingresos - egresos
    table.decimal('monto_contado', 10, 2); // Lo que realmente hay
    table.decimal('diferencia', 10, 2); // monto_contado - monto_esperado
    table.text('observaciones');
    table.timestamps();
    table.foreign('apertura_caja_id').references('id').inTable('aperturas_caja').onDelete('RESTRICT');
    table.foreign('usuario_id').references('id').inTable('usuarios').onDelete('RESTRICT');
  });

  // Tabla: facturas
  await knex.schema.createTable('facturas', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.integer('orden_id').unsigned().notNullable();
    table.integer('cliente_id').unsigned();
    table.string('numero_factura', 100).unique();
    table.enum('estado', ['borrador', 'emitida', 'cancelada', 'anulada']).defaultTo('borrador');
    table.date('fecha_emision');
    table.date('fecha_vencimiento');
    table.decimal('subtotal', 10, 2);
    table.decimal('iva', 10, 2);
    table.decimal('descuento_total', 10, 2).defaultTo(0);
    table.decimal('total', 10, 2);
    table.text('observaciones');
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.foreign('orden_id').references('id').inTable('ordenes').onDelete('RESTRICT');
    table.foreign('cliente_id').references('id').inTable('clientes').onDelete('SET NULL');
    table.index('numero_factura');
  });

  // Tabla: pago_facturas
  await knex.schema.createTable('pago_facturas', (table) => {
    table.increments('id').primary();
    table.integer('factura_id').unsigned().notNullable();
    table.integer('metodo_pago_id').unsigned().notNullable();
    table.decimal('monto', 10, 2).notNullable();
    table.string('referencia', 255);
    table.date('fecha_pago');
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('factura_id').references('id').inTable('facturas').onDelete('CASCADE');
    table.foreign('metodo_pago_id').references('id').inTable('metodos_pago').onDelete('RESTRICT');
    table.index('factura_id');
  });

  // ========================================
  // 10. TABLAS DE DOMICILIOS
  // ========================================

  // Tabla: repartidores
  await knex.schema.createTable('repartidores', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned().notNullable();
    table.string('nombre', 255).notNullable();
    table.string('email', 255);
    table.string('telefono', 20);
    table.string('documento', 50);
    table.enum('estado', ['activo', 'en_domicilio', 'disponible', 'inactivo']).defaultTo('disponible');
    table.string('vehiculo', 100);
    table.string('placa', 20);
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
    table.index('estado');
  });

  // Tabla: domicilio_entregas
  await knex.schema.createTable('domicilio_entregas', (table) => {
    table.increments('id').primary();
    table.integer('orden_id').unsigned().notNullable();
    table.integer('repartidor_id').unsigned();
    table.integer('zona_entrega_id').unsigned();
    table.string('direccion_entrega', 500).notNullable();
    table.string('referencia', 500);
    table.string('nombre_destinatario', 255);
    table.string('telefono_destinatario', 20);
    table.enum('estado', ['pendiente', 'confirmada', 'en_camino', 'entregada', 'fallida', 'anulada']).defaultTo('pendiente');
    table.timestamp('hora_asignacion');
    table.timestamp('hora_salida');
    table.timestamp('hora_entrega');
    table.decimal('costo_entrega', 10, 2);
    table.text('observaciones');
    table.timestamps();
    table.datetime('deleted_at');
    table.foreign('orden_id').references('id').inTable('ordenes').onDelete('CASCADE');
    table.foreign('repartidor_id').references('id').inTable('repartidores').onDelete('SET NULL');
    table.foreign('zona_entrega_id').references('id').inTable('zona_entrega').onDelete('SET NULL');
    table.index('estado');
  });

  // Tabla: domicilio_tracking
  await knex.schema.createTable('domicilio_tracking', (table) => {
    table.increments('id').primary();
    table.integer('domicilio_entrega_id').unsigned().notNullable();
    table.string('estado', 100);
    table.decimal('latitud', 11, 8);
    table.decimal('longitud', 11, 8);
    table.text('observaciones');
    table.timestamps();
    table.foreign('domicilio_entrega_id').references('id').inTable('domicilio_entregas').onDelete('CASCADE');
    table.index('domicilio_entrega_id');
  });

  // ========================================
  // 11. TABLAS DE CONFIGURACIÓN
  // ========================================

  // Tabla: configuracion
  await knex.schema.createTable('configuracion', (table) => {
    table.increments('id').primary();
    table.integer('sede_id').unsigned();
    table.string('clave', 255).notNullable();
    table.text('valor');
    table.string('descripcion', 500);
    table.string('tipo', 50); // 'string', 'number', 'boolean', 'json'
    table.timestamps();
    table.unique(['sede_id', 'clave']);
    table.foreign('sede_id').references('id').inTable('sedes').onDelete('CASCADE');
  });

  // ========================================
  // 12. VISTAS (Views para consultas frecuentes)
  // ========================================

  // Vista: Inventario Actual
  await knex.raw(`
    CREATE VIEW vw_inventario_actual AS
    SELECT 
      i.id,
      i.nombre,
      i.sede_id,
      s.nombre AS sede_nombre,
      COALESCE(SUM(CASE 
        WHEN km.tipo = 'entrada' THEN km.cantidad 
        ELSE -km.cantidad 
      END), 0) AS cantidad_actual,
      i.cantidad_minima,
      i.cantidad_maxima,
      i.unidad_medida_id,
      um.nombre AS unidad_medida,
      CASE 
        WHEN COALESCE(SUM(CASE 
          WHEN km.tipo = 'entrada' THEN km.cantidad 
          ELSE -km.cantidad 
        END), 0) <= i.cantidad_minima THEN 'BAJO'
        WHEN COALESCE(SUM(CASE 
          WHEN km.tipo = 'entrada' THEN km.cantidad 
          ELSE -km.cantidad 
        END), 0) >= i.cantidad_maxima THEN 'ALTO'
        ELSE 'NORMAL'
      END AS estado_stock
    FROM insumos i
    LEFT JOIN kardex_movimientos km ON i.id = km.insumo_id
    LEFT JOIN sedes s ON i.sede_id = s.id
    LEFT JOIN unidad_medida um ON i.unidad_medida_id = um.id
    WHERE i.deleted_at IS NULL
    GROUP BY i.id, i.nombre, i.sede_id, s.nombre, i.cantidad_minima, i.cantidad_maxima, i.unidad_medida_id, um.nombre;
  `);

  // Vista: Órdenes Abiertas por Mesa
  await knex.raw(`
    CREATE VIEW vw_ordenes_abiertas_mesa AS
    SELECT 
      o.id,
      o.numero_orden,
      m.numero AS mesa_numero,
      z.nombre AS zona_nombre,
      o.estado,
      COUNT(oi.id) AS num_items,
      o.total,
      o.created_at,
      EXTRACT(MINUTE FROM (NOW() - o.created_at)) AS minutos_abierta
    FROM ordenes o
    LEFT JOIN mesas m ON o.mesa_id = m.id
    LEFT JOIN zonas z ON m.zona_id = z.id
    LEFT JOIN orden_items oi ON o.id = oi.orden_id
    WHERE o.estado NOT IN ('entregada', 'anulada')
      AND o.deleted_at IS NULL
    GROUP BY o.id, o.numero_orden, m.numero, z.nombre, o.estado, o.total, o.created_at;
  `);

  // Vista: Comandas Pendientes por Estación
  await knex.raw(`
    CREATE VIEW vw_comandas_pendientes AS
    SELECT 
      c.id,
      c.numero_comanda,
      e.nombre AS estacion_nombre,
      c.estado,
      COUNT(ci.id) AS num_items,
      c.tiempo_preparacion_estimado,
      EXTRACT(MINUTE FROM (NOW() - c.created_at)) AS minutos_en_cola,
      o.numero_orden
    FROM comandas c
    JOIN estaciones e ON c.estacion_id = e.id
    LEFT JOIN comanda_items ci ON c.id = ci.comanda_id
    LEFT JOIN ordenes o ON c.orden_id = o.id
    WHERE c.estado NOT IN ('entregada')
      AND c.deleted_at IS NULL
    GROUP BY c.id, c.numero_comanda, e.nombre, c.estado, c.tiempo_preparacion_estimado, o.numero_orden;
  `);

  console.log('✅ Migration: Initial schema created successfully!');
};

exports.down = async (knex) => {
  // Drop views first (in reverse order of creation)
  await knex.raw('DROP VIEW IF EXISTS vw_comandas_pendientes');
  await knex.raw('DROP VIEW IF EXISTS vw_ordenes_abiertas_mesa');
  await knex.raw('DROP VIEW IF EXISTS vw_inventario_actual');

  // Drop tables in reverse order of dependencies
  const tables = [
    'domicilio_tracking',
    'domicilio_entregas',
    'repartidores',
    'pago_facturas',
    'facturas',
    'cierres_caja',
    'caja_movimientos',
    'aperturas_caja',
    'metodos_pago',
    'comanda_items',
    'comandas',
    'orden_item_modificador',
    'orden_items',
    'ordenes',
    'zona_entrega',
    'cliente_direcciones',
    'clientes',
    'canales',
    'compra_items',
    'compras',
    'proveedores',
    'kardex_movimientos',
    'receta_insumos',
    'recetas',
    'insumos',
    'unidad_medida',
    'combo_items',
    'combos',
    'producto_modificador',
    'modificador_opciones',
    'modificadores',
    'producto_variante',
    'variantes',
    'productos',
    'categorias',
    'sede_estacion_impresora',
    'impresoras',
    'mesas',
    'estaciones',
    'zonas',
    'sedes',
    'auditoria_eventos',
    'rol_permiso',
    'permisos',
    'roles',
    'usuarios',
  ];

  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }

  // Drop ENUMS
  const enums = [
    'caja_estado_enum',
    'repartidor_estado_enum',
    'modificador_tipo_enum',
    'compra_estado_enum',
    'kardex_tipo_enum',
    'canal_enum',
    'item_estado_enum',
    'comanda_estado_enum',
    'orden_estado_enum',
    'mesa_estado_enum',
  ];

  for (const enumType of enums) {
    await knex.raw(`DROP TYPE IF EXISTS ${enumType} CASCADE`);
  }

  console.log('✅ Migration: Initial schema rolled back successfully!');
};
