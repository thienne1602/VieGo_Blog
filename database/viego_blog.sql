-- VieGo Blog Database Schema
-- Tạo database và các bảng cần thiết

-- Tạo database
CREATE DATABASE IF NOT EXISTS viego_blog 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE viego_blog;

-- Bảng Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    points INT DEFAULT 0,
    level INT DEFAULT 1,
    badges JSON,
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    social_links JSON,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
);

-- Bảng Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#667eea',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug)
);

-- Bảng Locations  
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type ENUM('attraction', 'restaurant', 'hotel', 'culture', 'nature', 'beach', 'city') NOT NULL,
    description TEXT,
    address TEXT,
    coordinates POINT,
    province VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Vietnam',
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INT DEFAULT 0,
    images JSON,
    contact_info JSON,
    opening_hours JSON,
    price_range ENUM('budget', 'mid-range', 'luxury') DEFAULT 'mid-range',
    features JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_type (type),
    INDEX idx_province (province),
    INDEX idx_rating (rating),
    INDEX idx_featured (is_featured),
    SPATIAL INDEX idx_coordinates (coordinates)
);

-- Bảng Posts
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    featured_image VARCHAR(255),
    author_id INT NOT NULL,
    category_id INT,
    location_id INT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    visibility ENUM('public', 'private', 'members') DEFAULT 'public',
    tags JSON,
    meta_description TEXT,
    read_time INT DEFAULT 0,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    
    INDEX idx_slug (slug),
    INDEX idx_author (author_id),
    INDEX idx_category (category_id),
    INDEX idx_location (location_id),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at),
    INDEX idx_featured (is_featured),
    FULLTEXT idx_content (title, excerpt, content)
);

-- Bảng Comments
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author_id INT NOT NULL,
    parent_id INT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'spam') DEFAULT 'pending',
    like_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    
    INDEX idx_post (post_id),
    INDEX idx_author (author_id),
    INDEX idx_parent (parent_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Bảng Post Likes
CREATE TABLE IF NOT EXISTS post_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_like (post_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_user (user_id)
);

-- Bảng Comment Likes
CREATE TABLE IF NOT EXISTS comment_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_like (comment_id, user_id),
    INDEX idx_comment (comment_id),
    INDEX idx_user (user_id)
);

-- Bảng Tours
CREATE TABLE IF NOT EXISTS tours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    location_id INT,
    duration_days INT NOT NULL,
    difficulty ENUM('easy', 'moderate', 'hard') DEFAULT 'easy',
    category ENUM('food', 'adventure', 'nature', 'cultural', 'luxury', 'beach') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    max_participants INT DEFAULT 10,
    min_participants INT DEFAULT 1,
    includes JSON,
    excludes JSON,
    itinerary JSON,
    images JSON,
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INT DEFAULT 0,
    booking_count INT DEFAULT 0,
    guide_id INT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_slug (slug),
    INDEX idx_location (location_id),
    INDEX idx_category (category),
    INDEX idx_price (price),
    INDEX idx_rating (rating),
    INDEX idx_featured (is_featured)
);

-- Bảng User Sessions (JWT tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_token (token_jti),
    INDEX idx_expires_at (expires_at)
);

-- Chèn dữ liệu mẫu

-- Categories
INSERT INTO categories (name, slug, description, color, icon) VALUES
('Du lịch', 'travel', 'Các bài viết về địa điểm du lịch', '#3B82F6', '🏔️'),
('Ẩm thực', 'food', 'Khám phá ẩm thực Việt Nam', '#F59E0B', '🍜'),
('Văn hóa', 'culture', 'Văn hóa và truyền thống', '#8B5CF6', '🏛️'),
('Tips', 'tips', 'Mẹo du lịch hữu ích', '#10B981', '💡'),
('Review', 'review', 'Đánh giá địa điểm', '#EF4444', '⭐');

-- Locations
INSERT INTO locations (name, slug, type, description, address, coordinates, province, rating, images) VALUES
('Vịnh Hạ Long', 'vinh-ha-long', 'attraction', 'Di sản thiên nhiên thế giới với những hang động tuyệt đẹp', 'Vịnh Hạ Long, Quảng Ninh', ST_GeomFromText('POINT(107.1839 20.9101)'), 'Quảng Ninh', 4.8, '["halong1.jpg", "halong2.jpg"]'),
('Phố cổ Hội An', 'pho-co-hoi-an', 'culture', 'Khu phố cổ được UNESCO công nhận', 'Hội An, Quảng Nam', ST_GeomFromText('POINT(108.3380 15.8801)'), 'Quảng Nam', 4.7, '["hoian1.jpg", "hoian2.jpg"]'),
('Ruộng bậc thang Sapa', 'ruong-bac-thang-sapa', 'nature', 'Ruộng bậc thang tuyệt đẹp', 'Sapa, Lào Cai', ST_GeomFromText('POINT(103.8442 22.3380)'), 'Lào Cai', 4.6, '["sapa1.jpg", "sapa2.jpg"]'),
('Chợ Bến Thành', 'cho-ben-thanh', 'attraction', 'Chợ truyền thống nổi tiếng Sài Gòn', 'Quận 1, TP.HCM', ST_GeomFromText('POINT(106.6980 10.7720)'), 'TP.HCM', 4.3, '["benthanh1.jpg"]'),
('Đảo Phú Quốc', 'dao-phu-quoc', 'beach', 'Đảo ngọc với bãi biển tuyệt đẹp', 'Phú Quốc, Kiên Giang', ST_GeomFromText('POINT(103.9840 10.2899)'), 'Kiên Giang', 4.5, '["phuquoc1.jpg", "phuquoc2.jpg"]');

-- Admin user
INSERT INTO users (username, email, password_hash, full_name, role, points, level, badges, bio) VALUES
('admin', 'admin@viego.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeW.WFEmoLbtsnmT6', 'VieGo Admin', 'admin', 1000, 10, '["Admin", "Founder", "Travel Expert"]', 'Administrator của VieGo Blog - nền tảng du lịch và ẩm thực Việt Nam'),
('demo_user', 'demo@viego.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeW.WFEmoLbtsnmT6', 'Demo User', 'user', 150, 2, '["New Member", "Traveler"]', 'Người dùng demo của VieGo Blog');

-- Sample posts  
INSERT INTO posts (title, slug, excerpt, content, featured_image, author_id, category_id, location_id, status, tags, read_time, view_count, like_count, comment_count, is_featured, published_at) VALUES
('Khám phá vẻ đẹp vịnh Hạ Long', 'kham-pha-ve-dep-vinh-ha-long', 'Khám phá vẻ đẹp kỳ bí của vịnh Hạ Long với những hang động tuyệt đẹp và núi đá vôi độc đáo.', 
'<h2>Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới</h2>
<p>Vịnh Hạ Long là một trong những điểm đến không thể bỏ qua khi du lịch Việt Nam. Được UNESCO công nhận là Di sản Thiên nhiên Thế giới, vịnh Hạ Long sở hữu vẻ đẹp huyền bí với hàng nghìn hòn đảo đá vôi.</p>

<h3>Những điều không thể bỏ lỡ</h3>
<ul>
<li><strong>Hang Sửng Sốt:</strong> Một trong những hang động đẹp nhất vịnh Hạ Long</li>
<li><strong>Đảo Ti Tốp:</strong> Leo lên đỉnh để ngắm toàn cảnh vịnh</li>
<li><strong>Làng chài Cửa Vạn:</strong> Trải nghiệm cuộc sống của người dân địa phương</li>
<li><strong>Kayak:</strong> Chèo thuyền kayak khám phá các hang động nhỏ</li>
</ul>

<p>Thời điểm tốt nhất để du lịch vịnh Hạ Long là từ tháng 10 đến tháng 4 năm sau. Thời tiết mát mẻ, ít mưa và có nhiều ngày nắng đẹp.</p>',
'halong-bay.jpg', 1, 1, 1, 'published', '["vịnh hạ long", "du lịch", "thiên nhiên", "UNESCO"]', 8, 1250, 156, 23, TRUE, '2025-09-25 10:00:00'),

('Phở Hà Nội - Hương vị đậm đà', 'pho-ha-noi-huong-vi-dam-da', 'Tìm hiểu về lịch sử và cách làm phở Hà Nội authentic với nước dùng trong suốt.',
'<h2>Phở - Linh hồn ẩm thực Việt Nam</h2>
<p>Phở là món ăn đặc trưng của Việt Nam, đặc biệt là phở Hà Nội với hương vị đậm đà, truyền thống.</p>

<h3>Đặc trưng phở Hà Nội</h3>
<ul>
<li>Nước dùng trong suốt, đậm đà</li>
<li>Bánh phở mềm, dai vừa phải</li>
<li>Thịt bò tươi, thái mỏng</li>
<li>Gia vị đơn giản: hành lá, ngò gai</li>
</ul>',
'pho-hanoi.jpg', 1, 2, NULL, 'published', '["phở", "ẩm thực", "hà nội", "traditional food"]', 5, 890, 89, 15, FALSE, '2025-09-24 09:30:00'),

('Ruộng bậc thang Sapa mùa lúa chín', 'ruong-bac-thang-sapa-mua-lua-chin', 'Ngắm nhìn vẻ đẹp rực rỡ của ruộng bậc thang Sapa trong mùa lúa chín vàng.',
'<h2>Sapa - Thiên đường ruộng bậc thang</h2>
<p>Mùa lúa chín là thời điểm đẹp nhất để ngắm ruộng bậc thang Sapa. Cảnh quan hùng vĩ với những thửa ruộng vàng óng trải dài khắp sườn núi.</p>

<h3>Thời điểm lý tưởng</h3>
<p>Từ tháng 9 đến tháng 10 hàng năm, ruộng lúa chín vàng tạo nên một khung cảnh tuyệt đẹp.</p>',
'sapa-terraces.jpg', 1, 1, 3, 'published', '["sapa", "ruộng bậc thang", "núi", "mùa lúa"]', 6, 1560, 234, 41, TRUE, '2025-09-23 14:15:00');

-- Sample comments
INSERT INTO comments (post_id, author_id, content, status) VALUES
(1, 2, 'Bài viết rất hay và chi tiết! Mình đã đi Hạ Long theo gợi ý này và rất hài lòng.', 'approved'),
(1, 1, 'Cảm ơn bạn đã chia sẻ! Hy vọng bạn có nhiều trải nghiệm tuyệt vời.', 'approved'),
(2, 2, 'Phở Hà Nội thực sự là món ăn tuyệt vời. Mình rất thích hương vị truyền thống.', 'approved');

-- Sample tours
INSERT INTO tours (title, slug, description, short_description, location_id, duration_days, difficulty, category, price, max_participants, includes, images, rating, review_count, is_featured) VALUES
('Hà Nội Street Food Adventure', 'ha-noi-street-food-adventure', 'Khám phá ẩm thực đường phố Hà Nội với local guide chuyên nghiệp', 'Tour ẩm thực đường phố Hà Nội 1 ngày', 4, 1, 'easy', 'food', 500000, 8, '["Phở authentic", "Bánh mì", "Cà phê vỉa hè", "Chè đậu đỏ"]', '["hanoi-food1.jpg", "hanoi-food2.jpg"]', 4.8, 124, TRUE),

('Sapa Trekking Experience', 'sapa-trekking-experience', 'Trekking 2 ngày 1 đêm tại Sapa với homestay và văn hóa địa phương', 'Trekking Sapa 2 ngày 1 đêm', 3, 2, 'moderate', 'adventure', 1200000, 12, '["Ruộng bậc thang", "Homestay", "Văn hóa H\'Mong", "Sunrise"]', '["sapa-trek1.jpg", "sapa-trek2.jpg"]', 4.9, 89, TRUE);

COMMIT;