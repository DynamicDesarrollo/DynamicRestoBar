@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend\pos-mesero"

echo ================================================
echo DynamicRestoBar - Reinicio Forzado Local
echo ================================================
echo Cerrando procesos de puertos 5081 y 3001...
echo.

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5081" ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>nul
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>nul
)

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

echo Iniciando backend y frontend...
start "DynamicRestoBar Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && npm run dev"
start "DynamicRestoBar POS" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm start"

echo.
echo Espera 15-25 segundos y abre:
echo http://192.168.1.53:3001
echo.
pause
