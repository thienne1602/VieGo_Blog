#!/usr/bin/env python3
"""
Tạo tour_assignments cho các booking của huongdanvien
"""

import pymysql
from datetime import datetime

def create_assignments_for_huongdanvien():
    conn = pymysql.connect(
        host='localhost', 
        user='root', 
        password='', 
        database='viego_blog', 
        charset='utf8mb4', 
        cursorclass=pymysql.cursors.DictCursor
    )
    cursor = conn.cursor()
    
    # Lấy các booking của huongdanvien (id=13) chưa có tour_assignment
    cursor.execute('''
        SELECT b.id as booking_id 
        FROM bookings b 
        LEFT JOIN tour_assignments ta ON b.id = ta.booking_id AND ta.tour_guide_id = 13
        WHERE b.user_id = 13 AND ta.id IS NULL
    ''')
    bookings_without_assignment = cursor.fetchall()
    
    print(f"Bookings chưa có assignment: {len(bookings_without_assignment)}")
    
    # Tạo tour_assignment cho mỗi booking
    for b in bookings_without_assignment:
        booking_id = b['booking_id']
        cursor.execute('''
            INSERT INTO tour_assignments (booking_id, tour_guide_id, assigned_by, assignment_date, status, created_at, updated_at)
            VALUES (%s, 13, 10, %s, 'completed', %s, %s)
        ''', (booking_id, datetime.now(), datetime.now(), datetime.now()))
        print(f"  ✅ Tạo assignment cho booking #{booking_id}")
    
    conn.commit()
    
    # Kiểm tra lại
    cursor.execute('SELECT COUNT(*) as cnt FROM tour_assignments WHERE tour_guide_id = 13')
    total = cursor.fetchone()['cnt']
    print(f"\n📊 Tổng số tour_assignments của huongdanvien: {total}")
    
    # Hiển thị danh sách
    cursor.execute('''
        SELECT ta.id, ta.booking_id, ta.status, b.date, t.title
        FROM tour_assignments ta
        JOIN bookings b ON ta.booking_id = b.id
        JOIN tours t ON b.tour_id = t.id
        WHERE ta.tour_guide_id = 13
        ORDER BY b.date DESC
    ''')
    
    print("\n=== Danh sách tour đã được assign ===")
    for row in cursor.fetchall():
        print(f"  #{row['id']} | Booking {row['booking_id']} | {row['date']} | {row['status']} | {row['title'][:35]}")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    create_assignments_for_huongdanvien()
