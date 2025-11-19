"""
Migration script to add 'rating' and 'reviews_count' columns to locations table
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
    """Add rating and reviews_count columns to locations table if they don't exist"""
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
            # Check and add rating column
            if check_column_exists(cursor, 'locations', 'rating'):
                print("[INFO] Column 'rating' already exists in 'locations' table")
            else:
                print("[INFO] Adding 'rating' column to 'locations' table...")
                alter_query = """
                    ALTER TABLE locations
                    ADD COLUMN rating FLOAT DEFAULT 0.0 AFTER subcategory
                """
                cursor.execute(alter_query)
                print("[SUCCESS] Column 'rating' added successfully!")
            
            # Check and add reviews_count column
            if check_column_exists(cursor, 'locations', 'reviews_count'):
                print("[INFO] Column 'reviews_count' already exists in 'locations' table")
            else:
                print("[INFO] Adding 'reviews_count' column to 'locations' table...")
                alter_query = """
                    ALTER TABLE locations
                    ADD COLUMN reviews_count INT DEFAULT 0 AFTER rating
                """
                cursor.execute(alter_query)
                print("[SUCCESS] Column 'reviews_count' added successfully!")
            
            connection.commit()
            
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
    print("Migration: Add 'rating' and 'reviews_count' columns to locations table")
    print("=" * 50)
    migrate()

