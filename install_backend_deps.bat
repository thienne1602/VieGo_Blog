@echo off
echo Installing VieGo Blog Backend Dependencies...
echo ===============================================

REM Chuyển vào thư mục backend
cd /d "%~dp0backend"

REM Kiểm tra xem có file requirements.txt không
if not exist "requirements.txt" (
    echo ERROR: requirements.txt not found in backend folder!
    pause
    exit /b 1
)

echo Current directory: %CD%
echo Installing Python packages with pip...
echo.

REM Cài đặt dependencies với py thay vì python
py -m pip install -r requirements.txt

echo.
echo Backend dependencies installation completed!
pause