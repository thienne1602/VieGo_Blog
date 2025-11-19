@echo off
chcp 65001 >nul
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║        🌐 VIEGO BLOG - FRONTEND SERVER (NEXT.JS)                     ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

REM Setup Node.js v20
set "NODE_PATH=C:\laragon\bin\nodejs\node-v20"
set "PATH=%NODE_PATH%;%PATH%"

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
for /f "delims=" %%v in ('"%NODE_PATH%\node.exe" --version') do (
    echo ✅ Node.js: %%v
)

REM Kiểm tra thư mục frontend
if not exist "%~dp0..\frontend" (
    echo ❌ Thư mục frontend không tồn tại!
    pause
    exit /b 1
)

REM Chuyển vào thư mục frontend
cd /d "%~dp0..\frontend"

REM Kiểm tra package.json
if not exist "package.json" (
    echo ❌ package.json not found in frontend folder!
    echo.
    echo 💡 Cần cài đặt Next.js project trong thư mục frontend
    pause
    exit /b 1
)

REM Kiểm tra node_modules
if not exist "node_modules" (
    echo ⚠️  node_modules không tồn tại!
    echo 📦 Đang cài đặt dependencies...
    echo.
    call "%NODE_PATH%\npm.cmd" install
    if errorlevel 1 (
        echo.
        echo ❌ Lỗi khi cài đặt dependencies!
        pause
        exit /b 1
    )
)

echo.
echo ============================================================
echo 🚀 Starting Next.js Frontend...
echo ============================================================
echo.
echo 🔗 Backend API: http://localhost:5000
echo 🌐 Frontend: http://localhost:3000 (sẽ mở sau khi start)
echo.

REM Chạy Next.js development server
call "%NODE_PATH%\npm.cmd" run dev

REM Nếu server thoát
echo.
echo ============================================================
echo ⚠️  Frontend server has stopped.
echo ============================================================
pause