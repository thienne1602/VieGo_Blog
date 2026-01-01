#!/usr/bin/env python3
"""Kiểm tra dữ liệu booking trong database"""

import pymysql

conn = pymysql.connect(
    host='localhost', 
    user='root', 
    password='', 
    database='viego_blog', 
    charset='utf8mb4', 
    cursorclass=pymysql.cursors.DictCursor
)
cursor = conn.cursor()

# Kiểm tra booking mới tạo
cursor.execute('SELECT id, user_id, tour_id, date, status, payment_status FROM bookings WHERE id >= 35 ORDER BY id')
print('=== Bookings moi tao (id >= 35) ===')
for row in cursor.fetchall():
    print(row)

# Kiểm tra booking_itinerary_days
cursor.execute('SELECT COUNT(*) as cnt FROM booking_itinerary_days')
result = cursor.fetchone()
print(f"\nTong so booking_itinerary_days: {result['cnt']}")

# Kiểm tra tất cả booking của user 10 và 11
cursor.execute('''
    SELECT b.id, b.user_id, t.title, b.date, b.status, b.payment_status 
    FROM bookings b 
    JOIN tours t ON b.tour_id = t.id 
    WHERE b.user_id IN (10, 11) 
    ORDER BY b.date DESC
''')
print('\n=== Tat ca bookings cua user 10 va 11 ===')
for row in cursor.fetchall():
    print(f"#{row['id']} | user={row['user_id']} | {row['title'][:30]} | {row['date']} | {row['status']}")

cursor.close()
conn.close()
