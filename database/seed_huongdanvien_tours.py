#!/usr/bin/env python3
"""
Script tạo tài khoản huongdanvien và nạp dữ liệu tour đã hoàn thành
"""

import pymysql
import bcrypt
from datetime import datetime, timedelta
import random
import json

def get_db_connection():
    return pymysql.connect(
        host='localhost', 
        user='root', 
        password='', 
        database='viego_blog', 
        charset='utf8mb4', 
        cursorclass=pymysql.cursors.DictCursor
    )

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_huongdanvien_and_seed_tours():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("🔍 Kiểm tra tài khoản huongdanvien...")
    
    # Kiểm tra tài khoản đã tồn tại chưa
    cursor.execute("SELECT id, username, email, role FROM users WHERE username = 'huongdanvien'")
    user = cursor.fetchone()
    
    if user:
        user_id = user['id']
        print(f"✅ Tài khoản đã tồn tại: ID={user_id}, Username={user['username']}, Role={user['role']}")
    else:
        # Tạo tài khoản mới
        print("📝 Tạo tài khoản huongdanvien mới...")
        password_hash = hash_password('huongdanvien123')
        
        cursor.execute("""
            INSERT INTO users (
                username, email, password_hash, full_name, bio, role, 
                is_active, email_verified, points, level, badges, location, language, timezone
            ) VALUES (
                'huongdanvien', 'huongdanvien@viego.com', %s, 'Hướng Dẫn Viên Du Lịch',
                'Hướng dẫn viên chuyên nghiệp với nhiều năm kinh nghiệm dẫn tour khắp Việt Nam',
                'user', 1, 1, 500, 3, '["Tour Guide", "Explorer"]', 'TP.HCM, Việt Nam', 'vi', 'Asia/Ho_Chi_Minh'
            )
        """, (password_hash,))
        
        user_id = cursor.lastrowid
        print(f"✅ Đã tạo tài khoản: ID={user_id}, Username=huongdanvien")
    
    conn.commit()
    
    # Nạp dữ liệu tour đã hoàn thành
    print("\n🚀 Bắt đầu nạp dữ liệu tour đã hoàn thành cho huongdanvien...")
    
    # Lấy danh sách tour
    cursor.execute("SELECT id, title, duration_days, price_per_person FROM tours WHERE status='active' LIMIT 6")
    tours = cursor.fetchall()
    
    if not tours:
        print("❌ Không có tour nào trong database!")
        return
    
    # Địa chỉ mẫu
    addresses = [
        'Quận 1, TP.HCM', 'Quận Hoàn Kiếm, Hà Nội', 'Quận Hải Châu, Đà Nẵng',
        'TP. Nha Trang', 'TP. Huế', 'TP. Đà Lạt', 'Quận Ninh Kiều, Cần Thơ'
    ]
    
    destinations_by_tour = {
        1: ['Sân bay Nội Bài', 'Vịnh Hạ Long', 'Hang Sửng Sốt', 'Đảo Ti Tốp', 'Phố cổ Hà Nội'],
        2: ['Bà Nà Hills', 'Phố cổ Hội An', 'Chùa Cầu', 'Đại Nội Huế', 'Chùa Thiên Mụ'],
        3: ['Bản Cát Cát', 'Thác Bạc', 'Đỉnh Fansipan', 'Bản Tả Phìn', 'Chợ Sapa'],
        4: ['Sân bay Phú Quốc', 'Vinpearl Safari', 'Bãi Sao', 'Chợ đêm Dinh Cậu', 'Suối Tranh'],
        5: ['Thác Datanla', 'Đồi chè Cầu Đất', 'Vườn hoa TP', 'Chợ Đà Lạt', 'Ga Đà Lạt'],
        6: ['Bến Tre', 'Cồn Phụng', 'Vườn trái cây', 'Làng nghề', 'Chợ nổi']
    }
    
    weather_conditions = ['Nắng đẹp', 'Mây rải rác', 'Trời trong xanh', 'Ấm áp', 'Mát mẻ', 'Gió nhẹ']
    
    booking_count = 0
    
    # Tạo 10 booking cho huongdanvien
    for i in range(10):
        tour = random.choice(tours)
        tour_id = tour['id']
        duration_days = tour['duration_days'] or 2
        price = tour['price_per_person'] or 2500000
        
        # Ngày đi trong quá khứ (3-12 tháng trước)
        days_ago = random.randint(90, 365)
        tour_date = datetime.now() - timedelta(days=days_ago)
        tour_date_str = tour_date.strftime('%Y-%m-%d')
        
        adults = random.randint(1, 4)
        children = random.randint(0, 2)
        infants = random.randint(0, 1) if random.random() > 0.7 else 0
        participants = adults + children + infants
        
        adult_price = price
        child_price = int(price * 0.8)
        infant_price = int(price * 0.5)
        total_price = (adults * adult_price) + (children * child_price) + (infants * infant_price)
        
        address = random.choice(addresses)
        
        # Insert booking
        cursor.execute("""
            INSERT INTO bookings (
                tour_id, user_id, date, participants, adults, children, infants,
                full_name, email, phone, address, base_price, adult_price, child_price, infant_price,
                discount_amount, total_price, currency, payment_method, payment_status, status, notes,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s
            )
        """, (
            tour_id, user_id, tour_date_str, participants, adults, children, infants,
            'Hướng Dẫn Viên Du Lịch', 'huongdanvien@viego.com', '0901234567', address, 
            total_price, adult_price, child_price, infant_price,
            0, total_price, 'VND', 'office', 'paid', 'confirmed', 
            'Tour đã hoàn thành tốt đẹp. Khách hàng rất hài lòng.',
            tour_date - timedelta(days=random.randint(7, 30)), datetime.now()
        ))
        
        booking_id = cursor.lastrowid
        print(f"  ✅ Tạo booking #{booking_id}: {tour['title'][:40]} - {tour_date_str}")
        
        # Tạo itinerary days
        checkpoints = destinations_by_tour.get(tour_id, ['Điểm đến 1', 'Điểm đến 2', 'Điểm đến 3'])
        
        for day_num in range(1, duration_days + 1):
            actual_date = tour_date + timedelta(days=day_num - 1)
            
            cursor.execute("""
                INSERT INTO booking_itinerary_days (
                    booking_id, day_number, actual_date, day_title, day_description,
                    status, actual_breakfast, actual_lunch, actual_dinner,
                    actual_accommodation, actual_transportation,
                    progress_percentage, completed_checkpoints, total_checkpoints,
                    start_time, end_time, guide_notes, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s, %s
                )
            """, (
                booking_id, day_num, actual_date.date(), 
                f"Ngày {day_num}: Khám phá {checkpoints[day_num % len(checkpoints)]}",
                f"Hành trình ngày {day_num} đã hoàn thành thành công",
                'completed', True, True, day_num < duration_days,
                f"Khách sạn {random.randint(3, 5)} sao" if day_num < duration_days else None,
                'Xe du lịch đời mới',
                100, random.randint(3, 5), random.randint(3, 5),
                actual_date.replace(hour=6, minute=30),
                actual_date.replace(hour=20, minute=0),
                f"Ngày {day_num} diễn ra suôn sẻ. Khách rất hài lòng.",
                datetime.now(), datetime.now()
            ))
        
        booking_count += 1
    
    conn.commit()
    
    print(f"\n🎉 Hoàn thành! Đã tạo {booking_count} booking cho tài khoản huongdanvien")
    
    # Thống kê
    cursor.execute("""
        SELECT COUNT(*) as cnt FROM bookings WHERE user_id = %s
    """, (user_id,))
    total = cursor.fetchone()['cnt']
    
    print(f"\n📊 Tổng số booking của huongdanvien: {total}")
    print(f"\n🔐 Thông tin đăng nhập:")
    print(f"   - Username: huongdanvien")
    print(f"   - Password: huongdanvien123")
    print(f"   - Email: huongdanvien@viego.com")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    create_huongdanvien_and_seed_tours()
