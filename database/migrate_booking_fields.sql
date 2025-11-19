-- Migration script to add new fields to bookings table
-- Run this script to update the bookings table with new booking information fields

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS adults INT DEFAULT 0 AFTER participants,
ADD COLUMN IF NOT EXISTS children INT DEFAULT 0 AFTER adults,
ADD COLUMN IF NOT EXISTS infants INT DEFAULT 0 AFTER children,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) AFTER infants,
ADD COLUMN IF NOT EXISTS email VARCHAR(255) AFTER full_name,
ADD COLUMN IF NOT EXISTS phone VARCHAR(50) AFTER email,
ADD COLUMN IF NOT EXISTS address TEXT AFTER phone,
ADD COLUMN IF NOT EXISTS base_price FLOAT DEFAULT 0.0 AFTER address,
ADD COLUMN IF NOT EXISTS adult_price FLOAT DEFAULT 0.0 AFTER base_price,
ADD COLUMN IF NOT EXISTS child_price FLOAT DEFAULT 0.0 AFTER adult_price,
ADD COLUMN IF NOT EXISTS infant_price FLOAT DEFAULT 0.0 AFTER child_price,
ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50) AFTER infant_price,
ADD COLUMN IF NOT EXISTS discount_amount FLOAT DEFAULT 0.0 AFTER discount_code,
ADD COLUMN IF NOT EXISTS payment_method ENUM('office', 'bank_transfer', 'online') DEFAULT 'office' AFTER currency,
ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid' AFTER payment_method,
ADD COLUMN IF NOT EXISTS notes TEXT AFTER status;

-- Update existing records to set adults = participants for backward compatibility
UPDATE bookings 
SET adults = participants 
WHERE adults = 0 AND participants > 0;

