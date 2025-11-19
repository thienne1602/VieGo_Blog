#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migration script to add new fields to bookings table
Cập nhật bảng bookings với các trường mới cho booking form
"""

import pymysql
import sys
import os
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # WAMP default no password
    'database': 'viego_blog',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def check_column_exists(cursor, table, column):
    """Kiểm tra xem cột đã tồn tại chưa"""
    try:
        cursor.execute(f"""
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'viego_blog' 
            AND TABLE_NAME = '{table}' 
            AND COLUMN_NAME = '{column}'
        """)
        result = cursor.fetchone()
        return result['count'] > 0
    except Exception as e:
        print(f"⚠️  Lỗi khi kiểm tra cột {column}: {e}")
        return False

def get_table_columns(cursor, table):
    """Lấy danh sách các cột hiện tại của bảng"""
    try:
        cursor.execute(f"DESCRIBE {table}")
        columns = cursor.fetchall()
        return [col['Field'] for col in columns]
    except Exception as e:
        print(f"⚠️  Lỗi khi lấy danh sách cột: {e}")
        return []

def run_migration():
    """Chạy migration để thêm các trường mới vào bảng bookings"""
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🚀 Bắt đầu migration bảng bookings...")
        print("=" * 60)
        
        # Kiểm tra xem bảng bookings có tồn tại không
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'viego_blog' 
            AND TABLE_NAME = 'bookings'
        """)
        table_exists = cursor.fetchone()['count'] > 0
        
        if not table_exists:
            print("❌ Bảng 'bookings' không tồn tại!")
            print("💡 Vui lòng chạy script init_database.py trước")
            return False
        
        print("✅ Bảng 'bookings' đã tồn tại")
        
        # Lấy danh sách cột hiện tại
        existing_columns = get_table_columns(cursor, 'bookings')
        print(f"\n📋 Các cột hiện tại ({len(existing_columns)}): {', '.join(existing_columns[:5])}...")
        
        # Định nghĩa các cột cần thêm
        # Format: (column_name, column_definition, after_column)
        columns_to_add = [
            ('adults', 'INT DEFAULT 0', 'participants'),
            ('children', 'INT DEFAULT 0', 'adults'),
            ('infants', 'INT DEFAULT 0', 'children'),
            ('full_name', 'VARCHAR(255)', 'infants'),
            ('email', 'VARCHAR(255)', 'full_name'),
            ('phone', 'VARCHAR(50)', 'email'),
            ('address', 'TEXT', 'phone'),
            ('base_price', 'FLOAT DEFAULT 0.0', 'address'),
            ('adult_price', 'FLOAT DEFAULT 0.0', 'base_price'),
            ('child_price', 'FLOAT DEFAULT 0.0', 'adult_price'),
            ('infant_price', 'FLOAT DEFAULT 0.0', 'child_price'),
            ('discount_code', 'VARCHAR(50)', 'infant_price'),
            ('discount_amount', 'FLOAT DEFAULT 0.0', 'discount_code'),
            ('payment_method', "ENUM('office', 'bank_transfer', 'online') DEFAULT 'office'", 'currency'),
            ('payment_status', "ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid'", 'payment_method'),
            ('notes', 'TEXT', 'status'),
        ]
        
        added_count = 0
        skipped_count = 0
        
        print("\n📝 Đang thêm các cột mới...")
        print("-" * 60)
        
        for col_name, col_def, after_col in columns_to_add:
            if check_column_exists(cursor, 'bookings', col_name):
                print(f"⏭️  Cột '{col_name}' đã tồn tại, bỏ qua")
                skipped_count += 1
            else:
                try:
                    # Kiểm tra xem cột 'after' có tồn tại không
                    if after_col not in existing_columns and after_col != 'participants' and after_col != 'currency' and after_col != 'status':
                        # Nếu cột 'after' không tồn tại, thêm ở cuối
                        sql = f"ALTER TABLE bookings ADD COLUMN {col_name} {col_def}"
                    else:
                        sql = f"ALTER TABLE bookings ADD COLUMN {col_name} {col_def} AFTER {after_col}"
                    
                    cursor.execute(sql)
                    connection.commit()
                    print(f"✅ Đã thêm cột '{col_name}' ({col_def})")
                    added_count += 1
                    
                    # Cập nhật danh sách cột hiện tại
                    existing_columns.append(col_name)
                    
                except Exception as e:
                    print(f"❌ Lỗi khi thêm cột '{col_name}': {e}")
                    # Rollback transaction
                    connection.rollback()
        
        # Cập nhật dữ liệu cũ: set adults = participants nếu adults = 0
        print("\n🔄 Đang cập nhật dữ liệu cũ...")
        try:
            cursor.execute("""
                UPDATE bookings 
                SET adults = participants 
                WHERE adults = 0 AND participants > 0
            """)
            updated_rows = cursor.rowcount
            connection.commit()
            if updated_rows > 0:
                print(f"✅ Đã cập nhật {updated_rows} bản ghi: adults = participants")
            else:
                print("ℹ️  Không có bản ghi nào cần cập nhật")
        except Exception as e:
            print(f"⚠️  Lỗi khi cập nhật dữ liệu: {e}")
            connection.rollback()
        
        print("\n" + "=" * 60)
        print("📊 Tóm tắt migration:")
        print(f"   ✅ Đã thêm: {added_count} cột")
        print(f"   ⏭️  Đã bỏ qua: {skipped_count} cột")
        print("=" * 60)
        print("🎉 Migration hoàn tất!")
        
        # Hiển thị cấu trúc bảng sau migration
        print("\n📋 Cấu trúc bảng bookings sau migration:")
        final_columns = get_table_columns(cursor, 'bookings')
        print(f"   Tổng số cột: {len(final_columns)}")
        print(f"   Các cột mới: {', '.join([col for col in final_columns if col in [c[0] for c in columns_to_add]])}")
        
        return True
        
    except pymysql.Error as e:
        print(f"\n❌ Lỗi database: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Lỗi không mong muốn: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'connection' in locals():
            connection.close()
            print("\n🔌 Đã đóng kết nối database")

def main():
    """Main function"""
    print("=" * 60)
    print("🚀 VieGo Blog - Booking Fields Migration")
    print("=" * 60)
    print()
    
    success = run_migration()
    
    if success:
        print("\n✅ Migration thành công!")
        print("\n💡 Các trường mới đã được thêm vào bảng bookings:")
        print("   - adults, children, infants")
        print("   - full_name, email, phone, address")
        print("   - base_price, adult_price, child_price, infant_price")
        print("   - discount_code, discount_amount")
        print("   - payment_method, payment_status")
        print("   - notes")
        sys.exit(0)
    else:
        print("\n❌ Migration thất bại!")
        print("💡 Vui lòng kiểm tra lại database connection và thử lại")
        sys.exit(1)

if __name__ == "__main__":
    main()

