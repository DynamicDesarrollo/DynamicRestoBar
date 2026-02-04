@echo off
REM Test API endpoints

echo === TEST KDS ACTUALIZACION ===
echo.

REM Login
echo 1. Logueando...
curl -X POST http://localhost:5000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"barman@test.com\",\"password\":\"password\"}"

echo.
echo.
pause
