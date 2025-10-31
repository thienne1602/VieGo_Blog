import pymysql

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'viego_blog',
    'charset': 'utf8mb4'
}

print("=" * 80)
print("  THÊM HÌNH ẢNH CHO BÀI VIẾT")
print("=" * 80)

try:
    conn = pymysql.connect(**db_config)
    cursor = conn.cursor()
    
    # Xóa dữ liệu cũ
    print("\n[1/4] Xóa hình ảnh cũ (nếu có)...")
    cursor.execute("DELETE FROM post_images")
    conn.commit()
    print("✅ Đã xóa")
    
    # Thêm hình ảnh mới
    print("\n[2/4] Thêm hình ảnh mới...")
    
    images_data = [
        # Post 1: Hạ Long
        (1, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200', 'Vịnh Hạ Long - Di sản thiên nhiên thế giới', 1),
        (1, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', 'Du thuyền trên Vịnh Hạ Long', 2),
        (1, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200', 'Hang Sửng Sốt', 3),
        
        # Post 2: Hội An
        (2, 'https://images.unsplash.com/photo-1555639003-e8076e8de985?w=1200', 'Phố cổ Hội An về đêm', 1),
        (2, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', 'Đèn lồng Hội An', 2),
        (2, 'https://images.unsplash.com/photo-1578680671705-0965e325b2ba?w=1200', 'Cao lầu - Đặc sản Hội An', 3),
        
        # Post 3: Sapa
        (3, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200', 'Ruộng bậc thang Sapa', 1),
        (3, 'https://images.unsplash.com/photo-1569074187119-c87815b476da?w=1200', 'Núi non Sapa mùa đông', 2),
        (3, 'https://images.unsplash.com/photo-1604920099090-177577d1c9b6?w=1200', 'Dân tộc thiểu số Sapa', 3),
        
        # Post 4: Đà Lạt
        (4, 'https://images.unsplash.com/photo-1632646723753-3c0e44f1f040?w=1200', 'Thành phố Đà Lạt', 1),
        (4, 'https://images.unsplash.com/photo-1591696331111-ef9586a5b17a?w=1200', 'Hồ Xuân Hương', 2),
        (4, 'https://images.unsplash.com/photo-1606982896075-c15c0b8c2c41?w=1200', 'Vườn hoa Đà Lạt', 3),
        
        # Post 5: Homestay Sapa
        (5, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200', 'Homestay Sapa view núi', 1),
        (5, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', 'Phòng nghỉ cozy', 2),
        (5, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', 'View từ homestay', 3),
        
        # Post 6: Hà Nội
        (6, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=1200', 'Phố cổ Hà Nội', 1),
        (6, 'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=1200', 'Phở Hà Nội', 2),
        (6, 'https://images.unsplash.com/photo-1562224768-6b9c8a0e4dfb?w=1200', 'Bún chả Hà Nội', 3),
    ]
    
    cursor.executemany(
        "INSERT INTO post_images (post_id, image_url, caption, display_order) VALUES (%s, %s, %s, %s)",
        images_data
    )
    conn.commit()
    print(f"✅ Đã thêm {len(images_data)} hình ảnh")
    
    # Kiểm tra kết quả
    print("\n[3/4] Kiểm tra kết quả...")
    cursor.execute("""
        SELECT p.id, p.title, COUNT(pi.id) as image_count
        FROM posts p
        LEFT JOIN post_images pi ON p.id = pi.post_id
        GROUP BY p.id, p.title
        ORDER BY p.id
    """)
    results = cursor.fetchall()
    
    for post_id, title, image_count in results:
        status = "✅" if image_count > 0 else "❌"
        print(f"  {status} Post {post_id}: {image_count} images - {title[:50]}")
    
    print("\n[4/4] Hoàn thành!")
    print("=" * 80)
    
    cursor.close()
    conn.close()
    
    print("\n✅ THÀNH CÔNG! Đã thêm hình ảnh cho tất cả bài viết")
    
except Exception as e:
    print(f"\n❌ LỖI: {e}")
    exit(1)
