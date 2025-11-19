#!/usr/bin/env python3
"""
Run moderator tables migration script
Chạy script tạo bảng cho moderator dashboard
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
            return None

def run_migration():
    """Chạy migration script"""
    print("=" * 60)
    print("🚀 Moderator Dashboard Migration")
    print("=" * 60)
    print()
    
    # Đọc SQL file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(script_dir, 'moderator_tables.sql')
    
    if not os.path.exists(sql_file):
        print(f"❌ Không tìm thấy file: {sql_file}")
        return False
    
    print(f"📄 Đọc file: {sql_file}")
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Kết nối database
    print("🔌 Đang kết nối database...")
    conn = get_connection()
    if not conn:
        print("❌ Không thể kết nối database!")
        return False
    
    print("✅ Kết nối thành công!")
    print()
    
    try:
        cursor = conn.cursor()
        
        # Tách các câu lệnh SQL (loại bỏ comment và chia theo dấu ;)
        statements = []
        current_statement = []
        
        for line in sql_content.split('\n'):
            line = line.strip()
            # Bỏ qua comment và dòng trống
            if not line or line.startswith('--'):
                continue
            
            current_statement.append(line)
            
            # Nếu dòng kết thúc bằng ; thì đó là một statement hoàn chỉnh
            if line.endswith(';'):
                statement = ' '.join(current_statement)
                if statement.strip():
                    statements.append(statement)
                current_statement = []
        
        # Thêm statement cuối nếu có
        if current_statement:
            statement = ' '.join(current_statement)
            if statement.strip():
                statements.append(statement)
        
        print(f"📝 Tìm thấy {len(statements)} câu lệnh SQL")
        print()
        
        # Thực thi từng statement
        for i, statement in enumerate(statements, 1):
            try:
                print(f"[{i}/{len(statements)}] Đang thực thi...")
                cursor.execute(statement)
                conn.commit()
                print(f"✅ Thành công!")
            except Exception as e:
                # Một số lỗi có thể bỏ qua (như table đã tồn tại)
                error_msg = str(e).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    print(f"⚠️  Đã tồn tại (bỏ qua)")
                else:
                    print(f"❌ Lỗi: {e}")
                    print(f"   Statement: {statement[:100]}...")
                    # Không dừng lại, tiếp tục với các statement khác
        
        print()
        print("=" * 60)
        print("✅ Migration hoàn tất!")
        print("=" * 60)
        print()
        
        # Kiểm tra các bảng đã được tạo
        print("📊 Kiểm tra các bảng đã tạo:")
        cursor.execute("SHOW TABLES LIKE 'banned_keywords'")
        if cursor.fetchone():
            cursor.execute("SELECT COUNT(*) as count FROM banned_keywords")
            count = cursor.fetchone()['count']
            print(f"   ✅ banned_keywords: {count} từ khóa")
        else:
            print("   ❌ banned_keywords: không tồn tại")
        
        cursor.execute("SHOW TABLES LIKE 'contacts'")
        if cursor.fetchone():
            cursor.execute("SELECT COUNT(*) as count FROM contacts")
            count = cursor.fetchone()['count']
            print(f"   ✅ contacts: {count} yêu cầu")
        else:
            print("   ❌ contacts: không tồn tại")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Lỗi khi thực thi: {e}")
        conn.rollback()
        return False

if __name__ == '__main__':
    success = run_migration()
    if not success:
        sys.exit(1)

