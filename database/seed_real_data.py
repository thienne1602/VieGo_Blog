"""
Seed Real Data for VieGo Blog
Tạo dữ liệu thực tế cho database: users, locations, posts, comments, likes, followers
"""

import pymysql
import sys
from datetime import datetime, timedelta
import random
from werkzeug.security import generate_password_hash

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

def create_users(conn):
    """Tạo users thực tế"""
    print("\n" + "="*70)
    print("👥 Tạo Users...")
    print("="*70)
    
    users = [
        {
            'username': 'admin',
            'email': 'admin@viego.com',
            'password': 'Admin@123',
            'full_name': 'Administrator',
            'bio': 'System Administrator - VieGo Blog',
            'role': 'admin'
        },
        {
            'username': 'nguyenvana',
            'email': 'vana@gmail.com',
            'password': 'User@123',
            'full_name': 'Nguyễn Văn A',
            'bio': 'Yêu thích du lịch khám phá Việt Nam. Đã đi qua 50+ tỉnh thành.',
            'role': 'user'
        },
        {
            'username': 'tranthib',
            'email': 'thib@gmail.com',
            'password': 'User@123',
            'full_name': 'Trần Thị B',
            'bio': 'Travel blogger, photographer. Đam mê chụp ảnh phong cảnh.',
            'role': 'user'
        },
        {
            'username': 'leminhtuan',
            'email': 'minhtuan@gmail.com',
            'password': 'User@123',
            'full_name': 'Lê Minh Tuấn',
            'bio': 'Food blogger - Khám phá ẩm thực Việt Nam',
            'role': 'user'
        },
        {
            'username': 'phamthuhang',
            'email': 'thuhang@gmail.com',
            'password': 'User@123',
            'full_name': 'Phạm Thu Hằng',
            'bio': 'Backpacker - Budget travel specialist',
            'role': 'user'
        },
        {
            'username': 'editor01',
            'email': 'editor@viego.com',
            'password': 'Editor@123',
            'full_name': 'Biên Tập Viên',
            'bio': 'Content Editor - VieGo Blog',
            'role': 'editor'
        }
    ]
    
    with conn.cursor() as cursor:
        for user in users:
            try:
                # Check if user exists
                cursor.execute("SELECT id FROM users WHERE username = %s", (user['username'],))
                if cursor.fetchone():
                    print(f"   ⚠️  User {user['username']} đã tồn tại, skip")
                    continue
                
                password_hash = generate_password_hash(user['password'])
                
                sql = """
                INSERT INTO users (username, email, password_hash, full_name, bio, role, is_active, email_verified)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE, TRUE)
                """
                cursor.execute(sql, (
                    user['username'],
                    user['email'],
                    password_hash,
                    user['full_name'],
                    user['bio'],
                    user['role']
                ))
                
                print(f"   ✅ {user['username']} ({user['role']}) - Password: {user['password']}")
                
            except Exception as e:
                print(f"   ❌ Lỗi tạo user {user['username']}: {e}")
        
        conn.commit()
    
    print(f"\n✅ Hoàn tất tạo users!")

def create_locations(conn):
    """Tạo locations thực tế ở Việt Nam"""
    print("\n" + "="*70)
    print("📍 Tạo Locations...")
    print("="*70)
    
    locations = [
        {
            'name': 'Vịnh Hạ Long',
            'address': 'Thành phố Hạ Long',
            'city': 'Quảng Ninh',
            'country': 'Việt Nam',
            'latitude': 20.9101,
            'longitude': 107.1839,
            'description': 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi tuyệt đẹp'
        },
        {
            'name': 'Phố Cổ Hội An',
            'address': 'Phố cổ Hội An',
            'city': 'Quảng Nam',
            'country': 'Việt Nam',
            'latitude': 15.8801,
            'longitude': 108.3380,
            'description': 'Thành phố cổ với kiến trúc độc đáo, đèn lồng lung linh'
        },
        {
            'name': 'Phố Cổ Hà Nội',
            'address': 'Hoàn Kiếm',
            'city': 'Hà Nội',
            'country': 'Việt Nam',
            'latitude': 21.0285,
            'longitude': 105.8542,
            'description': '36 phố phường với lịch sử hàng nghìn năm tuổi'
        },
        {
            'name': 'Hồ Hoàn Kiếm',
            'address': 'Trung tâm Hà Nội',
            'city': 'Hà Nội',
            'country': 'Việt Nam',
            'latitude': 21.0285,
            'longitude': 105.8522,
            'description': 'Biểu tượng của Thủ đô Hà Nội, hồ nước ngọt trong lòng thành phố'
        },
        {
            'name': 'Đà Lạt',
            'address': 'Thành phố Đà Lạt',
            'city': 'Lâm Đồng',
            'country': 'Việt Nam',
            'latitude': 11.9404,
            'longitude': 108.4583,
            'description': 'Thành phố ngàn hoa với khí hậu mát mẻ quanh năm'
        },
        {
            'name': 'Sapa',
            'address': 'Thị trấn Sa Pa',
            'city': 'Lào Cai',
            'country': 'Việt Nam',
            'latitude': 22.3363,
            'longitude': 103.8438,
            'description': 'Ruộng bậc thang tuyệt đẹp, văn hóa dân tộc độc đáo'
        },
        {
            'name': 'Nha Trang',
            'address': 'Thành phố Nha Trang',
            'city': 'Khánh Hòa',
            'country': 'Việt Nam',
            'latitude': 12.2388,
            'longitude': 109.1967,
            'description': 'Bãi biển đẹp nhất Việt Nam với nước biển trong xanh'
        },
        {
            'name': 'Phú Quốc',
            'address': 'Đảo Phú Quốc',
            'city': 'Kiên Giang',
            'country': 'Việt Nam',
            'latitude': 10.2899,
            'longitude': 103.9840,
            'description': 'Đảo ngọc với bãi biển hoang sơ và hải sản tươi ngon'
        },
        {
            'name': 'Huế',
            'address': 'Thành phố Huế',
            'city': 'Thừa Thiên Huế',
            'country': 'Việt Nam',
            'latitude': 16.4637,
            'longitude': 107.5909,
            'description': 'Cố đô với kiến trúc cung điện và lăng tẩm tráng lệ'
        },
        {
            'name': 'Hồ Chí Minh',
            'address': 'Trung tâm Quận 1',
            'city': 'Hồ Chí Minh',
            'country': 'Việt Nam',
            'latitude': 10.7769,
            'longitude': 106.7009,
            'description': 'Thành phố năng động nhất Việt Nam với cuộc sống nhộn nhịp'
        }
    ]
    
    with conn.cursor() as cursor:
        for loc in locations:
            try:
                cursor.execute("SELECT id FROM locations WHERE name = %s", (loc['name'],))
                if cursor.fetchone():
                    print(f"   ⚠️  Location {loc['name']} đã tồn tại, skip")
                    continue
                
                sql = """
                INSERT INTO locations (name, address, city, country, latitude, longitude, description)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(sql, (
                    loc['name'],
                    loc['address'],
                    loc['city'],
                    loc['country'],
                    loc['latitude'],
                    loc['longitude'],
                    loc['description']
                ))
                
                print(f"   ✅ {loc['name']}, {loc['city']}")
                
            except Exception as e:
                print(f"   ❌ Lỗi tạo location {loc['name']}: {e}")
        
        conn.commit()
    
    print(f"\n✅ Hoàn tất tạo locations!")

def create_posts(conn):
    """Tạo blog posts thực tế"""
    print("\n" + "="*70)
    print("📝 Tạo Posts...")
    print("="*70)
    
    # Get users and locations
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, username FROM users WHERE role != 'admin'")
        users = cursor.fetchall()
        
        cursor.execute("SELECT id, name FROM locations")
        locations = cursor.fetchall()
        
        if not users or not locations:
            print("❌ Cần có users và locations trước!")
            return
    
    posts = [
        {
            'title': 'Hướng dẫn du lịch Hạ Long 3 ngày 2 đêm tiết kiệm',
            'content': '''Vịnh Hạ Long là một trong những địa điểm du lịch nổi tiếng nhất Việt Nam. Sau chuyến đi vừa qua, mình xin chia sẻ kinh nghiệm du lịch Hạ Long tiết kiệm nhưng vẫn trọn vẹn.

**Ngày 1: Khám phá phố cổ Hạ Long**
- Buổi sáng: Di chuyển từ Hà Nội xuống Hạ Long (khoảng 3-4 tiếng)
- Trưa: Ăn trưa tại chợ Hạ Long, thử hải sản tươi sống
- Chiều: Tham quan Sun World Hạ Long Park, cáp treo lên đỉnh Bảo Đài
- Tối: Dạo quanh phố cổ, thưởng thức ẩm thực địa phương

**Ngày 2: Tour du thuyền Vịnh Hạ Long**
- Cả ngày: Tham gia tour du thuyền 1 ngày (giá khoảng 400-600k/người)
- Hoạt động: Chèo kayak, bơi lội, thăm hang động
- Điểm đến: Hang Sửng Sốt, Đảo Titop, Làng chài

**Ngày 3: Thăm quan thêm và về**
- Sáng: Tham quan Quảng Ninh Museum (miễn phí)
- Trưa: Ăn trưa và mua đặc sản
- Chiều: Khởi hành về Hà Nội

**Chi phí ước tính:** 2-3 triệu/người cho cả chuyến đi.''',
            'summary': 'Kinh nghiệm du lịch Vịnh Hạ Long 3 ngày 2 đêm với chi phí tiết kiệm, tham quan đầy đủ các điểm đến nổi tiếng.',
            'category': 'Hướng dẫn du lịch',
            'location': 'Vịnh Hạ Long',
            'tags': '["Hạ Long", "du lịch tiết kiệm", "3 ngày 2 đêm", "Quảng Ninh"]'
        },
        {
            'title': 'Top 10 quán ăn ngon nhất định phải thử khi đến Hội An',
            'content': '''Hội An không chỉ nổi tiếng với phố cổ mà còn là thiên đường ẩm thực. Dưới đây là 10 quán ăn mình đã thử và rất hài lòng:

**1. Cao Lầu Thanh (22 Thái Phiên)**
- Món đặc sản: Cao lầu
- Giá: 30-40k/bát
- Đánh giá: 5⭐

**2. Bánh Mì Phượng (2B Phan Châu Trinh)**
- Nổi tiếng khắp thế giới
- Giá: 20-30k/ổ
- Phải xếp hàng đông!

**3. Com Ga Bà Buội (22 Phan Châu Trinh)**
- Cơm gà xé phay cực ngon
- Giá: 30-35k/phần

**4. Mì Quảng Bà Mua (1 Trần Cao Vân)**
- Mì Quảng đậm đà, thơm ngon
- Giá: 30-40k/tô

**5. White Rose (533 Hai Bà Trưng)**
- Bánh bao vạc - đặc sản Hội An
- Giá: 40-50k/phần

*Còn 5 quán nữa mình sẽ chia sẻ trong bài viết chi tiết...*

Nhớ đến sớm để tránh đông đúc nhé!''',
            'summary': 'Review chi tiết 10 quán ăn ngon nhất Hội An, từ món đặc sản đến ẩm thực đường phố với giá cả hợp lý.',
            'category': 'Ẩm thực',
            'location': 'Phố Cổ Hội An',
            'tags': '["Hội An", "ẩm thực", "cao lầu", "bánh mì", "quán ăn ngon"]'
        },
        {
            'title': 'Checklist đồ cần mang khi đi Sapa mùa đông',
            'content': '''Sapa mùa đông rất lạnh, nhiệt độ có thể xuống 0-5 độ C. Đây là checklist đồ cần thiết mình đã chuẩn bị:

**Quần áo:**
- Áo khoác lông/phao dày
- Áo len, áo nỉ
- Khăn quàng cổ
- Găng tay, mũ len
- Quần dài ấm
- Tất dày

**Giày dép:**
- Giày thể thao hoặc giày trekking
- Tất len dày
- Dép đi trong phòng

**Skincare:**
- Kem dưỡng ẩm
- Son dưỡng môi
- Kem chống nắng (vẫn cần!)

**Khác:**
- Thuốc cảm
- Nhiệt kế
- Pin sạc dự phòng
- Túi ni lông (đề phòng mưa)

**Lưu ý:**
- Đặt phòng sớm vì Sapa mùa đông rất đông khách
- Chuẩn bị tiền mặt vì nhiều nơi không có ATM
- Mang theo ô hoặc áo mưa

Chúc các bạn có chuyến đi vui vẻ!''',
            'summary': 'Hướng dẫn chi tiết những thứ cần mang theo khi đi Sapa mùa đông, giúp bạn chuẩn bị chu đáo cho chuyến đi.',
            'category': 'Tips & Tricks',
            'location': 'Sapa',
            'tags': '["Sapa", "mùa đông", "checklist", "chuẩn bị", "du lịch"]'
        },
        {
            'title': 'Đà Lạt - Thành phố mộng mơ qua ống kính của tôi',
            'content': '''Đà Lạt luôn có sức hút đặc biệt với tôi. Sau 5 lần đến, mỗi lần đều mang lại những cảm xúc khác nhau.

**Những địa điểm chụp ảnh đẹp:**

1. **Đồi chè Cầu Đất**
   - Thời gian đẹp nhất: Sáng sớm (5-6h)
   - Tips: Mang theo áo dài để chụp ảnh
   
2. **Hồ Tuyền Lâm**
   - View nhìn từ trên cao tuyệt đẹp
   - Có thể thuê thuyền kayak
   
3. **Ga Đà Lạt**
   - Kiến trúc cổ điển Pháp
   - Đẹp cả ngày lẫn tối

4. **Quảng trường Lâm Viên**
   - Biểu tượng của Đà Lạt
   - Đẹp nhất khi có đèn trang trí

5. **Thung lũng Đà Lạt**
   - Cánh đồng hoa rộng lớn
   - Nhiều góc check-in

**Kinh nghiệm chụp ảnh:**
- Đi sớm để tránh đông người
- Mang nhiều bộ đồ để thay đổi
- Thuê photographer local nếu cần (300-500k/set)

Đà Lạt là nơi bạn có thể chụp ảnh đẹp ở bất cứ đâu!''',
            'summary': 'Chia sẻ những địa điểm chụp ảnh đẹp nhất Đà Lạt cùng kinh nghiệm chụp ảnh du lịch từ nhiều chuyến đi.',
            'category': 'Photography',
            'location': 'Đà Lạt',
            'tags': '["Đà Lạt", "chụp ảnh", "địa điểm đẹp", "photography"]'
        },
        {
            'title': 'Trải nghiệm homestay view núi tuyệt đẹp ở Sapa',
            'content': '''Lần này đi Sapa, mình đã tìm được một homestay view cực đẹp và muốn chia sẻ với mọi người.

**Thông tin homestay:**
- Tên: Sapa Valley View Homestay
- Địa chỉ: Lao Chải, Sapa
- Giá: 300-500k/phòng/đêm
- View: Ruộng bậc thang và núi non

**Điểm nổi bật:**
✅ View từ phòng nhìn ra ruộng bậc thang
✅ Chủ nhà thân thiện, nhiệt tình
✅ Có bữa sáng miễn phí (phở, bánh mì)
✅ Phòng sạch sẽ, có điều hòa, nước nóng
✅ Ban công riêng để ngắm cảnh

**Hoạt động:**
- Trekking đến các bản làng
- Ngắm bình minh trên ban công
- BBQ tối (order thêm 150k/người)
- Tìm hiểu văn hóa dân tộc

**Booking:**
- Nên đặt trước 1-2 tuần
- Có thể liên hệ qua Facebook
- Free pick-up từ trung tâm Sapa

Đây là một trong những homestay đẹp nhất mình từng ở!''',
            'summary': 'Review chi tiết homestay view đẹp ở Sapa với giá cả hợp lý, view ruộng bậc thang tuyệt vời.',
            'category': 'Accommodation',
            'location': 'Sapa',
            'tags': '["Sapa", "homestay", "accommodation", "view đẹp"]'
        },
        {
            'title': 'Khám phá ẩm thực đường phố Hà Nội trong 24 giờ',
            'content': '''Hà Nội - thiên đường ẩm thực đường phố! Đây là lịch trình ăn uống mình đã thực hiện:

**6h sáng: Phở Gia Truyền Bát Đàn**
- Địa chỉ: 49 Bát Đàn
- Giá: 40-50k/tô
- Must try!

**9h sáng: Cà phê trứng Giảng**
- Địa chỉ: 39 Nguyễn Hữu Huân
- Giá: 35k/ly
- Độc đáo, ngon

**12h trưa: Bún chả Hương Liên**
- Địa chỉ: 24 Lê Văn Hưu
- Obama từng ăn ở đây!
- Giá: 40-50k/phần

**3h chiều: Chè Thanh Vân**
- Địa chỉ: 48 Nguyễn Thị Định
- Đủ loại chè ngon
- Giá: 15-25k/tô

**6h tối: Bún đậu mắm tôm**
- Nhiều quán ở Hàng Bồ
- Giá: 40-60k/phần

**9h tối: Bia hơi Tạ Hiện**
- Bia tươi + đồ nhắm
- Trải nghiệm văn hóa đêm HN

Tổng chi phí: khoảng 300-400k cho cả ngày ăn no nê!''',
            'summary': 'Lịch trình khám phá ẩm thực đường phố Hà Nội trong 24 giờ với các món ăn đặc sản không thể bỏ qua.',
            'category': 'Ẩm thực',
            'location': 'Phố Cổ Hà Nội',
            'tags': '["Hà Nội", "ẩm thực", "phở", "bún chả", "street food"]'
        }
    ]
    
    with conn.cursor() as cursor:
        for i, post in enumerate(posts):
            try:
                # Random user
                user = random.choice(users)
                
                # Find location
                cursor.execute("SELECT id FROM locations WHERE name = %s", (post['location'],))
                location = cursor.fetchone()
                location_id = location['id'] if location else None
                
                # Published time (last 30 days)
                days_ago = random.randint(1, 30)
                published_at = datetime.now() - timedelta(days=days_ago)
                
                sql = """
                INSERT INTO posts (title, content, summary, author_id, location_id, category, 
                                 tags, status, view_count, like_count, published_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'published', %s, %s, %s)
                """
                
                view_count = random.randint(100, 5000)
                like_count = random.randint(10, 500)
                
                cursor.execute(sql, (
                    post['title'],
                    post['content'],
                    post['summary'],
                    user['id'],
                    location_id,
                    post['category'],
                    post['tags'],
                    view_count,
                    like_count,
                    published_at
                ))
                
                print(f"   ✅ {post['title'][:50]}... by {user['username']}")
                
            except Exception as e:
                print(f"   ❌ Lỗi tạo post: {e}")
        
        conn.commit()
    
    print(f"\n✅ Hoàn tất tạo posts!")

def create_comments(conn):
    """Tạo comments cho posts"""
    print("\n" + "="*70)
    print("💬 Tạo Comments...")
    print("="*70)
    
    with conn.cursor() as cursor:
        # Get users and posts
        cursor.execute("SELECT id FROM users")
        users = cursor.fetchall()
        
        cursor.execute("SELECT id, title FROM posts")
        posts = cursor.fetchall()
        
        if not users or not posts:
            print("❌ Cần có users và posts trước!")
            return
    
    comment_templates = [
        "Bài viết rất hữu ích! Cảm ơn bạn đã chia sẻ.",
        "Mình đã đi rồi, thực sự rất đẹp như bạn mô tả!",
        "Bạn có thể chia sẻ thêm về chi phí được không?",
        "Lưu lại để đi sau này. Thanks bạn!",
        "View đẹp quá! Mình phải đi thử mới được.",
        "Có nên đi vào mùa này không bạn?",
        "Thông tin rất chi tiết và dễ hiểu. 5 sao!",
        "Bạn đi bao nhiêu ngày vậy?",
        "Có đông người không bạn? Mình sợ mùa peak.",
        "Ảnh đẹp quá! Bạn chụp bằng máy gì vậy?",
        "Cảm ơn bạn đã review chi tiết!",
        "Mình cũng muốn đi lắm nhưng chưa có cơ hội.",
        "Bạn book homestay qua app nào vậy?",
        "Giá cả có hợp lý không bạn?",
        "Rất hữu ích! Đang plan đi trong tháng này."
    ]
    
    comments_created = 0
    
    with conn.cursor() as cursor:
        for post in posts:
            # Random 2-5 comments per post
            num_comments = random.randint(2, 5)
            
            for _ in range(num_comments):
                user = random.choice(users)
                content = random.choice(comment_templates)
                
                try:
                    sql = """
                    INSERT INTO comments (post_id, user_id, content, like_count)
                    VALUES (%s, %s, %s, %s)
                    """
                    
                    like_count = random.randint(0, 50)
                    cursor.execute(sql, (post['id'], user['id'], content, like_count))
                    comments_created += 1
                    
                except Exception as e:
                    print(f"   ❌ Lỗi tạo comment: {e}")
        
        conn.commit()
    
    print(f"   ✅ Đã tạo {comments_created} comments")
    print(f"\n✅ Hoàn tất tạo comments!")

def create_likes(conn):
    """Tạo likes cho posts"""
    print("\n" + "="*70)
    print("❤️  Tạo Likes...")
    print("="*70)
    
    with conn.cursor() as cursor:
        cursor.execute("SELECT id FROM users")
        users = cursor.fetchall()
        
        cursor.execute("SELECT id FROM posts")
        posts = cursor.fetchall()
        
        if not users or not posts:
            print("❌ Cần có users và posts trước!")
            return
    
    likes_created = 0
    
    with conn.cursor() as cursor:
        for post in posts:
            # Random users like this post
            num_likes = random.randint(5, len(users))
            liked_users = random.sample(users, num_likes)
            
            for user in liked_users:
                try:
                    sql = "INSERT INTO likes (user_id, post_id) VALUES (%s, %s)"
                    cursor.execute(sql, (user['id'], post['id']))
                    likes_created += 1
                except:
                    pass  # Skip duplicates
        
        conn.commit()
    
    print(f"   ✅ Đã tạo {likes_created} likes")
    print(f"\n✅ Hoàn tất tạo likes!")

def create_followers(conn):
    """Tạo follow relationships"""
    print("\n" + "="*70)
    print("👥 Tạo Followers...")
    print("="*70)
    
    with conn.cursor() as cursor:
        cursor.execute("SELECT id FROM users WHERE role != 'admin'")
        users = cursor.fetchall()
        
        if len(users) < 2:
            print("❌ Cần ít nhất 2 users!")
            return
    
    followers_created = 0
    
    with conn.cursor() as cursor:
        for user in users:
            # Each user follows 1-3 other users
            num_following = random.randint(1, min(3, len(users)-1))
            
            # Get other users
            other_users = [u for u in users if u['id'] != user['id']]
            following_users = random.sample(other_users, num_following)
            
            for following in following_users:
                try:
                    sql = "INSERT INTO followers (follower_id, following_id) VALUES (%s, %s)"
                    cursor.execute(sql, (user['id'], following['id']))
                    followers_created += 1
                except:
                    pass  # Skip duplicates
        
        conn.commit()
    
    print(f"   ✅ Đã tạo {followers_created} follow relationships")
    print(f"\n✅ Hoàn tất tạo followers!")

def show_summary(conn):
    """Hiển thị tóm tắt data đã tạo"""
    print("\n" + "="*70)
    print("📊 SUMMARY - DỮ LIỆU ĐÃ TẠO")
    print("="*70)
    
    with conn.cursor() as cursor:
        tables = {
            'users': 'Users',
            'locations': 'Locations',
            'posts': 'Posts',
            'comments': 'Comments',
            'likes': 'Likes',
            'followers': 'Followers'
        }
        
        for table, name in tables.items():
            cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
            count = cursor.fetchone()['count']
            print(f"   {name:.<20} {count:>5} records")
    
    print("\n" + "="*70)
    
    # Show sample data
    with conn.cursor() as cursor:
        print("\n📝 Sample Users:")
        cursor.execute("SELECT username, email, role FROM users LIMIT 5")
        for user in cursor.fetchall():
            print(f"   - {user['username']:.<20} {user['email']:.<30} [{user['role']}]")
        
        print("\n📍 Sample Locations:")
        cursor.execute("SELECT name, city FROM locations LIMIT 5")
        for loc in cursor.fetchall():
            print(f"   - {loc['name']}, {loc['city']}")
        
        print("\n📰 Sample Posts:")
        cursor.execute("""
            SELECT p.title, u.username, p.view_count, p.like_count 
            FROM posts p 
            JOIN users u ON p.author_id = u.id 
            LIMIT 5
        """)
        for post in cursor.fetchall():
            print(f"   - {post['title'][:40]}... by {post['username']} ({post['view_count']} views, {post['like_count']} likes)")

def main():
    """Main function"""
    print("\n" + "="*70)
    print("🚀 SEED REAL DATA FOR VIEGO BLOG")
    print("="*70)
    print("Tạo dữ liệu thực tế cho database...")
    print()
    
    conn = get_connection()
    if not conn:
        print("❌ Không thể kết nối database!")
        return
    
    try:
        create_users(conn)
        create_locations(conn)
        create_posts(conn)
        create_comments(conn)
        create_likes(conn)
        create_followers(conn)
        show_summary(conn)
        
        print("\n" + "="*70)
        print("✅ HOÀN TẤT TẠO DỮ LIỆU!")
        print("="*70)
        print("\n📝 Thông tin đăng nhập:")
        print("   Admin:  admin@viego.com / Admin@123")
        print("   User:   vana@gmail.com / User@123")
        print("   Editor: editor@viego.com / Editor@123")
        print("\n🚀 Có thể khởi động project ngay:")
        print("   .\\run_fullstack.bat")
        print()
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
