-- Add missing columns to users table for VieGo Blog
-- Run with: mysql -u root viego_blog < fix_users_schema.sql

USE viego_blog;

-- Add cover_image_url if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500) NULL;

-- Add is_verified if not exists  
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) DEFAULT 0;

-- Add email_verified if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) DEFAULT 0;

-- Add points if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT DEFAULT 0 NOT NULL;

-- Add level if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1 NOT NULL;

-- Add badges if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS badges TEXT NULL;

-- Add location if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL;

-- Add language if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'vi';

-- Add timezone if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh';

-- Add social_links if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links TEXT NULL;

-- Add bookmarks if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS bookmarks TEXT NULL;

-- Add liked_posts if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS liked_posts TEXT NULL;

-- Add following if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS following TEXT NULL;

-- Add followers if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers TEXT NULL;

SELECT 'Users table schema updated successfully!' AS message;
