@echo off
chcp 65001 >nul
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║        🚀 VIEGO BLOG - BACKEND SERVER (LARAGON)                      ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

REM Kiểm tra virtual environment
if not exist "%~dp0..\.venv_new\Scripts\activate.bat" (
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

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call "%~dp0..\.venv_new\Scripts\activate.bat"

REM Kiểm tra file main.py
if not exist "%~dp0..\backend\main.py" (
    echo ❌ main.py not found in backend folder!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo 📊 Database Info (Laragon):
echo ============================================================
echo    Host:     localhost:3306
echo    Database: viego_blog
echo    User:     root
echo    Password: (empty)
echo.
echo ============================================================
echo 🚀 Starting Flask Backend...
echo ============================================================
echo.

REM Chuyển vào thư mục backend
cd /d "%~dp0..\backend"

REM Set email environment variables for Gmail
set MAIL_SERVER=smtp.gmail.com
set MAIL_PORT=587
set MAIL_USE_TLS=true
set MAIL_USE_SSL=false
set MAIL_USERNAME=ngocthien160224@gmail.com
set MAIL_PASSWORD=AbCd0000
set MAIL_DEFAULT_SENDER=ngocthien160224@gmail.com

REM Set Google Maps API Key
set GOOGLE_MAPS_API_KEY=AIzaSyA7gWv2sQWonQMvSsWIOB00Sxcxgrf5lx0

REM Set Weather API Key (Sử dụng WeatherAPI.com - miễn phí 1 triệu requests/tháng)
REM Lấy key miễn phí tại: https://www.weatherapi.com/
REM Google Geocoding đã được sử dụng tự động nếu có GOOGLE_MAPS_API_KEY
set WEATHER_API_KEY=AIzaSyA7gWv2sQWonQMvSsWIOB00Sxcxgrf5lx0

REM Chạy Flask server
python main.py

REM Nếu server thoát
echo.
echo ============================================================
echo ⚠️  Backend server has stopped.
echo ============================================================
pause