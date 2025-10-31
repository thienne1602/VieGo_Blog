-- ============================================
-- TẠO CÁC BẢNG THIẾU - SOCIAL FEATURES
-- ============================================

USE viego_blog;

-- 1. Bảng POST_STATS - Thống kê bài viết
DROP TABLE IF EXISTS post_stats;
CREATE TABLE post_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    share_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_stat (post_id)
);

-- Seed post_stats từ dữ liệu hiện có
INSERT INTO post_stats (post_id, view_count, like_count, comment_count)
SELECT 
    p.id as post_id,
    FLOOR(RAND() * 1000) + 100 as view_count,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
FROM posts p;

-- 2. Bảng BOOKMARKS - Đánh dấu bài viết
DROP TABLE IF EXISTS bookmarks;
CREATE TABLE bookmarks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (user_id, post_id)
);

-- Seed một vài bookmarks mẫu
INSERT INTO bookmarks (user_id, post_id) VALUES
(1, 1), (1, 3), (1, 4),
(2, 1), (2, 2), (2, 5),
(3, 2), (3, 4), (3, 6),
(4, 3), (4, 5),
(5, 1), (5, 6);

-- 3. Bảng FOLLOWS - Theo dõi người dùng
DROP TABLE IF EXISTS follows;
CREATE TABLE follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL COMMENT 'Người theo dõi',
    following_id INT NOT NULL COMMENT 'Người được theo dõi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Seed một vài follows mẫu
INSERT INTO follows (follower_id, following_id) VALUES
(1, 2), (1, 3), (1, 4),
(2, 1), (2, 6),
(3, 1), (3, 4), (3, 6),
(4, 1), (4, 2), (4, 3),
(5, 1), (5, 6),
(6, 1), (6, 2);

-- 4. Bảng STORIES - Câu chuyện 24h
DROP TABLE IF EXISTS stories;
CREATE TABLE stories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content TEXT,
    media_url VARCHAR(500),
    media_type ENUM('image', 'video') DEFAULT 'image',
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_expires (expires_at),
    INDEX idx_user (user_id)
);

-- Seed stories mẫu (expire sau 24h)
INSERT INTO stories (user_id, content, media_url, media_type, view_count) VALUES
(4, 'Lạng Sơn view đẹp ngất ngây! 🏔️', 'https://images.unsplash.com/photo-1569074187119-c87815b476da?w=800', 'image', 234),
(5, 'Ancient Town vibes ✨', 'https://images.unsplash.com/photo-1555639003-e8076e8de985?w=800', 'image', 108),
(3, 'Quang Anh - Núi trời view đỉnh', 'https://images.unsplash.com/photo-1632646723753-3c0e44f1f040?w=800', 'image', 89),
(2, 'Linh Chi - Delta vibes 🚤', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800', 'image', 312);

-- Kiểm tra kết quả
SELECT '========================================' as '';
SELECT '✅ BẢNG POST_STATS' as '';
SELECT '========================================' as '';
SELECT 
    ps.post_id,
    p.title,
    ps.view_count,
    ps.like_count,
    ps.comment_count,
    ps.share_count
FROM post_stats ps
LEFT JOIN posts p ON ps.post_id = p.id;

SELECT '========================================' as '';
SELECT '✅ BẢNG BOOKMARKS' as '';
SELECT '========================================' as '';
SELECT 
    u.username,
    COUNT(*) as bookmarks_count
FROM bookmarks b
LEFT JOIN users u ON b.user_id = u.id
GROUP BY u.username;

SELECT '========================================' as '';
SELECT '✅ BẢNG FOLLOWS' as '';
SELECT '========================================' as '';
SELECT 
    u1.username as follower,
    u2.username as following
FROM follows f
LEFT JOIN users u1 ON f.follower_id = u1.id
LEFT JOIN users u2 ON f.following_id = u2.id
LIMIT 10;

SELECT '========================================' as '';
SELECT '✅ BẢNG STORIES' as '';
SELECT '========================================' as '';
SELECT 
    s.id,
    u.username,
    s.content,
    s.view_count,
    s.expires_at
FROM stories s
LEFT JOIN users u ON s.user_id = u.id;

SELECT '========================================' as '';
SELECT '✅ HOÀN THÀNH TẤT CẢ!' as '';
SELECT '========================================' as '';
