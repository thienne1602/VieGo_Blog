@echo off
echo ========================================
echo   RESET MAT KHAU MySQL WAMP Server
echo ========================================
echo.
echo [WARNING] Script nay se RESET mat khau root ve RONG!
echo [INFO] Vui long dong tat moi ung dung dang su dung MySQL
echo.
pause
echo.

echo [STEP 1] Dung MySQL service...
net stop wampmysqld
timeout /t 2 /nobreak >NUL

echo.
echo [STEP 2] Tao file reset password...
set TEMP_SQL=%TEMP%\mysql_reset.txt
echo USE mysql; > "%TEMP_SQL%"
echo UPDATE user SET authentication_string='' WHERE User='root'; >> "%TEMP_SQL%"
echo UPDATE user SET plugin='mysql_native_password' WHERE User='root'; >> "%TEMP_SQL%"
echo FLUSH PRIVILEGES; >> "%TEMP_SQL%"

echo.
echo [STEP 3] Khoi dong MySQL che do safe mode (skip grant tables)...
start "MySQL Safe Mode" /MIN "D:\wamp\bin\mysql\mysql5.7.31\bin\mysqld.exe" --init-file="%TEMP_SQL%" --console --skip-grant-tables

echo [INFO] Cho MySQL khoi dong (10 giay)...
timeout /t 10 /nobreak

echo.
echo [STEP 4] Dung MySQL safe mode...
taskkill /F /IM mysqld.exe 2>NUL
timeout /t 3 /nobreak >NUL

echo.
echo [STEP 5] Khoi dong lai MySQL binh thuong...
net start wampmysqld

echo.
echo ========================================
echo   HOAN THANH!
echo ========================================
echo.
echo [SUCCESS] Mat khau root da duoc reset ve RONG
echo [INFO] Ban co the dang nhap phpMyAdmin voi:
echo.
echo   Username: root
echo   Password: (de trong)
echo.
echo [INFO] URL: http://localhost/phpmyadmin
echo.

:: Xoa file tam
del "%TEMP_SQL%" 2>NUL

pause
