@echo off
echo ============================================
echo VieGo Blog - Tour Itinerary System Setup
echo ============================================
echo.

echo [1/3] Running database migration...
"E:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root viego_blog < "%~dp0..\..\database\migrate_tour_itinerary_system.sql"

if %errorlevel% neq 0 (
    echo [ERROR] Migration failed!
    pause
    exit /b 1
)

echo [OK] Migration completed successfully!
echo.
echo [2/3] Tables created:
echo   - tour_itinerary_templates
echo   - tour_itinerary_days
echo   - booking_itinerary_days
echo   - itinerary_checkpoints
echo   - checkpoint_checkins
echo.

echo [3/3] Creating upload directory...
if not exist "%~dp0..\..\uploads\checkpoint_photos" (
    mkdir "%~dp0..\..\uploads\checkpoint_photos"
    echo [OK] Created uploads\checkpoint_photos directory
) else (
    echo [OK] Upload directory already exists
)

echo.
echo ============================================
echo Setup completed successfully!
echo ============================================
echo.
echo Next steps:
echo 1. Start backend: run_backend.bat
echo 2. Start frontend: run_frontend.bat
echo 3. Read documentation: TOUR_ITINERARY_SYSTEM.md
echo.
echo API endpoints available at:
echo   - POST /api/itinerary/templates
echo   - POST /api/itinerary/checkins/{id}/checkin
echo   - POST /api/itinerary/checkins/{id}/photos
echo   - GET  /api/itinerary/bookings/{id}/progress
echo.
pause
