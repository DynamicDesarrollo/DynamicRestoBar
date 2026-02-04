# 🚀 INICIO RÁPIDO IMPLEMENTACIÓN - FASE 1

## Estado Actual

✅ **Completado:**
- Migrations Knex (`database/migrations/001_initial_schema.js`)
- Seeds con datos de prueba (`database/seeds/001_initial_seed.js`)
- Autenticación Backend (Login email/PIN, JWT, refresh token)
- API Productos (CRUD, categorías, modificadores)
- Rutas y controladores configurados
- Socket.IO habilitado

⏳ **Por hacer hoy:**
- Setup local y ejecutar migraciones
- Pruebas de autenticación con Postman/cURL
- Empezar Frontend POS

---

## 1️⃣ SETUP DE BASE DE DATOS

### Opción A: Con Docker (Recomendado)

```bash
cd DynamicRestoBar

# Iniciar PostgreSQL en Docker
docker-compose up -d postgres

# Esperar 5 segundos a que inicie
sleep 5

# Ejecutar migraciones
cd backend
npm install  # Si no lo hiciste
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

# Ejecutar migraciones
cd backend
npm run migrate

# Cargar datos
npm run seed
```

---

## 2️⃣ INICIAR SERVIDOR BACKEND

```bash
cd backend
npm install  # Primera vez

# Desarrollo (con nodemon)
npm run dev

# O producción
npm start
```

**Verás:**
```
╔═════════════════════════════════════════════════════════╗
║  🍽️  DynamicRestoBar API v1.0.0-alpha                  ║
║  🚀  Servidor ejecutando en puerto 5000                ║
║  🌍  Ambiente: development                             ║
║  📚  API: http://localhost:5000/api                    ║
║  🏥  Health: http://localhost:5000/health              ║
║                                                         ║
║  ✅ Express + Socket.IO + PostgreSQL                   ║
║  ✅ JWT Authentication Ready                           ║
║  ✅ Database Connected                                 ║
│                                                         ║
╚═════════════════════════════════════════════════════════╝
```

---

## 3️⃣ PROBAR AUTENTICACIÓN

### Con cURL:

```bash
# 1. Login con email/contraseña
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dynamicrestobar.com",
    "contraseña": "1234"
  }'

# Respuesta esperada:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIs...",
#   "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
#   "usuario": {
#     "id": 1,
#     "nombre": "Admin Sistema",
#     "email": "admin@dynamicrestobar.com",
#     "rol": "Administrador",
#     "sedeId": 1
#   }
# }

# 2. Login con PIN (más rápido para tablet)
curl -X POST http://localhost:5000/api/v1/auth/login-pin \
  -H "Content-Type: application/json" \
  -d '{"pin": "5678"}'

# 3. Obtener usuario autenticado
TOKEN="<copiar_el_token_de_arriba>"
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Refrescar token
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<copiar_refreshToken>"}'
```

### Con Postman:

1. Crear colección: `DynamicRestoBar API`
2. Crear variable: `base_url` = `http://localhost:5000`
3. Crear variable: `token` = (dejar vacío, se llenará después)

**Request 1: Login**
```
POST {{base_url}}/api/v1/auth/login
Body (JSON):
{
  "email": "admin@dynamicrestobar.com",
  "contraseña": "1234"
}

Tests (copiar en pestaña Tests):
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.token);
}
```

**Request 2: Get Me**
```
GET {{base_url}}/api/v1/auth/me
Headers:
  Authorization: Bearer {{token}}
```

---

## 4️⃣ PROBAR API PRODUCTOS

### Listar categorías:
```bash
curl -X GET "http://localhost:5000/api/v1/productos/categorias?sedeId=1"
```

### Listar productos:
```bash
curl -X GET "http://localhost:5000/api/v1/productos?sedeId=1"
```

### Obtener producto detalle:
```bash
curl -X GET "http://localhost:5000/api/v1/productos/4"
```

### Listar combos:
```bash
curl -X GET "http://localhost:5000/api/v1/productos/combos/listar?sedeId=1"
```

---

## 5️⃣ CREDENCIALES DE PRUEBA

```
Email Login                    PIN Login
═════════════════════════════════════════
admin@dynamicrestobar.com     1111  → Admin
juan@dynamicrestobar.com      5678  → Mesero
cocina@dynamicrestobar.com    9999  → Cocina
bar@dynamicrestobar.com       8888  → Bar
caja@dynamicrestobar.com      7777  → Caja
repartidor@dynamicrestobar.com 6666 → Repartidor
gerente@dynamicrestobar.com   4444  → Gerente

Contraseña para todos: 1234
```

---

## 6️⃣ ESTRUCTURA DE PROYECTO ACTUAL

```
backend/
├── src/
│   ├── controllers/
│   │   ├── AuthController.js         ✅ Login, refresh, cambiar contraseña
│   │   └── ProductosController.js    ✅ CRUD productos
│   ├── middleware/
│   │   └── verificarToken.js         ✅ JWT validation
│   ├── routes/
│   │   ├── authRoutes.js             ✅ POST /auth/login, /auth/login-pin
│   │   └── productosRoutes.js        ✅ GET /productos, /categorias
│   ├── config/
│   │   ├── database.js               ✅ Knex connection
│   │   └── knexfile.js               ✅ Migrations config
│   └── server.js                     ✅ Express + Socket.IO
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.js     ✅ 40+ tablas
│   └── seeds/
│       └── 001_initial_seed.js       ✅ Datos iniciales
├── .env.example
├── Dockerfile
└── package.json

database/
├── schema.sql                 ✅ Schema completo (referencia)
├── migrations/               ✅ Knex migrations
├── seeds/                    ✅ Seed data
└── README.md
```

---

## 7️⃣ PRÓXIMOS PASOS ESTA SEMANA

### ✅ Completados Hoy:
1. Migrations de BD
2. Seeds de datos
3. Autenticación (email + PIN)
4. API Productos

### ⏳ Mañana/Pasado:
1. **API Órdenes** (crear, actualizar, listar)
2. **API Comandas** (generar, actualizar estado)
3. **Frontend POS** (Login, MesasMap, Carrito)
4. **KDS Display** (ComandaList realtime)

### 📅 Esta Semana:
1. Flujo completo POS → Cocina → Cobro
2. Tests e2e
3. Deploy staging

---

## 8️⃣ SOLUCIÓN DE PROBLEMAS

### Error: "Migraciones no se ejecutaron"
```bash
# Ver migraciones pendientes
npm run migrate:list

# Forza reintentar
npm run migrate:rollback
npm run migrate
```

### Error: "No puedo conectar a PostgreSQL"
```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep postgres

# O si es local:
psql -l | grep dynamicrestobar

# Recriar BD desde cero
psql -c "DROP DATABASE IF EXISTS dynamicrestobar;"
psql -c "CREATE DATABASE dynamicrestobar;"
npm run migrate
```

### Error: "JWT secret no configurado"
```bash
# Copiar .env.example a .env
cp backend/.env.example backend/.env

# O usar defaults (está en el código si no está en .env)
```

---

## 9️⃣ DOCUMENTACIÓN RÁPIDA API

### Endpoints Actuales:

```
🔐 AUTENTICACIÓN
POST   /api/v1/auth/login              Email + contraseña
POST   /api/v1/auth/login-pin          PIN de tablet
POST   /api/v1/auth/refresh            Refrescar token
GET    /api/v1/auth/me                 Usuario actual
POST   /api/v1/auth/logout             Logout
POST   /api/v1/auth/change-password    Cambiar contraseña

🍽️  PRODUCTOS
GET    /api/v1/productos               Listar productos
GET    /api/v1/productos/categorias    Categorías
GET    /api/v1/productos/:id           Detalle producto
GET    /api/v1/productos/combos/listar Combos
GET    /api/v1/productos/modificadores/:id Opciones
POST   /api/v1/productos               Crear (ADMIN)
PUT    /api/v1/productos/:id           Editar (ADMIN)
DELETE /api/v1/productos/:id           Eliminar (ADMIN)

⏳ PRÓXIMOS (Semana que viene)
/api/v1/ordenes                        Toma de pedidos
/api/v1/comandas                       Línea de producción
/api/v1/caja                           Cobro y facturas
```

---

## 🔟 CONTACTO & HELP

Si hay problemas:
1. Revisar `backend/logs/` por errores
2. Ejecutar `npm run migrate:list` para ver estado BD
3. Probar salud: `curl http://localhost:5000/health`
4. Revisar EMPEZAR_AQUI.md para contexto más amplio

---

**⚡ Status: Sistema Backend ✅ Listo para Frontend ⏳**

Próximo: Empezar componentes React para POS Mesero

---

*Última actualización: 11 de Enero de 2026*
*DynamicRestoBar Team*
