@echo off
REM VieGo Blog - Multi-Client Frontend Launcher
REM Run multiple frontend clients on different ports

setlocal

REM Get client count (default 2)
set CLIENT_COUNT=%1
if "%CLIENT_COUNT%"=="" set CLIENT_COUNT=2

REM Get start port (default 3000)
set START_PORT=%2
if "%START_PORT%"=="" set START_PORT=3000

cls
echo.
echo ======================================================================
echo.
echo        VIEGO BLOG - MULTI-CLIENT LAUNCHER
echo.
echo ======================================================================
echo.
echo Starting %CLIENT_COUNT% frontend clients from port %START_PORT%...
echo.

REM Run PowerShell script
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0run_multi_client.ps1" -ClientCount %CLIENT_COUNT% -StartPort %START_PORT%

if errorlevel 1 (
    echo.
    echo ERROR: Failed to start multi-client launcher!
    pause
)

endlocal
