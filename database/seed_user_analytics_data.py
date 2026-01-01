"""
Seed User Analytics Data
Tạo 50 users mới và dữ liệu hành vi để hiển thị thống kê
"""
import pymysql
import random
from datetime import datetime, timedelta
import json
import bcrypt
import sys
import os

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'viego_blog',
    'charset': 'utf8mb4'
}

# Vietnamese names
VIETNAMESE_FIRST_NAMES = [
    "An", "Bình", "Cường", "Dũng", "Em", "Phúc", "Giang", "Hùng", "Khôi", "Linh",
    "Minh", "Nam", "Oanh", "Phong", "Quang", "Sơn", "Thảo", "Uyên", "Việt", "Xuân",
    "Yến", "Long", "Hải", "Đức", "Tuấn", "Hương", "Mai", "Lan", "Hà", "Thu"
]

VIETNAMESE_LAST_NAMES = [
    "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô",
    "Phan", "Lý", "Võ", "Dương", "Lương", "Đinh", "Cao", "Tạ", "Hồ", "Tô"
]

PROVINCES = [
    "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Nha Trang",
    "Huế", "Đà Lạt", "Vũng Tàu", "Quảng Ninh", "Bình Dương", "Đồng Nai",
    "Nghệ An", "Thanh Hóa", "Hải Dương", "Nam Định", "Thái Nguyên", "Lâm Đồng"
]

INTERESTS = ['adventure', 'cultural', 'food', 'nature', 'urban', 'spiritual']
DEVICES = ['desktop', 'mobile', 'tablet']
BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']
ENGAGEMENT_LEVELS = ['low', 'medium', 'high', 'very_high']

ACTION_TYPES = [
    'view_tour', 'search_tour', 'book_tour', 'wishlist_tour', 'share_tour',
    'review_tour', 'view_category', 'view_location', 'click_promotion',
    'open_email', 'click_email_link', 'complete_booking', 'cancel_booking'
]


def hash_password(password):
    """Hash password with bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def get_connection():
    return pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)


def create_50_users(cursor):
    """Tạo 50 users mới"""
    print("\n" + "=" * 60)
    print("📝 Tạo 50 Users Mới")
    print("=" * 60)
    
    users_created = []
    password_hash = hash_password("User123!@#")
    
    # Get existing max user id
    cursor.execute("SELECT MAX(id) as max_id FROM users")
    result = cursor.fetchone()
    start_id = (result['max_id'] or 0) + 1
    
    for i in range(50):
        first_name = random.choice(VIETNAMESE_FIRST_NAMES)
        last_name = random.choice(VIETNAMESE_LAST_NAMES)
        full_name = f"{last_name} {first_name}"
        
        # Generate unique username
        username = f"user_{start_id + i}_{first_name.lower()}"
        email = f"{username}@gmail.com"
        
        # Random role distribution
        role_rand = random.random()
        if role_rand < 0.7:
            role = 'user'
        elif role_rand < 0.85:
            role = 'seller'
        elif role_rand < 0.95:
            role = 'tour_guide'
        else:
            role = 'moderator'
        
        # Random dates (within last year)
        days_ago = random.randint(1, 365)
        created_at = datetime.now() - timedelta(days=days_ago)
        
        # Random location
        location = random.choice(PROVINCES)
        
        # Random level and points
        level = random.randint(1, 10)
        points = level * random.randint(100, 500)
        
        # Avatar
        avatar_url = f"https://i.pravatar.cc/150?img={random.randint(1, 70)}"
        
        # Bio
        bios = [
            f"Yêu thích du lịch và khám phá văn hóa Việt Nam. Đến từ {location}.",
            f"Travel blogger | Food lover | Living in {location}",
            f"Đam mê khám phá những điểm đến mới. Hiện sống tại {location}.",
            f"Photographer & Traveler from {location}",
            f"🌍 Explorer | 📸 Photographer | 🍜 Foodie | {location}"
        ]
        bio = random.choice(bios)
        
        try:
            cursor.execute("""
                INSERT INTO users (
                    username, email, password_hash, full_name, bio, avatar_url,
                    role, is_active, email_verified, location, points, level, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                username, email, password_hash, full_name, bio, avatar_url,
                role, True, random.random() > 0.2, location, points, level, created_at
            ))
            
            user_id = cursor.lastrowid
            users_created.append({
                'id': user_id,
                'username': username,
                'role': role,
                'created_at': created_at,
                'location': location
            })
            print(f"   ✅ Created: {username} ({role}) - {location}")
        except Exception as e:
            print(f"   ❌ Error creating {username}: {e}")
    
    print(f"\n✅ Đã tạo {len(users_created)} users mới")
    return users_created


def create_user_interest_profiles(cursor, user_ids):
    """Tạo hồ sơ sở thích cho users"""
    print("\n" + "=" * 60)
    print("📊 Tạo User Interest Profiles")
    print("=" * 60)
    
    profiles_created = 0
    
    for user_id in user_ids:
        # Random interest scores
        adventure_score = random.uniform(0, 100)
        cultural_score = random.uniform(0, 100)
        food_score = random.uniform(0, 100)
        nature_score = random.uniform(0, 100)
        urban_score = random.uniform(0, 100)
        spiritual_score = random.uniform(0, 100)
        
        # Price preferences
        price_min = random.choice([500000, 1000000, 2000000, 3000000])
        price_max = price_min + random.choice([2000000, 5000000, 10000000, 15000000])
        price_sensitivity = random.uniform(0.2, 0.9)
        
        # Duration preferences
        duration_min = random.randint(1, 3)
        duration_max = duration_min + random.randint(2, 7)
        
        # Engagement
        engagement_level = random.choice(ENGAGEMENT_LEVELS)
        avg_session_duration = random.uniform(60, 1800)  # 1-30 minutes
        total_views = random.randint(5, 500)
        total_bookings = random.randint(0, 10)
        total_spent = total_bookings * random.uniform(1000000, 10000000)
        
        # Email engagement
        email_open_rate = random.uniform(0.1, 0.8)
        email_click_rate = random.uniform(0.05, 0.4)
        
        # Preferred provinces
        preferred_provinces = random.sample(PROVINCES, random.randint(2, 5))
        
        # Favorite tags
        tags = ['dulich', 'vietnam', 'travel', 'explore', 'foodie', 'nature', 'adventure', 'photography']
        favorite_tags = random.sample(tags, random.randint(3, 6))
        
        try:
            cursor.execute("""
                INSERT INTO user_interest_profiles (
                    user_id, adventure_score, cultural_score, food_score, nature_score,
                    urban_score, spiritual_score, preferred_price_min, preferred_price_max,
                    price_sensitivity, preferred_duration_min, preferred_duration_max,
                    preferred_provinces, favorite_tags, engagement_level, avg_session_duration,
                    total_views, total_bookings, total_spent, email_open_rate, email_click_rate,
                    created_at, updated_at, last_analyzed_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    adventure_score = VALUES(adventure_score),
                    cultural_score = VALUES(cultural_score),
                    food_score = VALUES(food_score),
                    nature_score = VALUES(nature_score),
                    urban_score = VALUES(urban_score),
                    spiritual_score = VALUES(spiritual_score),
                    engagement_level = VALUES(engagement_level),
                    total_views = VALUES(total_views),
                    total_bookings = VALUES(total_bookings),
                    updated_at = NOW()
            """, (
                user_id, adventure_score, cultural_score, food_score, nature_score,
                urban_score, spiritual_score, price_min, price_max,
                price_sensitivity, duration_min, duration_max,
                json.dumps(preferred_provinces), json.dumps(favorite_tags),
                engagement_level, avg_session_duration,
                total_views, total_bookings, total_spent, email_open_rate, email_click_rate,
                datetime.now(), datetime.now(), datetime.now()
            ))
            profiles_created += 1
        except Exception as e:
            print(f"   ❌ Error creating profile for user {user_id}: {e}")
    
    print(f"✅ Đã tạo {profiles_created} user interest profiles")


def create_user_behaviors(cursor, user_ids, tour_ids):
    """Tạo dữ liệu hành vi người dùng"""
    print("\n" + "=" * 60)
    print("📈 Tạo User Behaviors")
    print("=" * 60)
    
    behaviors_created = 0
    
    for user_id in user_ids:
        # Each user has random number of behaviors (10-100)
        num_behaviors = random.randint(10, 100)
        
        for _ in range(num_behaviors):
            action_type = random.choice(ACTION_TYPES)
            
            # Target based on action
            target_id = None
            target_type = None
            
            if action_type in ['view_tour', 'book_tour', 'wishlist_tour', 'share_tour', 'review_tour', 'complete_booking', 'cancel_booking']:
                if tour_ids:
                    target_id = random.choice(tour_ids)
                    target_type = 'tour'
            elif action_type == 'view_category':
                target_type = 'category'
            elif action_type == 'view_location':
                target_type = 'location'
            elif action_type == 'click_promotion':
                target_type = 'promotion'
            
            device_type = random.choice(DEVICES)
            browser = random.choice(BROWSERS)
            
            # Random time within last 90 days
            days_ago = random.randint(0, 90)
            hours_ago = random.randint(0, 23)
            created_at = datetime.now() - timedelta(days=days_ago, hours=hours_ago)
            
            duration_seconds = random.randint(10, 600)  # 10 seconds to 10 minutes
            
            session_id = f"session_{user_id}_{random.randint(1000, 9999)}"
            
            # Extra data
            extra_data = {}
            if action_type == 'search_tour':
                extra_data = {
                    'query': random.choice(['Đà Nẵng', 'Sapa', 'Phú Quốc', 'Hạ Long', 'Nha Trang']),
                    'filters': {'price_max': random.choice([5000000, 10000000, 15000000])}
                }
            
            try:
                cursor.execute("""
                    INSERT INTO user_behaviors (
                        user_id, action_type, target_id, target_type, metadata,
                        session_id, device_type, browser, duration_seconds, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id, action_type, target_id, target_type,
                    json.dumps(extra_data) if extra_data else None,
                    session_id, device_type, browser, duration_seconds, created_at
                ))
                behaviors_created += 1
            except Exception as e:
                pass  # Silently skip duplicates
    
    print(f"✅ Đã tạo {behaviors_created} user behaviors")


def create_bookings_for_users(cursor, user_ids, tour_ids):
    """Tạo bookings cho users"""
    print("\n" + "=" * 60)
    print("🎫 Tạo Bookings")
    print("=" * 60)
    
    if not tour_ids:
        print("   ⚠️ Không có tours, bỏ qua tạo bookings")
        return
    
    bookings_created = 0
    statuses = ['pending', 'confirmed', 'completed', 'cancelled']
    
    for user_id in user_ids:
        # 30% chance to have bookings
        if random.random() > 0.3:
            continue
        
        num_bookings = random.randint(1, 5)
        
        for _ in range(num_bookings):
            tour_id = random.choice(tour_ids)
            
            # Get tour price
            cursor.execute("SELECT price FROM tours WHERE id = %s", (tour_id,))
            tour = cursor.fetchone()
            if not tour:
                continue
            
            num_participants = random.randint(1, 4)
            total_price = float(tour['price']) * num_participants
            
            status = random.choice(statuses)
            
            # Random date within last 180 days
            days_ago = random.randint(0, 180)
            booking_date = datetime.now() - timedelta(days=days_ago)
            travel_date = booking_date + timedelta(days=random.randint(7, 60))
            
            try:
                cursor.execute("""
                    INSERT INTO bookings (
                        user_id, tour_id, booking_date, travel_date, num_participants,
                        total_price, status, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id, tour_id, booking_date, travel_date, num_participants,
                    total_price, status, booking_date
                ))
                bookings_created += 1
            except Exception as e:
                pass
    
    print(f"✅ Đã tạo {bookings_created} bookings")


def create_promotional_campaigns(cursor):
    """Tạo sample promotional campaigns"""
    print("\n" + "=" * 60)
    print("📧 Tạo Promotional Campaigns")
    print("=" * 60)
    
    campaigns = [
        {
            'name': 'Khuyến mãi mùa hè 2026',
            'description': 'Giảm giá 20% cho tất cả tour biển từ tháng 6-8/2026',
            'campaign_type': 'seasonal',
            'target_segment': 'beach_lovers',
            'status': 'active'
        },
        {
            'name': 'Tết Nguyên Đán 2026',
            'description': 'Ưu đãi đặc biệt cho các tour du xuân',
            'campaign_type': 'holiday',
            'target_segment': 'all_users',
            'status': 'draft'
        },
        {
            'name': 'Flash Sale Cuối Tuần',
            'description': 'Giảm 30% cho 100 khách đầu tiên mỗi tuần',
            'campaign_type': 'flash_sale',
            'target_segment': 'high_engagement',
            'status': 'active'
        },
        {
            'name': 'Kích hoạt lại khách hàng',
            'description': 'Email nhắc nhở và ưu đãi cho khách lâu không đặt tour',
            'campaign_type': 're_engagement',
            'target_segment': 'inactive_users',
            'status': 'active'
        },
        {
            'name': 'Tour mới tháng 1/2026',
            'description': 'Giới thiệu các tour mới ra mắt',
            'campaign_type': 'new_tours',
            'target_segment': 'adventure_seekers',
            'status': 'completed'
        }
    ]
    
    for campaign in campaigns:
        try:
            cursor.execute("""
                INSERT INTO promotional_campaigns (
                    name, description, campaign_type, target_segment, status,
                    total_sent, total_opened, total_clicked, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE name=name
            """, (
                campaign['name'], campaign['description'], campaign['campaign_type'],
                campaign['target_segment'], campaign['status'],
                random.randint(100, 5000), random.randint(50, 2000), random.randint(20, 500),
                datetime.now() - timedelta(days=random.randint(1, 60))
            ))
            print(f"   ✅ Campaign: {campaign['name']}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print(f"✅ Đã tạo {len(campaigns)} promotional campaigns")


def main():
    print("\n" + "=" * 60)
    print("🚀 SEED USER ANALYTICS DATA")
    print("=" * 60)
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 1. Create 50 new users
        new_users = create_50_users(cursor)
        conn.commit()
        
        # Get all user IDs (including existing)
        cursor.execute("SELECT id FROM users")
        all_user_ids = [row['id'] for row in cursor.fetchall()]
        
        # Get tour IDs
        cursor.execute("SELECT id FROM tours LIMIT 100")
        tour_ids = [row['id'] for row in cursor.fetchall()]
        
        # 2. Create interest profiles for all users
        create_user_interest_profiles(cursor, all_user_ids)
        conn.commit()
        
        # 3. Create user behaviors
        create_user_behaviors(cursor, all_user_ids, tour_ids)
        conn.commit()
        
        # 4. Create bookings
        create_bookings_for_users(cursor, [u['id'] for u in new_users], tour_ids)
        conn.commit()
        
        # 5. Create promotional campaigns
        create_promotional_campaigns(cursor)
        conn.commit()
        
        # Summary
        cursor.execute("SELECT COUNT(*) as cnt FROM users")
        total_users = cursor.fetchone()['cnt']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM user_interest_profiles")
        total_profiles = cursor.fetchone()['cnt']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM user_behaviors")
        total_behaviors = cursor.fetchone()['cnt']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM bookings")
        total_bookings = cursor.fetchone()['cnt']
        
        print("\n" + "=" * 60)
        print("📊 TỔNG KẾT")
        print("=" * 60)
        print(f"   👤 Tổng users: {total_users}")
        print(f"   📊 User profiles: {total_profiles}")
        print(f"   📈 User behaviors: {total_behaviors}")
        print(f"   🎫 Bookings: {total_bookings}")
        print("=" * 60)
        print("✅ HOÀN THÀNH!")
        print("=" * 60)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
