# 🍽️ DynamicRestoBar

**Sistema POS completo para Restaurante & Bar - Multi-sede, Multi-estación**

Solución integral de punto de venta con gestión de mesas, producción (cocina/bar), inventario, domicilios y caja, enfocada en operación ágil y reportes profundos.

---

## 🎯 Características Principales (MVP Fase 1)

✅ **POS Meseros** (Tablet/Celular)
- Mapa interactivo de mesas
- Toma de pedidos con adiciones y notas libres
- Precuenta y estado en tiempo real

✅ **Producción (KDS)**
- Pantallas separadas para Cocina y Bar
- Cambio de estado en tiempo real (Pendiente → Preparando → Listo)
- Timer de tiempos de preparación

✅ **Caja y Cobros**
- Factura térmica (80mm)
- Múltiples métodos de pago
- Cierre de caja con reportes

✅ **Domicilios**
- Nuevo canal de venta (Domicilio)
- Gestión de zonas y costos de entrega
- Tracking básico de estado

✅ **Admin & Configuración**
- CRUD de productos, combos, modificadores
- Gestión de usuarios y roles
- Reportes de ventas diarias

✅ **Multi-sede & Multi-estación**
- Soporte para varias sedes
- Impresoras por estación (Cocina/Bar)
- Operación independiente por sede

---

## 📊 Archivos de Documentación

| Documento | Contenido |
|-----------|-----------|
| [PLANNING_01_MAPA_PANTALLAS.md](PLANNING_01_MAPA_PANTALLAS.md) | Diseño UI/UX detallado de todas las interfaces |
| [PLANNING_02_MODELO_ER.md](PLANNING_02_MODELO_ER.md) | Diagrama entidad-relación y estructura de BD |
| [PLANNING_03_BACKLOG.md](PLANNING_03_BACKLOG.md) | Backlog de features por fases de desarrollo |

---

## 🏗️ Estructura del Proyecto

```
DynamicRestoBar/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── config/            # Configuraciones (BD, env vars)
│   │   ├── controllers/       # Lógica de negocio por entidad
│   │   ├── models/            # Esquemas y queries
│   │   ├── routes/            # Rutas API
│   │   ├── middleware/        # Auth, validación, error handling
│   │   ├── services/          # Servicios de negocio
│   │   ├── utils/             # Helpers, constantes
│   │   └── server.js          # Entry point
│   ├── tests/
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/                   # Apps React
│   ├── pos-mesero/            # POS Tablet/Móvil (React)
│   │   ├── src/
│   │   │   ├── components/    # Componentes React
│   │   │   ├── pages/         # Pantallas
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── store/         # Redux/Context
│   │   │   ├── styles/        # Bootstrap + custom CSS
│   │   │   └── App.js
│   │   ├── public/
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── kds-produccion/        # KDS Cocina/Bar (React)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── caja-admin/            # Caja + Admin (React)
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   └── ...
│       └── package.json
│
├── database/                  # Scripts y migraciones
│   ├── migrations/            # Scripts SQL (Knex)
│   ├── seeds/                 # Datos iniciales
│   ├── schema.sql             # Definición completa BD
│   └── README.md
│
├── docs/                      # Documentación técnica
│   ├── ARCHITECTURE.md        # Decisiones técnicas
│   ├── DEPLOYMENT.md          # Guía de deploy
│   └── API_DOCS.md            # Referencia de endpoints
│
├── docker-compose.yml         # Stack Docker (dev)
├── .gitignore
├── .env.example
└── README.md                  # Este archivo
```

---

## 🚀 Inicio Rápido (Desarrollo Local)

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (opcional pero recomendado)
- Git

### Opción 1: Con Docker (Recomendado)

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd DynamicRestoBar

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar servicios (BD + Backend + Frontend)
docker-compose up

# 4. Aplicar migraciones
docker exec dynamicrestobar-backend npm run migrate

# 5. Acceder a la aplicación
# POS Mesero: http://localhost:3001
# KDS: http://localhost:3002
# Caja/Admin: http://localhost:3003
# API: http://localhost:5000
```

### Opción 2: Setup Manual

```bash
# Backend
cd backend
npm install
npm run migrate
npm run seed
npm run dev

# Frontend (en otra terminal)
cd frontend/pos-mesero
npm install
npm start

# En otra terminal para KDS
cd frontend/kds-produccion
npm install
npm start

# Y otra para Caja/Admin
cd frontend/caja-admin
npm install
npm start
```

---

## 📱 Aplicaciones Frontend

### 1. **POS Mesero** (Tablet/Celular)
**URL**: `http://localhost:3001`

Interfaz móvil para meseros:
- Mapa interactivo de mesas
- Toma de pedidos rápida
- Notas y adiciones
- Precuenta

**Tecnología**: React, React Router, Redux, Bootstrap, Socket.io (client)

---

### 2. **KDS Producción** (PC/TV)
**URL**: `http://localhost:3002`

Pantallas para Cocina y Bar:
- Cola de comandas
- Cambio de estado
- Timer de tiempos
- Filtros y vistas

**Tecnología**: React, Socket.io (client), Tailwind CSS

---

### 3. **Caja & Admin** (PC)
**URL**: `http://localhost:3003`

Módulos de Caja y Administración:
- Cobros y facturas
- Cierre de caja
- CRUD de productos
- Gestión de usuarios
- Reportes

**Tecnología**: React, React Router, Redux, Bootstrap

---

## 🔌 Backend API

### URL Base
`http://localhost:5000/api/v1`

### Documentación Swagger
`http://localhost:5000/api-docs`

### Principales Endpoints (MVP)

```
Authentication
POST   /auth/login              # Login usuario
POST   /auth/refresh            # Refresh token
GET    /auth/validate           # Validar token

Productos
GET    /productos               # Listar productos
POST   /productos               # Crear producto
GET    /productos/:id           # Detalle producto
PUT    /productos/:id           # Editar producto
DELETE /productos/:id           # Desactivar producto

Órdenes
GET    /ordenes                 # Listar órdenes
POST   /ordenes                 # Crear orden
PUT    /ordenes/:id             # Actualizar orden
POST   /ordenes/:id/enviar      # Enviar a cocina

Comandas
GET    /comandas                # Listar comandas
PUT    /comandas/:id/estado     # Cambiar estado

Facturacion
GET    /facturas                # Listar facturas
POST   /facturas                # Crear factura

Caja
GET    /cajas/apertura          # Estado caja actual
POST   /cajas/apertura          # Abrir caja
POST   /cajas/cierre            # Cerrar caja

... (ver docs/API_DOCS.md para lista completa)
```

---

## 🗄️ Base de Datos

### Crear Base de Datos
```bash
createdb dynamicrestobar
```

### Aplicar Migraciones
```bash
cd backend
npm run migrate

# O con Docker
docker exec dynamicrestobar-backend npm run migrate
```

### Cargar Datos Iniciales (Seeds)
```bash
npm run seed
```

### Credenciales de Demo (Después de seed)

| Rol | Email | PIN |
|-----|-------|-----|
| Admin | admin@dynamicrestobar.local | 1234 |
| Mesero | juan@example.com | 5678 |
| Cocina | cocina@example.com | 9999 |
| Caja | caja@example.com | 7777 |

---

## 🔐 Autenticación

### Token JWT
- Válido por 24 horas
- Enviado en header: `Authorization: Bearer <token>`
- Refresh token válido por 7 días

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dynamicrestobar.local","password":"admin123"}'
```

---

## 🖨️ Impresoras

### Configuración
Las impresoras se configuran en Admin → Sedes → [Sede] → Impresoras

### Servicios de Impresión
- **Servicio centralizado**: PC servidor detecta impresoras de red
- **Local**: Por defecto, imprime a impresora predeterminada del sistema
- **Fallback**: Si no hay impresora, se guarda en BD para imprimir manualmente

### Test de Conexión
```bash
# Desde admin, botón "Test Impresora"
# O vía API:
POST /api/v1/impresoras/:id/test
```

---

## 🔄 WebSockets (Tiempo Real)

### Eventos Principales

```javascript
// Cliente conecta
socket.on('connect', () => {
  socket.emit('join-sede', { siteId: 1 });
});

// Nueva comanda llegó
socket.on('comanda:nueva', (comanda) => {
  // Actualizar KDS
});

// Estado de comanda cambió
socket.on('comanda:estado-cambio', (comanda) => {
  // Notificar mesero en POS
});

// Mesa cambió de estado
socket.on('mesa:estado-cambio', (mesa) => {
  // Actualizar mapa mesas
});
```

---

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con coverage
npm run test:coverage

# Tests E2E (Cypress)
npm run test:e2e
```

---

## 📊 Reportes

### Reportes Disponibles (Fase 1)
- Ventas diarias
- Ventas por categoría
- Ventas por mesero
- Cierre de caja

### Exportación
- PDF
- Excel (XLSX)

---

## 🐛 Debugging

### Logs
```bash
# Backend logs
docker logs dynamicrestobar-backend -f

# Frontend console (Dev Tools)
F12 > Console
```

### Variahles de Entorno (Backend)
```bash
DEBUG=dynamicrestobar:* npm run dev  # Logs detallados
NODE_ENV=development                 # Modo desarrollo
```

---

## 📦 Despliegue (Production)

### Build Frontend
```bash
cd frontend/pos-mesero && npm run build
cd frontend/kds-produccion && npm run build
cd frontend/caja-admin && npm run build
```

### Build Backend
```bash
cd backend && npm run build
```

### Docker Production
```bash
# Crear imagen
docker build -t dynamicrestobar:latest .

# Subir a registry (Docker Hub, ECR, etc.)
docker tag dynamicrestobar:latest <registry>/<repo>:latest
docker push <registry>/<repo>:latest

# Deploy a servidor (usando docker-compose o K8s)
```

### Variables de Entorno Producción
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db-prod:5432/dynamicrestobar
JWT_SECRET=<secret-muy-largo>
API_URL=https://api.restobar.com
FRONTEND_URL=https://restobar.com
...
```

---

## 🤝 Contribuciones

### Workflow
1. Crear rama: `git checkout -b feature/nomina-feature`
2. Desarrollar + Commits frecuentes
3. Push: `git push origin feature/nomina-feature`
4. Pull Request con descripción
5. Code review
6. Merge a `main`

### Estándares de Código
- ESLint + Prettier configurados
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- PR templates para descripción

---

## 📞 Soporte y Contacto

- **Issues**: GitHub Issues para bugs/features
- **Email**: soporte@dynamicrestobar.com
- **Documentación**: Ver carpeta `/docs`

---

## 📄 Licencia

[MIT License](LICENSE)

---

## 🎯 Roadmap

### Fase 1 ✅ (MVP - En progreso)
Mesas, pedidos, KDS, caja, domicilios básicos

### Fase 2 🔄 (Próxima)
Recetas, inventario automático, compras

### Fase 3 📋 (Futura)
Domicilios avanzados, facturación e-fiscal, reportes profundos

Ver [PLANNING_03_BACKLOG.md](PLANNING_03_BACKLOG.md) para detalles.

---

**Última actualización**: 11 de Enero de 2026
**Versión**: 1.0.0-alpha

