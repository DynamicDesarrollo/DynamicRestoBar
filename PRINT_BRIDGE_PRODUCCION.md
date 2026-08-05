# Print Bridge Produccion (Arquitectura Profesional)

Este flujo permite mantener backend en nube (SaaS) y imprimir en la LAN de cada cliente sin abrir puertos del router.

## Componentes

1. API principal (cloud) con cola de `print_jobs`.
2. Agente local por sede (Windows) que consulta la cola y manda ESC/POS a impresoras LAN.

## 1) Cloud API

Configura en backend cloud:

- `PRINT_DELIVERY_MODE=bridge`
- `PRINT_BRIDGE_TOKEN=<token-largo-seguro>`

Ejecuta migración:

- `cd backend`
- `npm run migrate`

Endpoints bridge:

- `GET /api/v1/bridge/health`
- `POST /api/v1/bridge/jobs/next/:sedeId`
- `POST /api/v1/bridge/jobs/:id/done`
- `POST /api/v1/bridge/jobs/:id/failed`

## 2) PC local en sede (agente)

Configura `.env` del backend local en la PC sede con:

- `BRIDGE_API_URL=https://tu-api-cloud.com/api/v1/bridge`
- `PRINT_BRIDGE_TOKEN=<mismo-token-cloud>`
- `BRIDGE_SEDE_ID=<id-sede>`
- `BRIDGE_AGENT_ID=bridge-sede-<id>`
- `BRIDGE_POLL_MS=2500`

Ejecuta:

- `cd backend`
- `npm install`
- `npm run bridge:agent`

## 3) Flujo de impresión

1. Usuario crea orden o prueba impresora en frontend SaaS.
2. API cloud encola trabajo en `print_jobs`.
3. Agente local toma job, imprime y confirma `done`.
4. Si falla, marca `failed` y el job vuelve a `pendiente` hasta `max_intentos`.

## 4) Recomendación operación

1. Ejecutar agente como servicio de Windows (NSSM/PM2) para autoarranque.
2. Monitorear jobs fallidos por sede.
3. Mantener IP fija en impresoras.

## 5) Nota de compatibilidad

- Modo actual local directo sigue funcionando cuando `PRINT_DELIVERY_MODE=direct`.
- Modo bridge se activa solo con `PRINT_DELIVERY_MODE=bridge`.
