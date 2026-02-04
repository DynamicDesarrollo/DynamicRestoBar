# 📋 BACKLOG DE FUNCIONALIDADES POR FASES
## DynamicRestoBar - Hoja de Ruta (Roadmap)

---

## RESUMEN EJECUTIVO

Este backlog organiza el desarrollo en **3 fases principales**:
- **Fase 1 (MVP)**: Sistema operativo día 1 (4-6 semanas)
- **Fase 2 (Profundización)**: Recetas e inventario (3-4 semanas)
- **Fase 3 (Extras)**: Domicilios avanzado, reportes, facturación e-fiscal (2-3 semanas)

Cada funcionalidad está etiquetada con:
- **Prioridad**: CRÍTICA / ALTA / MEDIA / BAJA
- **Esfuerzo**: S (1-2 días) / M (3-5 días) / L (1-2 semanas) / XL (3+ semanas)
- **Dependencias**: Qué debe estar listo primero

---

## ✅ FASE 1: MVP OPERATIVO (Semanas 1-6)

**Objetivo**: Sistema POS completamente funcional para operar un día de ventas.

### A. INFRAESTRUCTURA Y CONFIGURACIÓN BASE

#### A1. Setup Proyecto
- [ ] Inicializar repositorio Git (GitHub/GitLab)
- [ ] Crear estructura de carpetas (frontend/backend/database)
- [ ] Configurar CI/CD básico (opcional: GitHub Actions)
- [ ] Documentación de instalación y deploy local
- **Prioridad**: CRÍTICA | **Esfuerzo**: S | **Owner**: DevOps

#### A2. Base de Datos PostgreSQL
- [ ] Script SQL creación tablas (ver PLANNING_02_MODELO_ER.md)
- [ ] Índices y restricciones
- [ ] Seed data (sedes, zonas, categorías, productos base)
- [ ] Conexión y pool desde Node.js
- [ ] Migraciones automáticas (Knex/TypeORM)
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend/DB

#### A3. Autenticación y Seguridad
- [ ] Login básico (email/PIN para meseros)
- [ ] JWT tokens + refresh tokens
- [ ] Hash contraseñas (bcrypt)
- [ ] Roles básicos (Mesero, Cocina, Bar, Caja, Admin)
- [ ] Middleware autorización por ruta
- [ ] Auditoría: registro básico de quién hace qué
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend

#### A4. API REST Base
- [ ] Framework Express.js configurado
- [ ] Estructura MVC (routes, controllers, services, models)
- [ ] Error handling centralizado
- [ ] Validación de inputs (Joi/Zod)
- [ ] CORS y seguridad básica
- [ ] Documentación OpenAPI/Swagger
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend

---

### B. GESTIÓNDE MESAS Y ESTADO

#### B1. Administración de Sedes y Zonas
- [ ] CRUD Sedes (crear, editar, activar/desactivar)
- [ ] CRUD Zonas por sede (Salón, Terraza, VIP, Bar)
- [ ] Asignación de impresoras por estación
- [ ] Visualización de estructura física (para mapeo mesas)
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend + Admin Frontend

#### B2. Mapa de Mesas (POS Mesero - Tablet)
- [ ] Cargar y visualizar mapa de mesas por zona
- [ ] Estados visuales (libre, ocupada, precuenta, pagada, bloqueada)
- [ ] Tap en mesa → abrir modal de acciones
- [ ] Abrir mesa (seleccionar mesero, # comensales)
- [ ] Ver pedidos actuales de mesa (estado items)
- [ ] Cambiar estado mesa manualmente (Admin)
- [ ] Bloquear/desbloquear mesas (mantenimiento)
- **Prioridad**: CRÍTICA | **Esfuerzo**: L | **Owner**: Frontend (React)

#### B3. Gestión Dinámicas de Mesas
- [ ] Transferir mesa entre meseros
- [ ] Unir mesas (mesa 3 + mesa 4 = mesa 34)
- [ ] Separar mesas (deshacer unión)
- [ ] Cambiar número de comensales
- [ ] Notas en mesa (libre, para luego)
- **Prioridad**: ALTA | **Esfuerzo**: M | **Owner**: Frontend

---

### C. PRODUCTOS Y CATÁLOGO

#### C1. Gestión de Productos (Admin)
- [ ] CRUD Productos (crear, editar, activar/desactivar)
- [ ] Categorías y subcategorías
- [ ] Asignar estación (Cocina, Bar)
- [ ] Precio venta + costo promedio
- [ ] Foto/ícono por producto
- [ ] Búsqueda y filtrado en listado
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend + Admin Frontend

#### C2. Modificadores (Adiciones y Opciones)
- [ ] CRUD Modificadores (crear plantillas)
- [ ] Modificador = Adición (con costo) o Tipo de Preparación (sin costo)
- [ ] Asignar modificadores a productos (ej: "Alitas BBQ" → "Salsa", "Temperatura")
- [ ] Marcados como requerido u opcional
- [ ] Visualizar en POS al agregar producto
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend + Frontend

#### C3. Combos
- [ ] CRUD Combos (agrupar productos)
- [ ] Ítem del combo heredable (cantidad, descuento)
- [ ] Precio especial por combo
- [ ] Visualizar en POS como producto único
- [ ] Descomposición por estación en producción
- **Prioridad**: ALTA | **Esfuerzo**: M | **Owner**: Backend + Frontend

#### C4. Variantes/Tamaños
- [ ] Crear variantes por producto (Pequeño, Mediano, Grande)
- [ ] Precio diferenciado por variante
- [ ] Selector en POS al agregar
- [ ] Visible en comanda enviada a cocina
- **Prioridad**: MEDIA | **Esfuerzo**: M | **Owner**: Backend + Frontend

---

### D. TOMA DE PEDIDOS (POS MESERO)

#### D1. Pantalla de Categorías y Búsqueda
- [ ] Mostrar categorías en tabs/accordion
- [ ] Buscador de productos (por nombre, código)
- [ ] Filtrado dinámico
- [ ] Productos con foto, nombre, precio
- [ ] Botón "+" para agregar al carrito
- [ ] Mostrar disponibilidad (out of stock)
- **Prioridad**: CRÍTICA | **Esfuerzo**: L | **Owner**: Frontend

#### D2. Modal de Producto (Adiciones y Notas)
- [ ] Imagen grande del producto
- [ ] Nombre, descripción, precio
- [ ] Selector de cantidad (+ y -)
- [ ] Mostrar modificadores disponibles
  - Adiciones con costo (checkboxes)
  - Opciones sin costo (radio buttons)
- [ ] Campo de notas libres (término, sin picante, etc.)
- [ ] Cálculo de precio total (cantidad * precio base + adiciones)
- [ ] Botones [Agregar al Carrito] [Cancelar]
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Frontend

#### D3. Carrito de Mesa
- [ ] Listar ítems agregados
- [ ] Editar cantidad por ítem (botones + / -)
- [ ] Eliminar ítem del carrito
- [ ] Expandir/contraer ítem para ver detalles (modifs, notas)
- [ ] Cálculo automático: Subtotal, Impuesto (IVA %), Servicio (%)
- [ ] Total a pagar
- [ ] Botones [Seguir agregando] [Enviar a Cocina/Bar] [Guardar sin enviar]
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Frontend

#### D4. Guardar Pedido (sin enviar)
- [ ] Guardar carrito sin cambiar estado de comanda
- [ ] Regresar a mapa de mesas
- [ ] Retomar carrito guardado (botón "Continuar edición")
- [ ] Máximo 1 carrito abierto por mesa (o permitir múltiples)
- **Prioridad**: ALTA | **Esfuerzo**: S | **Owner**: Frontend

---

### E. PRODUCCIÓN (KDS COCINA Y BAR)

#### E1. Pantalla KDS Cocina (PC/TV)
- [ ] Listar comandas pendientes de la estación Cocina
- [ ] Tarjeta por comanda con:
  - Mesa/Mesero/Hora
  - Lista de ítems (producto + cantidad)
  - Notas resaltadas (sin cebolla, etc.)
  - Estado actual (Pendiente/Preparando/Listo)
- [ ] Botones de estado: [Preparando] [Listo] [Reimprime]
- [ ] Timer mostrando cuánto tiempo lleva cada comanda
- [ ] Alerta visual (rojo) si retrasado > X minutos
- [ ] Filtros: Mostrar/ocultar estados
- [ ] Vista: Cronológica o por prioridad
- **Prioridad**: CRÍTICA | **Esfuerzo**: L | **Owner**: Frontend

#### E2. Pantalla KDS Bar (PC/TV)
- [ ] Igual que KDS Cocina pero solo para estación Bar
- [ ] Bebidas, licores, cócteles
- [ ] Puede estar en misma pantalla (tabs) o separada
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Frontend

#### E3. Recepción de Comandas en Tiempo Real (WebSocket)
- [ ] Backend: WebSocket servidor
- [ ] Frontend: Cliente WebSocket en KDS
- [ ] Al mesero enviar pedido → se genera comanda y aparece en KDS automáticamente
- [ ] Sin necesidad de refrescar pantalla
- [ ] Sonido/notificación opcional cuando llega comanda
- **Prioridad**: CRÍTICA | **Esfuerzo**: L | **Owner**: Backend + Frontend

#### E4. Cambio de Estado de Comanda
- [ ] Comanda: Pendiente → Preparando → Listo → Entregado
- [ ] Al cambiar, se actualiza en tiempo real en POS Mesero y lista
- [ ] Registro de quién cambió y cuándo
- [ ] Cálculo de tiempos (desde envío hasta listo)
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend + Frontend

#### E5. Reimpresión de Comanda
- [ ] Botón "Reimprime" en comanda
- [ ] Vuelve a imprimir en impresora de estación
- [ ] Marca como "COPIA" en el ticket
- [ ] Registra quién reimprimo
- **Prioridad**: ALTA | **Esfuerzo**: S | **Owner**: Backend

---

### F. IMPRESIÓN DE COMANDAS

#### F1. Servicio de Impresión
- [ ] Backend: Servicio que recibe "jobs" de impresión
- [ ] Identifica impresora por sede + estación
- [ ] Envía comando a impresora (red o USB)
- [ ] Formato de ticket: 80mm térmico
- [ ] Manejo de errores (impresora sin papel, offline, etc.)
- [ ] Cola de impresión (si impresora está ocupada)
- **Prioridad**: CRÍTICA | **Esfuerzo**: L | **Owner**: Backend

#### F2. Formato de Comanda Térmica
```
═══════════════════════════════════
      DYNAMICRESTOBAR - CENTRO
═══════════════════════════════════
COMANDA #1234
Mesa: 3 | Mesero: Juan
Zona: Salón
Hora: 14:35 | Fecha: 11/Ene/2026

───────────────────────────────────
ESTACIÓN: COCINA
───────────────────────────────────
2x Alitas BBQ (9.90)
   ✎ sin cebolla
   (NOTAS LIBRES)

1x Filete a lo pobre (32.00)
   ✎ término: 3/4

───────────────────────────────────
───────────────────────────────────
[PENDIENTE]  [Enviado: 14:35]
═══════════════════════════════════
```
- [ ] Implementar plantilla
- [ ] Testear en impresora térmica
- [ ] Verificar alineación y caracteres especiales
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend

#### F3. Configuración de Impresoras por Sede
- [ ] Admin puede registrar impresora (IP, puerto, modelo)
- [ ] Asignar impresora a estación/sede
- [ ] Test de conexión desde admin
- [ ] Fallback: si no hay impresora, guardar en DB (Print Manual Later)
- **Prioridad**: ALTA | **Esfuerzo**: M | **Owner**: Backend + Admin Frontend

---

### G. CAJA Y COBROS

#### G1. Apertura de Caja
- [ ] Usuario (Cajero) abre caja al inicio del turno
- [ ] Registra saldo inicial (dinero en caja)
- [ ] Vincula a sed actual
- [ ] Un solo cierre pendiente por sede a la vez
- [ ] Pantalla inicial de Caja muestra "Caja abierta" si aplica
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend + Caja Frontend

#### G2. Pantalla de Cobro
- [ ] Listar mesas en precuenta (esperando pago)
- [ ] Tap en mesa → ver detalles de pedido
- [ ] Mostrar:
  - Ítems vendidos con precios
  - Subtotal
  - Impuesto (IVA calculado)
  - Servicio (% opcional)
  - Descuentos (si aplica)
  - **TOTAL A PAGAR**
- [ ] Ingresar método de pago (Efectivo, Tarjeta, Transferencia, Mixto)
- [ ] Si Efectivo: campo para "Dinero recibido" → calcula cambio
- [ ] Botón [Procesar Pago]
- **Prioridad**: CRÍTICA | **Esfuerzo**: L | **Owner**: Caja Frontend

#### G3. Factura Impresa
- [ ] Generar ticket factura (80mm o A4)
- [ ] Contiene:
  - Encabezado (sede, dirección)
  - Número de factura (correlativo)
  - Fecha/Hora
  - Detalles de venta (productos con cantidades y precios)
  - Subtotal, IVA, Servicio, Descuentos, TOTAL
  - Método de pago
  - Mesero y Cajero que procesó
  - Número de apertura de caja
- [ ] Imprimir en factura printer (80mm o A4 según config)
- [ ] Guardar en DB (tabla facturas)
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend + Caja Frontend

#### G4. Pago de Facturas
- [ ] Registrar pago en tabla pago_facturas
- [ ] Métodos de pago: Efectivo, Tarjeta Débito, Tarjeta Crédito, Transferencia, Otro
- [ ] Si tarjeta: campo para últimos 4 dígitos o referencia
- [ ] Actualizar estado de orden a PAGADA
- [ ] Liberar mesa
- [ ] Vincular a apertura de caja
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend + Caja Frontend

#### G5. Descuentos y Cortesías
- [ ] Aplicar descuento % o $ antes de cobrar
- [ ] Campo de motivo (obligatorio)
- [ ] Requiere permiso supervisor/admin
- [ ] Registra quién autorizó
- [ ] Refleja en reporte de caja
- **Prioridad**: ALTA | **Esfuerzo**: M | **Owner**: Backend + Caja Frontend

#### G6. Cierre de Caja
- [ ] Generar reporte de ventas del turno
- [ ] Mostrar:
  - Total facturado
  - Ventas por método de pago (Efectivo, Tarjeta, etc.)
  - Descuentos totales
  - Anulaciones
  - Venta neta
- [ ] Campo para recuento físico de efectivo
- [ ] Calcular diferencia (dinero en caja vs sistema)
- [ ] Observaciones (si hay diferencia)
- [ ] Botón [Confirmar Cierre]
- [ ] Genera PDF/imprime reporte
- [ ] Caja se marca como CERRADA
- **Prioridad**: CRÍTICA | **Esfuerzo**: L | **Owner**: Backend + Caja Frontend

---

### H. DOMICILIOS BÁSICOS (Fase 1 - Mínimo)

#### H1. Nuevo Pedido Domicilio
- [ ] Opción desde POS (botón "+ Domicilio" en mapa mesas)
- [ ] Formulario:
  - Nombre cliente
  - Teléfono
  - Dirección completa
  - Zona de entrega (dropdown)
  - Observaciones
- [ ] Usa mismo sistema de pedido que mesa (categorías, adiciones, etc.)
- [ ] Costo domicilio se suma automático según zona
- [ ] Botón [Enviar a Cocina/Bar]
- **Prioridad**: ALTA | **Esfuerzo**: M | **Owner**: Frontend + Backend

#### H2. Cola de Domicilios (Admin/Caja)
- [ ] Listar domicilios pendientes de cobro
- [ ] Estados: Recibido → En Producción → Listo → [Pagado]
- [ ] Similar a "Mesas en precuenta"
- [ ] Cobro desde caja
- [ ] Despacho (imprimir ticket con dirección)
- **Prioridad**: ALTA | **Esfuerzo**: M | **Owner**: Frontend + Backend

#### H3. Impresión de Despacho (Domicilio)
- [ ] Ticket con:
  - Número de pedido domicilio
  - Cliente, teléfono, dirección, referencias
  - Ítems (sin detalles complejos, resumen)
  - Observaciones
  - Costo total
- [ ] Para que despachador/repartidor vea
- **Prioridad**: ALTA | **Esfuerzo**: S | **Owner**: Backend

---

### I. USUARIOS Y ROLES BÁSICOS

#### I1. Gestión de Usuarios (Admin)
- [ ] CRUD Usuarios
- [ ] Campos: Nombre, Email, PIN (para meseros), Teléfono, Foto
- [ ] Asignar rol (Mesero, Cocina, Bar, Caja, Admin)
- [ ] Asignar sede/s (puede operar en múltiples)
- [ ] Activar/desactivar usuario
- [ ] Reset de PIN
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend + Admin Frontend

#### I2. Roles y Permisos Básicos
- [ ] Roles: Mesero, Cocina, Bar, Cajero, Admin
- [ ] Permisos por rol:
  - Mesero: tomar pedidos, ver precuenta
  - Cocina: ver/cambiar comandas cocina
  - Bar: ver/cambiar comandas bar
  - Cajero: cobrar, facturar, apertura/cierre
  - Admin: todo
- [ ] Middleware que valida permisos en cada ruta
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Owner**: Backend

---

### J. PANTALLA ADMIN (Home Dashboard)

#### J1. Home Admin
- [ ] Selector de sede (si multi-sede)
- [ ] Resumen del día:
  - Órdenes completadas (contador)
  - Ingresos totales
  - Mesas ocupadas
  - Promedio por mesa
- [ ] Menú de navegación (Productos, Inventario, Usuarios, Reportes, Sedes)
- [ ] Quick stats: Top 3 productos hoy, mesero con más ventas
- **Prioridad**: ALTA | **Esfuerzo**: L | **Owner**: Frontend

#### J2. Gestión de Productos (Admin)
- [ ] Listado de productos con filtros
- [ ] CRUD (crear, editar, activar/desactivar)
- [ ] Bulk actions (activar varios, precios, etc.)
- [ ] Búsqueda por nombre/código
- [ ] Columnas: Producto, Precio, Categoría, Estación, Estado
- **Prioridad**: ALTA | **Esfuerzo**: M | **Owner**: Frontend

#### J3. Gestión de Sedes
- [ ] CRUD Sedes
- [ ] Por sede: zonas, mesas, impresoras, usuarios
- [ ] Configuración por sede (horarios, comisiones, impuestos)
- **Prioridad**: ALTA | **Esfuerzo**: M | **Owner**: Frontend + Backend

#### J4. Gestión de Usuarios y Roles
- [ ] CRUD Usuarios
- [ ] Asignar roles
- [ ] Historial de login
- [ ] Permisos granulares (opcional en Fase 1)
- **Prioridad**: ALTA | **Esfuerzo**: M | **Owner**: Frontend + Backend

---

### K. REPORTES BÁSICOS

#### K1. Reporte de Ventas (Diario)
- [ ] Total vendido
- [ ] Ventas por categoría (Entrada, Fuerte, Bebida, etc.)
- [ ] Ventas por mesero
- [ ] Ventas por hora (gráfico de barras)
- [ ] Top 5 productos
- [ ] Métodos de pago
- [ ] Exportar a PDF
- **Prioridad**: MEDIA | **Esfuerzo**: M | **Owner**: Backend + Frontend

#### K2. Reporte de Caja
- [ ] Resumen de cierres
- [ ] Flujo de efectivo
- [ ] Diferencias detectadas
- [ ] Exportar a PDF/Excel
- **Prioridad**: MEDIA | **Esfuerzo**: M | **Owner**: Backend + Frontend

#### K3. Dashboard de Tiempos (Producción)
- [ ] Tiempo promedio por estación
- [ ] Comandas más lentas
- [ ] Eficiencia por turno
- **Prioridad**: MEDIA | **Esfuerzo**: S | **Owner**: Frontend

---

### L. INTEGRACIÓN Y TESTING

#### L1. Testing Automatizado
- [ ] Tests unitarios (Backend): autenticación, cálculos, validaciones
- [ ] Tests de integración (Backend): flujo pedido → pago
- [ ] Tests E2E (Frontend): flujo completo mesero (abrir → pedir → enviar)
- [ ] Coverage: mínimo 70%
- **Prioridad**: MEDIA | **Esfuerzo**: L | **Owner**: QA

#### L2. Deploy Local
- [ ] Docker compose (frontend + backend + DB)
- [ ] Documentación de instalación
- [ ] Scripts de seed data
- [ ] Checklist de features operativas
- **Prioridad**: MEDIA | **Esfuerzo**: M | **Owner**: DevOps

---

## 🔧 FASE 2: RECETAS E INVENTARIO (Semanas 7-10)

**Objetivo**: Sistema de inventario automático basado en recetas, con control de compras.

### A. RECETAS Y CONSUMO

#### A1. Crear/Editar Recetas
- [ ] Por producto: agregar insumos, cantidad, unidad
- [ ] Calcular costo de receta automáticamente
- [ ] Versiones de receta (cambios en el tiempo)
- [ ] Rendimiento (1kg carne → X porciones)
- [ ] Previsualizar costo vs precio venta
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Dependency**: Productos listos

#### A2. Descuento Automático de Inventario
- [ ] Opción 1: Al enviar orden a cocina (rápido pero puede fallar en anulación)
- [ ] Opción 2: Al marcar ítem "Listo" (más seguro)
- [ ] Elegir opciones según negocio
- [ ] Crear kardex_movimiento de SALIDA por cada ítem
- [ ] Si stock insuficiente → error o alerta (según config)
- **Prioridad**: CRÍTICA | **Esfuerzo**: L | **Dependency**: Recetas + Órdenes listos

#### A3. Manejo de Mermas y Cortesías
- [ ] Cortesía: venta pero no cobra
- [ ] Merma: descuenta inventario sin venta (desperdicio, dañado, prueba)
- [ ] Campo en ítem: [Cortesía] [Merma] [Normal]
- [ ] Refleja en kardex y reportes
- **Prioridad**: ALTA | **Esfuerzo**: M

---

### B. INVENTARIO Y KARDEX

#### B1. Gestión de Insumos
- [ ] CRUD Insumos (crear, editar, desactivar)
- [ ] Campos: Nombre, Código SKU, Unidad medida, Stock actual, Stock mínimo, Proveedor principal
- [ ] Costo promedio (calculado de compras)
- [ ] Búsqueda y filtrado
- **Prioridad**: CRÍTICA | **Esfuerzo**: M | **Dependency**: Unidades medida

#### B2. Kardex Automático
- [ ] Cada movimiento de inventario (entrada, salida, ajuste) registra en kardex_movimientos
- [ ] Historial completo por insumo (filtrar por fecha, tipo)
- [ ] Cálculo de stock actual = sum(entradas) - sum(salidas) - sum(mermas)
- [ ] Visualizar en admin (tabla + gráfico)
- **Prioridad**: CRÍTICA | **Esfuerzo**: L

#### B3. Alertas de Stock
- [ ] Si stock < mínimo → alerta visual (rojo)
- [ ] Notificación en admin
- [ ] Opción: auto-sugerir orden de compra
- [ ] Dashboard de productos críticos
- **Prioridad**: ALTA | **Esfuerzo**: M

#### B4. Ajuste Físico de Inventario
- [ ] Herramienta para contar físico (interfaz de entrada rápida)
- [ ] Comparar vs sistema
- [ ] Registrar diferencia como "Ajuste" en kardex
- [ ] Requiere autorización supervisor
- **Prioridad**: MEDIA | **Esfuerzo**: M

---

### C. COMPRAS Y PROVEEDORES

#### C1. Gestión de Proveedores
- [ ] CRUD Proveedores (nombre, contacto, teléfono, email, dirección, RUC/NIT)
- [ ] Términos: días de pago, período de entrega
- [ ] Productos/insumos que suministra (M→M)
- [ ] Histórico de precios
- **Prioridad**: ALTA | **Esfuerzo**: M

#### C2. Orden de Compra
- [ ] Crear OC: seleccionar proveedor → agregar insumos → cantidades → precios
- [ ] Vista previa: subtotal, impuestos, total
- [ ] Estado: Pendiente, Enviada, Parcialmente Recibida, Recibida, Cancelada
- [ ] Fecha prevista de entrega
- [ ] Notas/observaciones
- [ ] Imprime O/C para enviar a proveedor
- **Prioridad**: ALTA | **Esfuerzo**: L | **Dependency**: Proveedores

#### C3. Recepción de Compra
- [ ] Marcar items como recibidos (puede ser parcial)
- [ ] Ingresar cantidad real recibida (si difiere de O/C)
- [ ] Verificar calidad (lote, vencimiento si aplica)
- [ ] Al confirmar: genera kardex_movimiento de ENTRADA
- [ ] Actualiza stock de insumos
- **Prioridad**: CRÍTICA | **Esfuerzo**: M

#### C4. Cuentas por Pagar (Básico)
- [ ] Vincular factura de proveedor a O/C
- [ ] Registrar monto, fecha vencimiento
- [ ] Estado: Pendiente, Pagada, Parcial
- [ ] Listado de pagos pendientes
- [ ] (Full AP en versión futura)
- **Prioridad**: MEDIA | **Esfuerzo**: M

---

### D. TRASLADOS ENTRE SEDES (Opcional)

#### D1. Traslado de Insumos
- [ ] Si multi-sede: permitir trasladar insumos entre sedes
- [ ] Registra como SALIDA en sede A, ENTRADA en sede B
- [ ] Requiere aprobación supervisor
- **Prioridad**: MEDIA | **Esfuerzo**: M | **Dependency**: Multi-sede operativo

---

### E. REPORTES AVANZADOS

#### E1. Costo de Venta y Margen
- [ ] Por cada orden: mostrar costo de insumos vs precio venta
- [ ] Margen real (venta - costo insumos)
- [ ] Reportar por producto, categoría, mesero
- **Prioridad**: MEDIA | **Esfuerzo**: M

#### E2. Consumo de Insumos
- [ ] Consumo por insumo (filtrar fecha)
- [ ] Consumo por producto (cuánto se vendió)
- [ ] Proyección: consumo diario promedio
- [ ] Tabla: insumo, cantidad consumida, unidad, costo total
- **Prioridad**: MEDIA | **Esfuerzo**: M

#### E3. Auditoría Kardex
- [ ] Quién hizo cada movimiento, cuándo, por qué
- [ ] Rastreabilidad completa
- [ ] Filtros: usuario, fecha, tipo movimiento, insumo
- **Prioridad**: MEDIA | **Esfuerzo**: M

---

## 🚀 FASE 3: FUNCIONALIDADES EXTRAS (Semanas 11-16)

**Objetivo**: Enhancements, integración y escalabilidad.

### A. DOMICILIOS AVANZADOS

#### A1. Gestión de Repartidores
- [ ] CRUD Repartidores (nombre, teléfono, documento, vehículo)
- [ ] Estado actual (disponible, en ruta, descansando)
- [ ] Historial de entregas
- **Prioridad**: MEDIA | **Esfuerzo**: M

#### A2. Asignación Inteligente
- [ ] Al marcar domicilio "Listo": sugerir repartidor disponible
- [ ] Algoritmo: nearest repartidor, carga actual, histórico
- [ ] Notificación a repartidor (app o SMS)
- **Prioridad**: MEDIA | **Esfuerzo**: L

#### A3. GPS Tracking
- [ ] Repartidor comparte ubicación (GPS)
- [ ] Admin ve en mapa dónde está
- [ ] Cliente puede ver aprox. tiempo falta
- [ ] Requiere App mobile separada (React Native o similar)
- **Prioridad**: BAJA | **Esfuerzo**: XL

#### A4. Integración de Pagos
- [ ] Repartidor cobra en entrega (efectivo)
- [ ] Registra pago y cierra orden
- [ ] Sincroniza con caja del negocio
- **Prioridad**: MEDIA | **Esfuerzo**: L

---

### B. FACTURACIÓN ELECTRÓNICA

#### B1. Integración Proveedor E-Factura (Colombia)
- [ ] Seleccionar proveedor (VALIDCERT, Softwareplus, etc.)
- [ ] Credenciales y certificados
- [ ] Mapear campos de orden a factura electrónica
- [ ] API para enviar a proveedor
- [ ] Recibir CUFE y guardar XML
- **Prioridad**: BAJA | **Esfuerzo**: XL

#### B2. Impresión de E-Factura
- [ ] QR con información fiscal
- [ ] Número de CUFE visible
- [ ] Datos de validación (ej: "Factura electrónica autorizada")
- **Prioridad**: BAJA | **Esfuerzo**: M

---

### C. GESTIÓN DE CLIENTES Y FIDELIZACIÓN

#### C1. Base de Datos de Clientes
- [ ] Registro de cliente en domicilio o barra
- [ ] Historial de órdenes
- [ ] Teléfono, email para contacto
- [ ] Crédito (si aplica: fiado)
- **Prioridad**: MEDIA | **Esfuerzo**: M

#### C2. Programa de Puntos (Opcional)
- [ ] Puntos por venta (X puntos por peso gastado)
- [ ] Canje de puntos (descuento)
- [ ] Dashboard de puntos para cliente
- [ ] Requiere App/QR menu
- **Prioridad**: BAJA | **Esfuerzo**: L

---

### D. QR MENÚ (OPCIONAL)

#### D1. Menú Digital (App Web)
- [ ] Cliente escanea QR en mesa
- [ ] Ve catálogo completo (fotos, precios, descripciones)
- [ ] (opcional) Ordena desde celular, mesero recibe
- **Prioridad**: BAJA | **Esfuerzo**: L

---

### E. CONFIGURACIÓN AVANZADA

#### E1. Impuestos Complejos
- [ ] Múltiples tasas de IVA (ej: alimentos vs bebidas)
- [ ] Impuestos por producto
- [ ] Manejo de exentos
- **Prioridad**: MEDIA | **Esfuerzo**: M

#### E2. Servicios y Propinas
- [ ] % de servicio configurable
- [ ] Servicio automático vs opcional
- [ ] Propina en factura (tarjeta)
- **Prioridad**: MEDIA | **Esfuerzo**: S

#### E3. Horarios de Operación
- [ ] Por sede: definir horarios (ej: 11:30-14:00, 18:00-23:00)
- [ ] Alertas si se intenta abrir fuera de horario
- [ ] Reportes por hora de operación
- **Prioridad**: MEDIA | **Esfuerzo**: M

---

### F. INTEGRACIONES TERCEROS

#### F1. Pasarelas de Pago
- [ ] Integración Stripe / PayU / Wompi (para transacciones con tarjeta)
- [ ] Webhook para confirmación de pago
- [ ] Manejo de reembolsos
- **Prioridad**: MEDIA | **Esfuerzo**: L

#### F2. SMS Notificaciones
- [ ] Notificar al cliente cuando domicilio está "en ruta"
- [ ] Recordatorio de reservas (si aplica)
- [ ] Proveedor: Twilio, AWS SNS
- **Prioridad**: BAJA | **Esfuerzo**: M

---

### G. REPORTES Y ANALYTICS PROFUNDOS

#### G1. Dashboard Ejecutivo
- [ ] Gráficas de ventas (línea temporal)
- [ ] Margen por producto, categoría
- [ ] Ocupación de mesas (análisis)
- [ ] Top/Bottom productos
- [ ] Comparativa período anterior
- **Prioridad**: MEDIA | **Esfuerzo**: L

#### G2. Análisis Operacional
- [ ] Tiempos de preparación (cocina/bar)
- [ ] Eficiencia de meseros
- [ ] Tasa de descuentos/cortesías
- [ ] Cancelaciones y devoluciones
- **Prioridad**: MEDIA | **Esfuerzo**: M

#### G3. Exportación de Datos
- [ ] Excel, PDF, CSV
- [ ] Filtros avanzados (fecha, sede, usuario, producto)
- [ ] Gráficas embebidas
- **Prioridad**: MEDIA | **Esfuerzo**: M

---

### H. SEGURIDAD Y COMPLIANCE

#### H1. Auditoría Completa
- [ ] Todas las acciones registradas (quién, qué, cuándo, desde dónde IP)
- [ ] Búsqueda de auditoría (filtrar por usuario, rango fecha, recurso)
- [ ] Exportar reporte de auditoría
- **Prioridad**: MEDIA | **Esfuerzo**: M | **Dependency**: Core audit en Fase 1

#### H2. Backups Automáticos
- [ ] Backup diario de BD
- [ ] Almacenamiento remoto (cloud)
- [ ] Restore parcial (si necesario)
- **Prioridad**: MEDIA | **Esfuerzo**: M | **Owner**: DevOps

#### H3. Two-Factor Authentication (2FA)
- [ ] Opcional para admin/supervisor
- [ ] SMS o app (Google Authenticator)
- **Prioridad**: BAJA | **Esfuerzo**: M

---

### I. MOBILE APP (OPCIONAL)

#### I1. App Repartidor (React Native)
- [ ] Recibir asignación de domicilio
- [ ] GPS en tiempo real
- [ ] Confirmar entrega
- [ ] Registro de pago (efectivo)
- [ ] Sincronización con backend
- **Prioridad**: BAJA | **Esfuerzo**: XL

#### I2. App Cliente (React Native)
- [ ] Ver histórico de pedidos
- [ ] Puntos/fidelización
- [ ] Hacer reservas (opcional)
- [ ] Tracking de domicilios
- **Prioridad**: BAJA | **Esfuerzo**: XL

---

## 📊 RESUMEN DE ESFUERZOS Y TIMELINE

### Estimación por Fase

| Fase | Componentes | Esfuerzo Est. | Timeline |
|------|-------------|---------------|----------|
| **1** | 11 módulos (POS, KDS, Caja, Admin, Reportes básicos) | 4-6 semanas | Enero 25 - Marzo 1 |
| **2** | Recetas, Inventario, Compras | 3-4 semanas | Marzo 1 - Marzo 29 |
| **3** | Domicilios avanzados, E-factura, Analytics, Mobile | 2-3 semanas (core) + XL (mobile) | Abril - Mayo |

### Team Estimado (Fase 1)
- 1 Backend Lead (Node.js, DB)
- 1 Frontend Lead (React)
- 1 QA/Tester
- 1 DevOps/Infra
- **Total: 4 personas durante 6 semanas**

---

## 🎯 CRITERIOS DE ACEPTACIÓN (Definition of Done)

Cada funcionalidad está lista cuando:

1. **Código**: Escrito, comentado, sigue estándares del proyecto
2. **Testing**: Tests unitarios/integración pasen (70%+ coverage)
3. **Documentación**: README, API docs, guías de usuario
4. **Revisión**: Code review aprobado por lead
5. **QA**: Pruebas E2E exitosas, sin bugs críticos
6. **Deploy**: Funciona en ambiente de staging sin errores
7. **Monitoring**: Logs y métricas configuradas

---

## 📝 NOTAS FINALES

- **Iterativo**: Después de Fase 1, validar con usuarios reales antes de continuar
- **Feedback loop**: Ajustar backlog según necesidades que surjan
- **Escalabilidad**: Arquitectura preparada para crecer (multi-sede, múltiples impresoras)
- **Documentación**: Mantener actualizada conforme se desarrolla
- **Rollback plan**: Si algo falla en producción, tener plan B

---

## 📞 PRÓXIMOS PASOS

1. ✅ Revisar este backlog
2. ✅ Ajustar prioridades según negocio (si algo es MÁS crítico)
3. → Inicializar proyecto (setup repos, estructura, BD)
4. → Empezar Fase 1 - Sprint 1 (Infraestructura + Auth)
5. → Weekly standups para tracking de progreso

