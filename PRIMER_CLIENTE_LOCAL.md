# Primer Cliente - Operacion Local (Impresion Activa)

Este modo evita timeouts de impresion en nube porque backend e impresoras quedan en la misma red LAN.

## 1) Preparar una sola vez

1. PC servidor en la misma red de las impresoras.
2. Impresoras con IP fija (ejemplo actual):
   - Bar: 192.168.1.61:9100
   - Cocina: 192.168.1.101:9100
3. Verificar backend y frontend instalados con dependencias:
   - `cd backend && npm install`
   - `cd frontend/pos-mesero && npm install`

## 2) Iniciar sistema local

1. Ejecutar `iniciar-primer-cliente.bat` en la raiz del proyecto.
2. Esperar que abran dos ventanas:
   - Backend (puerto 5081)
   - Frontend POS (puerto 3001)

## 2.1) Modo produccion local (recomendado en cliente)

1. Ejecutar `produccion-primer-cliente.bat`.
2. El script detecta IP local, cierra puertos ocupados y levanta:
   - Backend en `NODE_ENV=production`
   - Frontend compilado (`npm run build`) servido en puerto 3001
3. Abrir la URL que imprime el script (ejemplo `http://192.168.1.53:3001`).

Notas:
- Primera ejecucion puede tardar mas por build del frontend.
- Requiere internet para `npx serve` en la primera corrida del equipo.

## 3) Abrir siempre esta URL (no Vercel)

- `http://192.168.1.52:3001`

Si entras por `dynamic-resto-bar.vercel.app`, la impresion puede fallar por timeout en IP privada.

## 4) Prueba rapida de impresion

1. Ir a Admin > Impresoras.
2. Click en Prueba para Bar y Cocina.
3. Debe salir ticket en ambas.

## 5) Si no imprime

1. Confirmar que backend esta levantado en `http://192.168.1.52:5081/health`.
2. Confirmar que la impresora responde en puerto 9100 desde la PC servidor:
   - `Test-NetConnection 192.168.1.61 -Port 9100`
   - `Test-NetConnection 192.168.1.101 -Port 9100`
3. Confirmar que frontend esta usando API local:
   - archivo `frontend/pos-mesero/.env`
   - `REACT_APP_API_URL=http://192.168.1.52:5081/api/v1`

## 6) Checklist operativo diario

1. Encender router + impresoras + PC servidor.
2. Ejecutar `produccion-primer-cliente.bat`.
3. Validar 1 impresion de prueba.
4. Operar normalmente.
