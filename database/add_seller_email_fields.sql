-- Migration: Add seller email fields to users table
-- Run this script to add seller_email and seller_email_password columns

USE viego_blog;

-- Add seller_email column if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS seller_email VARCHAR(255) NULL 
COMMENT 'Email address for seller to send booking confirmation emails';

-- Add seller_email_password column if not exists  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS seller_email_password VARCHAR(255) NULL 
COMMENT 'Encrypted password for seller email (bcrypt hashed)';

-- Show confirmation
SELECT 'Migration completed: seller_email and seller_email_password columns added' AS status;

