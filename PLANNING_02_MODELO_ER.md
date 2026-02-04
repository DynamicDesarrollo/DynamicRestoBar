# 📊 MODELO ER (ENTIDAD-RELACIÓN)
## DynamicRestoBar - Estructura de Base de Datos

---

## 1. DIAGRAMA ENTIDAD-RELACIÓN (Cajas y Líneas)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTIDADES PRINCIPALES                            │
└─────────────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║              A. GESTIÓN DE USUARIO Y SEGURIDAD                        ║
╚═══════════════════════════════════════════════════════════════════════╝

    ┌─────────────────┐           ┌──────────────────┐
    │    usuarios     │─1──────M─>│  usuario_sede    │
    ├─────────────────┤           ├──────────────────┤
    │ • id (PK)       │           │ • id (PK)        │
    │ • nombre        │           │ • usuario_id (FK)│
    │ • email         │           │ • sede_id (FK)   │
    │ • pin           │           │ • activo         │
    │ • contraseña    │           └──────────────────┘
    │ • activo        │                    │
    │ • foto          │                    │
    │ • telefono      │                    │
    └─────────────────┘                    │
            │                              │
            │ 1───────M                    │
            │                              │
    ┌───────┴───────┐                     │
    │   roles       │                     │
    ├───────────────┤                     │
    │ • id (PK)     │                     │
    │ • nombre      │                     │
    │ • descripción │                     │
    │ • activo      │                     │
    └───────────────┘                     │
            │                              │
            │ 1───────M                    │
            │                              │
    ┌───────┴─────────────┐               │
    │     permisos        │               │
    ├─────────────────────┤               │
    │ • id (PK)           │               │
    │ • rol_id (FK)       │               │
    │ • acción (FK)       │               │
    │ • recurso           │               │
    │ • descripción       │               │
    └─────────────────────┘               │
                                          │
    ┌──────────────────┐                  │
    │ auditoria_eventos│                  │
    ├──────────────────┤                  │
    │ • id (PK)        │────────<────────┘
    │ • usuario_id (FK)│
    │ • sede_id (FK)   │
    │ • acción         │
    │ • recurso        │
    │ • antes          │
    │ • después        │
    │ • timestamp      │
    │ • ip_address     │
    └──────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║              B. GESTIÓN DE SEDES Y ESPACIOS                           ║
╚═══════════════════════════════════════════════════════════════════════╝

    ┌─────────────────┐
    │     sedes       │
    ├─────────────────┤
    │ • id (PK)       │
    │ • nombre        │
    │ • direccion     │
    │ • telefono      │
    │ • ciudad        │
    │ • zona_tz       │
    │ • activa        │
    │ • logo          │
    └─────────────────┘
            │
            │ 1───────M
            │
    ┌───────┴──────────┐              ┌──────────────────┐
    │      zonas       │──1────M─────>│   impresoras     │
    ├────────────────┤              ├──────────────────┤
    │ • id (PK)      │              │ • id (PK)        │
    │ • sede_id (FK) │              │ • nombre         │
    │ • nombre       │              │ • ip_address     │
    │ • descripción  │              │ • puerto         │
    │ • orden        │              │ • tipo (térmica) │
    │ • activa       │              │ • estado         │
    └────────────────┘              └──────────────────┘
            │                              ▲
            │ 1───────M                    │
            │                              │ 1─────M
    ┌───────┴──────────┐                   │
    │     mesas        │─────────────────>┤
    ├────────────────┤                   │
    │ • id (PK)      │     ┌──────────────────────────┐
    │ • sede_id (FK) │     │ sede_estacion_impresora  │
    │ • zona_id (FK) │     ├──────────────────────────┤
    │ • numero       │     │ • id (PK)                │
    │ • capacidad    │     │ • sede_id (FK)           │
    │ • estado       │     │ • estacion_id (FK)       │
    │ • posicion_x   │     │ • impresora_id (FK)      │
    │ • posicion_y   │     │ • nombre                 │
    │ • activa       │     └──────────────────────────┘
    └────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║              C. GESTIÓN DE PRODUCTOS Y CATÁLOGOS                      ║
╚═══════════════════════════════════════════════════════════════════════╝

    ┌──────────────────┐
    │   categorias     │
    ├──────────────────┤
    │ • id (PK)        │
    │ • nombre         │
    │ • descripción    │
    │ • icono/imagen   │
    │ • orden          │
    │ • activa         │
    └──────────────────┘
            │
            │ 1───────M
            │
    ┌───────┴──────────────────┐
    │     productos            │
    ├──────────────────────────┤
    │ • id (PK)                │
    │ • categoria_id (FK)      │
    │ • nombre                 │
    │ • descripción            │
    │ • codigo_sku             │
    │ • estacion_id (FK)       │
    │ • precio_venta           │
    │ • costo_promedio         │
    │ • margen                 │
    │ • foto_url               │
    │ • activo                 │
    │ • requiere_receta        │
    │ • visible_pos            │
    └──────────────────────────┘
            │
            │ 1───────M
            │
    ┌───────┴──────────────┐         ┌────────────────────┐
    │  producto_variante   │─────M──>│   variantes        │
    ├──────────────────────┤         ├────────────────────┤
    │ • id (PK)            │         │ • id (PK)          │
    │ • producto_id (FK)   │         │ • nombre           │
    │ • variante_id (FK)   │         │ • descripción      │
    │ • precio_venta       │         │ • orden            │
    │ • costo_promedio     │         └────────────────────┘
    │ • activa             │
    └──────────────────────┘


            ┌──────────────────┐
            │  modificadores   │
            ├──────────────────┤
            │ • id (PK)        │
            │ • nombre         │
            │ • tipo           │
            │ • (adición/opción│
            │   requerido/    │
            │   opcional)      │
            │ • orden          │
            └──────────────────┘
                    │
                    │ 1───────M
                    │
    ┌───────────────┴──────────┐
    │ producto_modificador     │
    ├──────────────────────────┤
    │ • id (PK)                │
    │ • producto_id (FK)       │
    │ • modificador_id (FK)    │
    │ • requerido              │
    │ • orden                  │
    └──────────────────────────┘


    ┌──────────────────────────┐
    │ modificador_opciones     │
    ├──────────────────────────┤
    │ • id (PK)                │
    │ • modificador_id (FK)    │
    │ • nombre                 │
    │ • precio_adicional       │
    │ • orden                  │
    │ • activa                 │
    └──────────────────────────┘


    ┌──────────────────┐           ┌───────────────────────┐
    │     combos       │─1────M────>│  combo_items          │
    ├──────────────────┤           ├───────────────────────┤
    │ • id (PK)        │           │ • id (PK)             │
    │ • nombre         │           │ • combo_id (FK)       │
    │ • descripción    │           │ • producto_id (FK)    │
    │ • precio_venta   │           │ • cantidad            │
    │ • costo_promedio │           │ • orden               │
    │ • foto_url       │           └───────────────────────┘
    │ • activo         │
    │ • visible_pos    │
    └──────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║              D. GESTIÓN DE RECETAS E INVENTARIO                       ║
╚═══════════════════════════════════════════════════════════════════════╝

    ┌──────────────────┐           ┌────────────────────┐
    │    recetas       │─1────M────>│  receta_insumos    │
    ├──────────────────┤           ├────────────────────┤
    │ • id (PK)        │           │ • id (PK)          │
    │ • producto_id(FK)│           │ • receta_id (FK)   │
    │ • descripción    │           │ • insumo_id (FK)   │
    │ • rendimiento    │           │ • cantidad         │
    │ • unidad_rend.   │           │ • unidad_medida(FK)│
    │ • costo_total    │           │ • costo_unitario   │
    │ • activa         │           │ • merma            │
    │ • version        │           └────────────────────┘
    └──────────────────┘


    ┌──────────────────────┐           ┌──────────────────┐
    │   insumos            │────M──────>│ unidad_medida    │
    ├──────────────────────┤           ├──────────────────┤
    │ • id (PK)            │           │ • id (PK)        │
    │ • nombre             │           │ • nombre         │
    │ • codigo_sku         │           │ • abreviatura    │
    │ • unidad_medida (FK) │           │ • tipo           │
    │ • stock_actual       │           │ (peso/volumen/   │
    │ • stock_minimo       │           │  cantidad)       │
    │ • stock_maximo       │           └──────────────────┘
    │ • costo_promedio     │
    │ • costo_unitario     │
    │ • proveedor_id (FK)  │
    │ • activo             │
    └──────────────────────┘
            │
            │ 1───────M
            │
    ┌───────┴──────────────────┐
    │ kardex_movimientos       │
    ├──────────────────────────┤
    │ • id (PK)                │
    │ • insumo_id (FK)         │
    │ • sede_id (FK)           │
    │ • tipo_movimiento        │
    │ • cantidad               │
    │ • unidad_medida (FK)     │
    │ • costo_unitario         │
    │ • documento_id           │
    │ • usuario_id (FK)        │
    │ • motivo                 │
    │ • timestamp              │
    │ • (entrada/salida/ajuste)│
    └──────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║              E. GESTIÓN DE PROVEEDORES Y COMPRAS                      ║
╚═══════════════════════════════════════════════════════════════════════╝

    ┌──────────────────────┐           ┌──────────────────┐
    │    proveedores       │─1────M────>│ proveedor_datos  │
    ├──────────────────────┤           ├──────────────────┤
    │ • id (PK)            │           │ • id (PK)        │
    │ • nombre             │           │ • proveedor_id   │
    │ • ruc/nit            │           │ • tipo_dato      │
    │ • contacto_principal │           │ • valor          │
    │ • email              │           │ (teléfono/       │
    │ • telefono           │           │  email/banco)    │
    │ • direccion          │           └──────────────────┘
    │ • ciudad             │
    │ • condiciones_pago   │
    │ • dias_entrega       │
    │ • activo             │
    └──────────────────────┘
            │
            │ 1───────M
            │
    ┌───────┴──────────────────┐
    │      compras             │
    ├──────────────────────────┤
    │ • id (PK)                │
    │ • proveedor_id (FK)      │
    │ • sede_id (FK)           │
    │ • numero_orden           │
    │ • fecha_orden            │
    │ • fecha_entrega_prevista │
    │ • fecha_entrega_real     │
    │ • estado                 │
    │ • subtotal               │
    │ • impuestos              │
    │ • total                  │
    │ • usuario_id (FK)        │
    │ • observaciones          │
    │ • (pendiente/recibida/   │
    │   cancelada)             │
    └──────────────────────────┘
            │
            │ 1───────M
            │
    ┌───────┴──────────────────┐
    │   compra_items           │
    ├──────────────────────────┤
    │ • id (PK)                │
    │ • compra_id (FK)         │
    │ • insumo_id (FK)         │
    │ • cantidad_solicitada    │
    │ • cantidad_recibida      │
    │ • unidad_medida (FK)     │
    │ • precio_unitario        │
    │ • precio_total           │
    │ • recibido               │
    │ • fecha_recepcion        │
    │ • lote_numero            │
    │ • fecha_vencimiento      │
    └──────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║              F. GESTIÓN DE PEDIDOS Y ÓRDENES                          ║
╚═══════════════════════════════════════════════════════════════════════╝

    ┌──────────────────────┐
    │     canales          │
    ├──────────────────────┤
    │ • id (PK)            │
    │ • nombre             │
    │ • descripción        │
    │ • (mesa/barra/llevar)│
    │ • icono              │
    │ • orden              │
    └──────────────────────┘


    ┌──────────────────────┐
    │    clientes          │
    ├──────────────────────┤
    │ • id (PK)            │
    │ • nombre             │
    │ • telefono           │
    │ • email              │
    │ • documento          │
    │ • activo             │
    │ • frecuencia         │
    │ • saldo_credito      │
    └──────────────────────┘
            │
            │ 1───────M
            │
    ┌───────┴──────────────────┐
    │ cliente_direcciones      │
    ├──────────────────────────┤
    │ • id (PK)                │
    │ • cliente_id (FK)        │
    │ • direccion              │
    │ • referencias            │
    │ • zona_entrega_id (FK)   │
    │ • es_principal           │
    │ • activa                 │
    └──────────────────────────┘


    ┌──────────────────────┐
    │   zona_entrega       │
    ├──────────────────────┤
    │ • id (PK)            │
    │ • sede_id (FK)       │
    │ • nombre_zona        │
    │ • costo_domicilio    │
    │ • tiempo_entrega_min │
    │ • activa             │
    └──────────────────────┘


    ┌──────────────────────┐           ┌───────────────────┐
    │     ordenes          │─1────M───>│  orden_items      │
    ├──────────────────────┤           ├───────────────────┤
    │ • id (PK)            │           │ • id (PK)         │
    │ • numero_pedido      │           │ • orden_id (FK)   │
    │ • sede_id (FK)       │           │ • producto_id (FK)│
    │ • mesa_id (FK)       │           │ • cantidad        │
    │ • cliente_id (FK)    │           │ • precio_unitario │
    │ • canal_id (FK)      │           │ • subtotal        │
    │ • mesero_id (FK)     │           │ • notas           │
    │ • fecha_orden        │           │ • estado          │
    │ • hora_orden         │           │ (pendiente/prep/  │
    │ • fecha_entrega_prev │           │  listo/entregado) │
    │ • subtotal           │           │ • timestamp       │
    │ • impuestos          │           └───────────────────┘
    │ • servicio           │                    │
    │ • descuentos         │                    │ 1─────M
    │ • total              │                    │
    │ • estado             │           ┌────────┴───────────────┐
    │ • (abierta/pagada/   │           │ orden_item_modificador │
    │   cancelada/entrega) │           ├────────────────────────┤
    │ • tipo_domicilio     │           │ • id (PK)              │
    │ • repartidor_id (FK) │           │ • orden_item_id (FK)   │
    │ • observaciones      │           │ • modificador_opt_id   │
    │                      │           │   (FK)                 │
    │                      │           │ • precio_adicional     │
    │                      │           │ • cantidad             │
    │                      │           └────────────────────────┘
    └──────────────────────┘


    ┌──────────────────────┐           ┌────────────────────┐
    │     comandas         │─1────M───>│  comanda_items     │
    ├──────────────────────┤           ├────────────────────┤
    │ • id (PK)            │           │ • id (PK)          │
    │ • numero_comanda     │           │ • comanda_id (FK)  │
    │ • orden_id (FK)      │           │ • orden_item_id(FK)│
    │ • sede_id (FK)       │           │ • estacion_id (FK) │
    │ • estacion_id (FK)   │           │ • cantidad         │
    │ • mesa_numero        │           │ • notas            │
    │ • mesero_nombre      │           │ • estado           │
    │ • fecha_creacion     │           │ (pendiente/prep/   │
    │ • hora_creacion      │           │  listo/entregado)  │
    │ • fecha_inicio_prep  │           │ • timestamp_cambio │
    │ • estado             │           │ • usuario_id (FK)  │
    │ • (pendiente/prep/   │           └────────────────────┘
    │  listo/entregado)    │
    │ • impresa            │
    │ • numero_copia       │
    └──────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║              G. GESTIÓN DE CAJA Y PAGOS                               ║
╚═══════════════════════════════════════════════════════════════════════╝

    ┌──────────────────────┐
    │  metodos_pago        │
    ├──────────────────────┤
    │ • id (PK)            │
    │ • nombre             │
    │ • descripción        │
    │ • icono              │
    │ • requiere_ref       │
    │ • activo             │
    └──────────────────────┘


    ┌──────────────────────┐           ┌────────────────────┐
    │   aperturas_caja     │─1────M───>│  caja_movimientos  │
    ├──────────────────────┤           ├────────────────────┤
    │ • id (PK)            │           │ • id (PK)          │
    │ • sede_id (FK)       │           │ • apertura_id (FK) │
    │ • usuario_id (FK)    │           │ • tipo_movimiento  │
    │ • fecha_apertura     │           │ • monto            │
    │ • hora_apertura      │           │ • descripción      │
    │ • saldo_inicial      │           │ • timestamp        │
    │ • estado             │           │ (entrada/salida/   │
    │ • activa             │           │  ajuste)           │
    └──────────────────────┘           └────────────────────┘


    ┌──────────────────────┐
    │   cierres_caja       │
    ├──────────────────────┤
    │ • id (PK)            │
    │ • apertura_id (FK)   │
    │ • fecha_cierre       │
    │ • hora_cierre        │
    │ • total_vendido      │
    │ • total_efectivo     │
    │ • diferencia         │
    │ • usuario_id (FK)    │
    │ • observaciones      │
    │ • estado             │
    │ • (abierta/cerrada)  │
    └──────────────────────┘


    ┌──────────────────────┐           ┌─────────────────────┐
    │      facturas        │─1────M───>│  pago_facturas      │
    ├──────────────────────┤           ├─────────────────────┤
    │ • id (PK)            │           │ • id (PK)           │
    │ • numero_factura     │           │ • factura_id (FK)   │
    │ • orden_id (FK)      │           │ • metodo_pago_id(FK)│
    │ • apertura_id (FK)   │           │ • monto             │
    │ • cliente_id (FK)    │           │ • referencia        │
    │ • fecha_emision      │           │ • timestamp         │
    │ • subtotal           │           │ • estado            │
    │ • impuestos          │           │ (procesado/pendiente│
    │ • servicio           │           │  /fallido)          │
    │ • descuentos         │           └─────────────────────┘
    │ • total              │
    │ • pagado             │
    │ • saldo              │
    │ • estado             │
    │ • (borrador/emitida/ │
    │  cancelada)          │
    │ • electronica_id     │
    └──────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║              H. GESTIÓN DE DOMICILIOS Y ENTREGAS                      ║
╚═══════════════════════════════════════════════════════════════════════╝

    ┌──────────────────────┐
    │    repartidores      │
    ├──────────────────────┤
    │ • id (PK)            │
    │ • nombre             │
    │ • telefono           │
    │ • documento          │
    │ • vehiculo           │
    │ • placa_vehiculo     │
    │ • sede_id (FK)       │
    │ • estado             │
    │ • (disponible/en_ruta│
    │  /descansando)       │
    │ • activo             │
    └──────────────────────┘


    ┌──────────────────────┐           ┌────────────────────┐
    │ domicilio_entregas   │─1────M───>│domicilio_tracking  │
    ├──────────────────────┤           ├────────────────────┤
    │ • id (PK)            │           │ • id (PK)          │
    │ • orden_id (FK)      │           │ • entrega_id (FK)  │
    │ • repartidor_id (FK) │           │ • estado           │
    │ • cliente_id (FK)    │           │ • latitude         │
    │ • direccion          │           │ • longitude        │
    │ • zona_id (FK)       │           │ • timestamp        │
    │ • fecha_asignacion   │           │ • observaciones    │
    │ • hora_asignacion    │           │ (recibido/en_ruta/ │
    │ • fecha_entrega_prev │           │  entregado/no_entr)│
    │ • fecha_entrega_real │           └────────────────────┘
    │ • hora_entrega       │
    │ • estado             │
    │ • tiempo_entrega_min │
    │ • costo_domicilio    │
    │ • cobro_en_entrega   │
    │ • observaciones      │
    │ • (asignado/en_ruta/ │
    │  entregado/fallido)  │
    └──────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║              I. GESTIÓN DE ESTACIONES                                 ║
╚═══════════════════════════════════════════════════════════════════════╝

    ┌──────────────────────┐
    │     estaciones       │
    ├──────────────────────┤
    │ • id (PK)            │
    │ • nombre             │
    │ • descripción        │
    │ • orden              │
    │ • (Cocina/Bar/       │
    │  Parrilla/Postres)   │
    │ • color_indicador    │
    │ • activa             │
    └──────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║              J. CONFIGURACIÓN Y DATOS MAESTROS                        ║
╚═══════════════════════════════════════════════════════════════════════╝

    ┌──────────────────────┐
    │  configuracion       │
    ├──────────────────────┤
    │ • id (PK)            │
    │ • sede_id (FK)       │
    │ • clave              │
    │ • valor              │
    │ • tipo               │
    │ • descripción        │
    │                      │
    │ (Ej: impuesto_defecto│
    │   servicio_pct       │
    │   moneda_simbolo)    │
    └──────────────────────┘

```

---

## 2. TABLA DE RELACIONES (Relación Rápida)

| Tabla A | Relación | Tabla B | Descripción |
|---------|----------|---------|-------------|
| usuarios | 1→M | usuario_sede | Un usuario puede operar en varias sedes |
| usuarios | 1→M | roles | Un rol tiene muchos usuarios |
| roles | 1→M | permisos | Un rol tiene muchos permisos |
| usuarios | 1→M | auditoria_eventos | Auditoría de acciones del usuario |
| sedes | 1→M | zonas | Una sede tiene muchas zonas |
| sedes | 1→M | aperturas_caja | Una sede puede tener múltiples cajas abiertas |
| sedes | 1→M | impresoras | Una sede tiene varias impresoras por estación |
| zonas | 1→M | mesas | Una zona tiene múltiples mesas |
| categorias | 1→M | productos | Una categoría tiene muchos productos |
| productos | 1→M | producto_variante | Un producto puede tener variantes (talla) |
| productos | 1→M | producto_modificador | Un producto puede tener múltiples modificadores |
| modificadores | 1→M | modificador_opciones | Un modificador tiene varias opciones |
| productos | 1→M | recetas | Un producto puede tener recetas |
| recetas | 1→M | receta_insumos | Una receta contiene múltiples insumos |
| insumos | 1→M | kardex_movimientos | Un insumo tiene movimientos de entrada/salida |
| proveedores | 1→M | compras | Un proveedor tiene múltiples órdenes de compra |
| compras | 1→M | compra_items | Una compra contiene ítems de insumos |
| ordenes | 1→M | orden_items | Un pedido tiene múltiples ítems |
| orden_items | 1→M | orden_item_modificador | Un ítem del pedido puede tener modificadores |
| ordenes | 1→M | comandas | Un pedido genera comandas por estación |
| comandas | 1→M | comanda_items | Una comanda contiene ítems |
| aperturas_caja | 1→M | cierres_caja | Una apertura de caja se cierra una sola vez |
| aperturas_caja | 1→M | caja_movimientos | Una caja abierta tiene movimientos |
| facturas | 1→M | pago_facturas | Una factura puede ser pagada en partes |
| ordenes | 1→M | facturas | Un pedido genera una factura |
| ordenes | 1→M | domicilio_entregas | Un pedido domicilio genera un envío |
| domicilio_entregas | 1→M | domicilio_tracking | Un envío tiene tracking (múltiples estados) |
| sedes | 1→M | estaciones | Una sede tiene varias estaciones |
| estaciones | 1→M | sede_estacion_impresora | Cada estación por sede tiene asignada una impresora |

---

## 3. ÍNDICES Y CLAVES (Optimización)

### Claves Primarias y Foráneas
```
Todas las tablas tienen:
- PRIMARY KEY: id (serial/auto-increment)
- FOREIGN KEY: referencias a ids de tablas relacionadas

Índices recomendados para búsqueda rápida:

usuarios
  INDEX idx_email (email)
  INDEX idx_pin (pin)

mesas
  INDEX idx_sede_zona (sede_id, zona_id)
  INDEX idx_estado (estado)

productos
  INDEX idx_categoria (categoria_id)
  INDEX idx_codigo_sku (codigo_sku)

ordenes
  INDEX idx_numero_pedido (numero_pedido)
  INDEX idx_mesa_id (mesa_id)
  INDEX idx_fecha_orden (fecha_orden)
  INDEX idx_estado (estado)

comandas
  INDEX idx_numero_comanda (numero_comanda)
  INDEX idx_orden_id (orden_id)
  INDEX idx_estacion (estacion_id)
  INDEX idx_estado (estado)

kardex_movimientos
  INDEX idx_insumo (insumo_id)
  INDEX idx_sede (sede_id)
  INDEX idx_timestamp (timestamp)

facturas
  INDEX idx_numero_factura (numero_factura)
  INDEX idx_apertura (apertura_id)

Índices UNIQUE para evitar duplicados:

usuarios
  UNIQUE (email)

productos
  UNIQUE (codigo_sku)

ordenes
  UNIQUE (numero_pedido)

comandas
  UNIQUE (numero_comanda)

facturas
  UNIQUE (numero_factura)
```

---

## 4. TIPOS DE DATOS Y RESTRICCIONES

### Enumerados (ENUM)
```sql
-- Estado de mesa
ENUM_MESA_STATE: 'LIBRE', 'OCUPADA', 'PRECUENTA', 'PAGADA', 'BLOQUEADA'

-- Estado de orden
ENUM_ORDEN_STATE: 'ABIERTA', 'LISTA', 'PAGADA', 'CANCELADA'

-- Estado de comanda
ENUM_COMANDA_STATE: 'PENDIENTE', 'PREPARANDO', 'LISTA', 'ENTREGADA'

-- Estado de ítem en comanda
ENUM_ITEM_STATE: 'PENDIENTE', 'PREPARANDO', 'LISTO', 'ENTREGADO'

-- Canal de venta
ENUM_CANAL: 'MESA', 'BARRA', 'PARA_LLEVAR', 'DOMICILIO'

-- Tipo de movimiento Kardex
ENUM_KARDEX: 'ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA', 'TRASLADO'

-- Estado de compra
ENUM_COMPRA_STATE: 'PENDIENTE', 'RECIBIDA', 'PARCIAL', 'CANCELADA'

-- Tipo de modificador
ENUM_MODIFICADOR: 'ADICION', 'OPCION', 'REQUERIDO'

-- Estado de repartidor
ENUM_REPARTIDOR: 'DISPONIBLE', 'EN_RUTA', 'DESCANSANDO'

-- Estado de caja
ENUM_CAJA: 'ABIERTA', 'CERRADA'

-- Tipo de domicilio
ENUM_DOMICILIO: 'ENTREGAR', 'COMPRADOR_RETIRA'
```

### Campos Estándar (Auditoría)
```sql
Toda tabla incluye:
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  deleted_at TIMESTAMP NULL (soft delete)
```

---

## 5. VISTA DE TRANSACCIONES IMPORTANTES

### Transacción 1: Completar Pedido (Pago)
```
1. Orden actualiza estado a PAGADA
2. Facturas se generan (1 por vez que pagó)
3. Pago_facturas se registra
4. Aperturas_caja se actualiza (saldo)
5. Kardex_movimientos se decrementa (inventario)
   - Basado en receta de cada producto vendido
6. Auditoría_eventos registra la transacción
7. Mesa estado → PAGADA
```

### Transacción 2: Enviar Pedido a Cocina
```
1. Orden_items marcados para envío
2. Por cada estación, se crea Comanda
3. Comanda_items asociados
4. Impresora de estación recibe "job" de impresión
5. WebSocket notifica a KDS en tiempo real
6. Auditoría_eventos registra quién y cuándo
```

### Transacción 3: Recepcionar Compra
```
1. Compra estado → RECIBIDA
2. Para cada compra_item:
   - Kardex_movimiento tipo ENTRADA
   - Insumos stock_actual actualizado
3. Auditoría_eventos registra recepción
```

---

## 6. NOTAS DE DISEÑO

1. **Soft Delete**: Campo `deleted_at` permite "borrar lógico" sin perder integridad referencial.

2. **Auditoría completa**: Tabla `auditoria_eventos` registra TODA acción (quién, qué, cuándo, IP).

3. **Transaccionalidad**: Las operaciones críticas (pago, compra, recepción) deben usar transacciones ACID.

4. **Normalización**: Schema está en 3NF para evitar anomalías.

5. **Escalabilidad**: Índices estratégicos en búsquedas frecuentes (pedidos por fecha, mesa por zona, etc.).

6. **Relaciones M→M**: Se manejan con tablas de unión (ej: producto_modificador, usuario_sede).

7. **Kardex completo**: Permite trazabilidad y reportes de consumo por período.

