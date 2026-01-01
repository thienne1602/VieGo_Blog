@echo off
cls
echo.
echo ======================================================================
echo.
echo        VIEGO BLOG - FRONTEND SERVER (NEXT.JS)
echo.
echo ======================================================================
echo.

REM Setup Node.js v20
set "NODE_PATH=C:\laragon\bin\nodejs\node-v20"
set "PATH=%NODE_PATH%;%PATH%"

REM Check Node.js
echo Checking Node.js v20...
"%NODE_PATH%\node.exe" --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js v20 not found!
    echo.
    echo Please:
    echo    1. Run: .\auto_install_nodejs.bat
    echo    2. Or install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('"%NODE_PATH%\node.exe" --version') do (
    echo ✅ Node.js: %%v
)

REM Check frontend directory
if not exist "%~dp0..\frontend" (
    echo ERROR: Frontend directory does not exist!
    pause
    exit /b 1
)

REM Chuyển vào thư mục frontend
cd /d "%~dp0..\frontend"

REM Check package.json
if not exist "package.json" (
    echo ERROR: package.json not found in frontend folder!
    echo.
    echo Please install Next.js project in frontend directory
    pause
    exit /b 1
)

REM Check node_modules
if not exist "node_modules" (
    echo WARNING: node_modules does not exist!
    echo Installing dependencies...
    echo.
    call "%NODE_PATH%\npm.cmd" install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo.
echo ============================================================
echo Starting Next.js Frontend...
echo ============================================================
echo.
echo Backend API: http://localhost:5000
echo Frontend: http://localhost:3000 (will open after start)
echo.

REM Run Next.js development server
call "%NODE_PATH%\npm.cmd" run dev

REM If server exits
echo.
echo ============================================================
echo WARNING: Frontend server has stopped.
echo ============================================================
pause