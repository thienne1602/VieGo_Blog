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

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call "%~dp0.venv_new\Scripts\activate.bat"

REM Kiểm tra file main.py
if not exist "%~dp0backend\main.py" (
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
cd /d "%~dp0backend"

REM Chạy Flask server
python main.py

REM Nếu server thoát
echo.
echo ============================================================
echo ⚠️  Backend server has stopped.
echo ============================================================
pause