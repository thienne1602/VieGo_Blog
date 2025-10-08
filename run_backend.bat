@echo off
echo Starting VieGo Blog Backend Server...
echo =====================================

REM Chuyển vào thư mục backend
cd /d "%~dp0backend"

REM Kiểm tra xem có file main.py không
if not exist "main.py" (
    echo ERROR: main.py not found in backend folder!
    pause
    exit /b 1
)

REM Hiển thị thư mục hiện tại
echo Current directory: %CD%
echo Running: py main.py
echo.

REM Chạy server với py thay vì python
py main.py

REM Nếu server thoát, hiển thị thông báo
echo.
echo Backend server has stopped.
pause