@echo off
echo ============================================
echo CLEANING UP DEBUG AND TEST FILES
echo ============================================
echo.

echo Removing test scripts...
del /Q test_*.py 2>nul
del /Q check_*.py 2>nul
del /Q fix_*.py 2>nul

echo Removing debug HTML files...
del /Q admin-fix-tool.html 2>nul
del /Q clear-cache-and-login.html 2>nul

echo Removing temporary documentation...
del /Q ADMIN_DASHBOARD_FIX.md 2>nul
del /Q ADMIN_QUICK_FIX.md 2>nul
del /Q FIX_ADMIN_STEPS.md 2>nul
del /Q RESTART_BACKEND_NOW.md 2>nul
del /Q BACKEND_FIX_REPORT.md 2>nul
del /Q LOGIN_FIX_REPORT.md 2>nul
del /Q AUDIT_REPORT.md 2>nul
del /Q HIGH_PRIORITY_FIXES.md 2>nul
del /Q STRUCTURE_AUDIT.md 2>nul

echo.
echo ============================================
echo CLEANUP COMPLETE!
echo ============================================
echo.
echo Remaining important files:
echo   - README.md (Project documentation)
echo   - ADMIN_DASHBOARD_COMPLETE_FIX.md (Fix history)
echo   - QUICKSTART.md (Quick start guide)
echo   - *.bat files (Setup and run scripts)
echo.
echo All test and debug files have been removed.
pause
