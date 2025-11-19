@echo off
chcp 65001 >nul
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║        🚀 VIEGO BLOG - SYSTEM LAUNCHER                               ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo 📋 Đang khởi động GUI...
echo.

REM Check if PowerShell is available
powershell -Command "exit 0" >nul 2>&1
if errorlevel 1 (
    echo ❌ PowerShell không khả dụng!
    echo 💡 Vui lòng cài đặt PowerShell
    pause
    exit /b 1
)

REM Run PowerShell GUI script with UTF-8 encoding
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0launcher.ps1"

if errorlevel 1 (
    echo.
    echo ❌ Có lỗi xảy ra khi chạy GUI!
    echo 💡 Thử chạy trực tiếp: powershell -ExecutionPolicy Bypass -File launcher.ps1
    pause
)

