#!/usr/bin/env python3
"""
Cập nhật ngày cho các booking mới thêm của huongdanvien 
để xếp sau các tour hiện có (sau 2025-12-17)
"""

import pymysql
from datetime import datetime, timedelta

def update_booking_dates():
    conn = pymysql.connect(
        host='localhost', 
        user='root', 
        password='', 
        database='viego_blog', 
        charset='utf8mb4', 
        cursorclass=pymysql.cursors.DictCursor
    )
    cursor = conn.cursor()
    
    # Lấy các booking mới thêm (id >= 45 và user_id = 13)
    cursor.execute('''
        SELECT b.id, b.date, t.duration_days
        FROM bookings b
        JOIN tours t ON b.tour_id = t.id
        WHERE b.user_id = 13 AND b.id >= 45
        ORDER BY b.id
    ''')
    new_bookings = cursor.fetchall()
    
    print("=== Cập nhật ngày cho các booking mới ===")
    
    # Bắt đầu từ ngày 20/12/2025 (sau các tour cũ 17/12/2025)
    base_date = datetime(2025, 12, 20)
    
    for i, booking in enumerate(new_bookings):
        booking_id = booking['id']
        duration_days = booking['duration_days'] or 2
        
        # Ngày tour mới = base_date + khoảng cách ngẫu nhiên
        new_date = base_date + timedelta(days=i * 5 + 3)  # Cách nhau 5 ngày
        new_date_str = new_date.strftime('%Y-%m-%d')
        
        # Cập nhật ngày booking
        cursor.execute('UPDATE bookings SET date = %s WHERE id = %s', (new_date_str, booking_id))
        
        # Cập nhật ngày trong booking_itinerary_days
        cursor.execute('''
            SELECT id, day_number FROM booking_itinerary_days WHERE booking_id = %s ORDER BY day_number
        ''', (booking_id,))
        itinerary_days = cursor.fetchall()
        
        for day in itinerary_days:
            actual_date = new_date + timedelta(days=day['day_number'] - 1)
            cursor.execute('''
                UPDATE booking_itinerary_days 
                SET actual_date = %s, 
                    start_time = %s,
                    end_time = %s
                WHERE id = %s
            ''', (
                actual_date.date(),
                actual_date.replace(hour=6, minute=30),
                actual_date.replace(hour=20, minute=0),
                day['id']
            ))
        
        print(f"  ✅ Booking #{booking_id}: {booking['date']} -> {new_date_str}")
    
    conn.commit()
    
    # Xác nhận lại
    print("\n=== Danh sách tour sau khi cập nhật ===")
    cursor.execute('''
        SELECT ta.id, b.id as booking_id, b.date, ta.status, t.title
        FROM tour_assignments ta
        JOIN bookings b ON ta.booking_id = b.id
        JOIN tours t ON b.tour_id = t.id
        WHERE ta.tour_guide_id = 13
        ORDER BY b.date ASC
    ''')
    
    for row in cursor.fetchall():
        marker = "🆕" if row['booking_id'] >= 45 else "📌"
        print(f"  {marker} Booking #{row['booking_id']} | {row['date']} | {row['status']} | {row['title'][:30]}")
    
    cursor.close()
    conn.close()
    print("\n🎉 Hoàn thành!")

if __name__ == '__main__':
    update_booking_dates()
