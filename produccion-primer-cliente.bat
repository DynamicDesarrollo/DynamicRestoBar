@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend\pos-mesero"

echo ================================================
echo DynamicRestoBar - Modo Produccion Local
echo ================================================
echo Detectando IP local...

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object {$_.IPAddress -like '192.168.*'} ^| Select-Object -First 1 -ExpandProperty IPAddress"`) do set "LOCAL_IP=%%i"

if "%LOCAL_IP%"=="" (
  echo ERROR: No se pudo detectar IP local 192.168.x.x
  echo Verifica que la PC este conectada a la red del cliente.
  pause
  exit /b 1
)

echo IP detectada: %LOCAL_IP%
echo.

if not exist "%BACKEND_DIR%\package.json" (
  echo ERROR: No existe %BACKEND_DIR%\package.json
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo ERROR: No existe %FRONTEND_DIR%\package.json
  pause
  exit /b 1
)

echo Cerrando procesos previos en puertos 5081 y 3001...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5081" ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>nul
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>nul

echo.
echo Iniciando Backend en modo produccion...
start "DynamicRestoBar Backend PROD" cmd /k "cd /d ""%BACKEND_DIR%"" && set NODE_ENV=production && set FRONTEND_URL_POS=http://%LOCAL_IP%:3001 && set FRONTEND_URL_ADMIN=http://%LOCAL_IP%:3001 && set FRONTEND_URL_KDS=http://%LOCAL_IP%:3002 && npm start"

echo Iniciando Frontend compilado (build + server estatico)...
start "DynamicRestoBar Frontend PROD" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run build && npx --yes serve -s build -l 3001"

echo.
echo Espera 30-60 segundos y abre esta URL:
echo http://%LOCAL_IP%:3001
echo.
echo Salud backend:
echo http://%LOCAL_IP%:5081/health
echo.
echo IMPORTANTE: usa esta URL local, no Vercel.
echo.
pause
