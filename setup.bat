@echo off
echo ========================================
echo   VieGo Blog - Development Setup
echo ========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.9+ from python.org
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from nodejs.org
    pause
    exit /b 1
)

echo [INFO] Dependencies check passed!
echo.

:: Setup Backend
echo ========================================
echo   Setting up Backend (Flask API)
echo ========================================
cd backend

:: Create virtual environment if it doesn't exist
if not exist "viego_env" (
    echo [INFO] Creating Python virtual environment...
    python -m venv viego_env
)

:: Activate virtual environment
echo [INFO] Activating virtual environment...
call viego_env\Scripts\activate.bat

:: Install Python dependencies
echo [INFO] Installing Python dependencies...
pip install -r requirements.txt

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating .env file from template...
    copy .env.example .env
    echo [WARNING] Please edit .env file with your database and API keys!
    echo [WARNING] Required: DB_PASSWORD, GOOGLE_MAPS_API_KEY, OPENAI_API_KEY
)

:: Go back to root directory
cd ..

:: Setup Frontend
echo.
echo ========================================
echo   Setting up Frontend (Next.js)
echo ========================================
cd frontend

:: Install Node.js dependencies
echo [INFO] Installing Node.js dependencies...
npm install

:: Create .env.local file if it doesn't exist
if not exist ".env.local" (
    echo [INFO] Creating frontend environment file...
    echo NEXT_PUBLIC_API_URL=http://localhost:5000 > .env.local
    echo NEXT_PUBLIC_SOCKET_URL=http://localhost:5000 >> .env.local
    echo NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here >> .env.local
)

cd ..

:: Database Setup Instructions
echo.
echo ========================================
echo   Database Setup Instructions
echo ========================================
echo [INFO] Please make sure WAMP Server is running
echo [INFO] Import database\schema.sql into MySQL via phpMyAdmin
echo [INFO] Or run: mysql -u root -p ^< database\schema.sql
echo.

:: Start Instructions
echo ========================================
echo   Starting Development Servers
echo ========================================
echo.
echo [INFO] Setup completed successfully!
echo.
echo To start the development servers:
echo.
echo 1. Start Backend (Flask API):
echo    cd backend
echo    viego_env\Scripts\activate
echo    python app.py
echo.
echo 2. Start Frontend (Next.js) in new terminal:
echo    cd frontend  
echo    npm run dev
echo.
echo 3. Access the application:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    Database: http://localhost/phpmyadmin
echo.
echo [WARNING] Make sure to:
echo - Configure WAMP Server MySQL
echo - Add API keys to backend\.env file
echo - Import database schema
echo.

pause