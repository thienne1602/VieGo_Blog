@echo off
echo Starting VieGo Blog - Full Stack Application
echo ===========================================
echo This will start both Backend and Frontend servers in separate windows
echo.

REM Kiểm tra xem các script con có tồn tại không
if not exist "%~dp0run_backend.bat" (
    echo ERROR: run_backend.bat not found!
    pause
    exit /b 1
)

if not exist "%~dp0run_frontend.bat" (
    echo ERROR: run_frontend.bat not found!
    pause
    exit /b 1
)

echo Starting Backend server in new window...
start "VieGo Blog - Backend Server" cmd /k "%~dp0run_backend.bat"

echo Waiting 3 seconds before starting Frontend...
timeout /t 3 /nobreak >nul

echo Starting Frontend server in new window...
start "VieGo Blog - Frontend Server" cmd /k "%~dp0run_frontend.bat"

echo.
echo Both servers are starting in separate windows:
echo - Backend: Check "VieGo Blog - Backend Server" window
echo - Frontend: Check "VieGo Blog - Frontend Server" window
echo.
echo Backend usually runs on: http://localhost:5000
echo Frontend usually runs on: http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause >nul