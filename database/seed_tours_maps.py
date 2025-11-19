"""
Seed Tours and Maps Data for VieGo Blog
创建 seller 账号并加载 tour 和 location 数据
Run from root: python database/seed_tours_maps.py
"""

import pymysql
import sys
import json
from datetime import datetime, timedelta
import random
import bcrypt
import os

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def get_connection():
    """Kết nối database"""
    try:
        conn = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            database='viego_blog',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        return conn
    except Exception as e:
        print(f"❌ Lỗi kết nối: {e}")
        print("💡 Thử với password 'root'...")
        try:
            conn = pymysql.connect(
                host='localhost',
                user='root',
                password='root',
                database='viego_blog',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            return conn
        except Exception as e2:
            print(f"❌ Vẫn lỗi: {e2}")
            return None

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_seller(conn):
    """Tạo seller 账号"""
    print("\n" + "="*70)
    print("👤 Tạo Seller Account...")
    print("="*70)
    
    cursor = conn.cursor()
    
    seller_data = {
        'username': 'tour_seller_vn',
        'email': 'seller@viego.com',
        'password_hash': hash_password('Seller@123'),
        'full_name': 'Công Ty Du Lịch Việt Nam Pro',
        'bio': 'Chuyên cung cấp tour du lịch chất lượng cao trên khắp Việt Nam. Hơn 10 năm kinh nghiệm trong ngành du lịch.',
        'role': 'seller',
        'avatar_url': 'https://ui-avatars.com/api/?name=Tour+Seller&background=0ea5e9&color=fff',
        'location': 'Hà Nội, Việt Nam',
        'is_active': True,
        'is_verified': True,
        'email_verified': True,
        'points': 1000,
        'level': 5
    }
    
    try:
        # Check if seller exists
        cursor.execute(
            "SELECT id FROM users WHERE username = %s OR email = %s",
            (seller_data['username'], seller_data['email'])
        )
        existing = cursor.fetchone()
        
        if existing:
            seller_id = existing['id']
            print(f"  ✅ Seller đã tồn tại (ID: {seller_id})")
            # Update seller info
            cursor.execute("""
                UPDATE users SET
                    full_name = %s,
                    bio = %s,
                    avatar_url = %s,
                    location = %s,
                    role = 'seller',
                    is_active = %s,
                    is_verified = %s,
                    email_verified = %s
                WHERE id = %s
            """, (
                seller_data['full_name'],
                seller_data['bio'],
                seller_data['avatar_url'],
                seller_data['location'],
                seller_data['is_active'],
                seller_data['is_verified'],
                seller_data['email_verified'],
                seller_id
            ))
            print(f"  ✅ Đã cập nhật thông tin seller")
        else:
            cursor.execute("""
                INSERT INTO users (
                    username, email, password_hash, full_name, bio, role,
                    avatar_url, location, is_active, is_verified, email_verified,
                    points, level, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                seller_data['username'],
                seller_data['email'],
                seller_data['password_hash'],
                seller_data['full_name'],
                seller_data['bio'],
                seller_data['role'],
                seller_data['avatar_url'],
                seller_data['location'],
                seller_data['is_active'],
                seller_data['is_verified'],
                seller_data['email_verified'],
                seller_data['points'],
                seller_data['level'],
                datetime.now()
            ))
            seller_id = cursor.lastrowid
            print(f"  ✅ Đã tạo seller (ID: {seller_id})")
            print(f"     Username: {seller_data['username']}")
            print(f"     Email: {seller_data['email']}")
            print(f"     Password: Seller@123")
        
        conn.commit()
        return seller_id
        
    except Exception as e:
        conn.rollback()
        print(f"  ❌ Lỗi tạo seller: {e}")
        return None

def create_locations(conn):
    """Tạo location 数据"""
    print("\n" + "="*70)
    print("📍 Tạo Locations...")
    print("="*70)
    
    cursor = conn.cursor()
    
    locations = [
        {
            'name': 'Vịnh Hạ Long',
            'description': 'Di sản thiên nhiên thế giới với những hang động tuyệt đẹp và núi đá vôi kỳ bí. Một trong những kỳ quan thiên nhiên đẹp nhất Việt Nam.',
            'latitude': 20.9101,
            'longitude': 107.1839,
            'address': 'Vịnh Hạ Long, Quảng Ninh, Việt Nam',
            'city': 'Hạ Long',
            'province': 'Quảng Ninh',
            'category': 'attraction',
            'subcategory': 'Natural Wonder',
            'price_range': 'mid-range',
            'rating': 4.8,
            'reviews_count': 2543,
            'tags': json.dumps(['thiên nhiên', 'di sản', 'du thuyền', 'hải sản']),
            'verified': True,
            'status': 'active'
        },
        {
            'name': 'Phố cổ Hội An',
            'description': 'Khu phố cổ được UNESCO công nhận với kiến trúc độc đáo và văn hóa đặc sắc. Nơi hội tụ của nhiều nền văn hóa Á Đông.',
            'latitude': 15.8801,
            'longitude': 108.338,
            'address': 'Hội An, Quảng Nam, Việt Nam',
            'city': 'Hội An',
            'province': 'Quảng Nam',
            'category': 'attraction',
            'subcategory': 'Historical Site',
            'price_range': 'budget',
            'rating': 4.7,
            'reviews_count': 1876,
            'tags': json.dumps(['lịch sử', 'kiến trúc', 'văn hóa', 'đèn lồng']),
            'verified': True,
            'status': 'active'
        },
        {
            'name': 'Ruộng bậc thang Sapa',
            'description': 'Ruộng bậc thang tuyệt đẹp của đồng bào dân tộc thiểu số. Phong cảnh núi non hùng vĩ và văn hóa độc đáo.',
            'latitude': 22.338,
            'longitude': 103.8442,
            'address': 'Sapa, Lào Cai, Việt Nam',
            'city': 'Sapa',
            'province': 'Lào Cai',
            'category': 'attraction',
            'subcategory': 'Cultural Heritage',
            'price_range': 'budget',
            'rating': 4.6,
            'reviews_count': 1234,
            'tags': json.dumps(['thiên nhiên', 'văn hóa dân tộc', 'trekking', 'homestay']),
            'verified': True,
            'status': 'active'
        },
        {
            'name': 'Chợ Bến Thành',
            'description': 'Chợ truyền thống nổi tiếng với đa dạng món ăn đường phố Sài Gòn. Trải nghiệm văn hóa ẩm thực miền Nam.',
            'latitude': 10.772,
            'longitude': 106.698,
            'address': 'Lê Lợi, Bến Nghé, Quận 1, TP.HCM',
            'city': 'TP.HCM',
            'province': 'TP.HCM',
            'category': 'shopping',
            'subcategory': 'Traditional Market',
            'price_range': 'budget',
            'rating': 4.3,
            'reviews_count': 987,
            'tags': json.dumps(['ẩm thực', 'chợ truyền thống', 'văn hóa', 'street food']),
            'verified': True,
            'status': 'active'
        },
        {
            'name': 'Đảo Phú Quốc',
            'description': 'Đảo ngọc với bãi biển tuyệt đẹp và hải sản tươi ngon. Thiên đường nghỉ dưỡng lý tưởng.',
            'latitude': 10.2899,
            'longitude': 103.984,
            'address': 'Phú Quốc, Kiên Giang, Việt Nam',
            'city': 'Phú Quốc',
            'province': 'Kiên Giang',
            'category': 'attraction',
            'subcategory': 'Beach Resort',
            'price_range': 'luxury',
            'rating': 4.5,
            'reviews_count': 1654,
            'tags': json.dumps(['biển', 'resort', 'hải sản', 'nghỉ dưỡng']),
            'verified': True,
            'status': 'active'
        },
        {
            'name': 'Cố Đô Huế',
            'description': 'Di sản văn hóa thế giới với những công trình kiến trúc cổ kính và lăng tẩm vua chúa.',
            'latitude': 16.4637,
            'longitude': 107.5909,
            'address': 'Huế, Thừa Thiên Huế, Việt Nam',
            'city': 'Huế',
            'province': 'Thừa Thiên Huế',
            'category': 'attraction',
            'subcategory': 'Historical Site',
            'price_range': 'mid-range',
            'rating': 4.6,
            'reviews_count': 1432,
            'tags': json.dumps(['lịch sử', 'kiến trúc', 'văn hóa', 'UNESCO']),
            'verified': True,
            'status': 'active'
        },
        {
            'name': 'Thành phố Đà Lạt',
            'description': 'Thành phố ngàn hoa với khí hậu mát mẻ quanh năm. Thiên đường của du lịch nghỉ dưỡng và tham quan.',
            'latitude': 11.9404,
            'longitude': 108.4583,
            'address': 'Đà Lạt, Lâm Đồng, Việt Nam',
            'city': 'Đà Lạt',
            'province': 'Lâm Đồng',
            'category': 'attraction',
            'subcategory': 'Mountain Resort',
            'price_range': 'mid-range',
            'rating': 4.7,
            'reviews_count': 2134,
            'tags': json.dumps(['núi', 'hoa', 'nghỉ dưỡng', 'thác nước']),
            'verified': True,
            'status': 'active'
        },
        {
            'name': 'Vườn Quốc Gia Phong Nha - Kẻ Bàng',
            'description': 'Di sản thiên nhiên thế giới với hệ thống hang động đá vôi lớn nhất thế giới.',
            'latitude': 17.5453,
            'longitude': 106.1447,
            'address': 'Quảng Bình, Việt Nam',
            'city': 'Quảng Bình',
            'province': 'Quảng Bình',
            'category': 'attraction',
            'subcategory': 'National Park',
            'price_range': 'mid-range',
            'rating': 4.9,
            'reviews_count': 876,
            'tags': json.dumps(['thiên nhiên', 'hang động', 'di sản', 'UNESCO']),
            'verified': True,
            'status': 'active'
        },
    ]
    
    location_ids = []
    
    for loc in locations:
        try:
            # Check if exists
            cursor.execute(
                "SELECT id FROM locations WHERE name = %s",
                (loc['name'],)
            )
            existing = cursor.fetchone()
            
            if existing:
                loc_id = existing['id']
                print(f"  ✅ Location đã tồn tại: {loc['name']} (ID: {loc_id})")
                location_ids.append(loc_id)
            else:
                # Schema thực tế chỉ có: name, slug, address, city, country, latitude, longitude, description, image_url, featured_image
                # Tạo slug từ name
                slug = loc['name'].lower().replace(' ', '-').replace('đ', 'd').replace('ê', 'e').replace('ô', 'o')
                slug = ''.join(c for c in slug if c.isalnum() or c == '-')
                
                cursor.execute("""
                    INSERT INTO locations (
                        name, slug, description, latitude, longitude, address, city, country, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    loc['name'], slug, loc['description'], loc['latitude'], loc['longitude'],
                    loc['address'], loc['city'], 'Vietnam', datetime.now()
                ))
                loc_id = cursor.lastrowid
                print(f"  ✅ Đã tạo location: {loc['name']} (ID: {loc_id})")
                location_ids.append(loc_id)
        except Exception as e:
            print(f"  ❌ Lỗi tạo location {loc['name']}: {e}")
    
    conn.commit()
    print(f"\n  📊 Tổng số locations: {len(location_ids)}")
    return location_ids

def create_tours(conn, seller_id, location_ids):
    """Tạo tour 数据"""
    print("\n" + "="*70)
    print("🎫 Tạo Tours...")
    print("="*70)
    
    cursor = conn.cursor()
    
    # Generate available dates for next 3 months
    today = datetime.now()
    available_dates = []
    for i in range(1, 91, 3):  # Every 3 days
        date = today + timedelta(days=i)
        available_dates.append(date.strftime('%Y-%m-%d'))
    
    tours = [
        {
            'title': 'Tour Hà Nội - Vịnh Hạ Long 2 Ngày 1 Đêm',
            'description': 'Khám phá thủ đô Hà Nội và vịnh Hạ Long kỳ quan thiên nhiên thế giới. Trải nghiệm văn hóa miền Bắc và cảnh quan tuyệt đẹp.',
            'duration_days': 2,
            'max_participants': 20,
            'min_participants': 2,
            'difficulty_level': 'easy',
            'starting_location': 'Hà Nội',
            'ending_location': 'Hà Nội',
            'itinerary': json.dumps({
                'day1': {
                    'morning': 'Đón khách tại sân bay/khách sạn Hà Nội, khởi hành đi Hạ Long',
                    'afternoon': 'Tham quan hang Sửng Sốt, chèo thuyền kayak, tắm biển',
                    'evening': 'Nghỉ đêm trên tàu, thưởng thức hải sản tươi sống'
                },
                'day2': {
                    'morning': 'Tham quan hang Luồn, tiên ông',
                    'afternoon': 'Quay về Hà Nội, tham quan phố cổ Hà Nội',
                    'evening': 'Kết thúc tour, tiễn khách'
                }
            }),
            'locations_covered': json.dumps([location_ids[0]] if len(location_ids) > 0 else []),
            'price_per_person': 2500000,
            'currency': 'VND',
            'discount_percentage': 10.0,
            'inclusions': json.dumps([
                'Xe đưa đón Hà Nội - Hạ Long',
                'Tàu tham quan vịnh Hạ Long',
                'Hướng dẫn viên tiếng Việt/Anh',
                'Bữa ăn theo chương trình',
                'Phòng nghỉ trên tàu (2 người/phòng)',
                'Bảo hiểm du lịch'
            ]),
            'exclusions': json.dumps([
                'Đồ uống cá nhân',
                'Chi phí phát sinh',
                'Tips cho hướng dẫn viên',
                'Dịch vụ massage, spa'
            ]),
            'category': 'adventure',
            'tags': json.dumps(['hạ long', 'hà nội', 'du thuyền', 'thiên nhiên']),
            'rating': 4.8,
            'reviews_count': 342,
            'views_count': 1250,
            'status': 'active',
            'featured': True,
            'available_dates': json.dumps(available_dates[:30])
        },
        {
            'title': 'Tour Miền Trung: Đà Nẵng - Hội An - Huế 4 Ngày',
            'description': 'Hành trình khám phá di sản văn hóa miền Trung: phố cổ Hội An, cố đô Huế và thành phố biển Đà Nẵng.',
            'duration_days': 4,
            'max_participants': 16,
            'min_participants': 2,
            'difficulty_level': 'moderate',
            'starting_location': 'Đà Nẵng',
            'ending_location': 'Huế',
            'itinerary': json.dumps({
                'day1': {
                    'morning': 'Đón tại Đà Nẵng, tham quan Bà Nà Hills',
                    'afternoon': 'Check-in khách sạn, nghỉ ngơi',
                    'evening': 'Thưởng thức hải sản tại Đà Nẵng'
                },
                'day2': {
                    'morning': 'Khởi hành đi Hội An, tham quan phố cổ',
                    'afternoon': 'Làm đèn lồng, tham quan chùa Cầu',
                    'evening': 'Ngắm đèn lồng, shopping tại Hội An'
                },
                'day3': {
                    'morning': 'Khởi hành đi Huế, tham quan lăng Khải Định',
                    'afternoon': 'Tham quan Đại Nội, Hoàng Thành',
                    'evening': 'Thưởng thức ẩm thực cung đình Huế'
                },
                'day4': {
                    'morning': 'Chùa Thiên Mụ, tham quan sông Hương',
                    'afternoon': 'Mua quà, trả khách tại Huế hoặc Đà Nẵng'
                }
            }),
            'locations_covered': json.dumps([location_ids[1], location_ids[5]] if len(location_ids) > 5 else []),
            'price_per_person': 5800000,
            'currency': 'VND',
            'discount_percentage': 15.0,
            'inclusions': json.dumps([
                'Xe du lịch đời mới có máy lạnh',
                'Hướng dẫn viên chuyên nghiệp',
                'Vé tham quan các điểm du lịch',
                'Khách sạn 3 sao (3 đêm)',
                'Bữa ăn theo chương trình',
                'Bảo hiểm du lịch'
            ]),
            'exclusions': json.dumps([
                'Vé máy bay',
                'Đồ uống cá nhân',
                'Chi phí phát sinh',
                'Tips, phụ thu phòng đơn'
            ]),
            'category': 'cultural',
            'tags': json.dumps(['hội an', 'huế', 'đà nẵng', 'văn hóa', 'di sản']),
            'rating': 4.7,
            'reviews_count': 256,
            'views_count': 890,
            'status': 'active',
            'featured': True,
            'available_dates': json.dumps(available_dates)
        },
        {
            'title': 'Tour Sapa Trekking 3 Ngày 2 Đêm',
            'description': 'Khám phá Sapa với trekking qua các bản làng dân tộc, ngắm ruộng bậc thang và trải nghiệm văn hóa địa phương.',
            'duration_days': 3,
            'max_participants': 12,
            'min_participants': 2,
            'difficulty_level': 'moderate',
            'starting_location': 'Sapa',
            'ending_location': 'Sapa',
            'itinerary': json.dumps({
                'day1': {
                    'morning': 'Đón tại Sapa, trekking bản Tả Van',
                    'afternoon': 'Khám phá bản Cát Cát, thác nước',
                    'evening': 'Nghỉ đêm homestay tại bản làng'
                },
                'day2': {
                    'morning': 'Trekking bản Lao Chải, Tả Van',
                    'afternoon': 'Thăm ruộng bậc thang, tìm hiểu văn hóa dân tộc',
                    'evening': 'Nghỉ đêm tại Sapa'
                },
                'day3': {
                    'morning': 'Chinh phục đỉnh Fansipan (nếu có thời gian)',
                    'afternoon': 'Mua sắm tại chợ Sapa, kết thúc tour'
                }
            }),
            'locations_covered': json.dumps([location_ids[2]] if len(location_ids) > 2 else []),
            'price_per_person': 3200000,
            'currency': 'VND',
            'discount_percentage': 5.0,
            'inclusions': json.dumps([
                'Xe đưa đón tại Sapa',
                'Hướng dẫn viên địa phương',
                'Homestay tại bản làng (1 đêm)',
                'Khách sạn Sapa (1 đêm)',
                'Bữa ăn theo chương trình',
                'Vé tham quan các điểm'
            ]),
            'exclusions': json.dumps([
                'Vé cáp treo Fansipan',
                'Đồ uống cá nhân',
                'Chi phí phát sinh',
                'Tips'
            ]),
            'category': 'nature',
            'tags': json.dumps(['sapa', 'trekking', 'văn hóa dân tộc', 'ruộng bậc thang']),
            'rating': 4.6,
            'reviews_count': 189,
            'views_count': 678,
            'status': 'active',
            'featured': False,
            'available_dates': json.dumps(available_dates)
        },
        {
            'title': 'Tour Phú Quốc Resort 3 Ngày 2 Đêm',
            'description': 'Nghỉ dưỡng tại đảo ngọc Phú Quốc với resort 4 sao, thưởng thức hải sản tươi sống và khám phá các bãi biển đẹp nhất.',
            'duration_days': 3,
            'max_participants': 25,
            'min_participants': 2,
            'difficulty_level': 'easy',
            'starting_location': 'Phú Quốc',
            'ending_location': 'Phú Quốc',
            'itinerary': json.dumps({
                'day1': {
                    'morning': 'Đón tại sân bay Phú Quốc, check-in resort',
                    'afternoon': 'Nghỉ ngơi tại bãi biển, tắm biển',
                    'evening': 'Thưởng thức hải sản tại nhà hàng biển'
                },
                'day2': {
                    'morning': 'Tham quan Công viên Safari, Vinpearl Land',
                    'afternoon': 'Tham quan chợ đêm Dinh Cậu',
                    'evening': 'Nghỉ ngơi tại resort'
                },
                'day3': {
                    'morning': 'Tự do tắm biển, shopping',
                    'afternoon': 'Check-out, tiễn khách ra sân bay'
                }
            }),
            'locations_covered': json.dumps([location_ids[4]] if len(location_ids) > 4 else []),
            'price_per_person': 4500000,
            'currency': 'VND',
            'discount_percentage': 20.0,
            'inclusions': json.dumps([
                'Xe đưa đón sân bay',
                'Resort 4 sao (2 đêm)',
                'Bữa sáng buffet',
                'Vé tham quan Safari, Vinpearl',
                'Bảo hiểm du lịch'
            ]),
            'exclusions': json.dumps([
                'Vé máy bay',
                'Bữa trưa, tối',
                'Đồ uống cá nhân',
                'Chi phí spa, massage'
            ]),
            'category': 'nature',
            'tags': json.dumps(['phú quốc', 'resort', 'biển', 'nghỉ dưỡng', 'hải sản']),
            'rating': 4.5,
            'reviews_count': 423,
            'views_count': 1567,
            'status': 'active',
            'featured': True,
            'available_dates': json.dumps(available_dates)
        },
        {
            'title': 'Tour Đà Lạt Ngàn Hoa 2 Ngày 1 Đêm',
            'description': 'Khám phá thành phố ngàn hoa với thác nước, đồi chè, vườn hoa và không khí mát mẻ quanh năm.',
            'duration_days': 2,
            'max_participants': 18,
            'min_participants': 2,
            'difficulty_level': 'easy',
            'starting_location': 'Đà Lạt',
            'ending_location': 'Đà Lạt',
            'itinerary': json.dumps({
                'day1': {
                    'morning': 'Đón tại Đà Lạt, tham quan thác Datanla',
                    'afternoon': 'Tham quan vườn hoa thành phố, đồi chè Cầu Đất',
                    'evening': 'Chợ đêm Đà Lạt, thưởng thức ẩm thực địa phương'
                },
                'day2': {
                    'morning': 'Tham quan Dinh Bảo Đại, nhà thờ Con Gà',
                    'afternoon': 'Tham quan vườn hoa, mua sắm đặc sản',
                    'evening': 'Kết thúc tour'
                }
            }),
            'locations_covered': json.dumps([location_ids[6]] if len(location_ids) > 6 else []),
            'price_per_person': 1800000,
            'currency': 'VND',
            'discount_percentage': 0.0,
            'inclusions': json.dumps([
                'Xe du lịch',
                'Hướng dẫn viên',
                'Vé tham quan các điểm',
                'Khách sạn 3 sao (1 đêm)',
                'Bữa sáng buffet'
            ]),
            'exclusions': json.dumps([
                'Bữa trưa, tối',
                'Đồ uống cá nhân',
                'Chi phí phát sinh'
            ]),
            'category': 'nature',
            'tags': json.dumps(['đà lạt', 'hoa', 'thác nước', 'nghỉ dưỡng']),
            'rating': 4.7,
            'reviews_count': 298,
            'views_count': 1123,
            'status': 'active',
            'featured': False,
            'available_dates': json.dumps(available_dates[:60])
        },
    ]
    
    tour_ids = []
    
    for tour in tours:
        try:
            # Check if exists
            cursor.execute(
                "SELECT id FROM tours WHERE title = %s AND seller_id = %s",
                (tour['title'], seller_id)
            )
            existing = cursor.fetchone()
            
            if existing:
                tour_id = existing['id']
                print(f"  ✅ Tour đã tồn tại: {tour['title'][:50]}... (ID: {tour_id})")
                tour_ids.append(tour_id)
            else:
                cursor.execute("""
                    INSERT INTO tours (
                        title, description, duration_days, max_participants, min_participants,
                        difficulty_level, starting_location, ending_location, itinerary,
                        locations_covered, price_per_person, currency, discount_percentage,
                        inclusions, exclusions, category, tags, rating, reviews_count,
                        views_count, status, featured, available_dates, seller_id, created_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    tour['title'], tour['description'], tour['duration_days'],
                    tour['max_participants'], tour['min_participants'],
                    tour['difficulty_level'], tour['starting_location'],
                    tour['ending_location'], tour['itinerary'],
                    tour['locations_covered'], tour['price_per_person'],
                    tour['currency'], tour['discount_percentage'],
                    tour['inclusions'], tour['exclusions'],
                    tour['category'], tour['tags'], tour['rating'],
                    tour['reviews_count'], tour['views_count'],
                    tour['status'], tour['featured'], tour['available_dates'],
                    seller_id, datetime.now()
                ))
                tour_id = cursor.lastrowid
                print(f"  ✅ Đã tạo tour: {tour['title'][:50]}... (ID: {tour_id})")
                tour_ids.append(tour_id)
        except Exception as e:
            print(f"  ❌ Lỗi tạo tour {tour['title'][:30]}: {e}")
    
    conn.commit()
    print(f"\n  📊 Tổng số tours: {len(tour_ids)}")
    return tour_ids

def main():
    """Main function"""
    print("="*70)
    print("🌱 VieGo Blog - Seed Tours & Maps Data")
    print("="*70)
    print(f"⏰ Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    conn = get_connection()
    if not conn:
        print("\n❌ Không thể kết nối database!")
        print("💡 Đảm bảo:")
        print("   1. MySQL đang chạy (Laragon)")
        print("   2. Database 'viego_blog' đã được tạo")
        print("   3. Kiểm tra username/password trong script")
        return
    
    try:
        # Create seller
        seller_id = create_seller(conn)
        if not seller_id:
            print("\n❌ Không thể tạo seller, dừng script!")
            return
        
        # Create locations
        location_ids = create_locations(conn)
        
        # Create tours
        tour_ids = create_tours(conn, seller_id, location_ids)
        
        print("\n" + "="*70)
        print("✅ HOÀN THÀNH!")
        print("="*70)
        print(f"\n📊 Tổng kết:")
        print(f"   - Seller: 1 (ID: {seller_id})")
        print(f"   - Locations: {len(location_ids)}")
        print(f"   - Tours: {len(tour_ids)}")
        
        print(f"\n🔑 Thông tin đăng nhập Seller:")
        print(f"   Username: tour_seller_vn")
        print(f"   Email: seller@viego.com")
        print(f"   Password: Seller@123")
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()
        print("\n✅ Đã đóng kết nối database")

if __name__ == '__main__':
    main()

