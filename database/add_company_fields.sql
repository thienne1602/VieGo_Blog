-- Migration: Add company information fields to users table
-- Run this script to add company fields for sellers

USE viego_blog;

-- Add company information columns if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) NULL 
COMMENT 'Tên công ty';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_address TEXT NULL 
COMMENT 'Địa chỉ công ty';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50) NULL 
COMMENT 'Số điện thoại công ty';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_tax_id VARCHAR(50) NULL 
COMMENT 'Mã số thuế';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_email VARCHAR(255) NULL 
COMMENT 'Email công ty (để hiển thị trong booking)';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100) NULL 
COMMENT 'Số tài khoản ngân hàng';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255) NULL 
COMMENT 'Tên ngân hàng';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255) NULL 
COMMENT 'Chủ tài khoản';

-- Show confirmation
SELECT 'Migration completed: Company information fields added to users table' AS status;

