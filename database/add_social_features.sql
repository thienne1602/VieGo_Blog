-- Add social features columns to users table
-- These columns store JSON data for bookmarks, likes, follows, and followers

USE viego_blog;

-- Add bookmarks column (stores array of post IDs)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bookmarks JSON DEFAULT NULL COMMENT 'Array of bookmarked post IDs';

-- Add liked_posts column (stores array of post IDs)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS liked_posts JSON DEFAULT NULL COMMENT 'Array of liked post IDs';

-- Add following column (stores array of user IDs)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS following JSON DEFAULT NULL COMMENT 'Array of user IDs this user follows';

-- Add followers column (stores array of user IDs)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS followers JSON DEFAULT NULL COMMENT 'Array of user IDs following this user';

-- Initialize NULL values to empty arrays for existing users
UPDATE users 
SET 
    bookmarks = JSON_ARRAY(),
    liked_posts = JSON_ARRAY(),
    following = JSON_ARRAY(),
    followers = JSON_ARRAY()
WHERE 
    bookmarks IS NULL 
    OR liked_posts IS NULL 
    OR following IS NULL 
    OR followers IS NULL;

-- Show the updated table structure
DESCRIBE users;

SELECT 'Social features columns added successfully!' AS status;
