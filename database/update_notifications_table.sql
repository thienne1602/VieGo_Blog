-- Update notifications table to add missing columns
-- This script safely adds missing columns to the existing notifications table

USE viego_blog;

-- Add related_type column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND COLUMN_NAME = 'related_type');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notifications ADD COLUMN related_type VARCHAR(50) AFTER message;',
    'SELECT "Column related_type already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add related_id column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND COLUMN_NAME = 'related_id');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notifications ADD COLUMN related_id INT AFTER related_type;',
    'SELECT "Column related_id already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add actor_id column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND COLUMN_NAME = 'actor_id');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notifications ADD COLUMN actor_id INT AFTER related_id;',
    'SELECT "Column actor_id already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_seen column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND COLUMN_NAME = 'is_seen');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notifications ADD COLUMN is_seen BOOLEAN DEFAULT FALSE AFTER is_read;',
    'SELECT "Column is_seen already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add metadata column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND COLUMN_NAME = 'metadata');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notifications ADD COLUMN metadata TEXT AFTER is_seen;',
    'SELECT "Column metadata already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add action_url column if it doesn't exist, or rename 'link' to 'action_url'
SET @link_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND COLUMN_NAME = 'link');
SET @action_url_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND COLUMN_NAME = 'action_url');

SET @sql = IF(@action_url_exists = 0 AND @link_exists > 0,
    'ALTER TABLE notifications CHANGE COLUMN link action_url VARCHAR(500);',
    IF(@action_url_exists = 0,
        'ALTER TABLE notifications ADD COLUMN action_url VARCHAR(500) AFTER metadata;',
        'SELECT "Column action_url already exists";'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add read_at column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND COLUMN_NAME = 'read_at');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notifications ADD COLUMN read_at DATETIME AFTER action_url;',
    'SELECT "Column read_at already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add seen_at column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND COLUMN_NAME = 'seen_at');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notifications ADD COLUMN seen_at DATETIME AFTER read_at;',
    'SELECT "Column seen_at already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify title to allow NULL
ALTER TABLE notifications MODIFY COLUMN title VARCHAR(255) NULL;

-- Modify message to be NOT NULL
ALTER TABLE notifications MODIFY COLUMN message TEXT NOT NULL;

-- Add foreign key for actor_id if it doesn't exist
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME LIKE '%actor%');
SET @fk_name = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME LIKE '%actor%'
    LIMIT 1);
SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE notifications ADD CONSTRAINT notifications_ibfk_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;',
    'SELECT "FK actor_id already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create indexes if they don't exist
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND INDEX_NAME = 'idx_user_id');
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_user_id ON notifications(user_id);',
    'SELECT "Index idx_user_id already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND INDEX_NAME = 'idx_type');
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_type ON notifications(type);',
    'SELECT "Index idx_type already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND INDEX_NAME = 'idx_is_read');
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_is_read ON notifications(is_read);',
    'SELECT "Index idx_is_read already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'viego_blog' 
    AND TABLE_NAME = 'notifications' 
    AND INDEX_NAME = 'idx_created_at');
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_created_at ON notifications(created_at);',
    'SELECT "Index idx_created_at already exists";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update table comment
ALTER TABLE notifications COMMENT = 'Stores user notifications for likes, comments, messages, etc.';

SELECT 'Notifications table updated successfully!' AS Status;
