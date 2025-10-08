@echo off
echo Starting VieGo Blog Frontend (Next.js)...
echo =========================================

REM Chuyển vào thư mục frontend
cd /d "%~dp0frontend"

REM Kiểm tra xem có file package.json không
if not exist "package.json" (
    echo ERROR: package.json not found in frontend folder!
    pause
    exit /b 1
)

REM Hiển thị thư mục hiện tại
echo Current directory: %CD%
echo Running: npm run dev
echo.

REM Chạy Next.js development server
npm run dev

REM Nếu server thoát, hiển thị thông báo
echo.
echo Frontend server has stopped.
pause