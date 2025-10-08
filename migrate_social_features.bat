@echo off
REM Update database schema with social features columns
echo ============================================================
echo   VieGo Blog - Database Migration (Social Features)
echo ============================================================
echo.

cd /d "%~dp0database"

echo Running migration script...
echo.
py add_social_features.py

echo.
echo ============================================================
echo   Migration Complete!
echo ============================================================
echo.
echo Press any key to exit...
pause >nul
