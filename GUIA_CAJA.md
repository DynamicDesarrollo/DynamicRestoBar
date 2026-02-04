# 💳 SISTEMA DE CAJA - GUÍA DE USO

## Descripción General
Sistema completo de gestión de caja para DynamicRestoBar con control de:
- Apertura/cierre de caja
- Registro de pagos y abonos
- Procesamiento de devoluciones
- Validación de diferencias

---

## 🟢 ABRIR CAJA

### Ubicación
- URL: `http://localhost:3000/caja`

### Pasos
1. Haz clic en el botón **"🟢 Abrir Caja"**
2. Ingresa el **Saldo Inicial** (efectivo disponible)
3. Haz clic en **"✅ Abrir"**

### Resultado
- ✅ Caja abierta
- ✅ Se muestra estado con saldo inicial
- ✅ Se registra movimiento en historial

---

## 💰 REGISTRAR PAGOS

### Pasos
1. En la sección **"📋 Órdenes Pendientes de Pago"**, selecciona una orden
2. Haz clic en **"Pagar"**
3. Completa los datos:
   - **Método de Pago**: Selecciona (Efectivo, Tarjeta, etc.)
   - **Monto a Pagar**: Total o monto parcial
   - **Referencia**: (Opcional) Número de tarjeta o transacción
   - **Es abono**: ✓ si es pago parcial

4. Haz clic en **"💰 Registrar Pago"**

### Comportamiento
- **Pago Completo**: Orden se marca como "pagada", mesa se libera
- **Abono (Pago Parcial)**: Orden mantiene saldo pendiente, se puede pagar más después

### Validaciones
- ❌ Monto no puede superar el total (sin marcar "Es abono")
- ❌ Campos requeridos: orden, monto, método de pago

---

## 🔄 PROCESAR DEVOLUCIONES

### Pasos
1. En la sección **"📋 Órdenes Pendientes de Pago"**, selecciona una orden
2. Haz clic en **"Devolver"**
3. Completa:
   - **Motivo de la Devolución**: Ej: "Orden cancelada por cliente"
   - **Monto a Devolver**: Total o parcial
4. Haz clic en **"🔄 Procesar Devolución"**

### Resultado
- ✅ Orden se anula
- ✅ Dinero se registra como egreso en caja
- ✅ Mesa se libera

---

## 🔴 CERRAR CAJA

### Pasos
1. Haz clic en **"🔴 Cerrar Caja"**
2. Se muestra resumen:
   - Saldo Inicial
   - Total Vendido
   - Devoluciones
   - **Total Esperado** (saldo inicial + ventas - devoluciones)

3. Cuenta el efectivo físico
4. Ingresa **Saldo Final** (lo que contaste)
5. (Opcional) Agrega observaciones si hay diferencias
6. Haz clic en **"🔴 Cerrar Caja"**

### Ejemplo
```
Saldo Inicial:        $100,000
Total Vendido:        $250,000
Devoluciones:        -$50,000
Total Esperado:       $300,000

Saldo Final (contado):  $300,500

Diferencia: +$500 (exceso)
```

---

## 📊 ESTADO DE CAJA EN TIEMPO REAL

Cuando la caja está abierta, se muestra automáticamente:

| Métrica | Descripción |
|---------|------------|
| **Saldo Inicial** | Dinero inicial en caja |
| **Ingresos** | Total de pagos registrados |
| **Egresos** | Total de devoluciones |
| **Total en Caja** | Saldo inicial + Ingresos - Egresos |

---

## 🏦 MÉTODOS DE PAGO DISPONIBLES

1. **Efectivo** - No requiere referencia
2. **Tarjeta Débito** - Requiere número referencia
3. **Tarjeta Crédito** - Requiere número referencia
4. **Transferencia** - Requiere número de comprobante
5. **Cheque** - Requiere número de cheque

---

## 📋 BASES DE DATOS AFECTADAS

### Tablas principales
- `aperturas_caja` - Control de apertura/cierre
- `caja_movimientos` - Historial detallado
- `cierres_caja` - Registros de cierre
- `facturas` - Facturas de órdenes
- `pago_facturas` - Detalles de pagos

---

## 🔌 API ENDPOINTS

### Caja
```
POST   /caja/abrir                  - Abrir caja
GET    /caja/apertura-actual        - Estado actual
POST   /caja/pago                   - Registrar pago
POST   /caja/devolucion             - Procesar devolución
POST   /caja/cerrar                 - Cerrar caja
GET    /caja/metodos-pago           - Métodos disponibles
```

### Órdenes
```
GET    /ordenes/estado/abierta      - Órdenes pendientes de pago
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Solo una caja abierta por usuario** - No puedes abrir 2 cajas simultáneamente
2. **Abonos vs Pagos Completos** - Marca "Es abono" si no pagará el total
3. **Devoluciones** - La orden se anula y no se puede pagar después
4. **Diferencias** - Registra observaciones al cerrar si hay discrepancias
5. **Cierre de turno** - Siempre cierra la caja al final del turno

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "No hay caja abierta"
✅ Solución: Haz clic en "🟢 Abrir Caja" primero

### Error: "Monto supera el saldo pendiente"
✅ Solución: Marca "Es abono" si es pago parcial

### Órdenes no aparecen
✅ Solución: Las órdenes deben estar en estado "abierta" o "lista"

### Diferencia al cerrar caja
✅ Solución: Verifica el conteo físico y registra la diferencia

---

**Fecha**: 11 de Enero de 2026  
**Versión**: 1.0  
**Estado**: ✅ Completo y funcional
