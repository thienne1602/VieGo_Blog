"""
Migration script to add missing columns to locations table
Adds: phone, website, email, opening_hours, price_range, images, city, tags, amenities, 
      languages_spoken, verified, status, reviews_count, created_by, featured_image
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
    """Add missing columns to locations table if they don't exist"""
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
            # List of columns to add with their definitions
            columns_to_add = [
                {
                    'name': 'phone',
                    'definition': 'VARCHAR(20) NULL',
                    'after': 'reviews_count'
                },
                {
                    'name': 'website',
                    'definition': 'VARCHAR(255) NULL',
                    'after': 'phone'
                },
                {
                    'name': 'email',
                    'definition': 'VARCHAR(120) NULL',
                    'after': 'website'
                },
                {
                    'name': 'opening_hours',
                    'definition': 'TEXT NULL',
                    'after': 'email'
                },
                {
                    'name': 'price_range',
                    'definition': "ENUM('budget', 'mid-range', 'luxury') DEFAULT 'budget'",
                    'after': 'opening_hours'
                },
                {
                    'name': 'images',
                    'definition': 'TEXT NULL',
                    'after': 'price_range'
                },
                {
                    'name': 'city',
                    'definition': 'VARCHAR(100) NULL',
                    'after': 'province'
                },
                {
                    'name': 'tags',
                    'definition': 'TEXT NULL',
                    'after': 'featured_image'
                },
                {
                    'name': 'amenities',
                    'definition': 'TEXT NULL',
                    'after': 'tags'
                },
                {
                    'name': 'languages_spoken',
                    'definition': 'TEXT NULL',
                    'after': 'amenities'
                },
                {
                    'name': 'verified',
                    'definition': 'BOOLEAN DEFAULT FALSE',
                    'after': 'languages_spoken'
                },
                {
                    'name': 'status',
                    'definition': "ENUM('active', 'inactive', 'pending') DEFAULT 'active'",
                    'after': 'verified'
                },
                {
                    'name': 'created_by',
                    'definition': 'INT NULL',
                    'after': 'updated_at'
                },
                {
                    'name': 'featured_image',
                    'definition': 'VARCHAR(255) NULL',
                    'after': 'images'
                },
            ]
            
            # Check for reviews_count (might be named review_count)
            if check_column_exists(cursor, 'locations', 'review_count') and not check_column_exists(cursor, 'locations', 'reviews_count'):
                print("[INFO] Column 'review_count' exists but 'reviews_count' is missing")
                print("[INFO] Adding alias 'reviews_count' by creating a view or renaming...")
                # Add reviews_count if review_count exists
                columns_to_add.insert(0, {
                    'name': 'reviews_count',
                    'definition': 'INT DEFAULT 0',
                    'after': 'rating'
                })
            elif not check_column_exists(cursor, 'locations', 'reviews_count'):
                columns_to_add.insert(0, {
                    'name': 'reviews_count',
                    'definition': 'INT DEFAULT 0',
                    'after': 'rating'
                })
            
            # Add each column if it doesn't exist
            added_count = 0
            for col in columns_to_add:
                col_name = col['name']
                if check_column_exists(cursor, 'locations', col_name):
                    print(f"[INFO] Column '{col_name}' already exists in 'locations' table")
                else:
                    print(f"[INFO] Adding '{col_name}' column to 'locations' table...")
                    after_clause = f"AFTER {col['after']}" if col.get('after') else ""
                    
                    # Check if the 'after' column exists
                    if col.get('after') and not check_column_exists(cursor, 'locations', col['after']):
                        # If after column doesn't exist, add without AFTER clause
                        after_clause = ""
                        print(f"[WARNING] Column '{col['after']}' not found, adding '{col_name}' without AFTER clause")
                    
                    alter_query = f"""
                        ALTER TABLE locations
                        ADD COLUMN {col_name} {col['definition']} {after_clause}
                    """
                    
                    try:
                        cursor.execute(alter_query)
                        print(f"[SUCCESS] Column '{col_name}' added successfully!")
                        added_count += 1
                    except pymysql.Error as e:
                        print(f"[ERROR] Failed to add column '{col_name}': {e}")
            
            # Add foreign key for created_by if it doesn't exist
            if check_column_exists(cursor, 'locations', 'created_by'):
                # Check if foreign key exists
                fk_check_query = """
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME = 'locations'
                    AND COLUMN_NAME = 'created_by'
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                """
                cursor.execute(fk_check_query, (DB_NAME,))
                result = cursor.fetchone()
                fk_exists = result.get('count', 0) > 0 if isinstance(result, dict) else result[0] > 0
                
                if not fk_exists:
                    print("[INFO] Adding foreign key constraint for 'created_by'...")
                    try:
                        fk_query = """
                            ALTER TABLE locations
                            ADD CONSTRAINT fk_locations_created_by
                            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                        """
                        cursor.execute(fk_query)
                        print("[SUCCESS] Foreign key constraint added successfully!")
                    except pymysql.Error as e:
                        print(f"[WARNING] Could not add foreign key: {e} (may already exist or users table doesn't exist)")
            
            connection.commit()
            print(f"\n[SUCCESS] Migration completed! Added {added_count} new column(s).")
            
    except pymysql.Error as e:
        print(f"[ERROR] Database error: {e}")
        if 'connection' in locals():
            connection.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        if 'connection' in locals():
            connection.rollback()
        sys.exit(1)
    finally:
        if 'connection' in locals():
            connection.close()
            print("[INFO] Database connection closed")

if __name__ == '__main__':
    print("=" * 70)
    print("Migration: Add missing columns to locations table")
    print("=" * 70)
    migrate()

