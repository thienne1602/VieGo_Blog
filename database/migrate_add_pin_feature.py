"""
Migration script để thêm chức năng ghim tour (pin) vào hành trình
Thêm các cột is_pinned và pinned_at vào bảng bookings và tour_assignments
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

import mysql.connector
from mysql.connector import Error

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'viego_blog'
}


def run_migration():
    """Chạy migration để thêm các cột is_pinned và pinned_at"""
    connection = None
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("=" * 60)
        print("Migration: Thêm chức năng ghim tour (Pin Feature)")
        print("=" * 60)
        
        # 1. Thêm cột is_pinned và pinned_at vào bảng bookings
        print("\n[1/4] Kiểm tra cột is_pinned trong bảng bookings...")
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'viego_blog' 
            AND TABLE_NAME = 'bookings' 
            AND COLUMN_NAME = 'is_pinned'
        """)
        
        if cursor.fetchone() is None:
            print("  → Thêm cột is_pinned vào bảng bookings...")
            cursor.execute("""
                ALTER TABLE bookings 
                ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE
            """)
            print("  ✓ Đã thêm cột is_pinned vào bảng bookings")
        else:
            print("  → Cột is_pinned đã tồn tại trong bảng bookings")
        
        # 2. Thêm cột pinned_at vào bảng bookings
        print("\n[2/4] Kiểm tra cột pinned_at trong bảng bookings...")
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'viego_blog' 
            AND TABLE_NAME = 'bookings' 
            AND COLUMN_NAME = 'pinned_at'
        """)
        
        if cursor.fetchone() is None:
            print("  → Thêm cột pinned_at vào bảng bookings...")
            cursor.execute("""
                ALTER TABLE bookings 
                ADD COLUMN pinned_at DATETIME NULL
            """)
            print("  ✓ Đã thêm cột pinned_at vào bảng bookings")
        else:
            print("  → Cột pinned_at đã tồn tại trong bảng bookings")
        
        # 3. Thêm cột is_pinned vào bảng tour_assignments
        print("\n[3/4] Kiểm tra cột is_pinned trong bảng tour_assignments...")
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'viego_blog' 
            AND TABLE_NAME = 'tour_assignments' 
            AND COLUMN_NAME = 'is_pinned'
        """)
        
        if cursor.fetchone() is None:
            print("  → Thêm cột is_pinned vào bảng tour_assignments...")
            cursor.execute("""
                ALTER TABLE tour_assignments 
                ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE
            """)
            print("  ✓ Đã thêm cột is_pinned vào bảng tour_assignments")
        else:
            print("  → Cột is_pinned đã tồn tại trong bảng tour_assignments")
        
        # 4. Thêm cột pinned_at vào bảng tour_assignments
        print("\n[4/4] Kiểm tra cột pinned_at trong bảng tour_assignments...")
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'viego_blog' 
            AND TABLE_NAME = 'tour_assignments' 
            AND COLUMN_NAME = 'pinned_at'
        """)
        
        if cursor.fetchone() is None:
            print("  → Thêm cột pinned_at vào bảng tour_assignments...")
            cursor.execute("""
                ALTER TABLE tour_assignments 
                ADD COLUMN pinned_at DATETIME NULL
            """)
            print("  ✓ Đã thêm cột pinned_at vào bảng tour_assignments")
        else:
            print("  → Cột pinned_at đã tồn tại trong bảng tour_assignments")
        
        connection.commit()
        
        print("\n" + "=" * 60)
        print("✅ Migration hoàn thành!")
        print("=" * 60)
        
        # Hiển thị cấu trúc mới
        print("\n📋 Cấu trúc các cột mới:")
        print("-" * 40)
        
        cursor.execute("""
            SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'viego_blog' 
            AND TABLE_NAME IN ('bookings', 'tour_assignments')
            AND COLUMN_NAME IN ('is_pinned', 'pinned_at')
            ORDER BY TABLE_NAME, COLUMN_NAME
        """)
        
        columns = cursor.fetchall()
        for col in columns:
            print(f"  • {col[0]}.{col[1]}: {col[2]} (NULL: {col[3]}, Default: {col[4]})")
        
        return True
        
    except Error as e:
        print(f"\n❌ Lỗi MySQL: {e}")
        if connection:
            connection.rollback()
        return False
        
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Đã đóng kết nối database")


if __name__ == '__main__':
    run_migration()
