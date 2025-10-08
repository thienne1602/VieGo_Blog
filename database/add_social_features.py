"""
Add social features columns to users table
Run this script to update the database schema with new social features
"""
import pymysql
import sys
import os

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Default WAMP MySQL password
    'database': 'viego_blog',
    'charset': 'utf8mb4'
}

def add_social_features():
    """Add social features columns to users table"""
    try:
        print("🔌 Connecting to database...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("\n📊 Current users table structure:")
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        existing_columns = [col[0] for col in columns]
        
        for col in columns:
            print(f"  - {col[0]}: {col[1]}")
        
        # Check which columns need to be added
        social_columns = ['bookmarks', 'liked_posts', 'following', 'followers']
        missing_columns = [col for col in social_columns if col not in existing_columns]
        
        if not missing_columns:
            print("\n✅ All social feature columns already exist!")
            return
        
        print(f"\n🔧 Adding missing columns: {', '.join(missing_columns)}")
        
        # Add each missing column
        for column in missing_columns:
            print(f"\n  Adding {column}...")
            cursor.execute(f"""
                ALTER TABLE users 
                ADD COLUMN {column} JSON DEFAULT NULL 
                COMMENT 'Array of IDs for {column} feature'
            """)
            print(f"  ✅ {column} added")
        
        connection.commit()
        
        # Initialize NULL values to empty arrays
        print("\n🔄 Initializing empty arrays for existing users...")
        cursor.execute("""
            UPDATE users 
            SET 
                bookmarks = COALESCE(bookmarks, JSON_ARRAY()),
                liked_posts = COALESCE(liked_posts, JSON_ARRAY()),
                following = COALESCE(following, JSON_ARRAY()),
                followers = COALESCE(followers, JSON_ARRAY())
        """)
        connection.commit()
        affected_rows = cursor.rowcount
        print(f"  ✅ Updated {affected_rows} users")
        
        # Show updated structure
        print("\n📊 Updated users table structure:")
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        for col in columns:
            if col[0] in social_columns:
                print(f"  - {col[0]}: {col[1]} ✨ (NEW)")
            else:
                print(f"  - {col[0]}: {col[1]}")
        
        print("\n✅ Social features migration completed successfully!")
        print("\n📌 New columns added:")
        print("  - bookmarks: Stores array of bookmarked post IDs")
        print("  - liked_posts: Stores array of liked post IDs")
        print("  - following: Stores array of user IDs this user follows")
        print("  - followers: Stores array of user IDs following this user")
        
        cursor.close()
        connection.close()
        
    except pymysql.Error as e:
        print(f"\n❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 60)
    print("  VieGo Blog - Add Social Features Migration")
    print("=" * 60)
    
    add_social_features()
    
    print("\n" + "=" * 60)
    print("  Migration Complete - You can now restart the backend")
    print("=" * 60)
