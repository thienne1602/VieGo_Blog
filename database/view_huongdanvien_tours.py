#!/usr/bin/env python3
"""
Xem và sắp xếp lại dữ liệu tour của huongdanvien
"""

import pymysql
from datetime import datetime, timedelta

def view_and_fix_tours():
    conn = pymysql.connect(
        host='localhost', 
        user='root', 
        password='', 
        database='viego_blog', 
        charset='utf8mb4', 
        cursorclass=pymysql.cursors.DictCursor
    )
    cursor = conn.cursor()
    
    # Xem các tour hiện có của huongdanvien (id=13) theo thứ tự ngày
    cursor.execute('''
        SELECT ta.id as assignment_id, b.id as booking_id, b.date, ta.status, t.title, b.created_at
        FROM tour_assignments ta
        JOIN bookings b ON ta.booking_id = b.id
        JOIN tours t ON b.tour_id = t.id
        WHERE ta.tour_guide_id = 13
        ORDER BY b.date ASC
    ''')
    
    print("=== Tour của huongdanvien theo thứ tự ngày ===")
    tours = cursor.fetchall()
    for row in tours:
        print(f"Assignment #{row['assignment_id']} | Booking #{row['booking_id']} | {row['date']} | {row['status']} | {row['title'][:30]}")
    
    # Tìm các booking mới thêm (id >= 45) - đây là các tour mới seed
    print("\n=== Các booking mới thêm (id >= 45) ===")
    cursor.execute('''
        SELECT b.id, b.date, t.title
        FROM bookings b
        JOIN tours t ON b.tour_id = t.id
        WHERE b.user_id = 13 AND b.id >= 45
        ORDER BY b.id
    ''')
    new_bookings = cursor.fetchall()
    for row in new_bookings:
        print(f"Booking #{row['id']} | {row['date']} | {row['title'][:30]}")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    view_and_fix_tours()
