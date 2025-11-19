@echo off
chcp 65001 >nul
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║        📊 TẠO DỮ LIỆU THỰC TẾ CHO DATABASE                          ║
echo ║              VieGo Blog - Seed Real Data                             ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

REM Check virtual environment
if not exist "%~dp0...\.venv_new\Scripts\activate.bat" (
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

echo 🔧 Activating virtual environment...
call "%~dp0...\.venv_new\Scripts\activate.bat"

echo.
echo ============================================================
echo 📊 Đang tạo dữ liệu thực tế...
echo ============================================================
echo.
echo Dữ liệu sẽ tạo:
echo   - 6 Users (admin, users, editor)
echo   - 10 Locations (địa điểm nổi tiếng VN)
echo   - 6+ Blog posts với nội dung thực tế
echo   - Comments, Likes, Followers
echo.
echo ⚠️  Lưu ý: Script sẽ skip nếu data đã tồn tại
echo.

python "%~dp0..\..\database\seed_real_data.py"

if errorlevel 1 (
    echo.
    echo ❌ Có lỗi xảy ra!
    echo.
    echo 💡 Kiểm tra:
    echo    1. Database 'viego_blog' tồn tại
    echo    2. MySQL đang chạy
    echo    3. Đã cài pymysql: pip install pymysql
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo ✅ HOÀN TẤT!
echo ============================================================
echo.
echo 🎉 Dữ liệu đã được tạo thành công!
echo.
echo 📝 Thông tin đăng nhập:
echo.
echo    👤 Admin:
echo       Email: admin@viego.com
echo       Password: Admin@123
echo.
echo    👤 User (Nguyễn Văn A):
echo       Email: vana@gmail.com
echo       Password: User@123
echo.
echo    👤 Editor:
echo       Email: editor@viego.com
echo       Password: Editor@123
echo.
echo 🚀 Sẵn sàng khởi động:
echo    .\run_fullstack.bat
echo.
echo 🌐 Truy cập:
echo    Frontend: http://localhost:3000
echo    Backend: http://localhost:5000
echo.
pause
