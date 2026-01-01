#!/usr/bin/env python3
"""
Script nạp dữ liệu các tour đã hoàn thành cho 2 tài khoản:
- ngocthien (user_id=11)
- tour_seller_vn (user_id=10) - seller nhưng cũng có thể có booking

Dữ liệu bao gồm 10 tour đã đi trong quá khứ với hành trình chi tiết
"""

import pymysql
from datetime import datetime, timedelta
import random
import json

def get_db_connection():
    """Kết nối database"""
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='viego_blog',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def seed_completed_tours():
    """Nạp dữ liệu tour đã hoàn thành"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("🚀 Bắt đầu nạp dữ liệu tour đã hoàn thành...")
    
    # Lấy danh sách tour hiện có
    cursor.execute("SELECT id, title, duration_days, price_per_person FROM tours WHERE status='active' LIMIT 6")
    tours = cursor.fetchall()
    
    if not tours:
        print("❌ Không có tour nào trong database!")
        return
    
    print(f"📋 Tìm thấy {len(tours)} tour")
    
    # Tài khoản cần nạp dữ liệu
    users = [
        {'user_id': 11, 'username': 'ngocthien', 'full_name': 'Ngọc Thiên', 'email': 'thienne160224@gmail.com', 'phone': '0948283916'},
        {'user_id': 10, 'username': 'tour_seller_vn', 'full_name': 'Công Ty Du Lịch Việt Nam Pro', 'email': 'seller@viego.com', 'phone': '0912345678'}
    ]
    
    # Danh sách địa chỉ mẫu
    addresses = [
        'Quận 1, TP.HCM',
        'Quận Hoàn Kiếm, Hà Nội',
        'Quận Hải Châu, Đà Nẵng',
        'TP. Nha Trang, Khánh Hòa',
        'TP. Huế, Thừa Thiên Huế',
        'TP. Đà Lạt, Lâm Đồng',
        'Quận Ninh Kiều, Cần Thơ',
        'TP. Vũng Tàu, Bà Rịa - Vũng Tàu'
    ]
    
    # Các điểm đến cho checkpoint checkin
    destinations_by_tour = {
        1: ['Sân bay Nội Bài', 'Vịnh Hạ Long', 'Hang Sửng Sốt', 'Đảo Ti Tốp', 'Phố cổ Hà Nội'],  # Hạ Long
        2: ['Bà Nà Hills', 'Phố cổ Hội An', 'Chùa Cầu', 'Đại Nội Huế', 'Chùa Thiên Mụ'],  # Miền Trung
        3: ['Bản Cát Cát', 'Thác Bạc', 'Đỉnh Fansipan', 'Bản Tả Phìn', 'Chợ Sapa'],  # Sapa
        4: ['Sân bay Phú Quốc', 'Vinpearl Safari', 'Bãi Sao', 'Chợ đêm Dinh Cậu', 'Suối Tranh'],  # Phú Quốc
        5: ['Thác Datanla', 'Đồi chè Cầu Đất', 'Vườn hoa TP', 'Chợ Đà Lạt', 'Ga Đà Lạt'],  # Đà Lạt
        6: ['Bến Tre', 'Cồn Phụng', 'Vườn trái cây', 'Làng nghề', 'Chợ nổi']  # Test tour
    }
    
    # Weather conditions
    weather_conditions = ['Nắng đẹp', 'Mây rải rác', 'Trời trong xanh', 'Ấm áp', 'Mát mẻ', 'Gió nhẹ']
    
    booking_count = 0
    
    for user in users:
        print(f"\n👤 Nạp dữ liệu cho user: {user['username']}")
        
        # Tạo 5 booking cho mỗi user = 10 booking tổng cộng
        for i in range(5):
            # Chọn ngẫu nhiên một tour
            tour = random.choice(tours)
            tour_id = tour['id']
            duration_days = tour['duration_days'] or 2
            price = tour['price_per_person'] or 2500000
            
            # Ngày đi trong quá khứ (3-12 tháng trước)
            days_ago = random.randint(90, 365)
            tour_date = datetime.now() - timedelta(days=days_ago)
            tour_date_str = tour_date.strftime('%Y-%m-%d')
            
            # Số người tham gia
            adults = random.randint(1, 4)
            children = random.randint(0, 2)
            infants = random.randint(0, 1) if random.random() > 0.7 else 0
            participants = adults + children + infants
            
            # Tính giá
            adult_price = price
            child_price = int(price * 0.8)
            infant_price = int(price * 0.5)
            total_price = (adults * adult_price) + (children * child_price) + (infants * infant_price)
            
            address = random.choice(addresses)
            
            # Insert booking (đã hoàn thành)
            booking_sql = """
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
            """
            
            notes = f"Tour đã hoàn thành tốt đẹp. Khách hàng hài lòng với dịch vụ."
            
            cursor.execute(booking_sql, (
                tour_id, user['user_id'], tour_date_str, participants, adults, children, infants,
                user['full_name'], user['email'], user['phone'], address, total_price, adult_price, child_price, infant_price,
                0, total_price, 'VND', 'office', 'paid', 'confirmed', notes,
                tour_date - timedelta(days=random.randint(7, 30)), datetime.now()
            ))
            
            booking_id = cursor.lastrowid
            print(f"  ✅ Tạo booking #{booking_id}: {tour['title']} - {tour_date_str}")
            
            # Tạo itinerary days cho booking này
            checkpoints = destinations_by_tour.get(tour_id, ['Điểm đến 1', 'Điểm đến 2', 'Điểm đến 3'])
            
            for day_num in range(1, duration_days + 1):
                actual_date = tour_date + timedelta(days=day_num - 1)
                
                day_sql = """
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
                """
                
                day_title = f"Ngày {day_num}: Khám phá {checkpoints[day_num % len(checkpoints)]}"
                day_desc = f"Hành trình ngày {day_num} đã hoàn thành thành công"
                
                # Thời gian bắt đầu và kết thúc
                start_time = actual_date.replace(hour=6, minute=30)
                end_time = actual_date.replace(hour=20, minute=0)
                
                num_checkpoints = random.randint(3, 5)
                guide_note = f"Ngày {day_num} diễn ra suôn sẻ. Khách rất hài lòng với lịch trình."
                
                cursor.execute(day_sql, (
                    booking_id, day_num, actual_date.date(), day_title, day_desc,
                    'completed', True, True, day_num < duration_days,  # No dinner on last day
                    f"Khách sạn {random.randint(3, 5)} sao" if day_num < duration_days else None,
                    'Xe du lịch đời mới',
                    100, num_checkpoints, num_checkpoints,
                    start_time, end_time, guide_note, datetime.now(), datetime.now()
                ))
                
                booking_day_id = cursor.lastrowid
                
                # Tạo checkpoint checkins cho mỗi ngày
                for cp_order in range(1, num_checkpoints + 1):
                    checkpoint_name = checkpoints[(day_num - 1 + cp_order) % len(checkpoints)]
                    
                    # Giả lập có itinerary_checkpoint (nếu không có thì bỏ qua)
                    # Chèn vào checkpoint_checkins với checkpoint_id giả định
                    checkin_sql = """
                        INSERT INTO checkpoint_checkins (
                            booking_day_id, checkpoint_id, status,
                            scheduled_time, actual_checkin_time, actual_checkout_time, duration_minutes,
                            checkin_latitude, checkin_longitude, distance_from_checkpoint,
                            photos, photo_count, guide_notes, participants_feedback,
                            weather_condition, had_issues, is_visible_to_participants,
                            created_at, updated_at
                        ) VALUES (
                            %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, %s,
                            %s, %s
                        )
                    """
                    
                    scheduled_hour = 7 + (cp_order * 2)
                    scheduled_time = actual_date.replace(hour=scheduled_hour, minute=0)
                    actual_checkin = scheduled_time + timedelta(minutes=random.randint(-10, 15))
                    duration = random.randint(30, 120)
                    actual_checkout = actual_checkin + timedelta(minutes=duration)
                    
                    # Vĩ độ và kinh độ ngẫu nhiên trong Việt Nam
                    lat = round(random.uniform(10.5, 22.5), 6)
                    lng = round(random.uniform(102.5, 109.5), 6)
                    
                    # Mảng ảnh giả định
                    photos = json.dumps([
                        f"/uploads/tour_photos/{booking_id}_{day_num}_{cp_order}_1.jpg",
                        f"/uploads/tour_photos/{booking_id}_{day_num}_{cp_order}_2.jpg"
                    ])
                    
                    weather = random.choice(weather_conditions)
                    feedback = random.choice([
                        "Rất đẹp và ấn tượng!",
                        "Trải nghiệm tuyệt vời",
                        "Đáng để quay lại",
                        "Phong cảnh tuyệt đẹp",
                        "Một điểm đến tuyệt vời"
                    ])
                    
                    try:
                        # Kiểm tra xem có checkpoint trong database không
                        cursor.execute("SELECT id FROM itinerary_checkpoints LIMIT 1")
                        checkpoint_row = cursor.fetchone()
                        
                        if checkpoint_row:
                            checkpoint_id = checkpoint_row['id']
                        else:
                            # Nếu không có, tạo một checkpoint giả
                            checkpoint_id = 1
                            
                        cursor.execute(checkin_sql, (
                            booking_day_id, checkpoint_id, 'checked_in',
                            scheduled_time, actual_checkin, actual_checkout, duration,
                            lat, lng, round(random.uniform(0, 50), 2),
                            photos, 2, f"Check-in tại {checkpoint_name} thành công", feedback,
                            weather, False, True,
                            datetime.now(), datetime.now()
                        ))
                    except Exception as e:
                        # Nếu lỗi foreign key, bỏ qua checkpoint checkin
                        pass
            
            booking_count += 1
    
    conn.commit()
    print(f"\n🎉 Hoàn thành! Đã tạo {booking_count} booking với hành trình chi tiết")
    
    # Hiển thị thống kê
    cursor.execute("""
        SELECT u.username, COUNT(b.id) as total_bookings,
               SUM(CASE WHEN b.status='confirmed' AND b.payment_status='paid' THEN 1 ELSE 0 END) as completed_tours
        FROM users u
        LEFT JOIN bookings b ON u.id = b.user_id
        WHERE u.id IN (10, 11)
        GROUP BY u.id, u.username
    """)
    
    print("\n📊 Thống kê booking:")
    for row in cursor.fetchall():
        print(f"  - {row['username']}: {row['total_bookings']} booking ({row['completed_tours']} đã hoàn thành)")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    seed_completed_tours()
