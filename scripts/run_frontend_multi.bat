@echo off
cls

REM Get client count from parameter (default 2)
set CLIENT_COUNT=%1
if "%CLIENT_COUNT%"=="" set CLIENT_COUNT=2

echo.
echo ======================================================================
echo.
echo        VIEGO BLOG - MULTI-CLIENT FRONTEND LAUNCHER
echo.
echo ======================================================================
echo.

REM Setup Node.js v20
set "NODE_PATH=C:\laragon\bin\nodejs\node-v20"
set "PATH=%NODE_PATH%;%PATH%"

REM Check Node.js
echo Checking Node.js v20...
"%NODE_PATH%\node.exe" --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js v20 not found!
    pause
    exit /b 1
)

REM Check frontend directory
if not exist "%~dp0..\frontend" (
    echo ERROR: Frontend directory does not exist!
    pause
    exit /b 1
)

cd /d "%~dp0..\frontend"

echo Starting %CLIENT_COUNT% frontend clients...
echo.

REM Start clients sequentially with proper delays
for /L %%i in (1,1,%CLIENT_COUNT%) do (
    setlocal enabledelayedexpansion
    set /A port=3000 + %%i - 1

    echo Starting client %%i on port !port!...

    REM Create completely separate directory structure for each client
    set "CLIENT_DIR=%~dp0..\frontend_client_%%i"
    echo CLIENT_DIR path: "!CLIENT_DIR!"
    echo Source path: "%~dp0..\frontend"
    if not exist "!CLIENT_DIR!\frontend" (
        echo Creating separate client directory for client %%i...
        mkdir "!CLIENT_DIR!" 2>nul
        mkdir "!CLIENT_DIR!\frontend" 2>nul
        echo Created directories, checking if they exist...
        if exist "!CLIENT_DIR!" echo CLIENT_DIR exists
        if exist "!CLIENT_DIR!\frontend" echo Frontend dir exists

        echo Copying frontend files...
        robocopy "%~dp0..\frontend" "!CLIENT_DIR!\frontend" /E /NFL /NDL /NJH /NJS /NC /NS /NP

        REM Always ensure public directory is copied properly
        echo Ensuring public directory is copied...
        mkdir "!CLIENT_DIR!\frontend\public" 2>nul
        xcopy "%~dp0..\frontend\public" "!CLIENT_DIR!\frontend\public\" /E /I /H /Y /C >nul 2>&1

        REM Verify that public directory was copied
        if exist "!CLIENT_DIR!\frontend\public\locales\zh\tours.json" (
            echo Public directory and locales copied successfully
        ) else (
            echo ERROR: Public directory or locales not found
            if exist "!CLIENT_DIR!\frontend\public" (
                echo Public directory exists but locales missing
            ) else (
                echo Public directory does not exist
            )
        )

        if not exist "!CLIENT_DIR!\frontend\package.json" (
            echo ERROR: Failed to copy essential files for client %%i
            pause
            exit /b 1
        )
    )

    REM Start client in completely separate directory
    REM Create a batch file for this client to avoid complex command line issues
    set "CLIENT_BATCH=!CLIENT_DIR!\start_client_%%i.bat"

    REM Create the batch file content
    (
        echo @echo off
        echo chcp 65001 ^>nul
        echo set "NODE_PATH=%NODE_PATH%"
        echo set "PATH=%%NODE_PATH%%;%%PATH%%"
        echo cd /d "!CLIENT_DIR!\frontend"
        echo if not exist node_modules ^(
        echo     echo Installing dependencies for client %%i...
        echo     call "%%NODE_PATH%%\npm.cmd" install
        echo ^)
        echo set PORT=!port!
        echo set NEXT_TELEMETRY_DISABLED=1
        echo call "%%NODE_PATH%%\npm.cmd" run dev
        echo pause
    ) > "!CLIENT_BATCH!"

    REM Start the client using the batch file
    start "Frontend Client %%i (Port !port!)" "!CLIENT_BATCH!"

    REM Wait between starts
    if %%i lss %CLIENT_COUNT% (
        echo Waiting 10 seconds before starting next client...
        timeout /t 10 /nobreak >nul
    )

    endlocal
)

echo.
echo All %CLIENT_COUNT% clients started successfully!
echo Client URLs:
for /L %%i in (1,1,%CLIENT_COUNT%) do (
    setlocal enabledelayedexpansion
    set /A port=3000 + %%i - 1
    echo    Client %%i: http://localhost:!port!
    endlocal
)
echo.
echo Each client runs in its own window and directory
echo Close individual windows to stop specific clients
echo.
pause
