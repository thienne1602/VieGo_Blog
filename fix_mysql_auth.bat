@echo off
echo ========================================
echo   Fix MySQL Authentication Error
echo ========================================
echo.
echo [INFO] Loi: The server requested authentication method unknown to the client
echo [INFO] Nguyen nhan: MySQL 8.0+ dung caching_sha2_password
echo [INFO] Giai phap: Doi sang mysql_native_password
echo.

echo [STEP 1] Dang ket noi MySQL...
echo.

:: Tao file SQL tam thoi
echo USE mysql; > %TEMP%\fix_mysql_auth.sql
echo ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''; >> %TEMP%\fix_mysql_auth.sql
echo FLUSH PRIVILEGES; >> %TEMP%\fix_mysql_auth.sql
echo SELECT User, Host, plugin FROM mysql.user WHERE User='root'; >> %TEMP%\fix_mysql_auth.sql

echo [INFO] Dang thuc thi lenh SQL...
echo.

:: Tim duong dan MySQL trong WAMP
set MYSQL_PATH=C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe

:: Neu khong tim thay, thu cac phien ban khac
if not exist "%MYSQL_PATH%" (
    echo [WARNING] Khong tim thay MySQL 8.0.27, dang tim phien ban khac...
    for /d %%d in (C:\wamp64\bin\mysql\mysql*) do (
        if exist "%%d\bin\mysql.exe" (
            set MYSQL_PATH=%%d\bin\mysql.exe
            echo [INFO] Tim thay: %%d\bin\mysql.exe
            goto :found
        )
    )
    echo [ERROR] Khong tim thay MySQL trong WAMP Server
    echo [INFO] Vui long chay lenh SQL thu cong:
    echo.
    type %TEMP%\fix_mysql_auth.sql
    echo.
    pause
    exit /b 1
)

:found
echo [INFO] Su dung MySQL: %MYSQL_PATH%
echo.

:: Chay lenh SQL
"%MYSQL_PATH%" -u root --password="" < %TEMP%\fix_mysql_auth.sql

if errorlevel 1 (
    echo.
    echo [ERROR] Khong the ket noi MySQL!
    echo.
    echo ========================================
    echo   CACH SUA THU CONG:
    echo ========================================
    echo.
    echo 1. Mo WAMP Server Manager
    echo 2. Click: MySQL ^> MySQL Console
    echo 3. Nhan Enter (password trong)
    echo 4. Chay cac lenh sau:
    echo.
    echo    ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
    echo    FLUSH PRIVILEGES;
    echo    EXIT;
    echo.
    echo 5. Khoi dong lai WAMP Server
    echo.
) else (
    echo.
    echo [SUCCESS] Da sua thanh cong!
    echo.
    echo ========================================
    echo   THONG TIN DANG NHAP
    echo ========================================
    echo.
    echo - URL: http://localhost/phpmyadmin
    echo - Username: root
    echo - Password: (de trong)
    echo.
    echo [INFO] Vui long khoi dong lai WAMP Server
    echo [INFO] Chay file: restart_phpmyadmin.bat
    echo.
)

:: Xoa file tam
del %TEMP%\fix_mysql_auth.sql

pause
