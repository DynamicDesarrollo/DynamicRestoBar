# 🚀 QUICKSTART - DynamicRestoBar

**Guía rápida para poner en marcha el proyecto en 10 minutos**

---

## ✅ Requisitos

- [x] Node.js 18+
- [x] PostgreSQL 14+
- [x] Git
- [x] Docker & Docker Compose (opcional pero recomendado)

---

## 📝 Opción 1: Setup Rápido (Recomendado con Docker)

### Paso 1: Clonar repositorio

```bash
git clone <url-repositorio>
cd DynamicRestoBar
```

### Paso 2: Copiar archivo de variables de entorno

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/pos-mesero/.env.example frontend/pos-mesero/.env
cp frontend/kds-produccion/.env.example frontend/kds-produccion/.env
cp frontend/caja-admin/.env.example frontend/caja-admin/.env
```

### Paso 3: Levantar servicios con Docker

```bash
docker-compose up -d
```

Esto levantará:
- **PostgreSQL** (puerto 5432)
- **Backend API** (puerto 5000)
- **Frontend POS Mesero** (puerto 3001)

### Paso 4: Aplicar migraciones de BD

```bash
docker exec dynamicrestobar-backend npm run migrate
docker exec dynamicrestobar-backend npm run seed
```

### Paso 5: Acceder a la aplicación

| Aplicación | URL | PIN |
|-----------|-----|-----|
| **POS Mesero** | http://localhost:3001 | 5678 (juan) |
| **API** | http://localhost:5000 | - |

---

## 📝 Opción 2: Setup Manual (Sin Docker)

### Paso 1: Crear Base de Datos PostgreSQL

```bash
# Conectar a PostgreSQL
psql -U postgres

# En la consola de psql:
CREATE DATABASE dynamicrestobar 
  WITH ENCODING = 'UTF8' 
  LC_COLLATE = 'es_CO.UTF-8' 
  LC_CTYPE = 'es_CO.UTF-8';

\q
```

### Paso 2: Instalar dependencias Backend

```bash
cd backend
npm install
```

### Paso 3: Configurar variables de entorno Backend

```bash
cp .env.example .env
# Editar .env con tus valores:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/dynamicrestobar
```

### Paso 4: Aplicar migraciones

```bash
npm run migrate
npm run seed
```

### Paso 5: Iniciar Backend

```bash
npm run dev
# Backend estará en http://localhost:5000
```

### Paso 6: Instalar y correr Frontend (en otra terminal)

```bash
cd frontend/pos-mesero
npm install
npm start
# POS estará en http://localhost:3001
```

---

## 🔑 Credenciales de Prueba

Después de ejecutar `npm run seed`, disponible:

| Rol | Email | PIN |
|-----|-------|-----|
| **Admin** | admin@dynamicrestobar.local | 1234 |
| **Mesero** | juan@example.com | 5678 |
| **Cocina** | cocina@example.com | 9999 |
| **Bar** | bar@example.com | 8888 |
| **Caja** | caja@example.com | 7777 |

---

## 🧪 Pruebas Rápidas

### Test de API

```bash
# Desde terminal, ir a backend
cd backend

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dynamicrestobar.local",
    "password": "admin123"
  }'

# Obtener productos
curl http://localhost:5000/api/v1/productos \
  -H "Authorization: Bearer <token>"
```

### Test del Frontend (Navegador)

1. Abrir http://localhost:3001
2. Seleccionar sede "Centro"
3. Login: PIN **5678** (mesero Juan)
4. Seleccionar mesa 1
5. Agregar producto a carrito
6. Enviar a cocina

---

## 📂 Estructura de Carpetas

```
DynamicRestoBar/
├── backend/              # API Node.js
├── frontend/
│   ├── pos-mesero/      # Aplicación tablets (puerto 3001)
│   ├── kds-produccion/  # KDS Cocina/Bar (puerto 3002)
│   └── caja-admin/      # Caja + Admin (puerto 3003)
├── database/            # Scripts SQL
├── docs/                # Documentación técnica
└── PLANNING_*.md        # Documentos de diseño
```

---

## 🐛 Troubleshooting

### Error: "Connection refused" en PostgreSQL

```bash
# Verificar si PostgreSQL está corriendo
psql -U postgres -c "SELECT version();"

# Iniciar PostgreSQL (si está parado)
# En Windows:
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start

# En Linux/Mac:
brew services start postgresql
```

### Error: "Port 5000 already in use"

```bash
# Encontrar proceso usando puerto 5000 (en Windows)
netstat -ano | findstr :5000

# Matar proceso
taskkill /PID <PID> /F

# En Linux/Mac:
lsof -i :5000
kill -9 <PID>
```

### Error: "npm ERR! code EACCES"

```bash
# Limpiar npm cache
npm cache clean --force

# Reinstalar
npm install
```

### BD con estado incorrecto

```bash
# Reset completo (cuidado: borra datos)
dropdb dynamicrestobar
createdb dynamicrestobar
npm run migrate
npm run seed
```

---

## 📊 Documentación

- **[README.md](README.md)** - Descripción general del proyecto
- **[PLANNING_01_MAPA_PANTALLAS.md](PLANNING_01_MAPA_PANTALLAS.md)** - Diseño UI/UX
- **[PLANNING_02_MODELO_ER.md](PLANNING_02_MODELO_ER.md)** - Base de datos
- **[PLANNING_03_BACKLOG.md](PLANNING_03_BACKLOG.md)** - Funcionalidades por fase
- **[database/README.md](database/README.md)** - Guía de BD

---

## 🔗 Links Útiles

- **API Documentación**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health
- **Socket.IO Test**: http://localhost:5000/socket.io/

---

## 🚀 Próximos Pasos

Después de setup inicial, puedes:

1. **Explorar las pantallas** en el navegador
2. **Revisar la documentación** (PLANNING_*.md)
3. **Crear productos** desde Admin
4. **Hacer un pedido** de prueba
5. **Empezar a desarrollar** nuevas funcionalidades

---

## 💡 Tips

- **Modo debug**: Agregar `DEBUG=dynamicrestobar:*` antes de `npm run dev`
- **Logs**: Ver `backend/logs/app.log` para errores
- **DB reset**: `npm run migrate:rollback` para deshacer cambios
- **Hot reload**: Frontend refresca automáticamente en `npm start`

---

## 📞 Soporte

- GitHub Issues para bugs/features
- Revisar logs para errores detallados
- Preguntar en equipo Slack/Teams

---

**¡Listo! Tu DynamicRestoBar está en marcha. 🎉**

Próximo: Revisa [PLANNING_03_BACKLOG.md](PLANNING_03_BACKLOG.md) para comenzar con Fase 1.

