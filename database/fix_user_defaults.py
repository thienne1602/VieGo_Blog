"""
Fix user table to ensure points and level are NOT NULL with proper defaults
Run this script to update the database
"""
import pymysql
import sys

def fix_user_defaults():
    try:
        # Connect to database
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='',  # Default WAMP password is empty
            database='viego_blog',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        print("✅ Connected to database successfully")
        
        with connection.cursor() as cursor:
            # Update any existing NULL values to defaults
            print("\n📝 Updating NULL values to defaults...")
            cursor.execute("UPDATE users SET points = 0 WHERE points IS NULL")
            rows_affected = cursor.rowcount
            print(f"   Updated {rows_affected} rows for points")
            
            cursor.execute("UPDATE users SET level = 1 WHERE level IS NULL")
            rows_affected = cursor.rowcount
            print(f"   Updated {rows_affected} rows for level")
            
            # Alter columns to add NOT NULL constraint
            print("\n🔧 Adding NOT NULL constraints...")
            try:
                cursor.execute("ALTER TABLE users MODIFY COLUMN points INT NOT NULL DEFAULT 0")
                print("   ✅ Added NOT NULL constraint to points")
            except Exception as e:
                print(f"   ⚠️  Points column: {e}")
            
            try:
                cursor.execute("ALTER TABLE users MODIFY COLUMN level INT NOT NULL DEFAULT 1")
                print("   ✅ Added NOT NULL constraint to level")
            except Exception as e:
                print(f"   ⚠️  Level column: {e}")
            
            # Commit changes
            connection.commit()
            
            # Verify the changes
            print("\n🔍 Verifying changes...")
            cursor.execute("""
                SELECT 
                    COLUMN_NAME, 
                    IS_NULLABLE, 
                    COLUMN_DEFAULT, 
                    DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'viego_blog' 
                  AND TABLE_NAME = 'users' 
                  AND COLUMN_NAME IN ('points', 'level')
            """)
            
            results = cursor.fetchall()
            for row in results:
                print(f"\n   Column: {row['COLUMN_NAME']}")
                print(f"   Type: {row['DATA_TYPE']}")
                print(f"   Nullable: {row['IS_NULLABLE']}")
                print(f"   Default: {row['COLUMN_DEFAULT']}")
            
            print("\n✅ Database migration completed successfully!")
            
    except pymysql.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
    finally:
        if connection:
            connection.close()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    print("=" * 60)
    print("VieGo Blog - User Table Migration")
    print("Fixing points and level columns")
    print("=" * 60)
    fix_user_defaults()
