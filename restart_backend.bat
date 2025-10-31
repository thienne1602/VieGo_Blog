@echo off
echo ============================================
echo   RESTART BACKEND AFTER DATABASE SYNC
echo ============================================
echo.

echo [INFO] Da fix User model - them 'editor' role
echo [INFO] Backend can restart de nhan model moi
echo.

cd backend

echo [1/2] Dang kiem tra backend process...
for /f "tokens=2" %%a in ('tasklist ^| findstr /i "node.exe"') do (
    echo     Tim thay Node.js process: %%a
    echo     Dang stop backend...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [2/2] Dang khoi dong backend...
echo.
start "VieGo Backend" cmd /k "npm start"

timeout /t 3 >nul

echo.
echo ============================================
echo   BACKEND DA KHOI DONG LAI!
echo ============================================
echo.
echo Tiep theo:
echo 1. Doi 5-10 giay de backend khoi dong xong
echo 2. Test API: python test_api_connection.py
echo 3. Mo web: http://localhost:3000
echo.
pause
