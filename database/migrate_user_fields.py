"""
Database Migration: Update User table fields
- Rename email_verified to is_verified
- Add cover_image_url, language, timezone columns
"""

import pymysql
from pymysql.cursors import DictCursor

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'viego_blog',
    'charset': 'utf8mb4'
}

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
        
        # 1. Rename email_verified to is_verified
        if 'email_verified' in current_columns and 'is_verified' not in current_columns:
            migrations.append(
                ("Rename email_verified to is_verified",
                 "ALTER TABLE users CHANGE COLUMN email_verified is_verified BOOLEAN DEFAULT FALSE")
            )
        elif 'is_verified' in current_columns:
            print("   ✅ is_verified column already exists")
        
        # 2. Add cover_image_url
        if 'cover_image_url' not in current_columns:
            migrations.append(
                ("Add cover_image_url column",
                 "ALTER TABLE users ADD COLUMN cover_image_url VARCHAR(255) AFTER avatar_url")
            )
        else:
            print("   ✅ cover_image_url column already exists")
        
        # 3. Add language
        if 'language' not in current_columns:
            migrations.append(
                ("Add language column",
                 "ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'vi' AFTER location")
            )
        else:
            print("   ✅ language column already exists")
        
        # 4. Add timezone
        if 'timezone' not in current_columns:
            migrations.append(
                ("Add timezone column",
                 "ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh' AFTER language")
            )
        else:
            print("   ✅ timezone column already exists")
        
        # Execute migrations
        if migrations:
            print(f"\n2. Executing {len(migrations)} migration(s)...")
            for description, sql in migrations:
                try:
                    print(f"\n   🔧 {description}...")
                    cursor.execute(sql)
                    connection.commit()
                    print(f"   ✅ SUCCESS")
                except Exception as e:
                    print(f"   ❌ FAILED: {str(e)}")
                    connection.rollback()
                    raise
        else:
            print("\n2. ✅ No migrations needed - all columns up to date!")
        
        # Verify final structure
        print("\n3. Verifying final structure...")
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        final_columns = [col['Field'] for col in columns]
        print(f"   Final columns: {', '.join(final_columns)}")
        
        # Check required columns
        required = ['is_verified', 'cover_image_url', 'language', 'timezone']
        missing = [col for col in required if col not in final_columns]
        
        if missing:
            print(f"\n   ⚠️ WARNING: Missing columns: {', '.join(missing)}")
        else:
            print(f"\n   ✅ All required columns present!")
        
        # Show sample data
        print("\n4. Sample user data:")
        cursor.execute("""
            SELECT id, username, email, is_verified, 
                   cover_image_url, language, timezone 
            FROM users 
            LIMIT 3
        """)
        users = cursor.fetchall()
        for user in users:
            print(f"   - User {user['id']}: {user['username']} | verified={user['is_verified']} | lang={user['language']}")
        
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        if connection:
            connection.rollback()
        raise
    
    finally:
        if connection:
            connection.close()

if __name__ == '__main__':
    try:
        run_migration()
    except KeyboardInterrupt:
        print("\n\n⚠️ Migration cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {str(e)}")
        exit(1)
