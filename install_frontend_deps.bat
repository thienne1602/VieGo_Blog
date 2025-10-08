@echo off
echo Installing VieGo Blog Frontend Dependencies...
echo ===============================================

REM Chuyển vào thư mục frontend
cd /d "%~dp0frontend"

REM Kiểm tra xem có file package.json không
if not exist "package.json" (
    echo ERROR: package.json not found in frontend folder!
    pause
    exit /b 1
)

echo Current directory: %CD%
echo Installing Node.js packages with npm...
echo.

REM Cài đặt dependencies
npm install

echo.
echo Frontend dependencies installation completed!
pause