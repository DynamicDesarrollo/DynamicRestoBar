# 🗺️ MAPA DE PANTALLAS Y NAVEGACIÓN
## DynamicRestoBar - Sistema Multi-Sede

---

## 1. ESTRUCTURA GENERAL (3 Aplicaciones)

```
┌─────────────────────────────────────────────────────────────────┐
│                    DYNAMICRESTOBAR                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │   POS MESEROS        │  │  PRODUCCIÓN KDS  │  │ CAJA/ADMIN │ │
│  │   (Tablet/Celular)   │  │  (PC/TV Screen)  │  │    (PC)    │ │
│  │                      │  │                  │  │            │ │
│  │  • Mesas             │  │ • Cocina         │  │ • Cobros   │ │
│  │  • Pedidos           │  │ • Bar            │  │ • Caja     │ │
│  │  • Adiciones         │  │ • Estaciones     │  │ • Admin    │ │
│  │  • Precuenta         │  │ • Tiempos        │  │ • Reportes │ │
│  │                      │  │                  │  │            │ │
│  └──────────────────────┘  └──────────────────┘  └────────────┘ │
│                                                                   │
│                 ↓ WebSockets (Realtime) ↓                        │
│                       BACKEND API                                │
│                      (Node.js Express)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. POS MESEROS (Tablet/Celular)

### Pantalla: LOGIN
```
┌──────────────────────────────────┐
│     DYNAMICRESTOBAR              │
│                                  │
│   [PIN de Mesero: ___]          │
│                                  │
│        [INICIAR SESIÓN]         │
│                                  │
│        Versión: 1.0.0           │
└──────────────────────────────────┘

Acciones:
- Seleccionar sede (si es multi-sede)
- Ingresar PIN de 4 dígitos (mesero)
- Validar con backend
```

### Pantalla: MAPA DE MESAS
```
┌──────────────────────────────────────┐
│ < BACK    MESERO: Juan               │
│ ────────────────────────────────────│
│ [Sede: Centro ▼] [Zona: Salón ▼]   │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │  1  │ │  2  │ │  3  │   LIBRE  │
│  │ ○○○ │ │ ███ │ │ ○○○ │          │
│  └─────┘ └─────┘ └─────┘          │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │  4  │ │  5  │ │  6  │  OCUPADA │
│  │ ███ │ │ ███ │ │ ○○○ │          │
│  └─────┘ └─────┘ └─────┘          │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │  7  │ │  8  │ │  9  │PRECUENTA │
│  │ ███ │ │ ○○○ │ │ ⚠⚠⚠ │          │
│  └─────┘ └─────┘ └─────┘          │
│                                     │
│ [+ NUEVA MESA]  [◉ BARRA]          │
└──────────────────────────────────────┘

Estados y Colores:
- LIBRE (Blanco/Gris): Tabla disponible
- OCUPADA (Azul): Mesa abierta con pedido
- PRECUENTA (Naranja): Esperando pago
- PAGADA (Verde): Cerrada
- BLOQUEADA (Rojo): No disponible

Acciones por Mesa:
- Tap en libre → Abrir mesa (seleccionar mesero)
- Tap en ocupada → Agregar pedido / Ver estado / Precuenta
- Tap en precuenta → Ir a caja para cobro
- Long-press → Menú: Info, historial, notas
```

### Pantalla: ABRIR MESA
```
┌──────────────────────────────────┐
│ < ATRÁS   ABRIR MESA 3            │
│                                   │
│ Mesa: 3                           │
│ Zona: Salón                       │
│                                   │
│ Mesero asignado:                 │
│ ┌──────────────────────────────┐ │
│ │ Juan Pérez         [✓ Yo]   │ │
│ │ Carlos López       [ ]      │ │
│ │ María González     [ ]      │ │
│ └──────────────────────────────┘ │
│                                   │
│ Cantidad de comensales:           │
│ [+] 4 [-]                         │
│                                   │
│ [CONFIRMAR APERTURA]             │
│                                   │
└──────────────────────────────────┘
```

### Pantalla: PEDIDO (Categorías + Buscador)
```
┌────────────────────────────────────────────┐
│ < ATRÁS  Mesa 3 - Juan Pérez               │
│────────────────────────────────────────────│
│ [🔍 Buscar producto...                    │
│                                            │
│ [Entradas] [Fuertes] [Bebidas] [Postres] │
│                                            │
│ ┌─────────────────────────────────────┐  │
│ │ Alitas BBQ                     9.90 │  │
│ │ (8 piezas)                     [+ ] │  │
│ ├─────────────────────────────────────┤  │
│ │ Calamares a la romana         12.50 │  │
│ │ (con salsa tártara)            [+ ] │  │
│ ├─────────────────────────────────────┤  │
│ │ Tabla de quesos               15.00 │  │
│ │ (Para 2 pers)                  [+ ] │  │
│ ├─────────────────────────────────────┤  │
│ │ Tabla Mixta (Promo)           28.00 │  │
│ │ (Alitas + calamares + queso)   [+ ] │  │
│ └─────────────────────────────────────┘  │
│                                            │
│ [Scroll...]                                │
│                                            │
│ Subtotal: $47.40                          │
│ [CARRITO (3 items)] [PRECUENTA]           │
└────────────────────────────────────────────┘
```

### Pantalla: MODAL - ADICIONES Y NOTAS
```
┌─────────────────────────────────────┐
│ Alitas BBQ (9.90)        [×]        │
├─────────────────────────────────────┤
│                                      │
│ Cantidad: [+] 2 [-]                 │
│                                      │
│ Adiciones (con costo):              │
│ ☐ +Queso derretido          +2.00   │
│ ☐ +Doble salsa              +1.00   │
│ ☑ +Crema agria              +1.50   │
│                                      │
│ Opciones (sin costo):              │
│ ○ Picante        ○ Medio ◉ Suave   │
│                                      │
│ Notas especiales:                  │
│ ┌──────────────────────────────────┐│
│ │ Sin cebolla, bien caliente       ││
│ └──────────────────────────────────┘│
│                                      │
│ Total item: $27.80 (2 unid)        │
│                                      │
│ [AGREGAR AL CARRITO]  [CANCELAR]   │
└─────────────────────────────────────┘
```

### Pantalla: CARRITO DE MESA
```
┌──────────────────────────────────────┐
│ < ATRÁS  Mesa 3 - Carrito             │
│──────────────────────────────────────│
│                                       │
│ 1x Alitas BBQ                 9.90   │
│   +Crema agria               +1.50   │
│   Notas: sin cebolla          (edit) │
│                                       │
│ 2x Calamares a la romana     25.00   │
│   Notas: bien crocante        (edit) │
│                                       │
│ 1x Coca-Cola 2L               5.00   │
│                                       │
│ ────────────────────────────────────│
│ Subtotal:                    40.40   │
│ Impuesto (IVA 19%):           7.68   │
│ ────────────────────────────────────│
│ TOTAL:                       48.08   │
│                                       │
│ ☑ Enviar ahora a cocina/bar          │
│ ☐ Guardar solo (sin enviar)          │
│                                       │
│ [← SEGUIR AGREGANDO] [ENVIAR →]     │
│                                       │
│ Estado: Pendiente de envío          │
└──────────────────────────────────────┘
```

### Pantalla: ESTADO DEL PEDIDO
```
┌─────────────────────────────────────┐
│ < ATRÁS  Mesa 3 - Estado Pedido      │
│─────────────────────────────────────│
│                                      │
│ Envío #1 (hace 8 min)               │
│ ┌────────────────────────────────┐  │
│ │ Alitas BBQ               LISTO  │  │
│ │ Calamares               EN PREP │  │
│ │ Coca-Cola                LISTO  │  │
│ │                                  │  │
│ │ Tiempo promedio: 12 min         │  │
│ └────────────────────────────────┘  │
│                                      │
│ Envío #2 (hace 2 min)               │
│ ┌────────────────────────────────┐  │
│ │ Cerveza Premium         PENDIENTE │ │
│ │ (En cola...)                     │  │
│ └────────────────────────────────┘  │
│                                      │
│ [◎ LLAMAR ATENCIÓN]  [IMPRIMIR]    │
│                                      │
└─────────────────────────────────────┘
```

### Pantalla: PRECUENTA
```
┌──────────────────────────────────────────┐
│ < ATRÁS  Mesa 3 - PRECUENTA              │
│──────────────────────────────────────────│
│                                           │
│ Mesa: 3 | Mesero: Juan | Comensales: 4   │
│ ────────────────────────────────────────│
│                                           │
│ RESUMEN:                                  │
│ Alitas BBQ                      11.40     │
│ Calamares x2                    25.00     │
│ Coca-Cola 2L                     5.00     │
│ Cerveza Premium                 10.00     │
│ ────────────────────────────────────────│
│ Subtotal:                       51.40     │
│ IVA (19%):                       9.77     │
│ ────────────────────────────────────────│
│ TOTAL:                          61.17     │
│                                           │
│ Descuento (si aplica):                    │
│ ┌──────────────────┐                     │
│ │ % o $ :  [_____] │ [APLICAR]           │
│ └──────────────────┘                     │
│                                           │
│ [⊕ AGREGAR ITEM] [IMPRIMIR PRECUENTA]  │
│                                           │
│ [← VOLVER A MESA] [IR A PAGO →]         │
│                                           │
└──────────────────────────────────────────┘
```

---

## 3. PRODUCCIÓN KDS (Cocina y Bar)

### Pantalla: KDS COCINA (PC/TV)
```
┌──────────────────────────────────────────────────────┐
│  COCINA        🔔 Alertas: 3 pedidos retrasados       │
├──────────────────────────────────────────────────────┤
│                                                        │
│ Filtros: [Pendiente ✓] [Prep ✓] [Listo ✓] [Entreg.]│
│ Sede: Centro | Vista: Cronológica | Urgencia        │
│                                                        │
│ ┌───────────────────┐  ┌──────────────────┐         │
│ │ COMANDA #1501     │  │ COMANDA #1502    │         │
│ │ Mesa 3 (Salón)    │  │ Mesa 5 (Terraza) │         │
│ │ Mesero: Juan      │  │ Mesero: María    │         │
│ │ Hace 5 min        │  │ Hace 3 min       │         │
│ │                   │  │                  │         │
│ │ ✎ Alitas BBQ      │  │ ◐ Filete a lo    │         │
│ │   (sin cebolla)   │  │   pobre (3/4)    │         │
│ │                   │  │   +ensalada      │         │
│ │ ◐ Calamares      │  │   +papas crema   │         │
│ │   (crocante)      │  │                  │         │
│ │                   │  │ Total: 2 items   │         │
│ │ Total: 2 items    │  │                  │         │
│ │                   │  │ [PREPARANDO]     │         │
│ │ [PENDIENTE]       │  │  (tiempo: 8min)  │         │
│ │  Tiempo: 5 min    │  │ [✓] [Reimprime] │         │
│ │                   │  │                  │         │
│ │ [EN PREP] [✓][↻] │  │ [LISTO] [Reimprime]       │
│ └───────────────────┘  └──────────────────┘         │
│                                                        │
│ ┌───────────────────┐  ┌──────────────────┐         │
│ │ COMANDA #1503     │  │ COMANDA #1504    │         │
│ │ Domicilio: Cll 5  │  │ Para llevar      │         │
│ │ Mesero: Carlos    │  │ Mesero: Ana      │         │
│ │ Hace 1 min        │  │ Hace 45 seg      │         │
│ │                   │  │                  │         │
│ │ ◑ Hamburguesa     │  │ ✎ Picada mixta   │         │
│ │   (mediana)       │  │   (sin picante)  │         │
│ │   +Tocino         │  │   +salsas aparte │         │
│ │                   │  │                  │         │
│ │ [PENDIENTE]       │  │ [PENDIENTE]      │         │
│ │  Tiempo: 1 min    │  │  Tiempo: 45 seg  │         │
│ │                   │  │                  │         │
│ │ [EN PREP] [✓]     │  │ [EN PREP] [✓]    │         │
│ └───────────────────┘  └──────────────────┘         │
│                                                        │
│ Historial del día: [Ver más]                         │
└──────────────────────────────────────────────────────┘

Estados de Items:
✎ Pendiente
◐ En preparación
✓ Listo
◉ Entregado

Acciones:
- [EN PREP]: Cambiar de Pendiente a En Preparación
- [✓]: Marcar como Listo
- [Reimprime]: Reimpresión con marca "COPIA"
- Long-press: Ver detalles, cancelar comanda
```

### Pantalla: KDS BAR (PC/TV)
```
┌──────────────────────────────────────────────────────┐
│  BAR            🔔 Alertas: 1 pedido urgente         │
├──────────────────────────────────────────────────────┤
│                                                        │
│ Filtros: [Pendiente ✓] [Prep ✓] [Listo ✓]           │
│ Sede: Centro | Vista: Prioridad                      │
│                                                        │
│ ┌───────────────────┐  ┌──────────────────┐         │
│ │ COMANDA #1501-B   │  │ COMANDA #1502-B  │         │
│ │ Mesa 3 (Salón)    │  │ Mesa 5 (Terraza) │         │
│ │ Mesero: Juan      │  │ Mesero: María    │         │
│ │ URGENTE - Hace 8m │  │ Hace 4 min       │         │
│ │ (⚠ RETRASADO)     │  │                  │         │
│ │                   │  │ ◐ Cerveza Craft  │         │
│ │ ✎ Coca-Cola 2L    │  │   +Limón         │         │
│ │ ✎ Cerveza Pilsen  │  │                  │         │
│ │                   │  │ Total: 1 item    │         │
│ │ Total: 2 items    │  │                  │         │
│ │ [EN PREP] [✓]     │  │ [PENDIENTE]      │         │
│ │                   │  │  Tiempo: 4 min   │         │
│ │                   │  │                  │         │
│ │                   │  │ [EN PREP] [✓]    │         │
│ └───────────────────┘  └──────────────────┘         │
│                                                        │
│ ┌───────────────────┐                                 │
│ │ COMANDA #1503-B   │                                 │
│ │ Domicilio: Cll 5  │                                 │
│ │ Mesero: Carlos    │                                 │
│ │ Hace 2 min        │                                 │
│ │                   │                                 │
│ │ ◑ Ron Premium     │                                 │
│ │   +hielo          │                                 │
│ │ ◑ Limoncello      │                                 │
│ │   (shot frío)     │                                 │
│ │                   │                                 │
│ │ Total: 2 items    │                                 │
│ │                   │                                 │
│ │ [EN PREP] [✓]     │                                 │
│ └───────────────────┘                                 │
│                                                        │
│ TOP Bebidas hoy: Cerveza (45), Ron (32), Vino (28)   │
└──────────────────────────────────────────────────────┘
```

---

## 4. CAJA Y COBRO (PC)

### Pantalla: CAJA - MESAS PENDIENTES
```
┌────────────────────────────────────────────────────────┐
│  CAJA            Sesión: Maria González | 08:30-17:45  │
├────────────────────────────────────────────────────────┤
│                                                          │
│ Filtros: [Precuenta ✓] [Efectivo] [Tarjeta] [Todos]   │
│ Buscar mesa o mesero: [________]                       │
│                                                          │
│ MESAS EN PRECUENTA                                      │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Mesa 2 | Juan | 4 pers | $48.90                  │   │
│ │ Tiempo esperando: 2 min                          │   │
│ │ [COBRAR]                                         │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ Mesa 6 | Carlos | 3 pers | $125.50               │   │
│ │ Tiempo esperando: 5 min                          │   │
│ │ [COBRAR]                                         │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ Barra | Ana | 2 pers | $32.00                    │   │
│ │ Tiempo esperando: 1 min                          │   │
│ │ [COBRAR]                                         │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ Mesa 8 | María | 6 pers | $234.80                │   │
│ │ Tiempo esperando: 12 min (⚠ ALERTA)              │   │
│ │ [COBRAR]                                         │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ Domicilio #2456 | Carlos | $89.50                │   │
│ │ Estado: Listo para despacho                      │   │
│ │ [COBRAR]                                         │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ RESUMEN DE HOY (hasta ahora):                          │
│ Mesas pagadas: 12 | Domicilios: 5 | Total: $4,234.50  │
│                                                          │
│ [CIERRE DE CAJA]  [REPORTES]  [CONFIGURACIÓN]         │
└────────────────────────────────────────────────────────┘
```

### Pantalla: COBRO
```
┌──────────────────────────────────────────────────────┐
│ < ATRÁS    COBRO - Mesa 8                             │
├──────────────────────────────────────────────────────┤
│                                                        │
│ Mesa: 8 | Mesero: María | Comensales: 6               │
│ ───────────────────────────────────────────────────│
│                                                        │
│ DETALLES DEL PEDIDO:                                  │
│ ┌────────────────────────────────────────────────┐   │
│ │ Filete a lo pobre         2 x  $32.00 =  $64.00 │   │
│ │   + Ensalada                                     │   │
│ │                                                  │   │
│ │ Pargo a la sal             1 x  $28.00 = $28.00 │   │
│ │                                                  │   │
│ │ Cerveza (botella)          3 x   $8.00 = $24.00 │   │
│ │                                                  │   │
│ │ Vino tinto (copa)          4 x   $7.00 = $28.00 │   │
│ │                                                  │   │
│ │ ────────────────────────────────────────────── │   │
│ │ Subtotal:                              $144.00   │   │
│ │ Impuesto (19%):                        $27.36   │   │
│ │ ────────────────────────────────────────────── │   │
│ │ TOTAL A PAGAR:                        $171.36   │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ MÉTODO DE PAGO:                                       │
│ ☑ Efectivo  ☐ Tarjeta Débito  ☐ Tarjeta Crédito      │
│ ☐ Transferencia  ☐ Otro                              │
│                                                        │
│ APLICAR DESCUENTO O CORTESÍA:                         │
│ ┌────────────────────────────────────────────────┐   │
│ │ Concepto: [Descuento vol]  Monto: [$___] [%]  │   │
│ │ Motivo: [_____________________]                │   │
│ │ Autorización: [_____________________]          │   │
│ │ [APLICAR]                                       │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ DINERO RECIBIDO:  [$________]                         │
│ CAMBIO:           [$________]                         │
│                                                        │
│ ☑ Imprimir factura                                    │
│ ☐ Factura electrónica (próximo: v2.0)                │
│                                                        │
│ [CANCELAR] [PROCESAR PAGO]                           │
└──────────────────────────────────────────────────────┘
```

### Pantalla: CIERRE DE CAJA
```
┌──────────────────────────────────────────────────────┐
│  CIERRE DE CAJA                                        │
├──────────────────────────────────────────────────────┤
│                                                        │
│ Sesión: Maria González                                │
│ Apertura: 08:30 | Cierre propuesto: 17:45             │
│ ────────────────────────────────────────────────────│
│                                                        │
│ VENTAS POR MÉTODO DE PAGO:                            │
│ Efectivo:                         $1,234.50  (28%)   │
│ Tarjeta Débito:                   $2,000.00  (47%)   │
│ Tarjeta Crédito:                   $950.50  (22%)    │
│ Transferencia:                     $200.00  (5%)    │
│ ────────────────────────────────────────────────────│
│ TOTAL FACTURADO:                  $4,384.50          │
│                                                        │
│ DESCUENTOS Y CORTESÍAS:           -$150.00           │
│ ANULACIONES:                      -$89.50            │
│                                                        │
│ VENTAS NETAS:                     $4,145.00          │
│                                                        │
│ ────────────────────────────────────────────────────│
│                                                        │
│ RECUENTO FÍSICO:                                      │
│ Efectivo en caja: [$________]                         │
│ Diferencia: [+/- $________]                           │
│ Observaciones: [_____________________]                │
│                                                        │
│ VENTAS POR CATEGORÍA:                                 │
│ Entrada:  $450.00  | Fuertes: $1,850.00              │
│ Bebidas: $1,200.00  | Postres: $300.00               │
│                                                        │
│ VENTAS POR MESERO:                                    │
│ Juan:     $1,050.00  | Carlos: $1,200.00  | María: $ │
│                                                        │
│ ────────────────────────────────────────────────────│
│                                                        │
│ [VISTA PREVIA] [GENERAR PDF] [CONFIRMAR CIERRE]     │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

## 5. ADMINISTRACIÓN (PC)

### Pantalla: HOME ADMIN
```
┌──────────────────────────────────────────────────────────┐
│ ADMINISTRACIÓN      Usuario: Admin | DynamicRestoBar      │
├──────────────────────────────────────────────────────────┤
│                                                            │
│ SELECCIONAR SEDE: [Centro ▼]  [Otra Sede]  [Todas]       │
│                                                            │
│ ╔════════════════════════════════════════════════════╗   │
│ ║  RESUMEN DEL DÍA (Centro) - 11/Ene/2026            ║   │
│ ╠════════════════════════════════════════════════════╣   │
│ ║ Órdenes completadas: 24  | Ingresos: $4,384.50     ║   │
│ ║ Mesas activas: 3         | Promedio/mesa: $182.69  ║   │
│ ║ Domicilios: 6            | Promedio dom: $78.33    ║   │
│ ╚════════════════════════════════════════════════════╝   │
│                                                            │
│ MENÚ DE OPCIONES:                                         │
│ ┌──────────────────────┐ ┌──────────────────────┐        │
│ │  📦 PRODUCTOS        │ │ 📋 PEDIDOS/VENTAS    │        │
│ │                      │ │                      │        │
│ │ • Platos             │ │ • Ver todas          │        │
│ │ • Bebidas            │ │ • Anulaciones        │        │
│ │ • Combos             │ │ • Por estación       │        │
│ │ • Modificadores      │ │ • Por mesero         │        │
│ │ • Recetas/insumos    │ │                      │        │
│ │ • Precios            │ │                      │        │
│ │                      │ │                      │        │
│ │ [ADMINISTRAR]        │ │ [VER]                │        │
│ └──────────────────────┘ └──────────────────────┘        │
│                                                            │
│ ┌──────────────────────┐ ┌──────────────────────┐        │
│ │ 📦 INVENTARIO        │ │ 🏪 COMPRAS           │        │
│ │                      │ │                      │        │
│ │ • Insumos (Kardex)   │ │ • Órdenes de Compra  │        │
│ │ • Stock actual       │ │ • Recepción          │        │
│ │ • Movimientos        │ │ • Proveedores        │        │
│ │ • Traslados          │ │ • Cuentas por pagar  │        │
│ │ • Alertas stock      │ │                      │        │
│ │                      │ │                      │        │
│ │ [VER]                │ │ [ADMINISTRAR]        │        │
│ └──────────────────────┘ └──────────────────────┘        │
│                                                            │
│ ┌──────────────────────┐ ┌──────────────────────┐        │
│ │ 👥 USUARIOS/ROLES    │ │ 🏢 SEDES             │        │
│ │                      │ │                      │        │
│ │ • Crear/editar       │ │ • Crear/editar       │        │
│ │ • Asignar roles      │ │ • Zonas/mesas        │        │
│ │ • Permisos           │ │ • Impresoras         │        │
│ │ • Auditoría          │ │ • Horarios           │        │
│ │                      │ │ • Costos             │        │
│ │ [ADMINISTRAR]        │ │ [ADMINISTRAR]        │        │
│ └──────────────────────┘ └──────────────────────┘        │
│                                                            │
│ ┌──────────────────────┐ ┌──────────────────────┐        │
│ │ 📊 REPORTES          │ │ ⚙️ CONFIGURACIÓN     │        │
│ │                      │ │                      │        │
│ │ • Ventas por período │ │ • Impuestos          │        │
│ │ • Top productos      │ │ • Servicios          │        │
│ │ • Meseros            │ │ • Categorías impuesto│        │
│ │ • Estaciones         │ │ • Márgenes           │        │
│ │ • Inventario         │ │ • Idioma/moneda      │        │
│ │ • Exportar (Excel)   │ │                      │        │
│ │ [VER]                │ │ [CONFIGURAR]         │        │
│ └──────────────────────┘ └──────────────────────┘        │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Pantalla: PRODUCTOS - Listado
```
┌──────────────────────────────────────────────────────────┐
│ < ATRÁS   PRODUCTOS                                       │
├──────────────────────────────────────────────────────────┤
│                                                            │
│ Filtros: [Activos ✓] [Inactivos] [Categoría ▼]           │
│ Buscar: [_________________] [BUSCAR]                     │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ PRODUCTO | PRECIO | CATEGORÍA | EST. | RECETA | ACT.│ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ Alitas BBQ        │ $9.90  │ Entrada │ Cocina │ Sí  │ │
│ │ Calamares a la R. │ $12.50 │ Entrada │ Cocina │ Sí  │ │
│ │ Filete a lo Pobre │ $32.00 │ Fuerte  │ Cocina │ Sí  │ │
│ │ Coca-Cola 2L      │ $5.00  │ Bebida  │ Bar    │ Sí  │ │
│ │ Cerveza Pilsen    │ $8.00  │ Bebida  │ Bar    │ Sí  │ │
│ │ Combo Ejecutivo   │ $28.00 │ Combo   │ Mixto  │ Sí  │ │
│ │ Flan Casero       │ $6.00  │ Postre  │ Cocina │ Sí  │ │
│ │ Milanesa Pollo    │ $18.50 │ Fuerte  │ Cocina │ No  │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ [+ NUEVO PRODUCTO]                                        │
│                                                            │
│ [EDITAR] [DUPLICAR] [INACTIVAR] [ELIMINAR]              │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Pantalla: CREAR/EDITAR PRODUCTO
```
┌──────────────────────────────────────────────────────────┐
│ < ATRÁS   NUEVO PRODUCTO                                  │
├──────────────────────────────────────────────────────────┤
│                                                            │
│ INFORMACIÓN BÁSICA                                        │
│ Nombre: [Filete a lo Pobre        ]                      │
│ Código: [FLP-001          ]                              │
│ Categoría: [Fuertes ▼]                                   │
│ Subcategoría: [Carnes ▼]                                │
│ Estación: [Cocina ▼]  ☐ Multi-estación                  │
│                                                            │
│ PRECIO Y COSTE                                            │
│ Precio venta: [$32.00    ]                               │
│ Costo promedio: [$14.50  ]                               │
│ Margen: 55%                                               │
│                                                            │
│ VARIANTES / TAMAÑOS (opcional)                            │
│ ┌──────────────────────────────────┐                    │
│ │ Pequeño  | $25.00 | Costo $11.00 │ [✓] [✗]           │
│ │ Mediano  | $32.00 | Costo $14.50 │ [✓] [✗]           │
│ │ Grande   | $38.00 | Costo $17.50 │ [✓] [✗]           │
│ └──────────────────────────────────┘                    │
│ [+ NUEVA VARIANTE]                                       │
│                                                            │
│ MODIFICADORES DISPONIBLES                                 │
│ ☑ Adiciones proteína  ☑ Punto cocción  ☑ Salsas         │
│ ☑ Acompañamientos     ☑ Sin ingrediente                 │
│                                                            │
│ RECETA (Insumos)                                          │
│ ☐ Sin receta (no se descuenta inventario)                │
│ ☑ Con receta:                                            │
│                                                            │
│ [Insumo] [Cantidad] [Unidad] [Costo] [↑↓] [✗]           │
│ Carne de res | 250 | gr | $12.00 | [✓] |                │
│ Huevo | 2 | und | $0.50 | [✓] |                         │
│ Cebolla | 50 | gr | $0.30 | [✓] |                       │
│ Tomate | 100 | gr | $0.40 | [✓] |                       │
│ Papas | 150 | gr | $0.80 | [✓] |                        │
│ [+ AGREGAR INSUMO]                                       │
│                                                            │
│ Total receta: $14.00                                     │
│                                                            │
│ IMAGEN / FOTOS                                            │
│ [Subir foto] [foto_filete.jpg] [✓]                      │
│                                                            │
│ ESTADO                                                    │
│ ☑ Activo  ☐ Inactivo  ☐ Fuera de stock (temporal)       │
│ ☑ Visible en POS                                         │
│                                                            │
│ DESCRIPCIÓN                                               │
│ [200 gr de carne, huevo, papas y                         │
│  ensalada fresca. Presentación del                        │
│  clásico chileno.            ]                           │
│                                                            │
│ [CANCELAR] [GUARDAR PRODUCTO]                            │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Pantalla: INVENTARIO / KARDEX
```
┌──────────────────────────────────────────────────────────┐
│ < ATRÁS   INVENTARIO (Sede: Centro)                       │
├──────────────────────────────────────────────────────────┤
│                                                            │
│ Filtros: [Todos ✓] [Bajo Stock ⚠] [Crítico ❌]           │
│ Buscar: [_________________]                              │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ INSUMO | STOCK | UNID. | MÍN. | MÁXIMO | COSTO UNI. │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ Carne de res │ 15.5 kg │ Bajo │ 10 kg │ $45.00     │ │
│ │ Pechuga Pollo│ 8.2 kg  │ CRÍTICO │ 10 kg │ $28.00 │ │
│ │ Queso Mozzar.│ 6.0 kg  │ Normal │ 5 kg │ $22.00    │ │
│ │ Coca-Cola    │ 45 und  │ Normal │ 30 und│ $2.50    │ │
│ │ Cerveza Pils │ 78 und  │ Normal │ 50 und│ $4.00    │ │
│ │ Huevos       │ 120 und │ Normal │ 100 u│ $0.25    │ │
│ │ Cebolla      │ 3.5 kg  │ Normal │ 3 kg │ $1.20    │ │
│ │ Aceite Oliva │ 2.8 lt  │ Bajo   │ 3 lt │ $35.00   │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ MOVIMIENTOS RECIENTES (Últimas 24h):                      │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ FECHA  │ HORA │ TIPO | INSUMO | QTD | USUARIO      │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ Hoy    │ 17:45│ Salida│ Carne │ 0.5 kg │ POS Ped.  │ │
│ │ Hoy    │ 17:30│ Salida│ Pollo │ 0.8 kg │ POS Ped.  │ │
│ │ Hoy    │ 10:15│ Entrada│ Coca │ 24 und │ Recepción │ │
│ │ Ayer   │ 08:00│ Ajuste│ Queso │ -0.2kg │ Merma     │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ [VER KARDEX COMPLETO]  [AJUSTE MANUAL]  [ENTRADA]       │
│ [GENERAR REPORTE]                                        │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## 6. NAVEGACIÓN GLOBAL (FLUJO ENTRE PANTALLAS)

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN INICIAL                            │
│                                                              │
│   ↓ (Credenciales válidas)                                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SELECCIONAR ROL / SEDE                  │  │
│  │                                                       │  │
│  │  ☐ Mesero (Tablet) → MAPA DE MESAS                  │  │
│  │  ☐ Producción (Cocina) → KDS COCINA                 │  │
│  │  ☐ Producción (Bar) → KDS BAR                       │  │
│  │  ☐ Caja → COBRO / CIERRES                           │  │
│  │  ☐ Admin → HOME ADMIN                               │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│                                                              │
│  ╔════════════════════════════════════════════════════╗    │
│  ║ FLUJO MESERO (Tablet)                              ║    │
│  ╠════════════════════════════════════════════════════╣    │
│  ║  LOGIN → MAPA MESAS → ABRIR MESA → PEDIDO →       ║    │
│  ║  ADICIONES → CARRITO → ENVIAR → ESTADO →          ║    │
│  ║  PRECUENTA → (Caja cobra) → MESA LIBRE            ║    │
│  ╚════════════════════════════════════════════════════╝    │
│                                                              │
│  ╔════════════════════════════════════════════════════╗    │
│  ║ FLUJO KDS (Cocina/Bar - PC)                        ║    │
│  ╠════════════════════════════════════════════════════╣    │
│  ║  LOGIN → KDS → RECIBE COMANDAS (WebSocket) →      ║    │
│  ║  CAMBIAR ESTADO → PREPARAR → MARCAR LISTO →       ║    │
│  ║  ENTREGADO → HISTORIAL                             ║    │
│  ╚════════════════════════════════════════════════════╝    │
│                                                              │
│  ╔════════════════════════════════════════════════════╗    │
│  ║ FLUJO CAJA (PC)                                    ║    │
│  ╠════════════════════════════════════════════════════╣    │
│  ║  LOGIN → LISTA MESAS PRECUENTA → COBRO →          ║    │
│  ║  FACTURA → CIERRE DE CAJA → REPORTES              ║    │
│  ╚════════════════════════════════════════════════════╝    │
│                                                              │
│  ╔════════════════════════════════════════════════════╗    │
│  ║ FLUJO ADMIN (PC)                                   ║    │
│  ╠════════════════════════════════════════════════════╣    │
│  ║  LOGIN → HOME ADMIN → (Cualquier módulo)          ║    │
│  ║  → PRODUCTOS / INVENTARIO / USUARIOS / REPORTES   ║    │
│  ╚════════════════════════════════════════════════════╝    │
│                                                              │
│  ╔════════════════════════════════════════════════════╗    │
│  ║ FLUJO DOMICILIO (Tablet/PC)                        ║    │
│  ╠════════════════════════════════════════════════════╣    │
│  ║  NEW PEDIDO DOMICILIO → DATOS CLIENTE →           ║    │
│  ║  SELECCIONAR ZONA → TOMAR ORDEN → ENVIAR →        ║    │
│  ║  KDS RECIBE → PREPARACIÓN → LISTO → DESPACHO →    ║    │
│  ║  REPARTIDOR ASIGNADO → EN RUTA → ENTREGADO →      ║    │
│  ║  COBRO (caja o repartidor)                         ║    │
│  ╚════════════════════════════════════════════════════╝    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. PANTALLAS COMPLEMENTARIAS

### Pantalla: DOMICILIO - NUEVO PEDIDO
```
┌──────────────────────────────────────────────────────┐
│ < ATRÁS   NUEVO PEDIDO DOMICILIO                     │
├──────────────────────────────────────────────────────┤
│                                                        │
│ DATOS DEL CLIENTE:                                    │
│ ┌────────────────────────────────────────────────┐   │
│ │ Cliente: [_____________________]               │   │
│ │ Teléfono: [_____________________]              │   │
│ │ Dirección: [_____________________]             │   │
│ │ Referencias: [_____________________]           │   │
│ │ Apt/Bloque: [_____________________]            │   │
│ │                                                 │   │
│ │ Zona de entrega: [Centro ▼]                    │   │
│ │ Costo domicilio: $5.00                         │   │
│ │ ☐ Cliente frecuente                            │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ TOMAR ORDEN:                                          │
│ [Categorías] [Buscador]                              │
│ (mismo que mesa)                                      │
│                                                        │
│ Carrito domicilio:                                    │
│ ...                                                   │
│                                                        │
│ Observaciones: [_____________________]               │
│                                                        │
│ [GUARDAR SIN ENVIAR] [ENVIAR A COCINA/BAR]          │
│                                                        │
└──────────────────────────────────────────────────────┘
```

### Pantalla: DOMICILIO - TRACKING
```
┌──────────────────────────────────────────────────────┐
│ DOMICILIO #2456                                       │
│ Cliente: Juan García | Tel: 555-123456                │
│ Dirección: Cll 5 #12-34, Apt 301                      │
│                                                        │
│ ESTADO: En ruta (Repartidor: Carlos López)           │
│ ┌────────────────────────────────────────────────┐   │
│ │ ✓ Recibido (10:15)                             │   │
│ │ ✓ En producción (10:20)                        │   │
│ │ ✓ Listo (10:35)                                │   │
│ │ ◐ En ruta (10:40) - hace 5 min                 │   │
│ │ ○ Entregado                                    │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Total: $89.50 | Costo domicilio: $5.00              │
│                                                        │
│ [CONTACTAR REPARTIDOR] [CAMBIAR ESTADO] [HISTORIAL]│
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

## RESUMEN: Navegación entre pantallas

| Módulo | Pantalla Inicial | Flujo Principal | Salida |
|--------|------------------|-----------------|--------|
| **Mesero** | Mapa de Mesas | Abrir → Pedir → Precuenta | Caja (flujo externo) |
| **Cocina** | KDS Cocina | Recibe comandas → Estado → Listo | (contínuo) |
| **Bar** | KDS Bar | Recibe comandas → Estado → Listo | (contínuo) |
| **Caja** | Mesas en Precuenta | Cobro → Factura → Cierre | Reportes |
| **Admin** | Home Admin | Menú principal → cualquier módulo | Reportes |

---

## NOTAS DE DISEÑO

1. **Responsividad**: POS Mesero en móvil/tablet (landscape 10-12"), KDS en PC/TV (landscape 22-24"), Caja/Admin en PC (1920x1080+)

2. **Colores indicadores**:
   - Verde: Listo/Éxito
   - Azul: En progreso
   - Naranja: Requiere atención
   - Rojo: Crítico/Error

3. **WebSockets en tiempo real**:
   - Mesero ve cambios de estado en VIVO
   - KDS recibe comandas automáticamente
   - Caja ve mesas nuevas en precuenta

4. **Impresión**:
   - Comanda: Térmica 80mm (cocina/bar)
   - Factura: 80mm o A4
   - Ticket domicilio: 80mm

5. **Navegación**: Siempre un botón "< ATRÁS" excepto en home de cada role.

