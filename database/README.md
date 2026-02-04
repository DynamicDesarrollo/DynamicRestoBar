# 🗄️ Configuración de Base de Datos

Este documento describe cómo crear, migrar y mantener la base de datos PostgreSQL para DynamicRestoBar.

---

## 📋 Requisitos Previos

- PostgreSQL 14+
- Node.js 18+
- Acceso a superusuario (para crear BD)

---

## 🚀 Creación Inicial de Base de Datos

### Opción 1: Script SQL Manual

```bash
# Conectar a PostgreSQL como superusuario
psql -U postgres

# En la consola de psql:
CREATE DATABASE dynamicrestobar
  WITH
  ENCODING = 'UTF8'
  LC_COLLATE = 'es_CO.UTF-8'
  LC_CTYPE = 'es_CO.UTF-8'
  TEMPLATE = template0;

\c dynamicrestobar;

-- Crear extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "plpgsql";

-- Crear usuario dedicado (opcional)
CREATE USER restobar_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE dynamicrestobar TO restobar_user;
GRANT USAGE, CREATE ON SCHEMA public TO restobar_user;

-- Salir
\q
```

### Opción 2: Con Docker (Recomendado)

```bash
# Desde raíz del proyecto
docker-compose up -d postgres

# Esperar a que la BD esté lista
sleep 10

# Ejecutar migraciones
docker exec dynamicrestobar-backend npm run migrate
```

---

## 📚 Migraciones (Knex.js)

Las migraciones se encuentra en `database/migrations/`

### Crear Nueva Migración

```bash
cd backend
npx knex migrate:make crear_tabla_pedidos
```

### Ejecutar Migraciones

```bash
npm run migrate
```

### Rollback de Última Migración

```bash
npm run migrate:rollback
```

---

## 🌱 Seeds (Datos Iniciales)

### Ejecutar Seeds

```bash
npm run seed
```

Se cargarán datos de demostración:
- Sedes, zonas, mesas
- Categorías, productos, modificadores
- Usuarios de prueba
- Impresoras

### Crear Nuevo Seed

```bash
npx knex seed:make seed_productos_extras
```

---

## 📊 Estructura de Tablas (Schema)

Todas las tablas incluyen estos campos por defecto:

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
deleted_at TIMESTAMP NULL  -- Soft delete
```

Ver [PLANNING_02_MODELO_ER.md](../PLANNING_02_MODELO_ER.md) para diagrama completo.

---

## 🔑 Índices Importantes

Se crean automáticamente en las migraciones.

Índices críticos para performance:
- `usuarios.email` (UNIQUE)
- `usuarios.pin` (para login rápido)
- `mesas.sede_id, zona_id` (búsqueda de mesas)
- `productos.codigo_sku` (UNIQUE)
- `ordenes.numero_pedido` (UNIQUE)
- `comandas.numero_comanda` (UNIQUE)
- `kardex_movimientos.insumo_id, timestamp` (reportes)

---

## 🔐 Backup y Restore

### Backup Completo

```bash
# Crear backup en archivo .sql
pg_dump -U postgres dynamicrestobar > backup.sql

# O con compresión
pg_dump -U postgres dynamicrestobar | gzip > backup.sql.gz
```

### Restaurar desde Backup

```bash
# Desde archivo .sql
psql -U postgres dynamicrestobar < backup.sql

# O desde archivo comprimido
gunzip -c backup.sql.gz | psql -U postgres dynamicrestobar
```

### Backup Automático (Docker)

```bash
# Cada día a las 2 AM
docker run --rm \
  --volumes-from dynamicrestobar-postgres \
  -v /backups:/backups \
  postgres:15 \
  pg_dump -U postgres dynamicrestobar > /backups/backup-$(date +%Y%m%d).sql
```

---

## 🧹 Mantenimiento

### Limpiar Soft-Deletes Antiguos

```sql
-- Eliminar registros borrados hace más de 90 días
DELETE FROM usuarios 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '90 days';

VACUUM ANALYZE;
```

### Reindexar Tabla

```sql
REINDEX TABLE comandas;
```

### Ver Tamaño de Base de Datos

```sql
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'dynamicrestobar';
```

---

## 📝 Credenciales de Prueba (Después de Seed)

| Rol | Email | PIN |
|-----|-------|-----|
| Admin | admin@dynamicrestobar.local | 1234 |
| Mesero | juan@example.com | 5678 |
| Cocina | cocina@example.com | 9999 |
| Bar | bar@example.com | 8888 |
| Caja | caja@example.com | 7777 |

---

## 🐛 Troubleshooting

### Error: "Role 'postgres' does not exist"

```bash
# Crear superusuario
sudo -u postgres createuser --superuser postgres
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password';"
```

### Error: "Database already exists"

```bash
# Eliminar BD existente
psql -U postgres -c "DROP DATABASE IF EXISTS dynamicrestobar;"
```

### Error: "Too many connections"

```sql
-- Ver conexiones activas
SELECT pid, usename, datname, state 
FROM pg_stat_activity 
WHERE datname = 'dynamicrestobar';

-- Terminar conexiones
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'dynamicrestobar' AND pid != pg_backend_pid();
```

---

## 📞 Soporte

Para problemas de BD:
1. Revisar logs de PostgreSQL
2. Ver [PLANNING_02_MODELO_ER.md](../PLANNING_02_MODELO_ER.md)
3. Abrir issue en GitHub

