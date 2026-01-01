@echo off
cls
echo.
echo ======================================================================
echo.
echo        VIEGO BLOG - SYSTEM LAUNCHER
echo.
echo ======================================================================
echo.
echo Starting GUI...
echo.

REM Check if PowerShell is available
powershell -Command "exit 0" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is not available!
    echo Please install PowerShell
    pause
    exit /b 1
)

REM Run PowerShell GUI script
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0launchers\launcher.ps1"

if errorlevel 1 (
    echo.
    echo ERROR: An error occurred while running GUI!
    echo Try running directly: powershell -ExecutionPolicy Bypass -File launchers\launcher.ps1
    pause
)

