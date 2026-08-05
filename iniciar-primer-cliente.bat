@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend\pos-mesero"

echo ================================================
echo DynamicRestoBar - Modo Local Primer Cliente
echo ================================================
echo Verificando servicios locales...
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

set "BACKEND_RUNNING=0"
set "FRONTEND_RUNNING=0"

netstat -ano | findstr ":5081" | findstr "LISTENING" >nul
if %errorlevel%==0 set "BACKEND_RUNNING=1"

netstat -ano | findstr ":3001" | findstr "LISTENING" >nul
if %errorlevel%==0 set "FRONTEND_RUNNING=1"

if "%BACKEND_RUNNING%"=="1" (
	echo [OK] Backend ya estaba activo en puerto 5081.
) else (
	echo [START] Levantando backend en puerto 5081...
	start "DynamicRestoBar Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && npm run dev"
)

if "%FRONTEND_RUNNING%"=="1" (
	echo [OK] Frontend ya estaba activo en puerto 3001.
) else (
	echo [START] Levantando frontend en puerto 3001...
	start "DynamicRestoBar POS" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm start"
)

echo Backend local:  http://192.168.1.53:5081/health
echo Frontend local: http://192.168.1.53:3001
echo.
echo IMPORTANTE: usa SIEMPRE la URL local (no la de Vercel) para imprimir.
echo.
echo Si cambiaste codigo del backend y ya estaba activo, reinicia esa ventana manualmente.
echo.
pause
