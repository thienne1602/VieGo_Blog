-- Migration script to sync User table with updated model
-- Run this in phpMyAdmin or MySQL command line

USE viego_blog;

-- 1. Rename email_verified to is_verified
ALTER TABLE users 
CHANGE COLUMN email_verified is_verified BOOLEAN DEFAULT FALSE;

-- 2. Add cover_image_url column
ALTER TABLE users 
ADD COLUMN cover_image_url VARCHAR(255) AFTER avatar_url;

-- 3. Add language column
ALTER TABLE users 
ADD COLUMN language VARCHAR(10) DEFAULT 'vi' AFTER location;

-- 4. Add timezone column
ALTER TABLE users 
ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh' AFTER language;

-- 5. Remove website column if exists (optional, only if you want to clean up)
-- ALTER TABLE users DROP COLUMN website;

-- Verify changes
DESCRIBE users;

-- Show sample data
SELECT id, username, email, is_verified, cover_image_url, language, timezone 
FROM users 
LIMIT 5;
