/**
 * SEED: Datos iniciales para DynamicRestoBar
 * 
 * Carga datos de prueba para que el sistema esté operativo desde el día 1:
 * - Sedes
 * - Usuarios con roles
 * - Mesas, zonas y estaciones
 * - Categorías y productos
 * - Modificadores
 * - Métodos de pago
 * - Zonas de entrega
 */

const bcrypt = require('bcryptjs');

exports.seed = async (knex) => {
  // Limpiar datos existentes (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    // Desabilitar foreign keys para poder limpiar todo
    await knex.raw('TRUNCATE TABLE usuarios CASCADE');
    await knex.raw('TRUNCATE TABLE roles CASCADE');
    await knex.raw('TRUNCATE TABLE permisos CASCADE');
    await knex.raw('TRUNCATE TABLE sedes CASCADE');
    await knex.raw('TRUNCATE TABLE categorias CASCADE');
    await knex.raw('TRUNCATE TABLE productos CASCADE');
    await knex.raw('TRUNCATE TABLE unidad_medida CASCADE');
    await knex.raw('TRUNCATE TABLE canales CASCADE');
  }

  // ========================================
  // 1. ROLES
  // ========================================
  const rolesData = [
    { nombre: 'Administrador', descripcion: 'Acceso total al sistema' },
    { nombre: 'Mesero', descripcion: 'Toma de pedidos y precuenta' },
    { nombre: 'Cocina', descripcion: 'Preparación de platos' },
    { nombre: 'Bar', descripcion: 'Preparación de bebidas' },
    { nombre: 'Caja', descripcion: 'Cobro y facturación' },
    { nombre: 'Repartidor', descripcion: 'Entregas a domicilio' },
    { nombre: 'Gerente', descripcion: 'Reportes y configuración' },
  ];

  const roles = await knex('roles').insert(rolesData).returning('*');
  const roleMap = roles.reduce((acc, role) => {
    acc[role.nombre] = role.id;
    return acc;
  }, {});

  console.log('✅ Roles creados:', Object.keys(roleMap));

  // ========================================
  // 2. PERMISOS
  // ========================================
  const permisosData = [
    // Módulo Productos
    { nombre: 'ver_productos', modulo: 'productos', descripcion: 'Ver catálogo de productos' },
    { nombre: 'crear_productos', modulo: 'productos', descripcion: 'Crear nuevos productos' },
    { nombre: 'editar_productos', modulo: 'productos', descripcion: 'Editar productos' },
    { nombre: 'eliminar_productos', modulo: 'productos', descripcion: 'Eliminar productos' },

    // Módulo Órdenes
    { nombre: 'crear_ordenes', modulo: 'ordenes', descripcion: 'Crear nuevas órdenes' },
    { nombre: 'ver_ordenes', modulo: 'ordenes', descripcion: 'Ver órdenes' },
    { nombre: 'editar_ordenes', modulo: 'ordenes', descripcion: 'Editar órdenes' },
    { nombre: 'anular_ordenes', modulo: 'ordenes', descripcion: 'Anular órdenes' },

    // Módulo Caja
    { nombre: 'abrir_caja', modulo: 'caja', descripcion: 'Abrir caja' },
    { nombre: 'cobrar', modulo: 'caja', descripcion: 'Realizar cobros' },
    { nombre: 'cerrar_caja', modulo: 'caja', descripcion: 'Cerrar caja' },
    { nombre: 'anular_facturas', modulo: 'caja', descripcion: 'Anular facturas' },

    // Módulo Administración
    { nombre: 'admin_usuarios', modulo: 'admin', descripcion: 'Gestionar usuarios' },
    { nombre: 'admin_sedes', modulo: 'admin', descripcion: 'Gestionar sedes' },
    { nombre: 'admin_configuracion', modulo: 'admin', descripcion: 'Configuración del sistema' },
    { nombre: 'ver_reportes', modulo: 'admin', descripcion: 'Ver reportes' },
  ];

  const permisos = await knex('permisos').insert(permisosData).returning('*');
  const permisoMap = permisos.reduce((acc, permiso) => {
    acc[permiso.nombre] = permiso.id;
    return acc;
  }, {});

  console.log('✅ Permisos creados:', Object.keys(permisoMap).length, 'permisos');

  // ========================================
  // 3. ASIGNAR PERMISOS A ROLES
  // ========================================
  // Administrador: todos los permisos
  const permisosAdmin = permisos.map(p => ({
    rol_id: roleMap['Administrador'],
    permiso_id: p.id,
  }));

  // Mesero: crear órdenes, ver órdenes
  const permisosMesero = [
    permisoMap['ver_productos'],
    permisoMap['crear_ordenes'],
    permisoMap['ver_ordenes'],
  ].map(permiso_id => ({
    rol_id: roleMap['Mesero'],
    permiso_id,
  }));

  // Cocina: ver órdenes (filtro cocina)
  const permisosCocina = [
    permisoMap['ver_ordenes'],
  ].map(permiso_id => ({
    rol_id: roleMap['Cocina'],
    permiso_id,
  }));

  // Bar: ver órdenes (filtro bar)
  const permisosBar = [
    permisoMap['ver_ordenes'],
  ].map(permiso_id => ({
    rol_id: roleMap['Bar'],
    permiso_id,
  }));

  // Caja: cobrar, ver órdenes, abrir/cerrar caja
  const permisosCaja = [
    permisoMap['cobrar'],
    permisoMap['abrir_caja'],
    permisoMap['cerrar_caja'],
    permisoMap['ver_ordenes'],
    permisoMap['anular_facturas'],
  ].map(permiso_id => ({
    rol_id: roleMap['Caja'],
    permiso_id,
  }));

  // Repartidor: ver órdenes domicilio
  const permisosRepartidor = [
    permisoMap['ver_ordenes'],
  ].map(permiso_id => ({
    rol_id: roleMap['Repartidor'],
    permiso_id,
  }));

  // Gerente: todos excepto crear/eliminar
  const permisosGerente = [
    permisoMap['ver_productos'],
    permisoMap['ver_ordenes'],
    permisoMap['ver_reportes'],
    permisoMap['admin_configuracion'],
  ].map(permiso_id => ({
    rol_id: roleMap['Gerente'],
    permiso_id,
  }));

  const rolPermisos = [
    ...permisosAdmin,
    ...permisosMesero,
    ...permisosCocina,
    ...permisosBar,
    ...permisosCaja,
    ...permisosRepartidor,
    ...permisosGerente,
  ];

  await knex('rol_permiso').insert(rolPermisos);
  console.log('✅ Permisos asignados a roles');

  // ========================================
  // 4. SEDES
  // ========================================
  const sedesData = [
    {
      nombre: 'DynamicRestaurant Centro',
      direccion: 'Calle Principal 123',
      ciudad: 'Medellín',
      telefono: '(4) 444-5678',
      email: 'centro@dynamicrestobar.com',
      descripcion: 'Sede principal en el centro de la ciudad',
    },
    {
      nombre: 'DynamicRestaurant Envigado',
      direccion: 'Carrera 45 #89-10',
      ciudad: 'Envigado',
      telefono: '(4) 555-6789',
      email: 'envigado@dynamicrestobar.com',
      descripcion: 'Sucursal en Envigado',
    },
  ];

  const sedes = await knex('sedes').insert(sedesData).returning('*');
  const sedeMap = sedes.reduce((acc, sede) => {
    acc[sede.nombre] = sede.id;
    return acc;
  }, {});

  console.log('✅ Sedes creadas:', Object.keys(sedeMap));

  // ========================================
  // 5. USUARIOS
  // ========================================
  const contrasenia = await bcrypt.hash('1234', 10);

  const usuariosData = [
    {
      nombre: 'Admin Sistema',
      email: 'admin@dynamicrestobar.com',
      contraseña: contrasenia,
      pin: '1111',
      rol_id: roleMap['Administrador'],
      sede_id: sedes[0].id,
    },
    {
      nombre: 'Juan Mesero',
      email: 'juan@dynamicrestobar.com',
      contraseña: contrasenia,
      pin: '5678',
      rol_id: roleMap['Mesero'],
      sede_id: sedes[0].id,
    },
    {
      nombre: 'Jefe Cocina',
      email: 'cocina@dynamicrestobar.com',
      contraseña: contrasenia,
      pin: '9999',
      rol_id: roleMap['Cocina'],
      sede_id: sedes[0].id,
    },
    {
      nombre: 'Barman',
      email: 'bar@dynamicrestobar.com',
      contraseña: contrasenia,
      pin: '8888',
      rol_id: roleMap['Bar'],
      sede_id: sedes[0].id,
    },
    {
      nombre: 'Cajero',
      email: 'caja@dynamicrestobar.com',
      contraseña: contrasenia,
      pin: '7777',
      rol_id: roleMap['Caja'],
      sede_id: sedes[0].id,
    },
    {
      nombre: 'Carlos Repartidor',
      email: 'repartidor@dynamicrestobar.com',
      contraseña: contrasenia,
      pin: '6666',
      rol_id: roleMap['Repartidor'],
      sede_id: sedes[0].id,
    },
    {
      nombre: 'Gerente Sede',
      email: 'gerente@dynamicrestobar.com',
      contraseña: contrasenia,
      pin: '4444',
      rol_id: roleMap['Gerente'],
      sede_id: sedes[0].id,
    },
  ];

  await knex('usuarios').insert(usuariosData);
  console.log('✅ Usuarios creados (credenciales: email/1234 o pin directo)');

  // ========================================
  // 6. UNIDADES DE MEDIDA
  // ========================================
  const unidadesMedida = [
    { nombre: 'Kilogramo', simbolo: 'kg' },
    { nombre: 'Litro', simbolo: 'lt' },
    { nombre: 'Unidad', simbolo: 'un' },
    { nombre: 'Porción', simbolo: 'por' },
    { nombre: 'Gramo', simbolo: 'g' },
    { nombre: 'Mililitro', simbolo: 'ml' },
    { nombre: 'Pieza', simbolo: 'pz' },
    { nombre: 'Bolsa', simbolo: 'bol' },
    { nombre: 'Centilitro', simbolo: 'cl' },
    { nombre: 'Miligramo', simbolo: 'mg' },
  ];

  const unidades = await knex('unidad_medida').insert(unidadesMedida).returning('*');
  const unidadMap = unidades.reduce((acc, u) => {
    acc[u.nombre] = u.id;
    return acc;
  }, {});

  console.log('✅ Unidades de medida creadas');
  // ========================================
  // 7. INSUMOS
  // ========================================
  const insumosData = [
    {
      sede_id: sedes[0].id,
      nombre: 'Harina de Trigo',
      unidad_medida_id: unidadMap['Kilogramo'],
      stock_actual: 50,
      stock_minimo: 10,
      costo_unitario: 2500,
    },
    {
      sede_id: sedes[0].id,
      nombre: 'Azúcar',
      unidad_medida_id: unidadMap['Kilogramo'],
      stock_actual: 20,
      stock_minimo: 5,
      costo_unitario: 1800,
    },
    {
      sede_id: sedes[0].id,
      nombre: 'Leche',
      unidad_medida_id: unidadMap['Litro'],
      stock_actual: 30,
      stock_minimo: 8,
      costo_unitario: 3200,
    },
    // ...agrega más insumos según tu modelo...
  ];
  await knex('insumos').insert(insumosData);
  console.log('✅ Insumos creados:', insumosData.length);

  // ========================================
  // 7. ZONAS (dentro de la sede)
  // ========================================
  const zonasData = [
    { sede_id: sedes[0].id, nombre: 'Zona A - Ventanas', numero_mesas: 5 },
    { sede_id: sedes[0].id, nombre: 'Zona B - Centro', numero_mesas: 8 },
    { sede_id: sedes[0].id, nombre: 'Zona C - Terraza', numero_mesas: 6 },
    { sede_id: sedes[0].id, nombre: 'Zona D - Private', numero_mesas: 2 },
  ];

  const zonas = await knex('zonas').insert(zonasData).returning('*');
  const zonaMap = zonas.reduce((acc, z) => {
    acc[z.nombre] = z.id;
    return acc;
  }, {});

  console.log('✅ Zonas creadas:', Object.keys(zonaMap));

  // ========================================
  // 8. ESTACIONES
  // ========================================
  const estacionesData = [
    { sede_id: sedes[0].id, nombre: 'Cocina', tipo: 'cocina', descripcion: 'Preparación de platos principales' },
    { sede_id: sedes[0].id, nombre: 'Bar', tipo: 'bar', descripcion: 'Preparación de bebidas y licores' },
    { sede_id: sedes[0].id, nombre: 'Pastelería', tipo: 'pasteleria', descripcion: 'Postres y panadería' },
  ];

  const estaciones = await knex('estaciones').insert(estacionesData).returning('*');
  const estacionMap = estaciones.reduce((acc, e) => {
    acc[e.nombre] = e.id;
    return acc;
  }, {});

  console.log('✅ Estaciones creadas:', Object.keys(estacionMap));

  // ========================================
  // 9. MESAS
  // ========================================
  const mesasData = [];
  let mesaCounter = 1;
  
  for (const zona of zonas) {
    const numMesas = zona.numero_mesas;
    for (let i = 1; i <= numMesas; i++) {
      mesasData.push({
        sede_id: sedes[0].id,
        zona_id: zona.id,
        numero: mesaCounter.toString(), // Simplemente números: 1, 2, 3, 4...
        capacidad: 4,
        estado: 'disponible',
      });
      mesaCounter++;
    }
  }

  await knex('mesas').insert(mesasData);
  console.log('✅ Mesas creadas:', mesasData.length, 'mesas');

  // ========================================
  // 10. IMPRESORAS
  // ========================================
  const impresorasData = [
    {
      sede_id: sedes[0].id,
      nombre: 'Impresora Cocina',
      tipo: 'termica',
      modelo: 'EPSON TM-T20',
      ip_address: '192.168.1.100',
      puerto: 9100,
    },
    {
      sede_id: sedes[0].id,
      nombre: 'Impresora Bar',
      tipo: 'termica',
      modelo: 'EPSON TM-T20',
      ip_address: '192.168.1.101',
      puerto: 9100,
    },
    {
      sede_id: sedes[0].id,
      nombre: 'Impresora Caja',
      tipo: 'termica',
      modelo: 'Star Micronics TSP100',
      ip_address: '192.168.1.102',
      puerto: 9100,
    },
  ];

  const impresoras = await knex('impresoras').insert(impresorasData).returning('*');
  console.log('✅ Impresoras creadas');

  // ========================================
  // 11. ASIGNAR IMPRESORAS A ESTACIONES
  // ========================================
  const sedEstaImpData = [
    { sede_id: sedes[0].id, estacion_id: estacionMap['Cocina'], impresora_id: impresoras[0].id, orden: 1 },
    { sede_id: sedes[0].id, estacion_id: estacionMap['Bar'], impresora_id: impresoras[1].id, orden: 1 },
    { sede_id: sedes[0].id, estacion_id: estacionMap['Pastelería'], impresora_id: impresoras[0].id, orden: 2 },
  ];

  await knex('sede_estacion_impresora').insert(sedEstaImpData);
  console.log('✅ Impresoras asignadas a estaciones');

  // ========================================
  // 12. CATEGORÍAS
  // ========================================
  const categoriasData = [
    { sede_id: sedes[0].id, nombre: 'Entradas', descripcion: 'Platos para empezar', orden: 1 },
    { sede_id: sedes[0].id, nombre: 'Platos Principales', descripcion: 'Platos fuertes', orden: 2 },
    { sede_id: sedes[0].id, nombre: 'Bebidas Frías', descripcion: 'Gaseosas, jugos, agua', orden: 3 },
    { sede_id: sedes[0].id, nombre: 'Bebidas Calientes', descripcion: 'Café, té, chocolate', orden: 4 },
    { sede_id: sedes[0].id, nombre: 'Licores', descripcion: 'Bebidas alcohólicas', orden: 5 },
    { sede_id: sedes[0].id, nombre: 'Postres', descripcion: 'Dulces y postres', orden: 6 },
    { sede_id: sedes[0].id, nombre: 'Combos', descripcion: 'Ofertas y paquetes', orden: 7 },
  ];



  const categorias = await knex('categorias').insert(categoriasData).returning('*');
  const categoriaMap = categorias.reduce((acc, c) => {
    acc[c.nombre] = c.id;
    return acc;
  }, {});

  console.log('✅ Categorías creadas:', Object.keys(categoriaMap));

  // ========================================
  // 13. PRODUCTOS
  // ========================================
  const productosData = [
    // Entradas
    {
      categoria_id: categoriaMap['Entradas'],
      nombre: 'Tabla de Quesos',
      descripcion: 'Selección gourmet de quesos nacionales',
      precio_venta: 28000,
      estacion_id: estacionMap['Cocina'],
      tiempo_preparacion: 5,
    },
    {
      categoria_id: categoriaMap['Entradas'],
      nombre: 'Tabla de Embutidos',
      descripcion: 'Jamones, salames y chorizos ibéricos',
      precio_venta: 35000,
      estacion_id: estacionMap['Cocina'],
      tiempo_preparacion: 5,
    },
    {
      categoria_id: categoriaMap['Entradas'],
      nombre: 'Alitas Buffalo',
      descripcion: 'Alitas de pollo picantes con salsas',
      precio_venta: 16000,
      estacion_id: estacionMap['Cocina'],
      tiempo_preparacion: 15,
    },
    // Platos Principales
    {
      categoria_id: categoriaMap['Platos Principales'],
      nombre: 'Costilla BBQ',
      descripcion: 'Costillas a la parrilla con salsa BBQ casera',
      precio_venta: 52000,
      estacion_id: estacionMap['Cocina'],
      tiempo_preparacion: 30,
    },
    {
      categoria_id: categoriaMap['Platos Principales'],
      nombre: 'Salmón a la Mantequilla',
      descripcion: 'Filete de salmón fresco con limón y mantequilla',
      precio_venta: 48000,
      estacion_id: estacionMap['Cocina'],
      tiempo_preparacion: 20,
    },
    {
      categoria_id: categoriaMap['Platos Principales'],
      nombre: 'Pechuga a la Parmesana',
      descripcion: 'Pechuga de pollo cubierta con queso y salsa marinara',
      precio_venta: 38000,
      estacion_id: estacionMap['Cocina'],
      tiempo_preparacion: 25,
    },
    {
      categoria_id: categoriaMap['Platos Principales'],
      nombre: 'Filete de Res Rojo',
      descripcion: 'Corte premium 300g con papas y verduras',
      precio_venta: 62000,
      estacion_id: estacionMap['Cocina'],
      tiempo_preparacion: 25,
    },
    // Bebidas Frías
    {
      categoria_id: categoriaMap['Bebidas Frías'],
      nombre: 'Coca Cola',
      descripcion: 'Bebida gaseosa 350ml',
      precio_venta: 5000,
      estacion_id: estacionMap['Bar'],
      tiempo_preparacion: 1,
    },
    {
      categoria_id: categoriaMap['Bebidas Frías'],
      nombre: 'Jugo Natural',
      descripcion: 'Jugo de frutas frescas recién exprimido',
      precio_venta: 8000,
      estacion_id: estacionMap['Bar'],
      tiempo_preparacion: 5,
    },
    {
      categoria_id: categoriaMap['Bebidas Frías'],
      nombre: 'Limonada',
      descripcion: 'Limonada hecha en casa con limón fresco',
      precio_venta: 6000,
      estacion_id: estacionMap['Bar'],
      tiempo_preparacion: 3,
    },
    // Bebidas Calientes
    {
      categoria_id: categoriaMap['Bebidas Calientes'],
      nombre: 'Café Americano',
      descripcion: 'Café expreso diluido en agua caliente',
      precio_venta: 4000,
      estacion_id: estacionMap['Bar'],
      tiempo_preparacion: 3,
    },
    {
      categoria_id: categoriaMap['Bebidas Calientes'],
      nombre: 'Capuchino',
      descripcion: 'Espresso con leche espumada',
      precio_venta: 6500,
      estacion_id: estacionMap['Bar'],
      tiempo_preparacion: 5,
    },
    // Licores
    {
      categoria_id: categoriaMap['Licores'],
      nombre: 'Cerveza Artesanal',
      descripcion: 'Cerveza artesanal local 375ml',
      precio_venta: 8000,
      estacion_id: estacionMap['Bar'],
      tiempo_preparacion: 2,
    },
    {
      categoria_id: categoriaMap['Licores'],
      nombre: 'Ron Viejo',
      descripcion: 'Ron premium añejado 12 años',
      precio_venta: 25000,
      estacion_id: estacionMap['Bar'],
      tiempo_preparacion: 2,
    },
    {
      categoria_id: categoriaMap['Licores'],
      nombre: 'Vino Tinto Reserva',
      descripcion: 'Vino tinto de las mejores bodegas',
      precio_venta: 60000,
      estacion_id: estacionMap['Bar'],
      tiempo_preparacion: 2,
    },
    // Postres
    {
      categoria_id: categoriaMap['Postres'],
      nombre: 'Brownie con Helado',
      descripcion: 'Brownie casero caliente con helado de vainilla',
      precio_venta: 16000,
      estacion_id: estacionMap['Pastelería'],
      tiempo_preparacion: 10,
    },
    {
      categoria_id: categoriaMap['Postres'],
      nombre: 'Cheesecake',
      descripcion: 'Clásico cheesecake con base de galleta',
      precio_venta: 18000,
      estacion_id: estacionMap['Pastelería'],
      tiempo_preparacion: 5,
    },
  ];

  const productos = await knex('productos').insert(productosData).returning('*');

  console.log('✅ Productos creados:', productos.length, 'productos');

  // ========================================
  // 16. MÉTODOS DE PAGO
  // ========================================
  const metodosPagoData = [
    { sede_id: sedes[0].id, nombre: 'Efectivo', requiere_referencia: false },
    { sede_id: sedes[0].id, nombre: 'Tarjeta Débito', requiere_referencia: true },
    { sede_id: sedes[0].id, nombre: 'Tarjeta Crédito', requiere_referencia: true },
    { sede_id: sedes[0].id, nombre: 'Transferencia', requiere_referencia: true },
    { sede_id: sedes[0].id, nombre: 'Cheque', requiere_referencia: true },
  ];

  await knex('metodos_pago').insert(metodosPagoData);
  console.log('✅ Métodos de pago creados');

  // ========================================
  // 17. ZONAS DE ENTREGA
  // ========================================
  const zonasEntregaData = [
    { sede_id: sedes[0].id, nombre: 'Centro', costo_entrega: 8000, descripcion: 'Zona centro-comercial' },
    { sede_id: sedes[0].id, nombre: 'Zona Residencial', costo_entrega: 12000, descripcion: 'Zona residencial cercana' },
    { sede_id: sedes[0].id, nombre: 'Periferia', costo_entrega: 18000, descripcion: 'Zonas periféricas' },
    {
      sede_id: sedes[0].id,
      nombre: 'Municipios Cercanos',
      costo_entrega: 25000,
      descripcion: 'Envigado, Sabaneta, Envigado',
    },
  ];

  await knex('zona_entrega').insert(zonasEntregaData);
  console.log('✅ Zonas de entrega creadas');

  // ========================================
  // 18. CANALES
  // ========================================
  const canalesData = [
    { nombre: 'mostrador', descripcion: 'Venta en mostrador o boletería' },
    { nombre: 'domicilio', descripcion: 'Venta a domicilio' },
    { nombre: 'para_llevar', descripcion: 'Pedido para llevar' },
  ];

  await knex('canales').insert(canalesData);
  console.log('✅ Canales creados');

  // ========================================
  // 19. REPARTIDORES
  // ========================================
  const repartidoresData = [
    {
      sede_id: sedes[0].id,
      nombre: 'Carlos García',
      email: 'carlos.garcia@dynamicrestobar.com',
      telefono: '300-123-4567',
      documento: '1234567890',
      estado: 'disponible',
      vehiculo: 'Moto Honda',
      placa: 'ABC-123',
    },
    {
      sede_id: sedes[0].id,
      nombre: 'Luis Martínez',
      email: 'luis.martinez@dynamicrestobar.com',
      telefono: '300-234-5678',
      documento: '0987654321',
      estado: 'disponible',
      vehiculo: 'Moto Yamaha',
      placa: 'XYZ-789',
    },
  ];

  await knex('repartidores').insert(repartidoresData);
  console.log('✅ Repartidores creados');

  // ========================================
  // 20. CONFIGURACIÓN GENERAL
  // ========================================

  // 21. ÓRDENES DE PRUEBA PARA DASHBOARD (MOVED HERE)
  // Obtener IDs necesarios
  const mesaObj = await knex('mesas').where({ sede_id: sedes[0].id }).first();
  const usuarioObj = await knex('usuarios').where({ email: 'juan@dynamicrestobar.com' }).first();
  const canalObj = await knex('canales').where({ nombre: 'mostrador' }).first();
  const productoObj = await knex('productos').where({ nombre: 'Costilla BBQ' }).first();
  const metodoPagoObj = await knex('metodos_pago').where({ nombre: 'Efectivo' }).first();

  if (!mesaObj) throw new Error('No se encontró una mesa para la sede principal');
  if (!usuarioObj) throw new Error('No se encontró el usuario juan@dynamicrestobar.com');
  if (!canalObj) throw new Error('No se encontró el canal mostrador');
  if (!productoObj) throw new Error('No se encontró el producto Costilla BBQ');
  if (!metodoPagoObj) throw new Error('No se encontró el método de pago Efectivo');

  const mesaId = mesaObj.id;
  const usuarioId = usuarioObj.id;

  const canalId = canalObj.id;
  const producto = productoObj;
  const metodoPagoId = metodoPagoObj.id;

  // Crear 3 órdenes entregadas
  const ordenesData = [
    {
      sede_id: sedes[0].id,
      mesa_id: mesaId,
      usuario_id: usuarioId,
      canal_id: canalId,
      estado: 'entregada',
      numero_orden: 'ORD-1001',
      created_at: new Date(),
      total: 52000,
    },
    {
      sede_id: sedes[0].id,
      mesa_id: mesaId,
      usuario_id: usuarioId,
      canal_id: canalId,
      estado: 'entregada',
      numero_orden: 'ORD-1002',
      created_at: new Date(),
      total: 48000,
    },
    {
      sede_id: sedes[0].id,
      mesa_id: mesaId,
      usuario_id: usuarioId,
      canal_id: canalId,
      estado: 'entregada',
      numero_orden: 'ORD-1003',
      created_at: new Date(),
      total: 6000,
    },
  ];
  const ordenes = await knex('ordenes').insert(ordenesData).returning('*');

  // Crear items para cada orden
  for (let i = 0; i < ordenes.length; i++) {
    await knex('orden_items').insert({
      orden_id: ordenes[i].id,
      producto_id: producto.id,
      cantidad: 1,
      precio_unitario: producto.precio_venta,
      subtotal: producto.precio_venta,
      estado: 'entregado',
    });
  }

  // Crear facturas y pagos para cada orden
  for (let i = 0; i < ordenes.length; i++) {
    const factura = await knex('facturas').insert({
      sede_id: sedes[0].id,
      orden_id: ordenes[i].id,
      numero_factura: `FACT-100${i+1}`,
      estado: 'emitida',
      fecha_emision: new Date(),
      subtotal: ordenes[i].total,
      iva: Math.round(ordenes[i].total * 0.19),
      descuento_total: 0,
      total: ordenes[i].total,
    }).returning('*');
    await knex('pago_facturas').insert({
      factura_id: factura[0].id,
      metodo_pago_id: metodoPagoId,
      monto: ordenes[i].total,
      fecha_pago: new Date(),
    });
  }

  // Configuración general
  const configuracionData = [
    {
      sede_id: sedes[0].id,
      clave: 'nombre_negocio',
      valor: 'DynamicRestoBar',
      tipo: 'string',
      descripcion: 'Nombre del negocio',
    },
    {
      sede_id: sedes[0].id,
      clave: 'iva_porcentaje',
      valor: '19',
      tipo: 'number',
      descripcion: 'Porcentaje de IVA',
    },
    {
      sede_id: sedes[0].id,
      clave: 'numero_resolucion',
      valor: 'DIAN-2024-00001',
      tipo: 'string',
      descripcion: 'Número de resolución DIAN',
    },
    {
      sede_id: sedes[0].id,
      clave: 'prefijo_factura',
      valor: 'FACT',
      tipo: 'string',
      descripcion: 'Prefijo para facturas',
    },
  ];

  await knex('configuracion').insert(configuracionData);
  console.log('✅ Configuración creada');

  console.log('\n🎉 ¡SEED COMPLETADO CON ÉXITO!');
  console.log('\n📋 RESUMEN DE DATOS CARGADOS:');
  console.log('   ✅ 7 roles creados');
  console.log('   ✅ 16 permisos asignados');
  console.log('   ✅ 2 sedes operativas');
  console.log('   ✅ 7 usuarios de prueba (ver credenciales abajo)');
  console.log('   ✅ 4 zonas con', mesasData.length, 'mesas');
  console.log('   ✅ 3 estaciones (Cocina, Bar, Pastelería)');
  console.log('   ✅ 3 impresoras térmicas');
  console.log('   ✅ 7 categorías de productos');
  console.log('   ✅ 17 productos');
  console.log('   ✅ 3 modificadores con opciones');
  console.log('   ✅ 5 métodos de pago');
  console.log('   ✅ 4 zonas de entrega');
  console.log('   ✅ 2 repartidores');

  console.log('\n🔑 CREDENCIALES DE PRUEBA:');
  console.log('   Admin:     admin@dynamicrestobar.com / 1234 (PIN: 1111)');
  console.log('   Mesero:    juan@dynamicrestobar.com / 1234 (PIN: 5678)');
  console.log('   Cocina:    cocina@dynamicrestobar.com / 1234 (PIN: 9999)');
  console.log('   Bar:       bar@dynamicrestobar.com / 1234 (PIN: 8888)');
  console.log('   Caja:      caja@dynamicrestobar.com / 1234 (PIN: 7777)');
  console.log('   Repartidor: repartidor@dynamicrestobar.com / 1234 (PIN: 6666)');
  console.log('   Gerente:   gerente@dynamicrestobar.com / 1234 (PIN: 4444)');

  console.log('\n✨ El sistema está listo para comenzar.');
};
