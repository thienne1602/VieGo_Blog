@echo off
echo ========================================
echo   Khoi dong lai phpMyAdmin/WAMP Server
echo ========================================
echo.

:: Kiem tra xem WAMP Server co dang chay khong
tasklist /FI "IMAGENAME eq wampmanager.exe" 2>NUL | find /I /N "wampmanager.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [INFO] WAMP Server dang chay. Dang dung lai...
    
    :: Dung Apache
    echo [INFO] Dang dung Apache...
    net stop wampapache64 2>NUL
    if errorlevel 1 (
        echo [WARNING] Khong the dung Apache bang net stop, thu phuong phap khac...
        taskkill /F /IM httpd.exe 2>NUL
    )
    
    :: Dung MySQL
    echo [INFO] Dang dung MySQL...
    net stop wampmysqld64 2>NUL
    if errorlevel 1 (
        echo [WARNING] Khong the dung MySQL bang net stop, thu phuong phap khac...
        taskkill /F /IM mysqld.exe 2>NUL
    )
    
    :: Cho 3 giay
    echo [INFO] Cho 3 giay...
    timeout /t 3 /nobreak >NUL
    
) else (
    echo [INFO] WAMP Server chua chay.
)

echo.
echo [INFO] Dang khoi dong lai cac dich vu...
echo.

:: Khoi dong Apache
echo [INFO] Dang khoi dong Apache...
net start wampapache64 2>NUL
if errorlevel 1 (
    echo [WARNING] Khong the khoi dong Apache tu dong.
    echo [INFO] Vui long khoi dong thu cong qua WAMP Manager.
)

:: Khoi dong MySQL
echo [INFO] Dang khoi dong MySQL...
net start wampmysqld64 2>NUL
if errorlevel 1 (
    echo [WARNING] Khong the khoi dong MySQL tu dong.
    echo [INFO] Vui long khoi dong thu cong qua WAMP Manager.
)

echo.
echo ========================================
echo   Kiem tra trang thai dich vu
echo ========================================

:: Kiem tra Apache
tasklist /FI "IMAGENAME eq httpd.exe" 2>NUL | find /I /N "httpd.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Apache dang chay
) else (
    echo [ERROR] Apache chua chay
)

:: Kiem tra MySQL
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL dang chay
) else (
    echo [ERROR] MySQL chua chay
)

echo.
echo ========================================
echo   Thong tin truy cap
echo ========================================
echo.
echo - phpMyAdmin: http://localhost/phpmyadmin
echo - WAMP Server: http://localhost
echo.
echo [INFO] Neu cac dich vu khong khoi dong duoc tu dong,
echo [INFO] vui long mo WAMP Manager va khoi dong thu cong.
echo.
echo [TIP] Nhan chuot phai vao icon WAMP o System Tray
echo [TIP] va chon "Restart All Services"
echo.
pause
