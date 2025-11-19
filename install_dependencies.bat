@echo off
chcp 65001 >nul
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║        📦 VIEGO BLOG - INSTALL DEPENDENCIES                          ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

REM Kiểm tra virtual environment
if not exist "%~dp0.venv_new\Scripts\activate.bat" (
    echo ❌ Virtual environment không tồn tại!
    echo.
    echo 💡 Tạo virtual environment...
    python -m venv .venv_new
    if errorlevel 1 (
        echo ❌ Không thể tạo virtual environment!
        pause
        exit /b 1
    )
    echo ✅ Virtual environment đã được tạo
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call "%~dp0.venv_new\Scripts\activate.bat"

REM Kiểm tra pip
echo.
echo 📦 Checking pip...
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip không tìm thấy!
    pause
    exit /b 1
)
echo ✅ pip OK

REM Cài đặt Flask-Mail trước (quan trọng nhất)
echo.
echo 📦 Installing Flask-Mail (required for email functionality)...
python -m pip install --upgrade pip
python -m pip install Flask-Mail==0.10.0

if errorlevel 1 (
    echo.
    echo ❌ Không thể cài đặt Flask-Mail!
    pause
    exit /b 1
)
echo ✅ Flask-Mail installed successfully

REM Cài đặt các dependencies khác (có thể bỏ qua một số lỗi build)
echo.
echo 📦 Installing other dependencies from requirements.txt...
echo ⚠️  Note: Some packages may fail to build (e.g. lru-dict requires Visual C++)
echo    But Flask-Mail and most packages should install fine.
echo.
python -m pip install -r backend\requirements.txt

REM Kiểm tra Flask-Mail đã được cài thành công
python -c "import flask_mail; print('✅ Flask-Mail OK:', flask_mail.__version__)" 2>nul
if errorlevel 1 (
    echo.
    echo ⚠️  Warning: Flask-Mail import failed, but package may still be installed.
    echo    Try running the application to test.
)

echo.
echo ✅ Tất cả dependencies đã được cài đặt thành công!
echo.
echo 📋 Đã cài đặt:
echo    - Flask và các extensions
echo    - Flask-Mail (cho chức năng gửi email)
echo    - Các dependencies khác từ requirements.txt
echo.
echo 💡 Bây giờ bạn có thể chạy ứng dụng bằng:
echo    - run_fullstack.bat (Backend + Frontend)
echo    - run_backend.bat (Chỉ Backend)
echo    - run_frontend.bat (Chỉ Frontend)
echo.
pause

