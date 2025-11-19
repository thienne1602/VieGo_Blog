"""
Mock Data Generator for VieGo Blog
Tạo dữ liệu ảo đầy đủ cho development và testing
"""
import pymysql
import random
from datetime import datetime, timedelta
import json
import hashlib

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Laragon default
    'database': 'viego_blog',
    'charset': 'utf8mb4'
}

# Vietnamese names and content
VIETNAMESE_NAMES = [
    "Nguyễn Văn An", "Trần Thị Bình", "Lê Minh Cường", "Phạm Thu Hà",
    "Hoàng Đức Thành", "Vũ Lan Anh", "Đặng Quang Huy", "Bùi Thị Mai",
    "Đỗ Văn Đức", "Ngô Thị Linh", "Phan Văn Hùng", "Lý Thị Nga",
    "Võ Minh Tuấn", "Dương Thị Hương", "Lương Văn Sơn", "Đinh Thị Lan"
]

LOCATIONS = [
    {"name": "Hà Nội", "lat": 21.0285, "lng": 105.8542, "address": "Hà Nội, Việt Nam"},
    {"name": "Hồ Chí Minh", "lat": 10.8231, "lng": 106.6297, "address": "TP. Hồ Chí Minh, Việt Nam"},
    {"name": "Đà Nẵng", "lat": 16.0544, "lng": 108.2022, "address": "Đà Nẵng, Việt Nam"},
    {"name": "Hội An", "lat": 15.8801, "lng": 108.3380, "address": "Hội An, Quảng Nam, Việt Nam"},
    {"name": "Nha Trang", "lat": 12.2388, "lng": 109.1967, "address": "Nha Trang, Khánh Hòa, Việt Nam"},
    {"name": "Sapa", "lat": 22.3380, "lng": 103.8442, "address": "Sapa, Lào Cai, Việt Nam"},
    {"name": "Vịnh Hạ Long", "lat": 20.9101, "lng": 107.1839, "address": "Vịnh Hạ Long, Quảng Ninh, Việt Nam"},
    {"name": "Phú Quốc", "lat": 10.2899, "lng": 103.9840, "address": "Phú Quốc, Kiên Giang, Việt Nam"},
]

POST_TITLES = [
    "Khám phá vẻ đẹp ẩn giấu của Hà Nội cổ kính",
    "Top 10 món ăn đường phố không thể bỏ qua tại Sài Gòn",
    "Hành trình 7 ngày khám phá miền Trung Việt Nam",
    "Những góc check-in đẹp nhất tại Đà Lạt mùa hoa",
    "Trải nghiệm văn hóa Tây Nguyên đầy màu sắc",
    "Hướng dẫn du lịch Phú Quốc tự túc chi tiết",
    "Khám phá hang Sơn Đoòng - Kỳ quan thiên nhiên",
    "Ẩm thực Huế: Từ cung đình đến đường phố",
    "Mekong Delta: Chợ nổi và đời sống miền sông nước",
    "Sapa mùa lúa chín - Thiên đường cho nhiếp ảnh gia"
]

CATEGORIES = ['travel', 'food', 'culture', 'adventure', 'budget', 'luxury']
CONTENT_TYPES = ['blog', 'video', 'photo', 'tour_guide']
TAGS_POOL = [
    'dulich', 'amthuc', 'vietnam', 'hanoi', 'saigon', 'danang', 'hoian',
    'sapa', 'halong', 'phuquoc', 'culture', 'adventure', 'nature',
    'photography', 'foodie', 'travelguide', 'vietnamesefood', 'heritage'
]

POST_CONTENTS = {
    'travel': [
        "Hành trình khám phá {location} mang lại những trải nghiệm đáng nhớ. Từ những con phố nhỏ đến các di tích lịch sử, mỗi góc phố đều ẩn chứa những câu chuyện thú vị.",
        "Đến với {location}, bạn sẽ được hòa mình vào không khí văn hóa đặc sắc. Những món ăn truyền thống, những điệu múa dân gian và những người dân thân thiện sẽ làm bạn say mê.",
    ],
    'food': [
        "Món ăn tại {location} không chỉ ngon mà còn mang đậm bản sắc văn hóa. Từ phở bò nổi tiếng đến bún chả Hà Nội, mỗi món ăn đều kể một câu chuyện riêng.",
        "Ẩm thực {location} là sự kết hợp tinh tế giữa các nguyên liệu tươi ngon và bí quyết nấu ăn truyền thống được lưu truyền qua nhiều thế hệ.",
    ],
    'culture': [
        "Văn hóa {location} phong phú và đa dạng với nhiều lễ hội truyền thống. Mỗi dịp lễ là cơ hội để khám phá những nét đẹp văn hóa độc đáo.",
        "Những di sản văn hóa tại {location} là minh chứng cho lịch sử lâu đời và sự phát triển của nền văn minh Việt Nam.",
    ]
}

def hash_password(password):
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_users(connection, count=20):
    """Generate mock users"""
    cursor = connection.cursor()
    
    print(f"📝 Generating {count} users...")
    
    for i in range(count):
        name = random.choice(VIETNAMESE_NAMES)
        username = f"user_{i+1}_{name.split()[-1].lower()}"
        email = f"{username}@example.com"
        password_hash = hash_password("Password123!")
        
        avatar_urls = [
            f"https://i.pravatar.cc/150?img={random.randint(1, 70)}",
            f"https://randomuser.me/api/portraits/{random.choice(['men', 'women'])}/{random.randint(1, 99)}.jpg",
        ]
        
        role = 'admin' if i == 0 else ('moderator' if i < 3 else 'user')
        
        created_at = datetime.now() - timedelta(days=random.randint(1, 365))
        
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, avatar_url, role, is_active, email_verified, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE username=username
        """, (username, email, password_hash, name, random.choice(avatar_urls), role, True, True, created_at))
        
        print(f"  ✅ Created user: {username}")
    
    connection.commit()
    print(f"✅ Generated {count} users\n")

def generate_posts(connection, count=50):
    """Generate mock posts"""
    cursor = connection.cursor()
    
    print(f"📝 Generating {count} posts...")
    
    # Get user IDs
    cursor.execute("SELECT id FROM users ORDER BY RAND() LIMIT %s", (count,))
    user_ids = [row[0] for row in cursor.fetchall()]
    if not user_ids:
        print("❌ No users found! Please generate users first.")
        return
    
    for i in range(count):
        user_id = random.choice(user_ids)
        title = random.choice(POST_TITLES)
        category = random.choice(CATEGORIES)
        content_type = random.choice(CONTENT_TYPES)
        
        # Generate slug
        slug = f"post-{i+1}-{title.lower().replace(' ', '-').replace('đ', 'd').replace('á', 'a')[:50]}"
        
        location = random.choice(LOCATIONS)
        content_template = random.choice(POST_CONTENTS.get(category, POST_CONTENTS['travel']))
        content = content_template.format(location=location['name'])
        content += "\n\n" + "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " * 20
        
        excerpt = content[:200] + "..."
        
        # Tags
        tags = random.sample(TAGS_POOL, random.randint(3, 8))
        
        # Images
        images = [
            f"https://picsum.photos/800/600?random={i*10+j}"
            for j in range(random.randint(1, 5))
        ]
        
        featured_image = images[0] if images else None
        
        # Dates
        created_at = datetime.now() - timedelta(days=random.randint(1, 180))
        published_at = created_at + timedelta(hours=random.randint(1, 24)) if random.random() > 0.2 else None
        
        status = 'published' if published_at else 'draft'
        featured = random.random() > 0.8
        reading_time = random.randint(3, 15)
        
        cursor.execute("""
            INSERT INTO posts (
                title, slug, content, excerpt, author_id, category, content_type,
                featured_image, images, location_name, location_address, location_lat, location_lng,
                tags, status, published_at, featured, reading_time,
                views_count, likes_count, comments_count, shares_count,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            title, slug, content, excerpt, user_id, category, content_type,
            featured_image, json.dumps(images), location['name'], location['address'],
            location['lat'], location['lng'], json.dumps(tags),
            status, published_at, featured, reading_time,
            random.randint(0, 5000), random.randint(0, 500),
            random.randint(0, 200), random.randint(0, 100),
            created_at, created_at
        ))
        
        print(f"  ✅ Created post: {title[:50]}...")
    
    connection.commit()
    print(f"✅ Generated {count} posts\n")

def generate_comments(connection, count=200):
    """Generate mock comments"""
    cursor = connection.cursor()
    
    print(f"📝 Generating {count} comments...")
    
    # Get posts
    cursor.execute("SELECT id FROM posts WHERE status='published'")
    post_ids = [row[0] for row in cursor.fetchall()]
    
    # Get users
    cursor.execute("SELECT id FROM users")
    user_ids = [row[0] for row in cursor.fetchall()]
    
    if not post_ids or not user_ids:
        print("❌ No posts or users found!")
        return
    
    comment_texts = [
        "Bài viết rất hay! Cảm ơn bạn đã chia sẻ.",
        "Tôi cũng từng đến đây, quả thật là một trải nghiệm tuyệt vời!",
        "Ảnh đẹp quá! Cho mình hỏi bạn chụp bằng máy gì vậy?",
        "Tuyệt vời! Mình sẽ lưu lại để đi thử.",
        "Bài viết chi tiết quá, cảm ơn bạn nhiều!",
        "Mình đang lên kế hoạch đi đây, bài viết rất hữu ích!",
        "WOW! Đẹp quá! Mình phải đi ngay thôi.",
        "Thông tin rất bổ ích, cảm ơn bạn đã chia sẻ kinh nghiệm.",
    ]
    
    for i in range(count):
        post_id = random.choice(post_ids)
        user_id = random.choice(user_ids)
        content = random.choice(comment_texts)
        
        created_at = datetime.now() - timedelta(days=random.randint(1, 60))
        
        cursor.execute("""
            INSERT INTO comments (post_id, user_id, content, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (post_id, user_id, content, created_at, created_at))
        
        # Update comment count
        cursor.execute("""
            UPDATE posts SET comments_count = comments_count + 1 WHERE id = %s
        """, (post_id,))
        
        if (i + 1) % 50 == 0:
            print(f"  ✅ Generated {i + 1} comments...")
    
    connection.commit()
    print(f"✅ Generated {count} comments\n")

def generate_stories(connection, count=30):
    """Generate mock stories"""
    cursor = connection.cursor()
    
    print(f"📝 Generating {count} stories...")
    
    # Get users
    cursor.execute("SELECT id FROM users")
    user_ids = [row[0] for row in cursor.fetchall()]
    
    if not user_ids:
        print("❌ No users found!")
        return
    
    story_types = ['image', 'video']
    locations = ["Hà Nội", "Sài Gòn", "Đà Nẵng", "Hội An", "Sapa"]
    
    for i in range(count):
        user_id = random.choice(user_ids)
        story_type = random.choice(story_types)
        media_url = f"https://picsum.photos/1080/1920?random={i}"
        location = random.choice(locations)
        caption = f"Check-in tại {location} ✨"
        
        expires_at = datetime.now() + timedelta(hours=24)
        created_at = datetime.now() - timedelta(hours=random.randint(1, 23))
        
        try:
            cursor.execute("""
                INSERT INTO stories (user_id, story_type, media_url, caption, location, expires_at, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_id, story_type, media_url, caption, location, expires_at, created_at))
            
            if (i + 1) % 10 == 0:
                print(f"  ✅ Generated {i + 1} stories...")
        except Exception as e:
            # Story table might not exist, skip
            print(f"  ⚠️  Stories table not found, skipping...")
            break
    
    connection.commit()
    print(f"✅ Generated stories\n")

def main():
    """Main function"""
    print("=" * 60)
    print("🚀 VieGo Blog - Mock Data Generator")
    print("=" * 60)
    print()
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        print("✅ Connected to database\n")
        
        # Generate data
        generate_users(connection, count=20)
        generate_posts(connection, count=50)
        generate_comments(connection, count=200)
        generate_stories(connection, count=30)
        
        print("=" * 60)
        print("✅ Mock data generation completed!")
        print("=" * 60)
        
        # Show stats
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM posts")
        post_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM comments")
        comment_count = cursor.fetchone()[0]
        
        print(f"\n📊 Database Statistics:")
        print(f"   Users: {user_count}")
        print(f"   Posts: {post_count}")
        print(f"   Comments: {comment_count}")
        print()
        
        connection.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

