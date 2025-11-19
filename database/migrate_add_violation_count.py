"""
Database Migration: Add violation_count field to users table
- Add violation_count column to track number of violations
"""

import pymysql
from pymysql.cursors import DictCursor
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'viego_blog',
    'charset': 'utf8mb4'
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

def run_migration():
    """Run database migration"""
    connection = None
    try:
        # Connect to database
        connection = pymysql.connect(**DB_CONFIG, cursorclass=DictCursor)
        cursor = connection.cursor()
        
        print("🔄 Starting database migration...")
        print("=" * 60)
        
        # Check current structure
        print("\n1. Checking current table structure...")
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        current_columns = [col['Field'] for col in columns]
        print(f"   Current columns: {', '.join(current_columns)}")
        
        # Migration steps
        migrations = []
        
        # Add violation_count
        if not check_column_exists(cursor, 'users', 'violation_count'):
            migrations.append(
                ("Add violation_count column",
                 "ALTER TABLE users ADD COLUMN violation_count INT DEFAULT 0 AFTER comment_banned_until")
            )
        else:
            print("   ✅ violation_count column already exists")
        
        # Execute migrations
        if migrations:
            print(f"\n2. Executing {len(migrations)} migration(s)...")
            for i, (description, sql) in enumerate(migrations, 1):
                try:
                    print(f"\n   [{i}/{len(migrations)}] {description}...")
                    cursor.execute(sql)
                    connection.commit()
                    print(f"   ✅ Success!")
                except Exception as e:
                    print(f"   ❌ Error: {e}")
                    connection.rollback()
                    raise
        else:
            print("\n2. No migrations needed - column already exists")
        
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        if connection:
            connection.rollback()
        raise
    finally:
        if connection:
            connection.close()
            print("\n🔌 Database connection closed")

if __name__ == '__main__':
    run_migration()

