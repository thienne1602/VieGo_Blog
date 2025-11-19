"""
Seed Real Vietnam Data for VieGo Blog
Tạo dữ liệu thực tế về Việt Nam cho database: users, locations, posts với đầy đủ thông tin
"""

import pymysql
import sys
import json
from datetime import datetime, timedelta
import random
from werkzeug.security import generate_password_hash
import re
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

def generate_slug(title):
    """Generate URL-friendly slug from title"""
    slug = title.lower()
    # Remove Vietnamese accents
    slug = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', slug)
    slug = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', slug)
    slug = re.sub(r'[ìíịỉĩ]', 'i', slug)
    slug = re.sub(r'[òóọỏõôồốộổỗơờớợởỡ]', 'o', slug)
    slug = re.sub(r'[ùúụủũưừứựửữ]', 'u', slug)
    slug = re.sub(r'[ỳýỵỷỹ]', 'y', slug)
    slug = re.sub(r'[đ]', 'd', slug)
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug

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
            'role': 'admin',
            'avatar_url': 'https://ui-avatars.com/api/?name=Admin&background=0ea5e9&color=fff'
        },
        {
            'username': 'nguyenvana',
            'email': 'vana@gmail.com',
            'password': 'User@123',
            'full_name': 'Nguyễn Văn A',
            'bio': 'Yêu thích du lịch khám phá Việt Nam. Đã đi qua 50+ tỉnh thành.',
            'role': 'user',
            'avatar_url': 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=10b981&color=fff'
        },
        {
            'username': 'tranthib',
            'email': 'thib@gmail.com',
            'password': 'User@123',
            'full_name': 'Trần Thị B',
            'bio': 'Travel blogger, photographer. Đam mê chụp ảnh phong cảnh Việt Nam.',
            'role': 'user',
            'avatar_url': 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=f59e0b&color=fff'
        },
        {
            'username': 'leminhtuan',
            'email': 'minhtuan@gmail.com',
            'password': 'User@123',
            'full_name': 'Lê Minh Tuấn',
            'bio': 'Food blogger - Khám phá ẩm thực Việt Nam từ Bắc vào Nam',
            'role': 'user',
            'avatar_url': 'https://ui-avatars.com/api/?name=Le+Minh+Tuan&background=ef4444&color=fff'
        },
        {
            'username': 'phamthuhang',
            'email': 'thuhang@gmail.com',
            'password': 'User@123',
            'full_name': 'Phạm Thu Hằng',
            'bio': 'Backpacker - Budget travel specialist. Khám phá Việt Nam với ngân sách hạn chế.',
            'role': 'user',
            'avatar_url': 'https://ui-avatars.com/api/?name=Pham+Thu+Hang&background=8b5cf6&color=fff'
        },
        {
            'username': 'editor01',
            'email': 'editor@viego.com',
            'password': 'Editor@123',
            'full_name': 'Biên Tập Viên',
            'bio': 'Content Editor - VieGo Blog',
            'role': 'editor',
            'avatar_url': 'https://ui-avatars.com/api/?name=Editor&background=6366f1&color=fff'
        }
    ]
    
    with conn.cursor() as cursor:
        for user in users:
            try:
                cursor.execute("SELECT id FROM users WHERE username = %s", (user['username'],))
                if cursor.fetchone():
                    cursor.execute("SELECT id FROM users WHERE username = %s", (user['username'],))
                    user_data = cursor.fetchone()
                    print(f"   ⚠️  User {user['username']} đã tồn tại (ID: {user_data['id']})")
                    continue
                
                password_hash = generate_password_hash(user['password'])
                
                sql = """
                INSERT INTO users (username, email, password_hash, full_name, bio, role, is_active, email_verified, avatar_url)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE, TRUE, %s)
                """
                cursor.execute(sql, (
                    user['username'],
                    user['email'],
                    password_hash,
                    user['full_name'],
                    user['bio'],
                    user['role'],
                    user.get('avatar_url', None)
                ))
                
                print(f"   ✅ {user['username']} ({user['role']}) - Password: {user['password']}")
                
            except Exception as e:
                print(f"   ❌ Lỗi tạo user {user['username']}: {e}")
        
        conn.commit()
    
    print(f"\n✅ Hoàn tất tạo users!")

def create_posts(conn):
    """Tạo blog posts thực tế về Việt Nam"""
    print("\n" + "="*70)
    print("📝 Tạo Posts về Việt Nam...")
    print("="*70)
    
    # Get users
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, username FROM users WHERE role != 'admin'")
        users = cursor.fetchall()
        
        if not users:
            print("❌ Cần có users trước!")
            return
    
    posts_data = [
        {
            'title': 'Khám phá Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới',
            'content': '''Vịnh Hạ Long là một trong những di sản thiên nhiên thế giới được UNESCO công nhận, nằm ở tỉnh Quảng Ninh, phía Bắc Việt Nam. Với hơn 1.600 hòn đảo đá vôi và đảo đá vôi vô cùng đẹp mắt, Vịnh Hạ Long đã trở thành điểm đến du lịch hàng đầu của Việt Nam.

## 🌊 Tổng quan về Vịnh Hạ Long

Vịnh Hạ Long có diện tích khoảng 1.553 km² với 1.969 hòn đảo lớn nhỏ. Những hòn đảo này được hình thành từ hàng triệu năm trước, tạo nên cảnh quan kỳ vĩ và độc đáo.

## 🚢 Hoạt động nổi bật

### 1. Du thuyền qua Vịnh
- Thời gian: 2 ngày 1 đêm hoặc 3 ngày 2 đêm
- Giá: 1.500.000 - 3.000.000 VNĐ/người
- Trải nghiệm: Ngắm cảnh, chèo kayak, tham quan hang động

### 2. Chèo kayak khám phá
- Khám phá các hang động ẩn
- Chiêm ngưỡng hệ sinh thái đa dạng
- Giá: 100.000 - 200.000 VNĐ/giờ

### 3. Tham quan hang Sửng Sốt
- Hang động lớn nhất Vịnh Hạ Long
- Kiến trúc tự nhiên tuyệt đẹp
- Giá vé: 30.000 VNĐ/người

## 🍽️ Ẩm thực

Khi đến Hạ Long, bạn không thể bỏ qua:
- Hải sản tươi sống
- Chả mực Hạ Long
- Nem chua Quảng Ninh
- Bánh gật gù

## 💰 Chi phí ước tính

- Du thuyền 2N1Đ: 1.500.000 - 2.500.000 VNĐ/người
- Khách sạn: 500.000 - 2.000.000 VNĐ/đêm
- Ăn uống: 300.000 - 500.000 VNĐ/ngày
- Tổng: 2.500.000 - 5.000.000 VNĐ/người cho chuyến 2 ngày

## 📸 Tips chụp ảnh

- Thời gian đẹp nhất: Bình minh (5-6h sáng) và hoàng hôn (17-18h)
- Địa điểm: Đỉnh núi Bảo Đài, đảo Titop
- Thiết bị: Ống kính góc rộng cho cảnh quan

Vịnh Hạ Long thực sự là một kỳ quan mà mọi người nên đến ít nhất một lần trong đời!''',
            'excerpt': 'Khám phá Vịnh Hạ Long - di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi tuyệt đẹp, hang động huyền bí và hệ sinh thái đa dạng.',
            'category': 'travel',
            'location_name': 'Vịnh Hạ Long',
            'location_address': 'Thành phố Hạ Long, Quảng Ninh',
            'location_lat': 20.9101,
            'location_lng': 107.1839,
            'tags': ['Vịnh Hạ Long', 'Quảng Ninh', 'du lịch', 'UNESCO', 'đảo đá vôi', 'hang động'],
            'featured_image': 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800',
            'images': [
                'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800',
                'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
                'https://images.unsplash.com/photo-1528127269322-539801943592?w=800'
            ],
            'status': 'published',
            'featured': True
        },
        {
            'title': 'Hội An - Thành phố cổ lãng mạn nhất Việt Nam',
            'content': '''Hội An là một thành phố cổ tuyệt đẹp nằm bên bờ sông Thu Bồn, tỉnh Quảng Nam. Với kiến trúc độc đáo kết hợp giữa văn hóa Việt, Trung, Nhật và Pháp, Hội An đã được UNESCO công nhận là Di sản Văn hóa Thế giới.

## 🏮 Lịch sử và Văn hóa

Hội An từng là một thương cảng quan trọng của Đông Nam Á từ thế kỷ 15 đến 19. Thành phố này là nơi giao thoa của nhiều nền văn hóa, tạo nên một không gian kiến trúc độc đáo.

## 🎨 Địa điểm tham quan

### 1. Chùa Cầu Nhật Bản
- Biểu tượng của Hội An
- Xây dựng từ thế kỷ 17
- Kiến trúc độc đáo kết hợp Việt-Nhật

### 2. Nhà cổ Tân Ký
- Một trong những nhà cổ đẹp nhất
- Kiến trúc pha trộn nhiều phong cách
- Vé tham quan: 80.000 VNĐ

### 3. Phố cổ Hội An
- 36 phố phường với kiến trúc cổ
- Đi bộ tham quan miễn phí
- Mua vé tham quan: 120.000 VNĐ

### 4. Làng gốm Thanh Hà
- Nghề gốm truyền thống
- Trải nghiệm làm gốm
- Vé: 35.000 VNĐ/người

## 🍜 Ẩm thực Hội An

### Must-try món ăn:
- **Cao lầu**: Món mì đặc trưng (30-40k/bát)
- **Bánh mì Phượng**: Nổi tiếng thế giới (20-30k/ổ)
- **Cơm gà Bà Buội**: Thơm ngon, đậm đà (30-35k/phần)
- **Mì Quảng**: Đặc sản Quảng Nam (30-40k/tô)
- **White Rose**: Bánh bao vạc (40-50k/phần)

### Top quán ăn:
1. Cao Lầu Thanh (22 Thái Phiên)
2. Bánh Mì Phượng (2B Phan Châu Trinh)
3. Com Ga Bà Buội (22 Phan Châu Trinh)
4. Mì Quảng Bà Mua (1 Trần Cao Vân)

## 🌙 Đêm Hội An

Khi màn đêm buông xuống, Hội An khoác lên mình vẻ đẹp lãng mạn với hàng nghìn chiếc đèn lồng lung linh. Con phố cổ trở nên sống động với các quán cafe, nhà hàng và shop bán đồ lưu niệm.

## 🛍️ Mua sắm

- Áo dài may tại chỗ
- Đèn lồng các loại
- Đồ gốm sứ
- Đồ handmade

## 💰 Chi phí

- Khách sạn: 300.000 - 1.500.000 VNĐ/đêm
- Ăn uống: 200.000 - 400.000 VNĐ/ngày
- Tham quan: 120.000 VNĐ (vé chung)
- Mua sắm: Tùy ý

## 📅 Thời gian tốt nhất để đi

- Mùa khô: Tháng 2 - Tháng 8
- Tránh mùa mưa: Tháng 9 - Tháng 1
- Lễ hội đèn lồng: Rằm tháng Giêng hàng năm

Hội An là một nơi mà thời gian như ngừng lại, mang đến cho bạn những trải nghiệm khó quên!''',
            'excerpt': 'Khám phá Hội An - thành phố cổ lãng mạn với kiến trúc độc đáo, đèn lồng lung linh và ẩm thực đậm đà bản sắc.',
            'category': 'culture',
            'location_name': 'Phố Cổ Hội An',
            'location_address': 'Hội An, Quảng Nam',
            'location_lat': 15.8801,
            'location_lng': 108.3380,
            'tags': ['Hội An', 'phố cổ', 'UNESCO', 'đèn lồng', 'ẩm thực', 'văn hóa'],
            'featured_image': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
            'images': [
                'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
                'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800',
                'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=800'
            ],
            'status': 'published',
            'featured': True
        },
        {
            'title': 'Sapa - Thiên đường ruộng bậc thang và văn hóa dân tộc',
            'content': '''Sapa là một thị trấn nhỏ nằm ở độ cao 1.600m so với mực nước biển, thuộc tỉnh Lào Cai. Với khí hậu mát mẻ quanh năm, cảnh quan ruộng bậc thang tuyệt đẹp và văn hóa đa dân tộc độc đáo, Sapa đã trở thành điểm đến yêu thích của nhiều du khách trong và ngoài nước.

## 🏔️ Cảnh quan tự nhiên

### Ruộng bậc thang
Ruộng bậc thang Sapa là một trong những cảnh quan đẹp nhất Việt Nam, được hình thành từ hàng trăm năm qua bởi các dân tộc thiểu số. Thời điểm đẹp nhất để ngắm ruộng bậc thang:
- **Mùa nước đổ**: Tháng 5-6 (xanh mướt)
- **Mùa lúa chín**: Tháng 9-10 (vàng óng)
- **Mùa cạn nước**: Tháng 12-2 (phản chiếu ánh sáng)

### Núi Fansipan
- Đỉnh núi cao nhất Đông Dương (3.143m)
- Có thể đi cáp treo lên đỉnh
- Giá cáp treo: 750.000 VNĐ/khứ hồi

## 👥 Văn hóa dân tộc

Sapa là nơi sinh sống của nhiều dân tộc thiểu số:
- **Người H'Mông**: Dệt vải, làm đồ thủ công
- **Người Dao Đỏ**: Trang phục đỏ rực rỡ
- **Người Tày**: Văn hóa lúa nước
- **Người Giáy**: Nghề dệt thổ cẩm

### Chợ phiên Sapa
- Họp vào thứ 7 và Chủ nhật
- Mua sắm đồ thủ công
- Trải nghiệm văn hóa địa phương

## 🚶 Trekking và Hoạt động

### 1. Trekking bản Cát Cát
- Quãng đường: 3-4km
- Thời gian: 2-3 giờ
- Giá: 70.000 VNĐ (có hướng dẫn viên)

### 2. Trekking bản Tả Phìn
- Quãng đường: 6-8km
- Thời gian: 4-5 giờ
- Khám phá bản làng người Dao

### 3. Leo Fansipan
- Thời gian: 2 ngày 1 đêm
- Độ khó: Trung bình - Khó
- Giá: 3.000.000 - 5.000.000 VNĐ/người

## 🏠 Homestay

Trải nghiệm ở lại với người dân địa phương:
- **Giá**: 200.000 - 500.000 VNĐ/đêm
- **Bao gồm**: Ăn sáng, tour đi bộ
- **Trải nghiệm**: Văn hóa, ẩm thực địa phương

## 🌡️ Thời tiết và thời điểm đi

- **Mùa xuân** (3-5): Hoa đào nở, khí hậu mát mẻ
- **Mùa hè** (6-8): Xanh tươi, mát mẻ tránh nóng
- **Mùa thu** (9-11): Lúa chín vàng, đẹp nhất
- **Mùa đông** (12-2): Rất lạnh, có thể có tuyết

## 🍲 Ẩm thực

- **Thắng cố**: Món ăn truyền thống người H'Mông
- **Cá hồi Sapa**: Tươi ngon, đặc sản
- **Rau cải mèo**: Rau đặc sản vùng cao
- **Thịt lợn cắp nách**: Heo thả rông

## 💰 Chi phí ước tính

- Xe từ Hà Nội: 200.000 - 400.000 VNĐ/lượt
- Khách sạn: 300.000 - 1.000.000 VNĐ/đêm
- Homestay: 200.000 - 500.000 VNĐ/đêm
- Ăn uống: 200.000 - 400.000 VNĐ/ngày
- Trekking: 70.000 - 300.000 VNĐ/tour

## 📝 Checklist khi đi Sapa mùa đông

- Áo khoác dày, mũ len, khăn quàng
- Găng tay, tất dày
- Kem dưỡng ẩm, son dưỡng môi
- Giày trekking
- Thuốc cảm cúm

Sapa là nơi bạn có thể tìm thấy sự yên bình và vẻ đẹp tự nhiên của Việt Nam!''',
            'excerpt': 'Khám phá Sapa - thiên đường ruộng bậc thang với văn hóa dân tộc đa dạng, khí hậu mát mẻ và cảnh quan núi non hùng vĩ.',
            'category': 'travel',
            'location_name': 'Sapa',
            'location_address': 'Thị trấn Sa Pa, Lào Cai',
            'location_lat': 22.3363,
            'location_lng': 103.8438,
            'tags': ['Sapa', 'ruộng bậc thang', 'dân tộc', 'trekking', 'Fansipan', 'Lào Cai'],
            'featured_image': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
            'images': [
                'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
                'https://images.unsplash.com/photo-1511497584788-876760111969?w=800',
                'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800'
            ],
            'status': 'published',
            'featured': True
        },
        {
            'title': 'Đà Lạt - Thành phố ngàn hoa và không khí lãng mạn',
            'content': '''Đà Lạt - thành phố ngàn hoa, nơi được mệnh danh là "Tiểu Paris" của Việt Nam. Với khí hậu mát mẻ quanh năm, cảnh quan đẹp như tranh vẽ và không khí lãng mạn, Đà Lạt luôn là điểm đến yêu thích của các cặp đôi và những người yêu thiên nhiên.

## 🌸 Tổng quan

Đà Lạt nằm ở độ cao 1.500m so với mực nước biển, thuộc tỉnh Lâm Đồng. Thành phố này được người Pháp phát hiện và xây dựng từ đầu thế kỷ 20 như một khu nghỉ dưỡng.

## 🏞️ Địa điểm tham quan nổi bật

### 1. Hồ Xuân Hương
- Trái tim của thành phố Đà Lạt
- Thích hợp dạo bộ, chụp ảnh
- Miễn phí

### 2. Nhà thờ Domaine de Marie
- Kiến trúc Pháp cổ điển
- Màu hồng độc đáo
- Miễn phí tham quan

### 3. Ga Đà Lạt
- Ga xe lửa cổ nhất Việt Nam
- Kiến trúc Art Deco
- Vé tham quan: 5.000 VNĐ

### 4. Thiền viện Trúc Lâm
- Thiền viện lớn nhất Đà Lạt
- View đẹp nhìn xuống hồ Tuyền Lâm
- Miễn phí

### 5. Đồi chè Cầu Đất
- Đồi chè xanh mướt
- Chụp ảnh sống ảo
- Vé: 50.000 VNĐ/người

## 📸 Địa điểm chụp ảnh đẹp

1. **Đồi chè Cầu Đất** - Thời gian đẹp: 5-7h sáng
2. **Hồ Tuyền Lâm** - View từ trên cao
3. **Ga Đà Lạt** - Kiến trúc cổ điển
4. **Quảng trường Lâm Viên** - Biểu tượng Đà Lạt
5. **Thung lũng Đà Lạt** - Cánh đồng hoa

## 🍓 Ẩm thực Đà Lạt

### Đặc sản:
- **Dâu tây**: Tươi ngon, giá rẻ (50.000 - 100.000 VNĐ/kg)
- **Atiso**: Trà atiso, canh atiso
- **Bánh tráng nướng**: Đặc sản đường phố (15.000 - 30.000 VNĐ)
- **Bánh căn**: Bánh nướng nhỏ (20.000 - 30.000 VNĐ/phần)
- **Kem bơ**: Kem làm từ bơ Đà Lạt

### Quán cafe đẹp:
- Cafe Tùng (view đẹp)
- An Cafe (không gian xanh)
- Mê Linh Coffee Garden

## 🏨 Khách sạn & Resort

- **Budget**: 300.000 - 700.000 VNĐ/đêm
- **Mid-range**: 700.000 - 1.500.000 VNĐ/đêm
- **Luxury**: 1.500.000 - 5.000.000 VNĐ/đêm

## 🚗 Di chuyển

- **Máy bay**: Sân bay Liên Khương (cách 30km)
- **Xe khách**: Từ TP.HCM (7-8 giờ, 200.000 - 400.000 VNĐ)
- **Xe máy**: Thuê xe máy trong thành phố (100.000 - 150.000 VNĐ/ngày)

## 🌦️ Thời tiết

- **Mùa khô** (11-4): Mát mẻ, ít mưa
- **Mùa mưa** (5-10): Mưa nhiều, hoa đẹp
- **Nhiệt độ**: 15-25°C quanh năm

## 💰 Chi phí ước tính

- Khách sạn: 400.000 - 1.000.000 VNĐ/đêm
- Ăn uống: 200.000 - 400.000 VNĐ/ngày
- Tham quan: 100.000 - 300.000 VNĐ/ngày
- Mua sắm: Tùy ý

Đà Lạt là nơi lý tưởng để "trốn" khỏi cuộc sống ồn ào và tận hưởng không khí trong lành!''',
            'excerpt': 'Khám phá Đà Lạt - thành phố ngàn hoa với khí hậu mát mẻ, cảnh quan đẹp như tranh và không khí lãng mạn độc đáo.',
            'category': 'travel',
            'location_name': 'Đà Lạt',
            'location_address': 'Thành phố Đà Lạt, Lâm Đồng',
            'location_lat': 11.9404,
            'location_lng': 108.4583,
            'tags': ['Đà Lạt', 'thành phố ngàn hoa', 'du lịch', 'Lâm Đồng', 'chụp ảnh'],
            'featured_image': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
            'images': [
                'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
                'https://images.unsplash.com/photo-1511497584788-876760111969?w=800',
                'https://images.unsplash.com/photo-1539650116574-75c0c6d73aa4?w=800'
            ],
            'status': 'published',
            'featured': False
        },
        {
            'title': 'Top 10 món ăn đường phố Hà Nội không thể bỏ qua',
            'content': '''Hà Nội là thiên đường ẩm thực đường phố với những món ăn đậm đà bản sắc Việt Nam. Dưới đây là 10 món ăn bạn nhất định phải thử khi đến thủ đô.

## 1. Phở Bò 🍜

Phở là món ăn nổi tiếng nhất của Hà Nội, được cả thế giới biết đến.

**Quán ngon:**
- Phở Gia Truyền Bát Đàn (49 Bát Đàn) - 40-50k/tô
- Phở Lý Quốc Sư (10 Lý Quốc Sư) - 50-60k/tô
- Phở Thìn (13 Lò Đúc) - 45-55k/tô

**Đặc điểm:** Nước dùng trong, thơm, thịt bò tái mềm

## 2. Bún Chả 🍖

Món ăn từng được Tổng thống Obama thưởng thức khi đến Việt Nam.

**Quán ngon:**
- Bún chả Hương Liên (24 Lê Văn Hưu) - 40-50k/phần
- Bún chả Đắc Kim (1 Hàng Mành) - 40-50k/phần
- Bún chả Hàng Mành - 35-45k/phần

**Đặc điểm:** Thịt nướng thơm, nước mắm chua ngọt đậm đà

## 3. Bún Đậu Mắm Tôm 🦐

Món ăn "quốc dân" của người Hà Nội.

**Quán ngon:**
- Bún đậu Hàng Khay - 40-60k/phần
- Bún đậu Mẹt (Hàng Bồ) - 45-55k/phần

**Đặc điểm:** Đậu rán giòn, mắm tôm đậm đà

## 4. Cà Phê Trứng ☕

Đặc sản cà phê độc đáo của Hà Nội.

**Quán ngon:**
- Cafe Giảng (39 Nguyễn Hữu Huân) - 35k/ly
- Cafe Đinh (13 Đinh Tiên Hoàng) - 30k/ly
- Cafe Lâm (91 Nguyễn Hữu Huân) - 30k/ly

**Đặc điểm:** Vị đắng cà phê kết hợp với trứng gà béo ngậy

## 5. Chè 🌸

Hà Nội nổi tiếng với các loại chè ngon.

**Quán ngon:**
- Chè Thanh Vân (48 Nguyễn Thị Định) - 15-25k/tô
- Chè Bốn Mùa (Hàng Gai) - 20-30k/tô

**Đặc điểm:** Đa dạng loại chè, ngọt thanh

## 6. Bánh Cuốn Thanh Trì 🥟

Bánh cuốn mỏng như tờ giấy.

**Quán ngon:**
- Bánh cuốn Bà Hoành (66 Tô Hiến Thành) - 40-50k/phần
- Bánh cuốn Gia An (25 Hàng Gà) - 35-45k/phần

## 7. Nem Nướng Nha Trang 🍢

Nem nướng thơm ngon, đậm đà.

**Quán:** Nhiều quán trên phố Tạ Hiện - 30-50k/phần

## 8. Bánh Mì 🥖

Bánh mì Việt Nam nổi tiếng thế giới.

**Quán ngon:**
- Bánh mì Phố (19 Lý Quốc Sư) - 20-30k/ổ
- Bánh mì P (Hàng Buồm) - 25-35k/ổ

## 9. Bánh Tôm Hồ Tây 🦐

Đặc sản vùng Hồ Tây.

**Quán:** Quán ven Hồ Tây - 50-70k/phần

## 10. Bia Hơi 🍺

Trải nghiệm văn hóa đêm Hà Nội.

**Địa điểm:**
- Phố Tạ Hiện
- Phố Lương Ngọc Quyến
- Giá: 15.000 - 30.000 VNĐ/ly

## 📍 Lịch trình ăn uống 24 giờ

- **6h sáng**: Phở Bát Đàn
- **9h sáng**: Cà phê trứng Giảng
- **12h trưa**: Bún chả Hương Liên
- **3h chiều**: Chè Thanh Vân
- **6h tối**: Bún đậu mắm tôm
- **9h tối**: Bia hơi Tạ Hiện

Tổng chi phí: 300.000 - 500.000 VNĐ cho cả ngày ăn no nê!

Hà Nội thực sự là thiên đường ẩm thực mà bạn không thể bỏ qua!''',
            'excerpt': 'Khám phá 10 món ăn đường phố Hà Nội nổi tiếng nhất, từ phở bò đến bún chả, bánh mì và cà phê trứng độc đáo.',
            'category': 'food',
            'location_name': 'Hà Nội',
            'location_address': 'Quận Hoàn Kiếm, Hà Nội',
            'location_lat': 21.0285,
            'location_lng': 105.8542,
            'tags': ['Hà Nội', 'ẩm thực', 'phở', 'bún chả', 'street food', 'đường phố'],
            'featured_image': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
            'images': [
                'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
                'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800'
            ],
            'status': 'published',
            'featured': False
        },
        {
            'title': 'Nha Trang - Bãi biển đẹp nhất Việt Nam',
            'content': '''Nha Trang là thành phố biển nổi tiếng của Việt Nam, nằm ở tỉnh Khánh Hòa. Với bãi biển dài 6km, nước biển trong xanh và nhiều đảo đẹp, Nha Trang đã trở thành điểm đến lý tưởng cho kỳ nghỉ biển.

## 🏖️ Bãi biển Nha Trang

Bãi biển Nha Trang là một trong những bãi biển đẹp nhất Việt Nam với:
- Cát trắng mịn
- Nước biển trong xanh
- Độ dốc nhẹ, an toàn
- Dài 6km từ sân bay đến Cầu Đá

## 🏝️ Đảo và Hoạt động

### 1. Vinpearl Land
- Công viên giải trí trên đảo
- Cáp treo vượt biển dài nhất thế giới
- Giá: 880.000 VNĐ/người (vé all-in)

### 2. Đảo Hòn Tre
- Tham quan bằng tàu
- Lặn biển, snorkeling
- Giá tour: 400.000 - 600.000 VNĐ/người

### 3. Tháp Bà Ponagar
- Di tích Chăm cổ
- Kiến trúc độc đáo
- Vé: 22.000 VNĐ/người

### 4. Viện Hải dương học
- Tham quan sinh vật biển
- Bể cá lớn
- Vé: 40.000 VNĐ/người

## 🏊 Hoạt động nước

- Lặn biển (diving): 1.500.000 - 2.500.000 VNĐ
- Snorkeling: 300.000 - 500.000 VNĐ
- Chèo thuyền kayak: 100.000 - 200.000 VNĐ/giờ
- Parasailing: 800.000 - 1.200.000 VNĐ

## 🍽️ Ẩm thực

### Hải sản:
- Cá ngừ tươi sống
- Tôm hùm
- Cua, ghẹ
- Nghêu, sò

### Quán ăn ngon:
- Quán Số 1 (ven biển)
- Nhà hàng Sailing Club
- Chợ Đầm (hải sản tươi)

## 🏨 Khách sạn

- **Budget**: 300.000 - 800.000 VNĐ/đêm
- **Mid-range**: 800.000 - 2.000.000 VNĐ/đêm
- **Luxury**: 2.000.000 - 10.000.000 VNĐ/đêm

## 💰 Chi phí ước tính

- Khách sạn: 500.000 - 1.500.000 VNĐ/đêm
- Ăn uống: 300.000 - 600.000 VNĐ/ngày
- Hoạt động: 500.000 - 1.000.000 VNĐ/ngày

## 🌤️ Thời tiết

- **Mùa khô**: Tháng 1-8 (nắng đẹp, ít mưa)
- **Mùa mưa**: Tháng 9-12 (mưa nhiều)

Nha Trang là điểm đến lý tưởng cho kỳ nghỉ biển tuyệt vời!''',
            'excerpt': 'Khám phá Nha Trang - thành phố biển với bãi biển dài 6km, nước trong xanh và nhiều hoạt động giải trí thú vị.',
            'category': 'travel',
            'location_name': 'Nha Trang',
            'location_address': 'Thành phố Nha Trang, Khánh Hòa',
            'location_lat': 12.2388,
            'location_lng': 109.1967,
            'tags': ['Nha Trang', 'biển', 'du lịch', 'Khánh Hòa', 'đảo'],
            'featured_image': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
            'images': [
                'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
            ],
            'status': 'published',
            'featured': False
        },
        {
            'title': 'Huế - Cố đô với kiến trúc cung đình tráng lệ',
            'content': '''Huế là thành phố cổ từng là kinh đô của Việt Nam dưới triều Nguyễn (1802-1945). Với hệ thống cung điện, lăng tẩm và đền đài tráng lệ, Huế đã được UNESCO công nhận là Di sản Văn hóa Thế giới.

## 🏛️ Lịch sử

Huế từng là thủ đô của Việt Nam trong hơn 140 năm (1802-1945) dưới triều đại nhà Nguyễn - triều đại phong kiến cuối cùng của Việt Nam.

## 🏰 Địa điểm tham quan

### 1. Đại Nội (Hoàng Thành)
- Khu vực cung điện chính
- Kiến trúc cổ kính
- Vé: 150.000 VNĐ/người

### 2. Lăng Tự Đức
- Lăng tẩm đẹp nhất
- Kiến trúc hài hòa với thiên nhiên
- Vé: 100.000 VNĐ/người

### 3. Lăng Khải Định
- Phong cách Á-Âu độc đáo
- Nghệ thuật khảm sứ tinh xảo
- Vé: 100.000 VNĐ/người

### 4. Chùa Thiên Mụ
- Ngôi chùa cổ nhất Huế
- Tháp Phước Duyên 7 tầng
- Miễn phí

### 5. Sông Hương
- Dòng sông thơ mộng
- Đi thuyền dragon boat
- Giá: 100.000 - 200.000 VNĐ/người

## 🍜 Ẩm thực Huế

### Đặc sản:
- **Bún bò Huế**: Món ăn nổi tiếng nhất
- **Cơm hến**: Đặc sản độc đáo
- **Bánh bèo**: Món ăn vặt phổ biến
- **Bánh khoái**: Bánh xèo kiểu Huế
- **Chè Huế**: Nhiều loại chè đặc biệt

### Quán ngon:
- Bún bò O Xuân (19 Phan Đình Phùng)
- Cơm hến Ba Cây (17 Trần Cao Vân)
- Bánh bèo Bà Đỏ (100 Điện Biên Phủ)

## 🎭 Lễ hội

- **Festival Huế**: 2 năm một lần
- **Lễ hội đèn lồng**: Tháng 4
- **Lễ hội áo dài**: Tháng 3

## 💰 Chi phí

- Khách sạn: 300.000 - 1.000.000 VNĐ/đêm
- Ăn uống: 200.000 - 400.000 VNĐ/ngày
- Tham quan: 300.000 - 500.000 VNĐ/ngày

Huế là nơi bạn có thể cảm nhận được lịch sử và văn hóa của Việt Nam!''',
            'excerpt': 'Khám phá Huế - cố đô với kiến trúc cung đình tráng lệ, lăng tẩm cổ kính và ẩm thực đậm đà bản sắc.',
            'category': 'culture',
            'location_name': 'Huế',
            'location_address': 'Thành phố Huế, Thừa Thiên Huế',
            'location_lat': 16.4637,
            'location_lng': 107.5909,
            'tags': ['Huế', 'cố đô', 'UNESCO', 'cung đình', 'lăng tẩm', 'văn hóa'],
            'featured_image': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73aa4?w=800',
            'images': [
                'https://images.unsplash.com/photo-1539650116574-75c0c6d73aa4?w=800',
                'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800'
            ],
            'status': 'published',
            'featured': False
        }
    ]
    
    with conn.cursor() as cursor:
        for i, post_data in enumerate(posts_data):
            try:
                # Random user
                user = random.choice(users)
                
                # Generate slug
                slug = generate_slug(post_data['title'])
                slug = f"{slug}-{int(datetime.now().timestamp())}"
                
                # Convert images to JSON
                images_json = json.dumps(post_data['images'])
                tags_json = json.dumps(post_data['tags'])
                
                # Published time (last 30 days, newer posts first)
                days_ago = i % 30
                published_at = datetime.now() - timedelta(days=days_ago)
                
                # Calculate reading time (approximate)
                word_count = len(post_data['content'].split())
                reading_time = max(1, round(word_count / 200))
                
                sql = """
                INSERT INTO posts (
                    title, slug, content, excerpt, author_id,
                    category, tags, location_name, location_address,
                    location_lat, location_lng, featured_image, images,
                    status, published_at, featured, views_count,
                    likes_count, comments_count, reading_time
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                view_count = random.randint(500, 5000)
                like_count = random.randint(50, 500)
                comment_count = random.randint(10, 100)
                
                cursor.execute(sql, (
                    post_data['title'],
                    slug,
                    post_data['content'],
                    post_data['excerpt'],
                    user['id'],
                    post_data['category'],
                    tags_json,
                    post_data['location_name'],
                    post_data['location_address'],
                    post_data['location_lat'],
                    post_data['location_lng'],
                    post_data['featured_image'],
                    images_json,
                    post_data['status'],
                    published_at,
                    post_data['featured'],
                    view_count,
                    like_count,
                    comment_count,
                    reading_time
                ))
                
                print(f"   ✅ {post_data['title'][:60]}... by {user['username']}")
                
            except Exception as e:
                print(f"   ❌ Lỗi tạo post '{post_data['title'][:30]}...': {e}")
                import traceback
                traceback.print_exc()
        
        conn.commit()
    
    print(f"\n✅ Hoàn tất tạo {len(posts_data)} posts!")

def show_summary(conn):
    """Hiển thị tóm tắt data đã tạo"""
    print("\n" + "="*70)
    print("📊 SUMMARY - DỮ LIỆU ĐÃ TẠO")
    print("="*70)
    
    with conn.cursor() as cursor:
        tables = {
            'users': 'Users',
            'posts': 'Posts',
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
        
        print("\n📰 Sample Posts:")
        cursor.execute("""
            SELECT p.title, u.username, p.views_count, p.likes_count, p.status
            FROM posts p 
            JOIN users u ON p.author_id = u.id 
            ORDER BY p.created_at DESC
            LIMIT 5
        """)
        for post in cursor.fetchall():
            print(f"   - {post['title'][:50]}... by {post['username']} ({post['views_count']} views, {post['likes_count']} likes) [{post['status']}]")

def main():
    """Main function"""
    print("\n" + "="*70)
    print("🚀 SEED REAL VIETNAM DATA FOR VIEGO BLOG")
    print("="*70)
    print("Tạo dữ liệu thực tế về Việt Nam cho database...")
    print()
    
    conn = get_connection()
    if not conn:
        print("❌ Không thể kết nối database!")
        return
    
    try:
        create_users(conn)
        create_posts(conn)
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
