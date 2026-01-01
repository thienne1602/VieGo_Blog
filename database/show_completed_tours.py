#!/usr/bin/env python3
"""
Script hiển thị chi tiết các tour đã đi
"""

import pymysql

def show_completed_tours():
    conn = pymysql.connect(
        host='localhost', 
        user='root', 
        password='', 
        database='viego_blog', 
        charset='utf8mb4', 
        cursorclass=pymysql.cursors.DictCursor
    )
    cursor = conn.cursor()
    
    # Chi tiết booking cho user ngocthien
    cursor.execute('''
        SELECT b.id, t.title as tour_name, b.date, b.adults, b.children, b.total_price, b.status, b.payment_status
        FROM bookings b
        JOIN tours t ON b.tour_id = t.id
        WHERE b.user_id = 11
        ORDER BY b.date DESC
    ''')
    
    print('=== Tour đã đi của ngocthien (id=11) ===')
    for row in cursor.fetchall():
        tour = row['tour_name'][:40]
        print(f"#{row['id']} - {tour} | {row['date']} | {row['adults']}A+{row['children']}C | {row['total_price']:,.0f} VND | {row['status']}/{row['payment_status']}")
    
    # Chi tiết booking cho user tour_seller_vn  
    cursor.execute('''
        SELECT b.id, t.title as tour_name, b.date, b.adults, b.children, b.total_price, b.status, b.payment_status
        FROM bookings b
        JOIN tours t ON b.tour_id = t.id
        WHERE b.user_id = 10
        ORDER BY b.date DESC
        LIMIT 10
    ''')
    
    print()
    print('=== Tour đã đi của tour_seller_vn (id=10) - Top 10 ===')
    for row in cursor.fetchall():
        tour = row['tour_name'][:40]
        print(f"#{row['id']} - {tour} | {row['date']} | {row['adults']}A+{row['children']}C | {row['total_price']:,.0f} VND | {row['status']}/{row['payment_status']}")
    
    # Hiển thị số ngày hành trình
    cursor.execute('''
        SELECT b.id as booking_id, COUNT(bid.id) as days_count
        FROM bookings b
        LEFT JOIN booking_itinerary_days bid ON b.id = bid.booking_id
        WHERE b.user_id IN (10, 11)
        GROUP BY b.id
        HAVING COUNT(bid.id) > 0
        ORDER BY b.id DESC
        LIMIT 10
    ''')
    
    print()
    print('=== Số ngày hành trình đã nạp (Top 10 booking) ===')
    for row in cursor.fetchall():
        print(f"Booking #{row['booking_id']}: {row['days_count']} ngày")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    show_completed_tours()
