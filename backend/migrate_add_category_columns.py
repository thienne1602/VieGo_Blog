"""
Migration script to add 'category' and 'subcategory' columns to locations table
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
    """Add category and subcategory columns to locations table if they don't exist"""
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
            # Check and add category column
            if check_column_exists(cursor, 'locations', 'category'):
                print("[INFO] Column 'category' already exists in 'locations' table")
            else:
                print("[INFO] Adding 'category' column to 'locations' table...")
                alter_query = """
                    ALTER TABLE locations
                    ADD COLUMN category ENUM('restaurant', 'attraction', 'hotel', 'transport', 'shopping', 'entertainment') 
                    NOT NULL DEFAULT 'attraction' AFTER country
                """
                cursor.execute(alter_query)
                print("[SUCCESS] Column 'category' added successfully!")
            
            # Check and add subcategory column
            if check_column_exists(cursor, 'locations', 'subcategory'):
                print("[INFO] Column 'subcategory' already exists in 'locations' table")
            else:
                print("[INFO] Adding 'subcategory' column to 'locations' table...")
                alter_query = """
                    ALTER TABLE locations
                    ADD COLUMN subcategory VARCHAR(100) NULL AFTER category
                """
                cursor.execute(alter_query)
                print("[SUCCESS] Column 'subcategory' added successfully!")
            
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
    print("Migration: Add 'category' and 'subcategory' columns to locations table")
    print("=" * 50)
    migrate()

