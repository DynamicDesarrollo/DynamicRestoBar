-- ================================================================
-- DYNAMICRESTOBAR - SCHEMA PRINCIPAL (PostgreSQL 14+)
-- ================================================================
-- Creado: 11 de Enero de 2026
-- Descripción: Estructura completa de BD para POS Restaurante & Bar
-- ================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "plpgsql";

-- Enumerados (ENUM types)
CREATE TYPE mesa_estado_enum AS ENUM (
  'LIBRE', 'OCUPADA', 'PRECUENTA', 'PAGADA', 'BLOQUEADA'
);

CREATE TYPE orden_estado_enum AS ENUM (
  'ABIERTA', 'LISTA', 'PAGADA', 'CANCELADA'
);

CREATE TYPE comanda_estado_enum AS ENUM (
  'PENDIENTE', 'PREPARANDO', 'LISTA', 'ENTREGADA'
);

CREATE TYPE item_estado_enum AS ENUM (
  'PENDIENTE', 'PREPARANDO', 'LISTO', 'ENTREGADO'
);

CREATE TYPE canal_enum AS ENUM (
  'MESA', 'BARRA', 'PARA_LLEVAR', 'DOMICILIO'
);

CREATE TYPE kardex_tipo_enum AS ENUM (
  'ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA', 'TRASLADO'
);

CREATE TYPE compra_estado_enum AS ENUM (
  'PENDIENTE', 'RECIBIDA', 'PARCIAL', 'CANCELADA'
);

CREATE TYPE modificador_tipo_enum AS ENUM (
  'ADICION', 'OPCION', 'REQUERIDO'
);

CREATE TYPE repartidor_estado_enum AS ENUM (
  'DISPONIBLE', 'EN_RUTA', 'DESCANSANDO'
);

CREATE TYPE caja_estado_enum AS ENUM (
  'ABIERTA', 'CERRADA'
);

-- ================================================================
-- A. GESTIÓN DE USUARIO Y SEGURIDAD
-- ================================================================

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_roles_activo ON roles(activo);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  pin VARCHAR(20),
  password_hash VARCHAR(255),
  rol_id INTEGER NOT NULL REFERENCES roles(id),
  telefono VARCHAR(20),
  foto_url TEXT,
  activo BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_pin ON usuarios(pin);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

CREATE TABLE usuario_sede (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  sede_id INTEGER REFERENCES sedes(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(usuario_id, sede_id)
);

CREATE TABLE permisos (
  id SERIAL PRIMARY KEY,
  rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  accion VARCHAR(100) NOT NULL,
  recurso VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permisos_rol ON permisos(rol_id);

CREATE TABLE auditoria_eventos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  sede_id INTEGER REFERENCES sedes(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL,
  recurso VARCHAR(100) NOT NULL,
  datos_antes JSONB,
  datos_despues JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_usuario ON auditoria_eventos(usuario_id);
CREATE INDEX idx_auditoria_timestamp ON auditoria_eventos(timestamp DESC);

-- ================================================================
-- B. GESTIÓN DE SEDES Y ESPACIOS
-- ================================================================

CREATE TABLE sedes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(255),
  ciudad VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(100),
  zona_tz VARCHAR(50) DEFAULT 'America/Bogota',
  activa BOOLEAN DEFAULT true,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_sedes_activa ON sedes(activa);

CREATE TABLE zonas (
  id SERIAL PRIMARY KEY,
  sede_id INTEGER NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_zonas_sede ON zonas(sede_id);
CREATE UNIQUE INDEX idx_zonas_sede_nombre ON zonas(sede_id, nombre) WHERE deleted_at IS NULL;

CREATE TABLE estaciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  color_indicador VARCHAR(20),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_estaciones_activa ON estaciones(activa);

CREATE TABLE mesas (
  id SERIAL PRIMARY KEY,
  sede_id INTEGER NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  zona_id INTEGER NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  capacidad INTEGER DEFAULT 4,
  estado mesa_estado_enum DEFAULT 'LIBRE',
  posicion_x DECIMAL(5,2),
  posicion_y DECIMAL(5,2),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_mesas_sede_zona ON mesas(sede_id, zona_id);
CREATE INDEX idx_mesas_estado ON mesas(estado);
CREATE UNIQUE INDEX idx_mesas_sede_numero ON mesas(sede_id, numero) WHERE deleted_at IS NULL;

CREATE TABLE impresoras (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45),
  puerto INTEGER DEFAULT 9100,
  tipo VARCHAR(50) DEFAULT 'termica',
  estado VARCHAR(50) DEFAULT 'activa',
  nota_papel BOOLEAN DEFAULT false,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE sede_estacion_impresora (
  id SERIAL PRIMARY KEY,
  sede_id INTEGER NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  estacion_id INTEGER NOT NULL REFERENCES estaciones(id) ON DELETE CASCADE,
  impresora_id INTEGER REFERENCES impresoras(id) ON DELETE SET NULL,
  nombre VARCHAR(100),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sede_id, estacion_id)
);

-- ================================================================
-- C. GESTIÓN DE PRODUCTOS Y CATÁLOGOS
-- ================================================================

CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  icono_url TEXT,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_categorias_activa ON categorias(activa);

CREATE TABLE unidad_medida (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  abreviatura VARCHAR(10) NOT NULL UNIQUE,
  tipo VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id),
  estacion_id INTEGER NOT NULL REFERENCES estaciones(id),
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  codigo_sku VARCHAR(50) UNIQUE,
  precio_venta DECIMAL(10,2) NOT NULL,
  costo_promedio DECIMAL(10,2) DEFAULT 0,
  margen DECIMAL(5,2),
  foto_url TEXT,
  requiere_receta BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  visible_pos BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_estacion ON productos(estacion_id);
CREATE INDEX idx_productos_codigo_sku ON productos(codigo_sku);
CREATE INDEX idx_productos_activo ON productos(activo);

CREATE TABLE variantes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE producto_variante (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  variante_id INTEGER NOT NULL REFERENCES variantes(id) ON DELETE CASCADE,
  precio_venta DECIMAL(10,2) NOT NULL,
  costo_promedio DECIMAL(10,2) DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(producto_id, variante_id)
);

CREATE TABLE modificadores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  tipo modificador_tipo_enum DEFAULT 'ADICION',
  orden INTEGER DEFAULT 0,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE modificador_opciones (
  id SERIAL PRIMARY KEY,
  modificador_id INTEGER NOT NULL REFERENCES modificadores(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  precio_adicional DECIMAL(10,2) DEFAULT 0,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(modificador_id, nombre)
);

CREATE TABLE producto_modificador (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  modificador_id INTEGER NOT NULL REFERENCES modificadores(id) ON DELETE CASCADE,
  requerido BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(producto_id, modificador_id)
);

CREATE TABLE combos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio_venta DECIMAL(10,2) NOT NULL,
  costo_promedio DECIMAL(10,2) DEFAULT 0,
  foto_url TEXT,
  activo BOOLEAN DEFAULT true,
  visible_pos BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE combo_items (
  id SERIAL PRIMARY KEY,
  combo_id INTEGER NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad DECIMAL(10,2) NOT NULL DEFAULT 1,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_combo_items_combo ON combo_items(combo_id);

-- ================================================================
-- D. GESTIÓN DE RECETAS E INVENTARIO
-- ================================================================

CREATE TABLE insumos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  codigo_sku VARCHAR(50) UNIQUE,
  unidad_medida_id INTEGER NOT NULL REFERENCES unidad_medida(id),
  stock_actual DECIMAL(15,4) DEFAULT 0,
  stock_minimo DECIMAL(15,4) DEFAULT 0,
  stock_maximo DECIMAL(15,4),
  costo_promedio DECIMAL(10,2) DEFAULT 0,
  costo_unitario DECIMAL(10,4),
  proveedor_principal_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_insumos_activo ON insumos(activo);
CREATE INDEX idx_insumos_codigo_sku ON insumos(codigo_sku);

CREATE TABLE recetas (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  descripcion TEXT,
  rendimiento DECIMAL(10,2),
  unidad_rendimiento_id INTEGER REFERENCES unidad_medida(id),
  costo_total DECIMAL(10,2),
  activa BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_recetas_producto ON recetas(producto_id);

CREATE TABLE receta_insumos (
  id SERIAL PRIMARY KEY,
  receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  insumo_id INTEGER NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
  cantidad DECIMAL(15,4) NOT NULL,
  unidad_medida_id INTEGER NOT NULL REFERENCES unidad_medida(id),
  costo_unitario DECIMAL(10,4),
  merma DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kardex_movimientos (
  id BIGSERIAL PRIMARY KEY,
  insumo_id INTEGER NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
  sede_id INTEGER NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  tipo_movimiento kardex_tipo_enum NOT NULL,
  cantidad DECIMAL(15,4) NOT NULL,
  unidad_medida_id INTEGER NOT NULL REFERENCES unidad_medida(id),
  costo_unitario DECIMAL(10,4),
  costo_total DECIMAL(12,2),
  documento_id VARCHAR(50),
  referencia TEXT,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  motivo TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kardex_insumo ON kardex_movimientos(insumo_id);
CREATE INDEX idx_kardex_sede ON kardex_movimientos(sede_id);
CREATE INDEX idx_kardex_timestamp ON kardex_movimientos(timestamp DESC);
CREATE INDEX idx_kardex_tipo ON kardex_movimientos(tipo_movimiento);

-- ================================================================
-- E. GESTIÓN DE PROVEEDORES Y COMPRAS
-- ================================================================

CREATE TABLE proveedores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  ruc_nit VARCHAR(50),
  contacto_principal VARCHAR(100),
  email VARCHAR(100),
  telefono VARCHAR(20),
  direccion VARCHAR(255),
  ciudad VARCHAR(100),
  condiciones_pago VARCHAR(100),
  dias_entrega INTEGER,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_proveedores_activo ON proveedores(activo);

CREATE TABLE compras (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
  sede_id INTEGER NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  numero_orden VARCHAR(50) UNIQUE,
  fecha_orden DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega_prevista DATE,
  fecha_entrega_real DATE,
  estado compra_estado_enum DEFAULT 'PENDIENTE',
  subtotal DECIMAL(12,2) DEFAULT 0,
  impuestos DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_compras_proveedor ON compras(proveedor_id);
CREATE INDEX idx_compras_estado ON compras(estado);
CREATE INDEX idx_compras_fecha ON compras(fecha_orden);

CREATE TABLE compra_items (
  id SERIAL PRIMARY KEY,
  compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  insumo_id INTEGER NOT NULL REFERENCES insumos(id),
  cantidad_solicitada DECIMAL(15,4) NOT NULL,
  cantidad_recibida DECIMAL(15,4) DEFAULT 0,
  unidad_medida_id INTEGER NOT NULL REFERENCES unidad_medida(id),
  precio_unitario DECIMAL(10,4) NOT NULL,
  precio_total DECIMAL(12,2),
  recibido BOOLEAN DEFAULT false,
  fecha_recepcion TIMESTAMP,
  lote_numero VARCHAR(100),
  fecha_vencimiento DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compra_items_compra ON compra_items(compra_id);

-- ================================================================
-- F. GESTIÓN DE PEDIDOS Y ÓRDENES
-- ================================================================

CREATE TABLE canales (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  icono_url TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  documento VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  frecuencia INTEGER DEFAULT 0,
  saldo_credito DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_clientes_telefono ON clientes(telefono);

CREATE TABLE cliente_direcciones (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  direccion VARCHAR(255) NOT NULL,
  referencias TEXT,
  zona_entrega_id INTEGER,
  es_principal BOOLEAN DEFAULT false,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE zona_entrega (
  id SERIAL PRIMARY KEY,
  sede_id INTEGER NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  nombre_zona VARCHAR(100) NOT NULL,
  costo_domicilio DECIMAL(10,2) DEFAULT 0,
  tiempo_entrega_min INTEGER DEFAULT 30,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sede_id, nombre_zona)
);

CREATE TABLE ordenes (
  id SERIAL PRIMARY KEY,
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  sede_id INTEGER NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  mesa_id INTEGER REFERENCES mesas(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  canal_id INTEGER NOT NULL REFERENCES canales(id),
  mesero_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha_orden DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_orden TIME NOT NULL DEFAULT CURRENT_TIME,
  fecha_entrega_prevista TIMESTAMP,
  subtotal DECIMAL(12,2) DEFAULT 0,
  impuestos DECIMAL(12,2) DEFAULT 0,
  servicio DECIMAL(12,2) DEFAULT 0,
  descuentos DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  estado orden_estado_enum DEFAULT 'ABIERTA',
  tipo_domicilio VARCHAR(50),
  repartidor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_ordenes_numero_pedido ON ordenes(numero_pedido);
CREATE INDEX idx_ordenes_mesa ON ordenes(mesa_id);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_ordenes_fecha ON ordenes(fecha_orden DESC);

CREATE TABLE orden_items (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2),
  notas TEXT,
  estado item_estado_enum DEFAULT 'PENDIENTE',
  timestamp_cambio TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orden_items_orden ON orden_items(orden_id);
CREATE INDEX idx_orden_items_estado ON orden_items(estado);

CREATE TABLE orden_item_modificador (
  id SERIAL PRIMARY KEY,
  orden_item_id INTEGER NOT NULL REFERENCES orden_items(id) ON DELETE CASCADE,
  modificador_opcion_id INTEGER NOT NULL REFERENCES modificador_opciones(id),
  precio_adicional DECIMAL(10,2) DEFAULT 0,
  cantidad INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comandas (
  id SERIAL PRIMARY KEY,
  numero_comanda VARCHAR(50) UNIQUE NOT NULL,
  orden_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  sede_id INTEGER NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  estacion_id INTEGER NOT NULL REFERENCES estaciones(id) ON DELETE RESTRICT,
  mesa_numero INTEGER,
  mesero_nombre VARCHAR(100),
  fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_creacion TIME NOT NULL DEFAULT CURRENT_TIME,
  fecha_inicio_prep TIMESTAMP,
  estado comanda_estado_enum DEFAULT 'PENDIENTE',
  impresa BOOLEAN DEFAULT false,
  numero_copia INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comandas_numero ON comandas(numero_comanda);
CREATE INDEX idx_comandas_orden ON comandas(orden_id);
CREATE INDEX idx_comandas_estacion ON comandas(estacion_id);
CREATE INDEX idx_comandas_estado ON comandas(estado);

CREATE TABLE comanda_items (
  id SERIAL PRIMARY KEY,
  comanda_id INTEGER NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  orden_item_id INTEGER REFERENCES orden_items(id) ON DELETE SET NULL,
  estacion_id INTEGER NOT NULL REFERENCES estaciones(id),
  cantidad DECIMAL(10,2) NOT NULL,
  notas TEXT,
  estado item_estado_enum DEFAULT 'PENDIENTE',
  timestamp_cambio TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comanda_items_comanda ON comanda_items(comanda_id);
CREATE INDEX idx_comanda_items_estado ON comanda_items(estado);

-- ================================================================
-- G. GESTIÓN DE CAJA Y PAGOS
-- ================================================================

CREATE TABLE metodos_pago (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  icono_url TEXT,
  requiere_referencia BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE aperturas_caja (
  id SERIAL PRIMARY KEY,
  sede_id INTEGER NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha_apertura DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_apertura TIME NOT NULL DEFAULT CURRENT_TIME,
  saldo_inicial DECIMAL(12,2) DEFAULT 0,
  estado caja_estado_enum DEFAULT 'ABIERTA',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aperturas_sede ON aperturas_caja(sede_id);
CREATE INDEX idx_aperturas_estado ON aperturas_caja(estado);

CREATE TABLE caja_movimientos (
  id BIGSERIAL PRIMARY KEY,
  apertura_caja_id INTEGER NOT NULL REFERENCES aperturas_caja(id) ON DELETE CASCADE,
  tipo_movimiento VARCHAR(50) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  descripcion TEXT,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_caja_movimientos_apertura ON caja_movimientos(apertura_caja_id);

CREATE TABLE cierres_caja (
  id SERIAL PRIMARY KEY,
  apertura_caja_id INTEGER NOT NULL UNIQUE REFERENCES aperturas_caja(id) ON DELETE CASCADE,
  fecha_cierre DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_cierre TIME NOT NULL DEFAULT CURRENT_TIME,
  total_vendido DECIMAL(12,2) DEFAULT 0,
  total_efectivo DECIMAL(12,2) DEFAULT 0,
  diferencia DECIMAL(12,2),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  observaciones TEXT,
  estado VARCHAR(50) DEFAULT 'abierto',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facturas (
  id SERIAL PRIMARY KEY,
  numero_factura VARCHAR(50) UNIQUE NOT NULL,
  orden_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE RESTRICT,
  apertura_caja_id INTEGER NOT NULL REFERENCES aperturas_caja(id),
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_emision TIME NOT NULL DEFAULT CURRENT_TIME,
  subtotal DECIMAL(12,2) DEFAULT 0,
  impuestos DECIMAL(12,2) DEFAULT 0,
  servicio DECIMAL(12,2) DEFAULT 0,
  descuentos DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  pagado BOOLEAN DEFAULT false,
  saldo DECIMAL(12,2),
  estado VARCHAR(50) DEFAULT 'emitida',
  electronica_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facturas_numero ON facturas(numero_factura);
CREATE INDEX idx_facturas_orden ON facturas(orden_id);
CREATE INDEX idx_facturas_apertura ON facturas(apertura_caja_id);

CREATE TABLE pago_facturas (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  metodo_pago_id INTEGER NOT NULL REFERENCES metodos_pago(id),
  monto DECIMAL(12,2) NOT NULL,
  referencia VARCHAR(100),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  estado VARCHAR(50) DEFAULT 'procesado'
);

CREATE INDEX idx_pago_facturas_factura ON pago_facturas(factura_id);

-- ================================================================
-- H. GESTIÓN DE DOMICILIOS Y ENTREGAS
-- ================================================================

CREATE TABLE repartidores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  documento VARCHAR(50),
  vehiculo VARCHAR(100),
  placa_vehiculo VARCHAR(20),
  sede_id INTEGER NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  estado repartidor_estado_enum DEFAULT 'DISPONIBLE',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_repartidores_sede ON repartidores(sede_id);

CREATE TABLE domicilio_entregas (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER NOT NULL UNIQUE REFERENCES ordenes(id) ON DELETE CASCADE,
  repartidor_id INTEGER REFERENCES repartidores(id) ON DELETE SET NULL,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  direccion VARCHAR(255) NOT NULL,
  zona_id INTEGER REFERENCES zona_entrega(id),
  fecha_asignacion TIMESTAMP,
  hora_asignacion TIME,
  fecha_entrega_prevista TIMESTAMP,
  fecha_entrega_real TIMESTAMP,
  hora_entrega TIME,
  estado VARCHAR(50) DEFAULT 'asignado',
  tiempo_entrega_minutos INTEGER,
  costo_domicilio DECIMAL(10,2) DEFAULT 0,
  cobro_en_entrega BOOLEAN DEFAULT false,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_domicilios_estado ON domicilio_entregas(estado);
CREATE INDEX idx_domicilios_repartidor ON domicilio_entregas(repartidor_id);

CREATE TABLE domicilio_tracking (
  id BIGSERIAL PRIMARY KEY,
  entrega_id INTEGER NOT NULL REFERENCES domicilio_entregas(id) ON DELETE CASCADE,
  estado VARCHAR(50) NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  observaciones TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracking_entrega ON domicilio_tracking(entrega_id);

-- ================================================================
-- I. CONFIGURACIÓN GENERAL
-- ================================================================

CREATE TABLE configuracion (
  id SERIAL PRIMARY KEY,
  sede_id INTEGER REFERENCES sedes(id) ON DELETE CASCADE,
  clave VARCHAR(100) NOT NULL,
  valor TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'string',
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sede_id, clave)
);

CREATE INDEX idx_config_clave ON configuracion(clave);

-- ================================================================
-- VIEWS ÚTILES
-- ================================================================

-- Vista: Inventario actual por insumo
CREATE VIEW vw_inventario_actual AS
SELECT 
  i.id,
  i.nombre,
  i.codigo_sku,
  um.nombre as unidad,
  i.stock_actual,
  i.stock_minimo,
  i.stock_maximo,
  (i.stock_actual <= i.stock_minimo) as bajo_stock,
  (i.stock_actual <= (i.stock_minimo * 0.5)) as stock_critico,
  i.costo_promedio,
  (i.stock_actual * i.costo_promedio) as valor_total
FROM insumos i
JOIN unidad_medida um ON i.unidad_medida_id = um.id
WHERE i.deleted_at IS NULL;

-- Vista: Órdenes abiertas por mesa
CREATE VIEW vw_ordenes_abiertas_mesa AS
SELECT 
  o.id,
  o.numero_pedido,
  m.numero as mesa_numero,
  z.nombre as zona,
  u.nombre as mesero,
  o.subtotal,
  o.impuestos,
  o.total,
  COUNT(oi.id) as cantidad_items,
  o.created_at
FROM ordenes o
JOIN mesas m ON o.mesa_id = m.id
JOIN zonas z ON m.zona_id = z.id
JOIN usuarios u ON o.mesero_id = u.id
LEFT JOIN orden_items oi ON o.id = oi.orden_id
WHERE o.estado = 'ABIERTA' AND o.deleted_at IS NULL
GROUP BY o.id, m.numero, z.nombre, u.nombre;

-- Vista: Comandas pendientes por estación
CREATE VIEW vw_comandas_pendientes AS
SELECT 
  c.id,
  c.numero_comanda,
  e.nombre as estacion,
  c.mesa_numero,
  c.mesero_nombre,
  COUNT(ci.id) as cantidad_items,
  c.created_at
FROM comandas c
JOIN estaciones e ON c.estacion_id = e.id
LEFT JOIN comanda_items ci ON c.id = ci.comanda_id
WHERE c.estado IN ('PENDIENTE', 'PREPARANDO') AND c.deleted_at IS NULL
GROUP BY c.id, e.nombre;

-- ================================================================
-- TRIGGER DE AUDITORÍA (Ejemplo básico)
-- ================================================================

CREATE OR REPLACE FUNCTION fn_auditoria_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria_eventos (
      usuario_id, accion, recurso, datos_antes, datos_despues
    ) VALUES (
      CURRENT_USER_ID(), 
      'UPDATE',
      TG_TABLE_NAME,
      row_to_json(OLD),
      row_to_json(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria_eventos (
      usuario_id, accion, recurso, datos_antes
    ) VALUES (
      CURRENT_USER_ID(),
      'DELETE',
      TG_TABLE_NAME,
      row_to_json(OLD)
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria_eventos (
      usuario_id, accion, recurso, datos_despues
    ) VALUES (
      CURRENT_USER_ID(),
      'INSERT',
      TG_TABLE_NAME,
      row_to_json(NEW)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Nota: Los triggers de auditoría se crean por tabla específica

-- ================================================================
-- FIN DEL SCHEMA
-- ================================================================
-- Última actualización: 11 de Enero de 2026
-- Versión: 1.0.0-alpha
