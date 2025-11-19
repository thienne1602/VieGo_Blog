-- Migration script to add 'audio' to message_type ENUM in chats table
-- Run this script to update the chats table with audio message type support

USE viego_blog;

-- Modify the ENUM column to include 'audio'
-- Note: MySQL doesn't support direct ALTER ENUM to add values, so we need to:
-- 1. Create a new column with the updated ENUM
-- 2. Copy data
-- 3. Drop old column
-- 4. Rename new column

-- Step 1: Add new column with updated ENUM
ALTER TABLE chats 
ADD COLUMN message_type_new ENUM('text', 'image', 'audio', 'file', 'location', 'system') DEFAULT 'text' AFTER message;

-- Step 2: Copy data from old column to new column
UPDATE chats 
SET message_type_new = message_type;

-- Step 3: Drop old column
ALTER TABLE chats 
DROP COLUMN message_type;

-- Step 4: Rename new column to original name
ALTER TABLE chats 
CHANGE COLUMN message_type_new message_type ENUM('text', 'image', 'audio', 'file', 'location', 'system') DEFAULT 'text';

