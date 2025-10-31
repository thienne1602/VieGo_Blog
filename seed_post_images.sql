-- ============================================
-- SEED POST IMAGES - THÊM HÌNH ẢNH CHO BÀI VIẾT
-- ============================================
-- Script này thêm hình ảnh featured cho các bài viết
-- Sử dụng Unsplash images với chủ đề du lịch Việt Nam

USE viego_blog;

-- Xóa dữ liệu cũ nếu có
TRUNCATE TABLE post_images;

-- Post #1: Hướng dẫn du lịch Hạ Long 3 ngày 2 đêm
INSERT INTO post_images (post_id, image_url, caption, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200', 'Vịnh Hạ Long - Di sản thiên nhiên thế giới', 1),
(1, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', 'Du thuyền trên Vịnh Hạ Long', 2),
(1, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200', 'Hang Sửng Sốt', 3);

-- Post #2: Top 10 quán ăn ngon Hội An
INSERT INTO post_images (post_id, image_url, caption, display_order) VALUES
(2, 'https://images.unsplash.com/photo-1555639003-e8076e8de985?w=1200', 'Phố cổ Hội An về đêm', 1),
(2, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', 'Đèn lồng Hội An', 2),
(2, 'https://images.unsplash.com/photo-1578680671705-0965e325b2ba?w=1200', 'Cao lầu - Đặc sản Hội An', 3);

-- Post #3: Checklist đồ đi Sapa
INSERT INTO post_images (post_id, image_url, caption, display_order) VALUES
(3, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200', 'Ruộng bậc thang Sapa', 1),
(3, 'https://images.unsplash.com/photo-1569074187119-c87815b476da?w=1200', 'Núi non Sapa mùa đông', 2),
(3, 'https://images.unsplash.com/photo-1604920099090-177577d1c9b6?w=1200', 'Dân tộc thiểu số Sapa', 3);

-- Post #4: Đà Lạt - Thành phố mộng mơ
INSERT INTO post_images (post_id, image_url, caption, display_order) VALUES
(4, 'https://images.unsplash.com/photo-1632646723753-3c0e44f1f040?w=1200', 'Thành phố Đà Lạt', 1),
(4, 'https://images.unsplash.com/photo-1591696331111-ef9586a5b17a?w=1200', 'Hồ Xuân Hương', 2),
(4, 'https://images.unsplash.com/photo-1606982896075-c15c0b8c2c41?w=1200', 'Vườn hoa Đà Lạt', 3);

-- Post #5: Homestay view núi Sapa
INSERT INTO post_images (post_id, image_url, caption, display_order) VALUES
(5, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200', 'Homestay Sapa view núi', 1),
(5, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', 'Phòng nghỉ cozy', 2),
(5, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', 'View từ homestay', 3);

-- Post #6: Ẩm thực đường phố Hà Nội
INSERT INTO post_images (post_id, image_url, caption, display_order) VALUES
(6, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=1200', 'Phố cổ Hà Nội', 1),
(6, 'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=1200', 'Phở Hà Nội', 2),
(6, 'https://images.unsplash.com/photo-1562224768-6b9c8a0e4dfb?w=1200', 'Bún chả Hà Nội', 3);

-- Kiểm tra kết quả
SELECT 
    pi.id,
    pi.post_id,
    p.title,
    pi.image_url,
    pi.caption,
    pi.display_order
FROM post_images pi
LEFT JOIN posts p ON pi.post_id = p.id
ORDER BY pi.post_id, pi.display_order;

-- Thống kê
SELECT 
    p.id,
    p.title,
    COUNT(pi.id) as image_count
FROM posts p
LEFT JOIN post_images pi ON p.id = pi.post_id
GROUP BY p.id, p.title
ORDER BY p.id;

SELECT '✅ Đã thêm hình ảnh cho tất cả bài viết!' as status;
