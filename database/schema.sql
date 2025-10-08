-- VieGo Blog Database Schema
-- MySQL/MariaDB Database Creation Script
-- Compatible with WAMP Server MySQL

-- Create database
CREATE DATABASE IF NOT EXISTS viego_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE viego_blog;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(255),
    cover_image_url VARCHAR(255),
    role ENUM('user', 'moderator', 'admin', 'seller') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    points INT DEFAULT 0,
    level INT DEFAULT 1,
    badges TEXT, -- JSON string of earned badges
    location VARCHAR(255),
    language VARCHAR(10) DEFAULT 'vi',
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    social_links TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Posts table
CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    content_type ENUM('blog', 'video', 'photo', 'tour_guide') DEFAULT 'blog',
    language VARCHAR(10) DEFAULT 'vi',
    reading_time INT, -- minutes
    featured_image VARCHAR(255),
    images TEXT, -- JSON array of image URLs
    video_url VARCHAR(255),
    video_embed TEXT, -- YouTube embed code
    location_lat FLOAT,
    location_lng FLOAT,
    location_name VARCHAR(255),
    location_address VARCHAR(500),
    category ENUM('travel', 'food', 'culture', 'adventure', 'budget', 'luxury') DEFAULT 'travel',
    tags TEXT, -- JSON array of tags
    difficulty_level ENUM('easy', 'moderate', 'hard') DEFAULT 'easy',
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    status ENUM('draft', 'published', 'archived', 'pending') DEFAULT 'draft',
    published_at DATETIME,
    featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    is_interactive BOOLEAN DEFAULT FALSE,
    story_choices TEXT, -- JSON for choose-your-adventure
    collaborative BOOLEAN DEFAULT FALSE,
    collaborators TEXT, -- JSON array of user IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    author_id INT NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_title (title),
    INDEX idx_slug (slug),
    INDEX idx_published_at (published_at),
    INDEX idx_created_at (created_at),
    INDEX idx_author_id (author_id),
    FULLTEXT idx_content (title, content, excerpt)
);

-- Locations table
CREATE TABLE locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Vietnam',
    category ENUM('restaurant', 'attraction', 'hotel', 'transport', 'shopping', 'entertainment') NOT NULL,
    subcategory VARCHAR(100),
    rating FLOAT DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    phone VARCHAR(20),
    website VARCHAR(255),
    email VARCHAR(120),
    opening_hours TEXT, -- JSON format
    price_range ENUM('budget', 'mid-range', 'luxury') DEFAULT 'budget',
    images TEXT, -- JSON array of image URLs
    featured_image VARCHAR(255),
    tags TEXT, -- JSON array
    amenities TEXT, -- JSON array
    languages_spoken TEXT, -- JSON array
    verified BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_latitude (latitude),
    INDEX idx_longitude (longitude),
    INDEX idx_created_at (created_at)
);

-- Comments table
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    parent_id INT, -- For threaded comments
    level INT DEFAULT 0, -- Nesting level
    likes_count INT DEFAULT 0,
    replies_count INT DEFAULT 0,
    status ENUM('active', 'hidden', 'deleted', 'pending') DEFAULT 'active',
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason VARCHAR(255),
    language VARCHAR(10) DEFAULT 'vi',
    translated_content TEXT, -- Auto-translated content
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    post_id INT NOT NULL,
    author_id INT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_author_id (author_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_created_at (created_at)
);

-- Chats table
CREATE TABLE chats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'location', 'system') DEFAULT 'text',
    file_url VARCHAR(255), -- For file/image messages
    file_type VARCHAR(50), -- MIME type
    room_id VARCHAR(100), -- For group chats
    conversation_type ENUM('direct', 'group', 'public') DEFAULT 'direct',
    status ENUM('sent', 'delivered', 'read', 'deleted') DEFAULT 'sent',
    language VARCHAR(10) DEFAULT 'vi',
    translated_message TEXT,
    auto_translated BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    read_at DATETIME,
    sender_id INT NOT NULL,
    receiver_id INT, -- For direct messages
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_room_id (room_id),
    INDEX idx_created_at (created_at)
);

-- User Preferences table
CREATE TABLE user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    travel_interests TEXT, -- JSON array
    budget_range ENUM('budget', 'mid-range', 'luxury') DEFAULT 'mid-range',
    travel_style ENUM('backpacker', 'family', 'luxury', 'business', 'adventure') DEFAULT 'backpacker',
    dietary_restrictions TEXT, -- JSON array
    cuisine_preferences TEXT, -- JSON array
    spice_tolerance ENUM('none', 'mild', 'medium', 'hot') DEFAULT 'medium',
    preferred_activities TEXT, -- JSON array
    fitness_level ENUM('low', 'moderate', 'high') DEFAULT 'moderate',
    group_size_preference ENUM('solo', 'couple', 'small_group', 'large_group') DEFAULT 'small_group',
    preferred_regions TEXT, -- JSON array
    climate_preference ENUM('tropical', 'temperate', 'cold', 'any') DEFAULT 'tropical',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    newsletter_subscription BOOLEAN DEFAULT TRUE,
    ai_recommendations BOOLEAN DEFAULT TRUE,
    personalization_data TEXT, -- JSON for ML features
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NFTs table
CREATE TABLE nfts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token_id VARCHAR(100) UNIQUE NOT NULL,
    contract_address VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    badge_type ENUM('explorer', 'foodie', 'photographer', 'writer', 'adventurer', 'cultural', 'special') NOT NULL,
    badge_level ENUM('bronze', 'silver', 'gold', 'platinum', 'legendary') DEFAULT 'bronze',
    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common',
    image_url VARCHAR(255) NOT NULL,
    animation_url VARCHAR(255), -- For animated NFTs
    metadata_url VARCHAR(255), -- IPFS or server URL
    achievement_criteria TEXT, -- JSON describing how to earn this NFT
    points_required INT DEFAULT 0,
    locations_required TEXT, -- JSON array of location IDs
    posts_required INT DEFAULT 0,
    transaction_hash VARCHAR(100),
    block_number INT,
    gas_used INT,
    status ENUM('minted', 'pending', 'failed', 'burned') DEFAULT 'pending',
    transferable BOOLEAN DEFAULT TRUE,
    tradeable BOOLEAN DEFAULT FALSE,
    unlocked BOOLEAN DEFAULT FALSE,
    unlock_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    minted_at DATETIME,
    owner_id INT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_id (token_id),
    INDEX idx_owner_id (owner_id),
    INDEX idx_created_at (created_at)
);

-- Tours table
CREATE TABLE tours (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    duration_days INT NOT NULL,
    max_participants INT DEFAULT 10,
    min_participants INT DEFAULT 2,
    difficulty_level ENUM('easy', 'moderate', 'hard') DEFAULT 'easy',
    starting_location VARCHAR(255) NOT NULL,
    ending_location VARCHAR(255),
    itinerary TEXT, -- JSON detailed itinerary
    locations_covered TEXT, -- JSON array of location IDs
    price_per_person FLOAT NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    discount_percentage FLOAT DEFAULT 0.0,
    inclusions TEXT, -- JSON array
    exclusions TEXT, -- JSON array
    featured_image VARCHAR(255),
    gallery_images TEXT, -- JSON array
    video_url VARCHAR(255),
    available_dates TEXT, -- JSON array of available dates
    booking_deadline_days INT DEFAULT 3,
    cancellation_policy TEXT,
    category ENUM('adventure', 'cultural', 'food', 'nature', 'urban', 'spiritual') NOT NULL,
    tags TEXT, -- JSON array
    rating FLOAT DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    status ENUM('active', 'inactive', 'draft', 'suspended') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    affiliate_link VARCHAR(500),
    commission_rate FLOAT DEFAULT 0.1, -- 10% default commission
    age_requirement VARCHAR(50), -- e.g., "18+", "All ages"
    fitness_requirement ENUM('low', 'moderate', 'high') DEFAULT 'low',
    equipment_provided TEXT, -- JSON array
    equipment_required TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    seller_id INT NOT NULL,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_title (title),
    INDEX idx_seller_id (seller_id),
    INDEX idx_created_at (created_at)
);

-- Insert sample data
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@viego.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewf1/2xDETnh4ArW', 'VieGo Admin', 'admin'),
('editor', 'editor@viego.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewf1/2xDETnh4ArW', 'Content Editor', 'moderator');

-- Sample locations
INSERT INTO locations (name, description, latitude, longitude, address, city, province, category, subcategory, price_range) VALUES
('Phở Hàng Trống', 'Quán phở truyền thống nổi tiếng ở Hà Nội', 21.0285, 105.8542, '49 Hàng Trống, Hoàn Kiếm', 'Hà Nội', 'Hà Nội', 'restaurant', 'Vietnamese', 'budget'),
('Chợ Bến Thành', 'Khu chợ truyền thống và điểm du lịch nổi tiếng', 10.7720, 106.6988, 'Lê Lợi, Bến Nghé, Quận 1', 'TP.HCM', 'TP.HCM', 'shopping', 'Traditional Market', 'budget'),
('Vịnh Hạ Long', 'Di sản thế giới thiên nhiên với những vách đá vôi tuyệt đẹp', 20.9101, 107.1839, 'Vịnh Hạ Long', 'Hạ Long', 'Quảng Ninh', 'attraction', 'Natural Wonder', 'mid-range');

-- Sample NFT badges
INSERT INTO nfts (token_id, contract_address, name, description, badge_type, badge_level, rarity, image_url, points_required, owner_id, status) VALUES
('VG001', '0x1234567890abcdef', 'Explorer Bronze', 'First steps in Vietnam exploration', 'explorer', 'bronze', 'common', '/nft/explorer-bronze.png', 100, 1, 'minted'),
('VG002', '0x1234567890abcdef', 'Foodie Silver', 'Tasted 10 different Vietnamese dishes', 'foodie', 'silver', 'uncommon', '/nft/foodie-silver.png', 500, 1, 'minted');

-- Sample tours
INSERT INTO tours (title, description, duration_days, starting_location, price_per_person, category, seller_id, status) VALUES
('Hà Nội Street Food Adventure', 'Khám phá ẩm thực đường phố Hà Nội với local guide', 1, 'Hoàn Kiếm, Hà Nội', 500000, 'food', 2, 'active'),
('Sapa Trekking Experience', 'Trekking 2 ngày 1 đêm tại Sapa với homestay', 2, 'Sapa, Lào Cai', 1200000, 'adventure', 2, 'active');

-- Create indexes for better performance
CREATE INDEX idx_posts_location ON posts(location_lat, location_lng);
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);
CREATE FULLTEXT INDEX idx_locations_search ON locations(name, description);
CREATE FULLTEXT INDEX idx_tours_search ON tours(title, description);

-- Grant permissions (adjust as needed for your WAMP setup)
-- GRANT ALL PRIVILEGES ON viego_blog.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;