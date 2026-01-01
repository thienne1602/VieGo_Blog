@echo off
chcp 65001 >nul
cls

REM Nhận port từ tham số
set FRONTEND_PORT=%1
if "%FRONTEND_PORT%"=="" set FRONTEND_PORT=3000

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║        🌐 VIEGO BLOG - FRONTEND CLIENT (PORT %FRONTEND_PORT%)        ║
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

REM Kiểm tra thư mục frontend gốc
if not exist "%~dp0..\frontend" (
    echo ❌ Thư mục frontend không tồn tại!
    pause
    exit /b 1
)

REM Chuyển vào thư mục frontend gốc
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

REM Kiểm tra port có đang được sử dụng không
echo 📋 Checking if port %FRONTEND_PORT% is available...
netstat -ano | findstr ":%FRONTEND_PORT%" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Port %FRONTEND_PORT% đang được sử dụng!
    echo 💡 Đang đợi 3 giây và thử lại...
    timeout /t 3 /nobreak >nul
    netstat -ano | findstr ":%FRONTEND_PORT%" >nul 2>&1
    if not errorlevel 1 (
        echo ❌ Port %FRONTEND_PORT% vẫn đang được sử dụng!
        echo 💡 Vui lòng đóng ứng dụng đang sử dụng port này hoặc chọn port khác
        pause
        exit /b 1
    )
)
echo ✅ Port %FRONTEND_PORT% is available

echo.
echo ============================================================
echo 🚀 Starting Next.js Frontend Client...
echo ============================================================
echo.
echo 🔗 Backend API: http://localhost:5000
echo 🌐 Frontend: http://localhost:%FRONTEND_PORT% (sẽ mở sau khi start)
echo.

REM Set port environment variable và chạy Next.js development server
REM Next.js hỗ trợ PORT environment variable hoặc -p parameter
REM Set PORT environment variable explicitly
set PORT=%FRONTEND_PORT%
REM Set separate cache directory for each client to avoid conflicts
REM Use port-specific cache directory for Turbo
set TURBO_CACHE_DIR=%~dp0frontend\.turbo_cache_%FRONTEND_PORT%
set NEXT_TELEMETRY_DISABLED=1

REM Add delay to prevent race conditions
timeout /t 2 /nobreak >nul

REM Set separate cache directory for each client to avoid conflicts
set NEXT_CACHE_DIR=.next_cache_%FRONTEND_PORT%
if not exist "%NEXT_CACHE_DIR%" mkdir "%NEXT_CACHE_DIR%"

REM Alternative approach: Use a wrapper script to handle multiple clients
REM Create a simple Node.js script to start multiple Next.js instances

echo Creating multi-client launcher...
echo const { spawn } = require('child_process'); > multi_client_launcher.js
echo const port = process.argv[2] ^|^| 3000; >> multi_client_launcher.js
echo const nextProcess = spawn('npx', ['next', 'dev', '-p', port], { >> multi_client_launcher.js
echo   stdio: 'inherit', >> multi_client_launcher.js
echo   env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } >> multi_client_launcher.js
echo }); >> multi_client_launcher.js
echo nextProcess.on('exit', (code) =^> { process.exit(code); }); >> multi_client_launcher.js

REM Run the launcher
call "%NODE_PATH%\node.exe" multi_client_launcher.js %FRONTEND_PORT%

REM Clean up
del multi_client_launcher.js 2>nul

REM Nếu server thoát
echo.
echo ============================================================
echo ⚠️  Frontend client (Port %FRONTEND_PORT%) has stopped.
echo ============================================================
pause

