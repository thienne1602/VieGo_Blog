-- Fix user table to ensure points and level are NOT NULL with proper defaults
-- Run this to fix existing database

USE viego_blog;

-- Update any existing NULL values to defaults
UPDATE users SET points = 0 WHERE points IS NULL;
UPDATE users SET level = 1 WHERE level IS NULL;

-- Alter columns to add NOT NULL constraint
ALTER TABLE users MODIFY COLUMN points INT NOT NULL DEFAULT 0;
ALTER TABLE users MODIFY COLUMN level INT NOT NULL DEFAULT 1;

-- Verify the changes
SELECT 
    COLUMN_NAME, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'viego_blog' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME IN ('points', 'level');
