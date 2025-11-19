-- Add extra_data column to notifications table
-- This is needed because the model uses extra_data but database might not have it

USE viego_blog;

-- Check if extra_data column exists, if not add it
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND COLUMN_NAME = 'extra_data');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notifications ADD COLUMN extra_data TEXT AFTER action_url;',
    'SELECT "Column extra_data already exists";');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

