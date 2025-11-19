"""
Migration script to add 'is_archived' column to stories table
"""
import os
import sys
import pymysql

# Try to load dotenv if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Database configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '3306'))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'viego_blog')

def check_column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table"""
    query = """
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = %s
        AND TABLE_NAME = %s
        AND COLUMN_NAME = %s
    """
    cursor.execute(query, (DB_NAME, table_name, column_name))
    result = cursor.fetchone()
    if isinstance(result, dict):
        return result.get('count', 0) > 0
    else:
        return result[0] > 0

def migrate():
    """Add is_archived column to stories table if it doesn't exist"""
    try:
        # Connect to database
        connection = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        print(f"[INFO] Connected to database: {DB_NAME}")
        
        with connection.cursor() as cursor:
            # Check if is_archived column exists
            if check_column_exists(cursor, 'stories', 'is_archived'):
                print("[INFO] Column 'is_archived' already exists in 'stories' table")
                return
            
            # Add is_archived column
            print("[INFO] Adding 'is_archived' column to 'stories' table...")
            alter_query = """
                ALTER TABLE stories
                ADD COLUMN is_archived BOOLEAN DEFAULT FALSE AFTER expires_at
            """
            cursor.execute(alter_query)
            
            # Auto-archive expired stories
            print("[INFO] Archiving expired stories...")
            archive_query = """
                UPDATE stories
                SET is_archived = TRUE
                WHERE expires_at < NOW() AND (is_archived IS NULL OR is_archived = FALSE)
            """
            cursor.execute(archive_query)
            archived_count = cursor.rowcount
            
            connection.commit()
            
            print(f"[SUCCESS] Column 'is_archived' added successfully!")
            print(f"[SUCCESS] Archived {archived_count} expired stories")
            
    except pymysql.Error as e:
        print(f"[ERROR] Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        sys.exit(1)
    finally:
        if 'connection' in locals():
            connection.close()
            print("[INFO] Database connection closed")

if __name__ == '__main__':
    print("=" * 50)
    print("Migration: Add 'is_archived' column to stories table")
    print("=" * 50)
    migrate()

