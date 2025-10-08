@echo off
echo VieGo Blog - Quick Setup Script
echo ===============================
echo This script will install all dependencies for both backend and frontend
echo.

echo Step 1/2: Installing Backend Dependencies...
call "%~dp0install_backend_deps.bat"

echo.
echo Step 2/2: Installing Frontend Dependencies...
call "%~dp0install_frontend_deps.bat"

echo.
echo ===============================
echo Setup completed successfully!
echo ===============================
echo.
echo You can now use:
echo - run_backend.bat     : Start backend server only
echo - run_frontend.bat    : Start frontend server only  
echo - run_fullstack.bat   : Start both servers
echo - test_backend.bat    : Run backend tests
echo.
pause