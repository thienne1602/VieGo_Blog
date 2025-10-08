@echo off
echo Testing VieGo Blog Backend...
echo ============================

REM Chuyển vào thư mục backend
cd /d "%~dp0backend"

echo Current directory: %CD%
echo Running backend tests...
echo.

REM Chạy các test với py thay vì python
echo Running available tests...
echo Note: Individual test files have been cleaned up.
echo Use pytest or the API test endpoints in routes/test.py

echo.
echo Testing API endpoints via routes/test.py...
echo You can test API by running the backend server and visiting:
echo - http://localhost:5000/api/test/database
echo - http://localhost:5000/api/test/auth/test-login

echo.
echo Backend test check completed!
pause