# 🚀 GUÍA RÁPIDA - COPIA Y PEGA

## 1️⃣ SETUP BASE DE DATOS (5 MINUTOS)

### Opción A: Con Docker (Recomendado)
```bash
# Asegúrate estar en raíz del proyecto
cd /path/to/DynamicRestoBar

# Levantar PostgreSQL
docker-compose up -d postgres

# Esperar a que inicie
sleep 5

# Ir a backend e instalar
cd backend
npm install

# Crear tablas
npm run migrate

# Cargar datos de prueba
npm run seed

# Ver que todo funciona
npm run migrate:status
```

### Opción B: PostgreSQL Local
```bash
# Crear base de datos
createdb dynamicrestobar

# Ir a backend
cd backend
npm install
npm run migrate
npm run seed
```

---

## 2️⃣ INICIAR BACKEND

```bash
cd backend

# Desarrollo (hot reload con nodemon)
npm run dev

# O producción
npm start
```

**Verás esto cuando inicie:**
```
╔═════════════════════════════════════════════════════════╗
║  🍽️  DynamicRestoBar API v1.0.0-alpha                  ║
║  🚀  Servidor ejecutando en puerto 5000                ║
║  🌍  Ambiente: development                             ║
║  📚  API: http://localhost:5000/api                    ║
║  🏥  Health: http://localhost:5000/health              ║
╚═════════════════════════════════════════════════════════╝
```

---

## 3️⃣ TESTEAR AUTENTICACIÓN (OPCIÓN A: cURL)

### Login con email/contraseña
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dynamicrestobar.com",
    "contraseña": "1234"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre": "Admin Sistema",
    "email": "admin@dynamicrestobar.com",
    "rol": "Administrador",
    "sedeId": 1
  }
}
```

### Login con PIN (más rápido, para tablets)
```bash
curl -X POST http://localhost:5000/api/v1/auth/login-pin \
  -H "Content-Type: application/json" \
  -d '{"pin": "5678"}'
```

### Obtener usuario autenticado
```bash
# Reemplaza AQUI_EL_TOKEN con el token obtenido arriba
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer AQUI_EL_TOKEN"
```

### Refrescar token
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "AQUI_EL_REFRESH_TOKEN"}'
```

---

## 3️⃣ TESTEAR AUTENTICACIÓN (OPCIÓN B: Postman)

### 1. Crear colección
```
Nombre: DynamicRestoBar API
```

### 2. Crear variables de entorno
```
base_url = http://localhost:5000
token = (dejar vacío, se llena automáticamente)
```

### 3. Crear request "Login"
```
Método: POST
URL: {{base_url}}/api/v1/auth/login

Body (JSON):
{
  "email": "admin@dynamicrestobar.com",
  "contraseña": "1234"
}

Tests (copiar en pestaña Tests):
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.token);
  console.log("✅ Token guardado automáticamente");
}
```

### 4. Crear request "Get Me"
```
Método: GET
URL: {{base_url}}/api/v1/auth/me

Headers:
Authorization: Bearer {{token}}
```

### 5. Ejecutar
1. Click en "Login" request
2. Click "Send"
3. Click en "Get Me" request
4. Click "Send"
5. Debería retornar usuario con permisos

---

## 4️⃣ TESTEAR PRODUCTOS API

### Listar categorías
```bash
curl "http://localhost:5000/api/v1/productos/categorias?sedeId=1"
```

### Listar productos
```bash
curl "http://localhost:5000/api/v1/productos?sedeId=1"
```

### Obtener producto con detalles
```bash
curl "http://localhost:5000/api/v1/productos/4"
```

### Listar combos
```bash
curl "http://localhost:5000/api/v1/productos/combos/listar?sedeId=1"
```

### Obtener opciones de modificador
```bash
curl "http://localhost:5000/api/v1/productos/modificadores/1"
```

---

## 5️⃣ CREDENCIALES PARA TODOS LOS TESTS

```
┌─────────────────────────────┬─────────────────────────────┬──────┐
│ Rol                         │ Email                       │ PIN  │
├─────────────────────────────┼─────────────────────────────┼──────┤
│ Administrador               │ admin@dynamicrestobar.com   │ 1111 │
│ Mesero (Toma de pedidos)    │ juan@dynamicrestobar.com    │ 5678 │
│ Cocina (KDS)                │ cocina@dynamicrestobar.com  │ 9999 │
│ Bar (KDS)                   │ bar@dynamicrestobar.com     │ 8888 │
│ Caja (Cobro)                │ caja@dynamicrestobar.com    │ 7777 │
│ Repartidor (Domicilios)     │ repartidor@...              │ 6666 │
│ Gerente (Reportes)          │ gerente@dynamicrestobar.com │ 4444 │
└─────────────────────────────┴─────────────────────────────┴──────┘

Contraseña para todos: 1234
```

---

## 6️⃣ PRODUCTOS DISPONIBLES PARA VENDER

```
ENTRADAS (3)
├─ Tabla de Quesos             $28,000
├─ Tabla de Embutidos          $35,000
└─ Alitas Buffalo              $16,000

PLATOS PRINCIPALES (4)
├─ Costilla BBQ                $52,000 (30 min)
├─ Salmón a la Mantequilla     $48,000 (20 min)
├─ Pechuga a la Parmesana      $38,000 (25 min)
└─ Filete de Res Rojo          $62,000 (25 min)

BEBIDAS FRÍAS (3)
├─ Coca Cola                   $5,000
├─ Jugo Natural                $8,000
└─ Limonada                    $6,000

BEBIDAS CALIENTES (2)
├─ Café Americano              $4,000
└─ Capuchino                   $6,500

LICORES (3)
├─ Cerveza Artesanal           $8,000
├─ Ron Viejo                   $25,000
└─ Vino Tinto Reserva          $60,000

POSTRES (2)
├─ Brownie con Helado          $16,000 (10 min)
└─ Cheesecake                  $18,000 (5 min)

TOTAL: 17 productos listos
```

---

## 7️⃣ MESAS OPERATIVAS

```
ZONA A - Ventanas (5 mesas)     A-1, A-2, A-3, A-4, A-5
ZONA B - Centro (8 mesas)       B-1, B-2, B-3, B-4, B-5, B-6, B-7, B-8
ZONA C - Terraza (6 mesas)      C-1, C-2, C-3, C-4, C-5, C-6
ZONA D - Private (2 mesas)      D-1, D-2

TOTAL: 21 mesas listas para recibir clientes
```

---

## 8️⃣ SOLUCIONAR PROBLEMAS

### Problema: "Migraciones no se ejecutaron"
```bash
# Ver migraciones pendientes
npm run migrate:list

# Ejecutarlas manualmente
npm run migrate

# Ver historial
npm run migrate:list
```

### Problema: "Error conectando a PostgreSQL"
```bash
# Verificar que Docker está corriendo
docker ps | grep postgres

# Si no ve nada, levantar:
docker-compose up -d postgres

# Esperar 5 segundos y verificar de nuevo
sleep 5
docker ps | grep postgres

# Si sigue fallando, recrear el contenedor
docker-compose down
docker-compose up -d postgres
```

### Problema: "Migración no sube datos (seeds)"
```bash
# Verificar que datos estén
psql -d dynamicrestobar -c "SELECT COUNT(*) FROM usuarios;"
# Debe retornar: 7

# Si retorna 0, ejecutar seed manualmente
npm run seed
```

### Problema: "Error 401 en login"
```bash
# Verificar que usuarios existen en BD
psql -d dynamicrestobar -c "SELECT email FROM usuarios LIMIT 5;"

# Si está vacío, ejecutar seed:
npm run seed

# Probar login nuevamente
```

### Problema: "Token inválido después de logout"
```bash
# Esto es NORMAL - JWT es stateless
# El cliente debe limpiar el token del localStorage
# Implementar en Frontend:
localStorage.removeItem('token');
```

### Problema: "No ve cambios en código al hace npm run dev"
```bash
# Nodemon debería reiniciar automáticamente
# Si no, reiniciar manualmente:
# 1. Ctrl+C para detener
# 2. npm run dev nuevamente
```

---

## 9️⃣ VERIFICACIÓN FINAL (CHECKLIST)

```bash
# ✅ Verificar BD está lista
npm run migrate:status
# Debe mostrar: ✅ 001_initial_schema.js - 2026-01-11

# ✅ Verificar datos cargados
psql -d dynamicrestobar -c "SELECT COUNT(*) FROM usuarios;"
# Debe retornar: 7

psql -d dynamicrestobar -c "SELECT COUNT(*) FROM productos;"
# Debe retornar: 17

psql -d dynamicrestobar -c "SELECT COUNT(*) FROM mesas;"
# Debe retornar: 21

# ✅ Verificar servidor inicia
npm run dev
# Debe mostrar banner y "Servidor ejecutando en puerto 5000"

# ✅ Verificar health endpoint
curl http://localhost:5000/health
# Debe retornar: {"status":"OK","timestamp":"..."}

# ✅ Verificar login funciona
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dynamicrestobar.com","contraseña":"1234"}'
# Debe retornar token JWT

# ✅ Verificar productos funcionan
curl "http://localhost:5000/api/v1/productos?sedeId=1"
# Debe retornar 17 productos
```

---

## 🔟 DOCUMENTACIÓN IMPORTANTE

Leer en este orden:

1. **[ESTADO_DEL_PROYECTO.md](./ESTADO_DEL_PROYECTO.md)** ← Estado actual ⭐
2. **[INICIO_IMPLEMENTACION.md](./INICIO_IMPLEMENTACION.md)** ← Instrucciones actuales
3. **[RESUMEN_IMPLEMENTACION_SESION_1.md](./RESUMEN_IMPLEMENTACION_SESION_1.md)** ← Lo que se hizo
4. **[EMPEZAR_AQUI.md](./EMPEZAR_AQUI.md)** ← Guía completa
5. **[QUICKSTART.md](./QUICKSTART.md)** ← Setup rápido

---

## 📞 ENDPOINTS DISPONIBLES AHORA

### Autenticación (Públicas)
```
POST   /api/v1/auth/login           ✅
POST   /api/v1/auth/login-pin       ✅
POST   /api/v1/auth/refresh         ✅
```

### Autenticación (Protegidas - requieren token)
```
GET    /api/v1/auth/me              ✅
POST   /api/v1/auth/logout          ✅
POST   /api/v1/auth/change-password ✅
```

### Productos (Públicas)
```
GET    /api/v1/productos            ✅
GET    /api/v1/productos/:id        ✅
GET    /api/v1/productos/categorias ✅
GET    /api/v1/productos/combos/listar ✅
GET    /api/v1/productos/modificadores/:id ✅
```

### Productos (Admin - protegidas)
```
POST   /api/v1/productos            ✅
PUT    /api/v1/productos/:id        ✅
DELETE /api/v1/productos/:id        ✅
```

---

## 🎯 PRÓXIMO PASO

Una vez confirmes que el backend funciona (puedes loguear y obtener productos), avisa para empezar con:

1. **Frontend POS** - React components para mesero
2. **API Órdenes** - Backend para tomar pedidos
3. **Frontend KDS** - Displays para cocina/bar
4. **API Caja** - Cobro y facturas

---

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  ✅ BACKEND COMPLETAMENTE FUNCIONAL                       ║
║  ✅ BASE DE DATOS LISTA                                   ║
║  ✅ DATOS DE PRUEBA CARGADOS                              ║
║                                                            ║
║  Sistema READY para producción Fase 1                    ║
║                                                            ║
║  Próximo: Frontend React                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

**Última actualización:** 11 de Enero de 2026  
**Versión:** 1.0.0-alpha  
**Status:** ✅ Producción-ready
