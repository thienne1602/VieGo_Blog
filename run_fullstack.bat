@echo off
chcp 65001 >nul
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║        🚀 VIEGO BLOG - FULL STACK (LARAGON)                          ║
echo ║           Backend (Flask) + Frontend (Next.js)                       ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

REM Setup Node.js v20
set "NODE_PATH=C:\laragon\bin\nodejs\node-v20"
set "PATH=%NODE_PATH%;%PATH%"
echo.

REM Check Node.js
echo 📋 Checking Node.js v20...
"%NODE_PATH%\node.exe" --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js v20 không tìm thấy!
    echo.
    echo 💡 VUI LÒNG:
    echo    1. Chạy: .\auto_install_nodejs.bat
    echo    2. Hoặc cài Node.js từ https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js v20: OK
for /f "delims=" %%v in ('"%NODE_PATH%\node.exe" --version') do echo    Version: %%v

REM Kiểm tra Laragon MySQL
echo 📋 Checking Laragon MySQL...
C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe -u root -e "SELECT 1" 2>nul
if errorlevel 1 (
    echo ❌ Không thể kết nối MySQL!
    echo.
    echo 💡 VUI LÒNG:
    echo    1. Mở Laragon
    echo    2. Click "Start All"
    echo    3. Chạy lại script này
    echo.
    pause
    exit /b 1
)
echo ✅ MySQL connected

REM Kiểm tra database
echo.
echo 📋 Checking database...
C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe -u root -e "USE viego_blog; SELECT COUNT(*) FROM users;" 2>nul
if errorlevel 1 (
    echo ⚠️  Database chưa có data!
    echo.
    echo 💡 Chạy: .\seed_data.bat để tạo data
    echo.
    set /p CONTINUE="Tiếp tục khởi động? (Y/N): "
    if /i not "%CONTINUE%"=="Y" exit /b 0
) else (
    echo ✅ Database OK
)

REM Kiểm tra virtual environment
echo.
echo 📋 Checking virtual environment...
if not exist "%~dp0.venv_new\Scripts\activate.bat" (
    echo ❌ Virtual environment không tồn tại!
    echo.
    echo 💡 Tạo virtual environment:
    echo    python -m venv .venv_new
    echo    .\.venv_new\Scripts\activate
    echo    pip install -r backend\requirements.txt
    echo.
    pause
    exit /b 1
)
echo ✅ Virtual environment OK

REM Kiểm tra scripts
echo.
echo 📋 Checking scripts...
if not exist "%~dp0run_backend.bat" (
    echo ❌ run_backend.bat not found!
    pause
    exit /b 1
)

if not exist "%~dp0run_frontend.bat" (
    echo ❌ run_frontend.bat not found!
    pause
    exit /b 1
)
echo ✅ Scripts OK

echo.
echo ============================================================
echo 🚀 Starting Full Stack Application...
echo ============================================================
echo.

echo 🔧 Starting Backend server...
start "VieGo Blog - Backend Server (Laragon)" cmd /k "%~dp0run_backend.bat"

echo ⏳ Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

echo 🌐 Starting Frontend server...
start "VieGo Blog - Frontend Server" cmd /k "%~dp0run_frontend.bat"

echo.
echo ============================================================
echo ✅ SERVERS STARTING!
echo ============================================================
echo.
echo 📊 Database (Laragon):
echo    - Host: localhost:3306
echo    - Database: viego_blog
echo    - phpMyAdmin: http://localhost/phpmyadmin
echo.
echo 🔗 Application URLs:
echo    - Backend API: http://localhost:5000
echo    - Frontend: http://localhost:3000
echo.
echo 🔑 Login:
echo    - Admin: admin@viego.com / Admin@123
echo    - User: vana@gmail.com / User@123
echo.
echo 📝 Servers are running in separate windows:
echo    - Backend: "VieGo Blog - Backend Server (Laragon)"
echo    - Frontend: "VieGo Blog - Frontend Server"
echo.
echo ⚠️  Close those windows to stop the servers
echo.
echo Press any key to exit this launcher...
pause >nul