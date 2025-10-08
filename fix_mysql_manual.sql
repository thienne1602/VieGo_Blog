-- =============================================
-- Fix MySQL Authentication Error (HY000/2054)
-- =============================================
-- Error: The server requested authentication method unknown to the client
-- Solution: Change from caching_sha2_password to mysql_native_password

-- Kiem tra plugin hien tai
SELECT User, Host, plugin FROM mysql.user WHERE User='root';

-- Doi sang mysql_native_password (khong mat khau)
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';

-- Hoac neu muon dat mat khau '123456':
-- ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';

-- Cap nhat quyen
FLUSH PRIVILEGES;

-- Kiem tra lai
SELECT User, Host, plugin FROM mysql.user WHERE User='root';

-- =============================================
-- CACH CHAY FILE NAY:
-- =============================================
-- Cach 1: Tu MySQL Console (WAMP Manager > MySQL > MySQL Console)
--   mysql> source D:\project\VieGo_Blog\fix_mysql_manual.sql
--
-- Cach 2: Tu Command Line
--   mysql -u root -p < fix_mysql_manual.sql
--
-- Cach 3: Chay tung lenh trong phpMyAdmin (tab SQL)
-- =============================================
