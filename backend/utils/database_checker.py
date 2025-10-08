import pymysql

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root', 
    'password': '',
    'database': 'viego_blog',
    'charset': 'utf8mb4'
}

def check_database_schema():
    """Check existing database schema"""
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Check if database exists
        cursor.execute("SHOW DATABASES LIKE 'viego_blog'")
        db_exists = cursor.fetchone()
        
        if db_exists:
            print("✅ Database 'viego_blog' exists")
            
            # Check users table structure
            cursor.execute("DESCRIBE users")
            columns = cursor.fetchall()
            
            print("\n📋 Users table structure:")
            for col in columns:
                print(f"   - {col[0]} ({col[1]})")
            
            # Check existing users
            cursor.execute("SELECT id, email, full_name, role FROM users LIMIT 5")
            users = cursor.fetchall()
            
            print(f"\n👥 Existing users ({len(users)}):")
            for user in users:
                print(f"   - ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Role: {user[3]}")
                
        else:
            print("❌ Database 'viego_blog' does not exist")
            
    except Exception as e:
        print(f"Error checking database: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    check_database_schema()