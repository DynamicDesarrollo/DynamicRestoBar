# 📊 ANÁLISIS: SISTEMA DE INVENTARIO Y COSTOS DE PRODUCCIÓN

## Objetivo General
Gestionar insumos, recetas, inventario y calcular la rentabilidad de cada producto basado en costos de producción real.

---

## 1️⃣ ESTRUCTURA DE DATOS ACTUAL (BD)

### Tablas Existentes:
```
✅ insumos
   - id, nombre, codigo_sku, unidad_medida_id
   - stock_actual, stock_minimo, stock_maximo
   - costo_unitario, costo_promedio
   - proveedor_principal_id
   
✅ recetas
   - id, producto_id, descripcion
   - rendimiento (e.g., 1 hamburguesa)
   - costo_total (auto-calculado)
   
✅ receta_insumos
   - receta_id, insumo_id
   - cantidad (cuánto se usa de cada insumo)
   - unidad_medida_id
   - costo_unitario, merma (pérdida en preparación)
   
✅ kardex_movimientos
   - Registro de entrada/salida de insumos
   - tipo: ENTRADA, SALIDA, AJUSTE, MERMA, TRASLADO
   
✅ unidad_medida
   - kg, litro, unidad, gramos, etc.
```

---

## 2️⃣ FLUJO DE FUNCIONAMIENTO

### 📋 EJEMPLO: HAMBURGUESA

```
INSUMOS NECESARIOS:
  1. Pan de hamburguesa          → 1 unidad @ $200
  2. Carne 150g                  → 150g @ $4/g = $600
  3. Cebolla                     → 20g @ $0.20/g = $4
  4. Tomate                      → 30g @ $0.10/g = $3
  5. Lechuga                     → 15g @ $0.15/g = $2.25
  6. Mayonesa                    → 10ml @ $0.50/ml = $5
  7. Ketchup                     → 10ml @ $0.30/ml = $3
  ─────────────────────────────────────────
  COSTO TOTAL PRODUCCIÓN: $817.25

VENTA:
  Precio venta al cliente: $3,000
  Menos costo producción: -$817.25
  ═══════════════════════════════════════════
  UTILIDAD BRUTA: $2,182.75 (72.76% margen)

INVENTARIO:
  Al vender 1 hamburguesa:
    - Pan: 1 - 1 = 0
    - Carne: 500g - 150g = 350g
    - Cebolla: 1000g - 20g = 980g
    - Tomate: 1000g - 30g = 970g
    - Lechuga: 500g - 15g = 485g
    - Mayonesa: 1L - 10ml = 990ml
    - Ketchup: 1L - 10ml = 990ml
```

---

## 3️⃣ COMPONENTES A DESARROLLAR

### A. BACKEND

#### 1. **InsumosController** (`/api/v1/admin/insumos`)
```
GET    /admin/insumos              → Listar todos los insumos
GET    /admin/insumos/:id          → Obtener detalle de insumo
GET    /admin/insumos/bajo-stock   → Ver qué insumos están bajo mínimo
POST   /admin/insumos              → Crear nuevo insumo
PUT    /admin/insumos/:id          → Actualizar insumo (precio, stock mín/máx)
DELETE /admin/insumos/:id          → Desactivar insumo (soft delete)
```

#### 2. **RecetasController** (`/api/v1/admin/recetas`)
```
GET    /admin/recetas                    → Listar todas las recetas
GET    /admin/recetas/:id                → Obtener receta con detalles
GET    /admin/recetas/producto/:producto_id → Obtener receta de un producto
POST   /admin/recetas                    → Crear receta
PUT    /admin/recetas/:id                → Actualizar receta
POST   /admin/recetas/:id/insumos        → Agregar insumo a receta
DELETE /admin/recetas/:id/insumos/:insumo_id → Eliminar insumo de receta
```

#### 3. **InventarioController** (`/api/v1/admin/inventario`)
```
GET    /admin/inventario                     → Dashboard de inventario
GET    /admin/inventario/bajo-stock          → Insumos que necesitan reorden
GET    /admin/inventario/movimientos         → Historial de movimientos (kardex)
POST   /admin/inventario/ajuste              → Ajuste manual (merma, roturas)
POST   /admin/inventario/entrada             → Entrada de insumos (compra)
POST   /admin/inventario/salida-manual       → Salida manual (rechazo, desperdicio)
```

#### 4. **CostosController** (`/api/v1/admin/costos`)
```
GET    /admin/costos/producto/:producto_id   → Costo de producción + margen
GET    /admin/costos/productos               → Todos productos con rentabilidad
GET    /admin/costos/reporte                 → Análisis de rentabilidad
```

---

### B. MIGRACIONES (Knex)

```
002_create_insumos_estructura.js
003_create_recetas_estructura.js
004_seed_insumos_iniciales.js
005_seed_recetas_iniciales.js
```

---

### C. FRONTEND (React)

#### 1. **Configuración > Insumos** (`/admin/insumos`)
```
✓ Grid de insumos con:
  - Nombre, código SKU
  - Unidad de medida
  - Stock actual / Mínimo / Máximo
  - Costo unitario
  - Proveedor
  - Alertas (🔴 bajo stock)
  
✓ Funcionalidades:
  - CRUD completo
  - Bulk upload desde CSV
  - Alertas automáticas
```

#### 2. **Configuración > Recetas** (`/admin/recetas`)
```
✓ Interfaz por producto:
  - Seleccionar producto
  - Agregar insumos con cantidad
  - Mostrar costo total auto-calculado
  - Agregar % de merma
  - Guardar versiones de receta
  
✓ Vista de receta:
  - Detalles de insumos
  - Costo unitario de cada componente
  - Total y margen de utilidad
```

#### 3. **Inventario** (`/admin/inventario`)
```
✓ Dashboard:
  - Stock actual vs mínimo/máximo
  - Alertas en rojo (bajo stock)
  - Valor total del inventario
  - Rotación y antigüedad
  
✓ Movimientos (Kardex):
  - Entrada: Compra de insumos
  - Salida: Producción (automático) o manual
  - Ajuste: Merma, rotura
  
✓ Reportes:
  - Insumos próximos a agotar
  - Costo promedio ponderado
  - Valorización de inventario (PEPS, UEPS, PPP)
```

#### 4. **Costos y Rentabilidad** (`/admin/costos`)
```
✓ Análisis por producto:
  - Costo de producción
  - Precio de venta
  - Margen bruto %
  - Productos con mejor/peor rentabilidad
  
✓ Reportes:
  - Comparativo mensual
  - Productos sin receta
  - Cambios de costo
```

---

## 4️⃣ FLUJO DE VENTA (Integración con Pedidos)

### Cuando se crea una VENTA:
```
1. Sistema obtiene receta del producto
   receta = await db('recetas').where('producto_id', producto_id).first()

2. Calcula costo total de producción
   costo_produccion = SUM(cantidad * costo_unitario) de receta_insumos

3. DESCUENTA del inventario
   Para cada insumo en la receta:
     stock_actual = stock_actual - cantidad_usada
   
4. Registra en kardex (SALIDA)
   kardex_movimientos.insert({
     tipo: 'SALIDA',
     insumo_id,
     cantidad,
     costo_unitario,
     referencia: `Venta orden ${orden_id}`
   })

5. Calcula margen:
   utilidad = precio_venta - costo_produccion
   margen_pct = (utilidad / precio_venta) * 100
```

---

## 5️⃣ ALERTAS Y VALIDACIONES

### 🔴 Stock Bajo
```javascript
if (insumo.stock_actual < insumo.stock_minimo) {
  alert("Stock bajo: " + insumo.nombre);
  // Enviar notificación al admin
}
```

### 🔴 Stock Insuficiente para Venta
```javascript
if (stock_actual < cantidad_requerida) {
  throw new Error("Stock insuficiente: " + insumo.nombre);
  // Rechazar venta
}
```

### ⚠️ Producto sin Receta
```javascript
if (!receta) {
  console.warn(`Producto ${producto} sin receta definida`);
  // Permitir venta pero mostrar advertencia
}
```

---

## 6️⃣ TABLAS NUEVAS REQUERIDAS

```sql
-- Ya existen en schema.sql pero verificar que estén completas:
✅ insumos
✅ recetas  
✅ receta_insumos
✅ kardex_movimientos
✅ unidad_medida
✅ proveedores
✅ compras

-- Posible agregar:
? orden_items.costo_produccion   → Guardar costo en momento de venta
? productos.requiere_receta       → Flag si es necesario calcular costo
```

---

## 7️⃣ IMPACTO EN ÓRDENES/PEDIDOS

### En `orden_items` agregar:
```sql
ALTER TABLE orden_items ADD COLUMN costo_produccion DECIMAL(10,2);
ALTER TABLE orden_items ADD COLUMN margen_utilidad DECIMAL(10,2);
ALTER TABLE orden_items ADD COLUMN margen_pct DECIMAL(5,2);
```

---

## 8️⃣ ROADMAP DE IMPLEMENTACIÓN

### 🎯 FASE 1: Estructura Base (AHORA)
- [ ] Crear AdminLayout section: "Inventario"
- [ ] Crear página: Gestión de Insumos
- [ ] CRUD de Insumos en backend
- [ ] Listar insumos en frontend

### 🎯 FASE 2: Recetas
- [ ] Crear página: Gestión de Recetas
- [ ] Interfaz para agregar insumos a receta
- [ ] Cálculo automático de costo total
- [ ] API endpoints de recetas

### 🎯 FASE 3: Inventario
- [ ] Dashboard de inventario
- [ ] Movimientos (kardex)
- [ ] Ajustes manuales
- [ ] Alertas de bajo stock

### 🎯 FASE 4: Integración con Ventas
- [ ] Descuento automático de inventario al vender
- [ ] Guardado de costo en orden_items
- [ ] Validación de stock antes de venta

### 🎯 FASE 5: Reportes
- [ ] Análisis de rentabilidad
- [ ] Reportes de costo vs venta
- [ ] Proyecciones

---

## 9️⃣ EJEMPLO DE CONSULTAS CLAVE

### Obtener costo de un producto:
```javascript
async getCostoproduccion(producto_id) {
  const receta = await db('recetas')
    .where('producto_id', producto_id)
    .first();
  
  if (!receta) return 0;
  
  const insumos = await db('receta_insumos')
    .where('receta_id', receta.id)
    .join('insumos', 'receta_insumos.insumo_id', 'insumos.id')
    .select(
      'receta_insumos.cantidad',
      'insumos.costo_unitario'
    );
  
  const costo_total = insumos.reduce((sum, item) => 
    sum + (item.cantidad * item.costo_unitario), 0
  );
  
  return costo_total;
}
```

### Ver insumos bajo stock:
```javascript
async getInsumosBajoStock() {
  return db('insumos')
    .where(db.raw('stock_actual <= stock_minimo'))
    .where('activo', true)
    .select('*');
}
```

### Crear movimiento de inventario:
```javascript
async registrarSalida(insumo_id, cantidad, referencia) {
  await db('insumos')
    .where('id', insumo_id)
    .decrement('stock_actual', cantidad);
  
  await db('kardex_movimientos').insert({
    insumo_id,
    tipo_movimiento: 'SALIDA',
    cantidad,
    referencia,
    timestamp: new Date()
  });
}
```

---

## 🔟 RESUMEN EJECUTIVO

| Aspecto | Descripción |
|---------|------------|
| **Objetivo** | Rastrear costos reales de producción y rentabilidad |
| **Componentes** | Insumos, Recetas, Inventario, Costos |
| **Tablas BD** | 6 (ya existen) |
| **Nuevos endpoints** | ~15 endpoints API |
| **Nuevas vistas** | 4 páginas frontend |
| **Integración** | Automática al crear ventas |
| **Reportes** | Rentabilidad, stock, rotación |
| **Alertas** | Stock bajo, productos sin receta |

---

### ✅ PRÓXIMO PASO:
Comenzar con **FASE 1: Gestión de Insumos** para tener la base de datos de ingredientes.

