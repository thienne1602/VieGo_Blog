-- Migration: Add new features for tour participants, assignments, and progress tracking
-- Date: 2025-11-16
-- Description: 
--   1. Add 'tour_guide' role to users
--   2. Create booking_participants table
--   3. Create tour_assignments table
--   4. Create tour_progress table

-- Step 1: Add 'tour_guide' role to users table
ALTER TABLE users 
MODIFY COLUMN role ENUM('user', 'moderator', 'admin', 'seller', 'editor', 'tour_guide') DEFAULT 'user';

-- Step 2: Create booking_participants table
CREATE TABLE IF NOT EXISTS booking_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    
    -- Participant information
    full_name VARCHAR(255) NOT NULL,
    gender ENUM('male', 'female', 'other') NULL,
    date_of_birth DATE NULL,
    id_number VARCHAR(50) NULL COMMENT 'CMND/CCCD',
    passport_number VARCHAR(50) NULL,
    phone VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    
    -- Participant type and special requirements
    participant_type ENUM('adult', 'child', 'infant') DEFAULT 'adult',
    special_requirements TEXT NULL COMMENT 'Dietary restrictions, medical conditions, etc.',
    
    -- Emergency contact
    emergency_contact_name VARCHAR(255) NULL,
    emergency_contact_phone VARCHAR(50) NULL,
    emergency_contact_relationship VARCHAR(100) NULL,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_booking_id (booking_id),
    INDEX idx_participant_type (participant_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Create tour_assignments table
CREATE TABLE IF NOT EXISTS tour_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    tour_guide_id INT NULL,
    
    -- Assignment details
    assigned_by INT NULL COMMENT 'Seller who made the assignment',
    assignment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    status ENUM('assigned', 'accepted', 'in_progress', 'completed', 'cancelled') DEFAULT 'assigned',
    
    -- Notes
    notes TEXT NULL,
    guide_notes TEXT NULL COMMENT 'Notes from tour guide',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (tour_guide_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_booking_id (booking_id),
    INDEX idx_tour_guide_id (tour_guide_id),
    INDEX idx_status (status),
    INDEX idx_assignment_date (assignment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Create tour_progress table
CREATE TABLE IF NOT EXISTS tour_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    
    -- Checkpoint information
    checkpoint_name VARCHAR(255) NOT NULL,
    checkpoint_description TEXT NULL,
    checkpoint_order INT NOT NULL,
    
    -- Location data
    location_name VARCHAR(255) NULL,
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    
    -- Progress status
    status ENUM('pending', 'in_progress', 'completed', 'skipped') DEFAULT 'pending',
    
    -- Images and media
    images TEXT NULL COMMENT 'JSON array of image URLs',
    
    -- Notes and updates
    notes TEXT NULL,
    updated_by INT NULL COMMENT 'Tour guide who updated',
    
    -- Timestamps
    scheduled_time DATETIME NULL COMMENT 'Planned arrival time',
    arrival_time DATETIME NULL COMMENT 'Actual arrival time',
    departure_time DATETIME NULL COMMENT 'Actual departure time',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_booking_id (booking_id),
    INDEX idx_checkpoint_order (checkpoint_order),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SHOW TABLES LIKE '%participant%';
SHOW TABLES LIKE '%assignment%';
SHOW TABLES LIKE '%progress%';
