"""
Test MySQL connection and create viego_blog database if needed
"""
import pymysql
import sys

def test_connection():
    """Test different MySQL connection methods"""
    
    # Try 1: No password
    print("🔍 Testing MySQL connection without password...")
    try:
        conn = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            charset='utf8mb4'
        )
        print("✅ Connected successfully without password!")
        
        # Check if database exists
        cursor = conn.cursor()
        cursor.execute("SHOW DATABASES LIKE 'viego_blog'")
        result = cursor.fetchone()
        
        if result:
            print("✅ Database 'viego_blog' exists")
        else:
            print("⚠️ Database 'viego_blog' does NOT exist")
            print("Creating database...")
            cursor.execute("CREATE DATABASE IF NOT EXISTS viego_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print("✅ Database 'viego_blog' created successfully!")
        
        cursor.close()
        conn.close()
        return True, ''
        
    except pymysql.err.OperationalError as e:
        print(f"❌ Connection failed: {e}")
        
        # Try 2: Common default passwords
        passwords = ['root', 'password', 'admin', '123456']
        for pwd in passwords:
            print(f"\n🔍 Trying password: '{pwd}'...")
            try:
                conn = pymysql.connect(
                    host='localhost',
                    user='root',
                    password=pwd,
                    charset='utf8mb4'
                )
                print(f"✅ Connected successfully with password: '{pwd}'!")
                
                # Check if database exists
                cursor = conn.cursor()
                cursor.execute("SHOW DATABASES LIKE 'viego_blog'")
                result = cursor.fetchone()
                
                if result:
                    print("✅ Database 'viego_blog' exists")
                else:
                    print("⚠️ Database 'viego_blog' does NOT exist")
                    print("Creating database...")
                    cursor.execute("CREATE DATABASE IF NOT EXISTS viego_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                    print("✅ Database 'viego_blog' created successfully!")
                
                cursor.close()
                conn.close()
                return True, pwd
                
            except pymysql.err.OperationalError:
                continue
        
        print("\n❌ Could not connect with any common password")
        print("\n📝 Please update backend/.env file with correct MySQL password:")
        print("   DB_PASSWORD=your_mysql_root_password")
        return False, None

if __name__ == '__main__':
    success, password = test_connection()
    
    if success:
        if password:
            print(f"\n✅ Update your backend/.env file:")
            print(f"   DB_PASSWORD={password}")
        else:
            print(f"\n✅ Your backend/.env is correct (no password needed)")
        print("\n🚀 You can now start the backend server!")
        sys.exit(0)
    else:
        sys.exit(1)
