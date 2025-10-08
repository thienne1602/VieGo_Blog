@echo off
echo Creating Admin User for VieGo Blog...
echo =====================================

REM Chuyển vào thư mục backend
cd /d "%~dp0backend"

echo Current directory: %CD%
echo Running admin user creation script...
echo.

REM Chạy script tạo admin với py
py create_admin.py

echo.
echo Admin user creation process completed!
pause