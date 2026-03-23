@echo off
chcp 65001 >nul
echo ================================================
echo    POLKA MESSENGER - Проверка статуса
echo ================================================
echo.

echo [PostgreSQL]
sc query postgresql-x64-16 | find "RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL: Запущен
) else (
    echo ❌ PostgreSQL: Не запущен
)
echo.

echo [Backend - Port 3000]
netstat -ano | find ":3000" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend: Запущен на http://localhost:3000
) else (
    echo ❌ Backend: Не запущен
)
echo.

echo [Frontend - Port 19006]
netstat -ano | find ":19006" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend: Запущен на http://localhost:19006
) else (
    echo ❌ Frontend: Не запущен
)
echo.

echo [Node.js]
node --version >nul 2>&1
if %errorlevel% equ 0 (
    node --version
    echo ✅ Node.js: Установлен
) else (
    echo ❌ Node.js: Не установлен
)
echo.

echo [npm]
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    npm --version
    echo ✅ npm: Установлен
) else (
    echo ❌ npm: Не установлен
)
echo.

echo ================================================
echo.
pause
