# Fix users table schema - add missing columns
import pymysql
import sys

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'viego_blog'
}

# Columns to add if not exists
COLUMNS_TO_ADD = [
    ("cover_image_url", "VARCHAR(500) NULL"),
    ("is_verified", "TINYINT(1) DEFAULT 0"),
    ("email_verified", "TINYINT(1) DEFAULT 0"),
    ("points", "INT DEFAULT 0 NOT NULL"),
    ("level", "INT DEFAULT 1 NOT NULL"),
    ("badges", "TEXT NULL"),
    ("location", "VARCHAR(255) NULL"),
    ("language", "VARCHAR(10) DEFAULT 'vi'"),
    ("timezone", "VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh'"),
    ("social_links", "TEXT NULL"),
    ("bookmarks", "TEXT NULL"),
    ("liked_posts", "TEXT NULL"),
    ("following", "TEXT NULL"),
    ("followers", "TEXT NULL")
]

print("=" * 70)
print("🔧 FIXING USERS TABLE SCHEMA")
print("=" * 70)
print()

try:
    # Connect to database
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("DESCRIBE users")
    existing_columns = {row[0] for row in cursor.fetchall()}
    print(f"✅ Found {len(existing_columns)} existing columns")
    print()
    
    # Add missing columns
    added_count = 0
    skipped_count = 0
    
    for col_name, col_definition in COLUMNS_TO_ADD:
        if col_name in existing_columns:
            print(f"⏭️  {col_name:20s} - Already exists")
            skipped_count += 1
        else:
            try:
                sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_definition}"
                cursor.execute(sql)
                print(f"✅ {col_name:20s} - Added")
                added_count += 1
            except pymysql.Error as e:
                print(f"❌ {col_name:20s} - Error: {e}")
    
    # Commit changes
    conn.commit()
    
    print()
    print("=" * 70)
    print(f"✅ SCHEMA FIX COMPLETE!")
    print(f"   Added: {added_count} columns")
    print(f"   Skipped: {skipped_count} columns")
    print("=" * 70)
    print()
    
    # Verify
    cursor.execute("DESCRIBE users")
    all_columns = cursor.fetchall()
    print(f"📊 Users table now has {len(all_columns)} columns total")
    print()
    
    cursor.close()
    conn.close()
    
    print("✅ Database connection closed")
    print()
    print("🎉 Ready to test login!")
    
except pymysql.Error as e:
    print(f"❌ Database error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
