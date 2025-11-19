#!/usr/bin/env python3
"""
Migration Script: Add company information fields to users table
Chạy script này để thêm các trường thông tin công ty cho sellers
"""

import pymysql
import sys
import os

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def get_connection():
    """Kết nối database"""
    try:
        conn = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            database='viego_blog',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        return conn
    except Exception as e:
        print(f"❌ Lỗi kết nối: {e}")
        print("💡 Thử với password 'root'...")
        try:
            conn = pymysql.connect(
                host='localhost',
                user='root',
                password='root',
                database='viego_blog',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            return conn
        except Exception as e2:
            print(f"❌ Vẫn lỗi: {e2}")
            print("\n💡 Vui lòng kiểm tra:")
            print("   1. MySQL/MariaDB đang chạy")
            print("   2. Database 'viego_blog' đã tồn tại")
            print("   3. Username và password đúng")
            return None

def column_exists(cursor, table_name, column_name):
    """Kiểm tra xem cột đã tồn tại chưa"""
    cursor.execute(f"""
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'viego_blog' 
        AND TABLE_NAME = '{table_name}' 
        AND COLUMN_NAME = '{column_name}'
    """)
    result = cursor.fetchone()
    return result['count'] > 0

def add_company_fields():
    """Thêm các trường thông tin công ty vào bảng users"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Danh sách các cột cần thêm
        columns_to_add = [
            {
                'name': 'company_name',
                'type': 'VARCHAR(255)',
                'comment': 'Tên công ty'
            },
            {
                'name': 'company_address',
                'type': 'TEXT',
                'comment': 'Địa chỉ công ty'
            },
            {
                'name': 'company_phone',
                'type': 'VARCHAR(50)',
                'comment': 'Số điện thoại công ty'
            },
            {
                'name': 'company_tax_id',
                'type': 'VARCHAR(50)',
                'comment': 'Mã số thuế'
            },
            {
                'name': 'company_email',
                'type': 'VARCHAR(255)',
                'comment': 'Email công ty (để hiển thị trong booking)'
            },
            {
                'name': 'bank_account_number',
                'type': 'VARCHAR(100)',
                'comment': 'Số tài khoản ngân hàng'
            },
            {
                'name': 'bank_name',
                'type': 'VARCHAR(255)',
                'comment': 'Tên ngân hàng'
            },
            {
                'name': 'bank_account_holder',
                'type': 'VARCHAR(255)',
                'comment': 'Chủ tài khoản'
            }
        ]
        
        print("=" * 60)
        print("🔧 Migration: Thêm trường thông tin công ty")
        print("=" * 60)
        print()
        
        added_count = 0
        skipped_count = 0
        
        for col in columns_to_add:
            col_name = col['name']
            col_type = col['type']
            col_comment = col['comment']
            
            if column_exists(cursor, 'users', col_name):
                print(f"⏭️  Cột '{col_name}' đã tồn tại, bỏ qua...")
                skipped_count += 1
            else:
                try:
                    sql = f"""
                        ALTER TABLE users 
                        ADD COLUMN {col_name} {col_type} NULL 
                        COMMENT '{col_comment}'
                    """
                    cursor.execute(sql)
                    conn.commit()
                    print(f"✅ Đã thêm cột '{col_name}' ({col_comment})")
                    added_count += 1
                except Exception as e:
                    print(f"❌ Lỗi khi thêm cột '{col_name}': {e}")
                    conn.rollback()
        
        print()
        print("=" * 60)
        print("📊 Kết quả:")
        print(f"   ✅ Đã thêm: {added_count} cột")
        print(f"   ⏭️  Đã bỏ qua: {skipped_count} cột")
        print("=" * 60)
        print()
        print("✅ Migration hoàn tất!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Lỗi khi chạy migration: {e}")
        import traceback
        print(traceback.format_exc())
        if conn:
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    print()
    success = add_company_fields()
    print()
    if success:
        print("🎉 Migration thành công!")
    else:
        print("⚠️  Migration thất bại. Vui lòng kiểm tra lỗi ở trên.")
    print()
    # Only wait for input if running interactively
    try:
        import sys
        if sys.stdin.isatty():
            input("Nhấn Enter để thoát...")
    except:
        pass

