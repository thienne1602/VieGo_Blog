-- Migration: Tour Itinerary System with Check-in Features
-- Date: 2025-11-16
-- Description: 
--   1. Create tour_itinerary_templates - Mẫu lịch trình cho mỗi tour
--   2. Create tour_itinerary_days - Chi tiết từng ngày trong lịch trình
--   3. Create booking_itinerary_days - Lịch trình cụ thể cho từng booking
--   4. Create itinerary_checkpoints - Các checkpoint trong ngày
--   5. Create checkpoint_checkins - Check-in và upload ảnh từ hướng dẫn viên

USE viego_blog;

-- =====================================================
-- Step 1: Tour Itinerary Templates (Mẫu lịch trình tour)
-- =====================================================
CREATE TABLE IF NOT EXISTS tour_itinerary_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    template_name VARCHAR(255) NOT NULL COMMENT 'Tên mẫu lịch trình',
    
    -- Template details
    total_days INT NOT NULL,
    total_nights INT NOT NULL DEFAULT 0,
    description TEXT NULL COMMENT 'Mô tả tổng quan lịch trình',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Template đang sử dụng',
    version INT DEFAULT 1 COMMENT 'Phiên bản lịch trình',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL COMMENT 'Seller tạo template',
    
    -- Foreign keys
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_tour_id (tour_id),
    INDEX idx_is_active (is_active),
    
    UNIQUE KEY unique_tour_template (tour_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 2: Tour Itinerary Days (Chi tiết từng ngày)
-- =====================================================
CREATE TABLE IF NOT EXISTS tour_itinerary_days (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    
    -- Day information
    day_number INT NOT NULL COMMENT 'Ngày thứ mấy (1, 2, 3...)',
    day_title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề ngày VD: Ngày 1 - Khám phá Hà Nội',
    day_description TEXT NULL COMMENT 'Mô tả tổng quan ngày',
    
    -- Meals included
    breakfast BOOLEAN DEFAULT FALSE,
    lunch BOOLEAN DEFAULT FALSE,
    dinner BOOLEAN DEFAULT FALSE,
    
    -- Accommodation
    accommodation VARCHAR(255) NULL COMMENT 'Nơi nghỉ trong ngày',
    accommodation_type ENUM('hotel', 'homestay', 'resort', 'camping', 'none') DEFAULT 'hotel',
    
    -- Transportation
    transportation VARCHAR(255) NULL COMMENT 'Phương tiện di chuyển',
    
    -- Timing
    estimated_duration_hours DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Thời gian ước tính (giờ)',
    
    -- Additional info
    notes TEXT NULL COMMENT 'Ghi chú cho ngày',
    special_requirements TEXT NULL COMMENT 'Yêu cầu đặc biệt',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (template_id) REFERENCES tour_itinerary_templates(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_template_id (template_id),
    INDEX idx_day_number (day_number),
    
    UNIQUE KEY unique_template_day (template_id, day_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 3: Booking Itinerary Days (Lịch trình thực tế cho booking)
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_itinerary_days (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    template_day_id INT NULL COMMENT 'Tham chiếu đến template, NULL nếu custom',
    
    -- Day information
    day_number INT NOT NULL,
    actual_date DATE NOT NULL COMMENT 'Ngày thực tế thực hiện',
    day_title VARCHAR(255) NOT NULL,
    day_description TEXT NULL,
    
    -- Status tracking
    status ENUM('not_started', 'in_progress', 'completed', 'cancelled', 'postponed') DEFAULT 'not_started',
    
    -- Actual details (có thể khác với template)
    actual_breakfast BOOLEAN DEFAULT FALSE,
    actual_lunch BOOLEAN DEFAULT FALSE,
    actual_dinner BOOLEAN DEFAULT FALSE,
    actual_accommodation VARCHAR(255) NULL,
    actual_transportation VARCHAR(255) NULL,
    
    -- Progress
    progress_percentage INT DEFAULT 0 COMMENT 'Tiến độ hoàn thành (%)',
    completed_checkpoints INT DEFAULT 0,
    total_checkpoints INT DEFAULT 0,
    
    -- Timing
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    
    -- Notes
    guide_notes TEXT NULL COMMENT 'Ghi chú từ hướng dẫn viên',
    admin_notes TEXT NULL,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (template_day_id) REFERENCES tour_itinerary_days(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_booking_id (booking_id),
    INDEX idx_actual_date (actual_date),
    INDEX idx_status (status),
    
    UNIQUE KEY unique_booking_day (booking_id, day_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 4: Itinerary Checkpoints (Các điểm check trong ngày)
-- =====================================================
CREATE TABLE IF NOT EXISTS itinerary_checkpoints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    itinerary_day_id INT NOT NULL COMMENT 'Thuộc ngày nào trong template',
    
    -- Checkpoint information
    checkpoint_order INT NOT NULL COMMENT 'Thứ tự checkpoint trong ngày (1, 2, 3...)',
    checkpoint_name VARCHAR(255) NOT NULL COMMENT 'Tên checkpoint VD: Hồ Hoàn Kiếm',
    checkpoint_type ENUM('attraction', 'restaurant', 'hotel', 'activity', 'transport', 'rest', 'photo_spot', 'shopping', 'other') DEFAULT 'attraction',
    
    -- Description
    description TEXT NULL COMMENT 'Mô tả hoạt động tại checkpoint',
    
    -- Location
    location_name VARCHAR(255) NULL,
    location_address VARCHAR(500) NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    
    -- Timing
    scheduled_time TIME NULL COMMENT 'Giờ dự kiến đến',
    estimated_duration_minutes INT DEFAULT 30 COMMENT 'Thời gian dự kiến (phút)',
    
    -- Media and content
    images TEXT NULL COMMENT 'JSON array - Ảnh mẫu của checkpoint',
    tips TEXT NULL COMMENT 'Tips cho du khách',
    warnings TEXT NULL COMMENT 'Cảnh báo/lưu ý',
    
    -- Requirements
    is_mandatory BOOLEAN DEFAULT TRUE COMMENT 'Checkpoint bắt buộc hay tùy chọn',
    requires_photo BOOLEAN DEFAULT FALSE COMMENT 'Yêu cầu chụp ảnh check-in',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (itinerary_day_id) REFERENCES tour_itinerary_days(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_itinerary_day_id (itinerary_day_id),
    INDEX idx_checkpoint_order (checkpoint_order),
    INDEX idx_checkpoint_type (checkpoint_type),
    
    UNIQUE KEY unique_day_checkpoint (itinerary_day_id, checkpoint_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 5: Checkpoint Check-ins (Check-in và upload ảnh)
-- =====================================================
CREATE TABLE IF NOT EXISTS checkpoint_checkins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_day_id INT NOT NULL COMMENT 'Ngày thực tế của booking',
    checkpoint_id INT NOT NULL COMMENT 'Checkpoint trong template',
    
    -- Check-in information
    status ENUM('pending', 'checked_in', 'skipped', 'cancelled') DEFAULT 'pending',
    
    -- Timing
    scheduled_time DATETIME NULL COMMENT 'Giờ dự kiến',
    actual_checkin_time DATETIME NULL COMMENT 'Giờ check-in thực tế',
    actual_checkout_time DATETIME NULL COMMENT 'Giờ rời khỏi điểm',
    duration_minutes INT NULL COMMENT 'Thời gian thực tế ở checkpoint (phút)',
    
    -- Location verification
    checkin_latitude DECIMAL(10, 8) NULL COMMENT 'Vị trí check-in thực tế',
    checkin_longitude DECIMAL(11, 8) NULL,
    distance_from_checkpoint DECIMAL(10, 2) NULL COMMENT 'Khoảng cách từ vị trí dự kiến (m)',
    
    -- Photos and media
    photos TEXT NULL COMMENT 'JSON array - URLs ảnh check-in từ hướng dẫn viên',
    photo_count INT DEFAULT 0,
    
    -- Notes and feedback
    guide_notes TEXT NULL COMMENT 'Ghi chú từ hướng dẫn viên',
    participants_feedback TEXT NULL COMMENT 'Phản hồi từ khách tham gia',
    weather_condition VARCHAR(100) NULL COMMENT 'Điều kiện thời tiết',
    
    -- Issues and resolutions
    had_issues BOOLEAN DEFAULT FALSE,
    issue_description TEXT NULL,
    issue_resolution TEXT NULL,
    
    -- Person who checked in
    checked_in_by INT NULL COMMENT 'Hướng dẫn viên check-in',
    
    -- Visibility
    is_visible_to_participants BOOLEAN DEFAULT TRUE COMMENT 'Hiển thị cho khách tham gia',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (booking_day_id) REFERENCES booking_itinerary_days(id) ON DELETE CASCADE,
    FOREIGN KEY (checkpoint_id) REFERENCES itinerary_checkpoints(id) ON DELETE CASCADE,
    FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_booking_day_id (booking_day_id),
    INDEX idx_checkpoint_id (checkpoint_id),
    INDEX idx_status (status),
    INDEX idx_checkin_time (actual_checkin_time),
    INDEX idx_checked_in_by (checked_in_by),
    
    UNIQUE KEY unique_booking_checkpoint (booking_day_id, checkpoint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 6: Add indexes for performance
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_booking_day_status ON booking_itinerary_days(booking_id, status);
CREATE INDEX idx_checkin_status_time ON checkpoint_checkins(status, actual_checkin_time);
CREATE INDEX idx_template_active ON tour_itinerary_templates(tour_id, is_active);

-- =====================================================
-- Step 7: Add triggers to update progress
-- =====================================================

DELIMITER //

-- Trigger to update booking_itinerary_days progress when checkpoint is checked in
CREATE TRIGGER after_checkpoint_checkin_update
AFTER UPDATE ON checkpoint_checkins
FOR EACH ROW
BEGIN
    IF NEW.status = 'checked_in' AND OLD.status != 'checked_in' THEN
        UPDATE booking_itinerary_days
        SET 
            completed_checkpoints = (
                SELECT COUNT(*)
                FROM checkpoint_checkins
                WHERE booking_day_id = NEW.booking_day_id
                AND status = 'checked_in'
            ),
            progress_percentage = ROUND(
                (SELECT COUNT(*) FROM checkpoint_checkins 
                 WHERE booking_day_id = NEW.booking_day_id AND status = 'checked_in') * 100.0 / 
                NULLIF((SELECT COUNT(*) FROM checkpoint_checkins 
                        WHERE booking_day_id = NEW.booking_day_id), 0),
                0
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.booking_day_id;
        
        -- Update day status if all checkpoints completed
        UPDATE booking_itinerary_days
        SET status = 'completed'
        WHERE id = NEW.booking_day_id
        AND progress_percentage >= 100
        AND status = 'in_progress';
    END IF;
END//

-- Trigger to set day status to in_progress on first check-in
CREATE TRIGGER after_first_checkin
AFTER UPDATE ON checkpoint_checkins
FOR EACH ROW
BEGIN
    IF NEW.status = 'checked_in' AND OLD.status = 'pending' THEN
        UPDATE booking_itinerary_days
        SET 
            status = CASE 
                WHEN status = 'not_started' THEN 'in_progress'
                ELSE status
            END,
            start_time = CASE
                WHEN start_time IS NULL THEN NEW.actual_checkin_time
                ELSE start_time
            END
        WHERE id = NEW.booking_day_id;
    END IF;
END//

DELIMITER ;

-- =====================================================
-- Sample data for testing
-- =====================================================

-- Note: Run this only after you have tours and bookings in your database
-- This is commented out by default

/*
-- Example: Create template for Hà Nội Street Food Adventure tour (assuming tour_id = 1)
INSERT INTO tour_itinerary_templates (tour_id, template_name, total_days, total_nights, description, created_by)
VALUES 
(1, 'Hà Nội Street Food - Standard Route', 1, 0, 'Lịch trình khám phá ẩm thực đường phố Hà Nội trong 1 ngày', 2);

SET @template_id = LAST_INSERT_ID();

-- Day 1 details
INSERT INTO tour_itinerary_days (template_id, day_number, day_title, day_description, breakfast, lunch, dinner, estimated_duration_hours)
VALUES 
(@template_id, 1, 'Ngày 1 - Khám phá ẩm thực Hà Nội', 'Tham quan và thưởng thức các món ăn đặc sản Hà Nội', FALSE, TRUE, TRUE, 8.0);

SET @day_id = LAST_INSERT_ID();

-- Checkpoints for Day 1
INSERT INTO itinerary_checkpoints (itinerary_day_id, checkpoint_order, checkpoint_name, checkpoint_type, description, location_name, scheduled_time, estimated_duration_minutes, requires_photo)
VALUES 
(@day_id, 1, 'Đón khách tại sân bay/khách sạn', 'transport', 'Đón khách tại điểm hẹn', 'Hà Nội', '08:00:00', 30, TRUE),
(@day_id, 2, 'Phở Hàng Trống', 'restaurant', 'Thưởng thức phở truyền thống', '49 Hàng Trống, Hoàn Kiếm, Hà Nội', '08:30:00', 45, TRUE),
(@day_id, 3, 'Hồ Hoàn Kiếm', 'attraction', 'Tham quan hồ Hoàn Kiếm', 'Hoàn Kiếm, Hà Nội', '09:30:00', 60, TRUE),
(@day_id, 4, 'Chợ Đồng Xuân', 'shopping', 'Khám phá chợ truyền thống', 'Đồng Xuân, Hoàn Kiếm, Hà Nội', '11:00:00', 90, TRUE),
(@day_id, 5, 'Bún chả Hàng Mành', 'restaurant', 'Ăn trưa bún chả', 'Hàng Mành, Hoàn Kiếm, Hà Nội', '13:00:00', 60, TRUE),
(@day_id, 6, 'Cafe trứng Giảng', 'restaurant', 'Thưởng thức cafe trứng', 'Ngõ Giảng, Hoàn Kiếm, Hà Nội', '15:00:00', 45, TRUE),
(@day_id, 7, 'Kết thúc tour', 'transport', 'Tiễn khách về điểm hẹn', 'Hà Nội', '16:00:00', 30, FALSE);
*/

-- =====================================================
-- Migration complete!
-- =====================================================
SELECT 'Migration completed successfully!' as status;
SELECT 'Created tables:' as info;
SELECT '  - tour_itinerary_templates' as table_name
UNION SELECT '  - tour_itinerary_days'
UNION SELECT '  - booking_itinerary_days'
UNION SELECT '  - itinerary_checkpoints'
UNION SELECT '  - checkpoint_checkins';
