#!/usr/bin/env python3
"""
Script cập nhật trạng thái các booking đã qua ngày
"""

import pymysql
from datetime import datetime

def update_old_bookings():
    conn = pymysql.connect(
        host='localhost', 
        user='root', 
        password='', 
        database='viego_blog', 
        charset='utf8mb4', 
        cursorclass=pymysql.cursors.DictCursor
    )
    cursor = conn.cursor()
    
    # Cập nhật các booking cũ đã qua ngày để status=confirmed, payment_status=paid
    cursor.execute("""
        UPDATE bookings 
        SET payment_status = 'paid', status = 'confirmed'
        WHERE user_id IN (10, 11) 
        AND date < CURDATE()
        AND status != 'cancelled'
    """)
    
    print(f'Đã cập nhật {cursor.rowcount} booking cũ')
    
    # Hiển thị thống kê
    cursor.execute("""
        SELECT u.username, COUNT(b.id) as total, 
               SUM(CASE WHEN b.payment_status='paid' AND b.status='confirmed' THEN 1 ELSE 0 END) as completed
        FROM users u
        LEFT JOIN bookings b ON u.id = b.user_id
        WHERE u.id IN (10, 11)
        GROUP BY u.id, u.username
    """)
    
    print("\n📊 Thống kê booking:")
    for row in cursor.fetchall():
        print(f"  - {row['username']}: {row['completed']}/{row['total']} tour đã hoàn thành")
    
    conn.commit()
    cursor.close()
    conn.close()

if __name__ == '__main__':
    update_old_bookings()
