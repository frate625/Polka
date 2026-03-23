@echo off
echo ================================================
echo    POLKA MESSENGER - Локальный запуск
echo ================================================
echo.

echo [1/4] Проверка PostgreSQL...
sc query postgresql-x64-16 >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] PostgreSQL служба не найдена
    echo [!] Запустите PostgreSQL через pgAdmin4 или services.msc
    pause
    exit /b 1
)

echo [OK] PostgreSQL найден
echo.

echo [2/4] Запуск Backend...
cd backend
start "Polka Backend" cmd /k "npm start"
timeout /t 3 >nul
echo [OK] Backend запускается на http://localhost:3000
echo.

echo [3/4] Запуск Frontend...
cd ..\mobile
start "Polka Frontend" cmd /k "npx expo start --web"
echo [OK] Frontend запускается на http://localhost:19006
echo.

echo ================================================
echo    Всё запущено!
echo ================================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:19006
echo.
echo Нажмите любую клавишу для выхода...
pause >nul
