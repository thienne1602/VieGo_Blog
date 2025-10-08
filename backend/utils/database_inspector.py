import pymysql

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root', 
    'password': '',
    'database': 'viego_blog',
    'charset': 'utf8mb4'
}

def check_database_detailed():
    """Check database schema and users in detail"""
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("=" * 60)
        print("🔍 KIỂM TRA DATABASE VIEGO_BLOG")
        print("=" * 60)
        
        # Check users table structure
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        
        print("\n📋 USERS TABLE STRUCTURE:")
        for col in columns:
            print(f"   - {col[0]:15} | {col[1]:20} | {col[2]:5} | {col[3]:10}")
        
        # Get all users with details
        cursor.execute("""
            SELECT id, username, email, full_name, role, is_active 
            FROM users 
            ORDER BY role, id
        """)
        users = cursor.fetchall()
        
        print(f"\n👥 TẤT CẢ USERS TRONG DATABASE ({len(users)}):")
        print("-" * 80)
        print(f"{'ID':3} | {'USERNAME':15} | {'EMAIL':25} | {'FULL_NAME':20} | {'ROLE':10} | {'ACTIVE':6}")
        print("-" * 80)
        
        admin_users = []
        mod_users = []
        regular_users = []
        
        for user in users:
            uid, username, email, full_name, role, is_active = user
            status = "✅" if is_active else "❌"
            print(f"{uid:3} | {username or 'None':15} | {email:25} | {full_name or 'None':20} | {role:10} | {status:6}")
            
            if role == 'admin':
                admin_users.append(user)
            elif role == 'moderator':
                mod_users.append(user)
            else:
                regular_users.append(user)
        
        print("\n" + "=" * 60)
        print("📊 THỐNG KÊ USERS THEO ROLE:")
        print("=" * 60)
        print(f"👑 Admin users: {len(admin_users)}")
        print(f"🛡️  Moderator users: {len(mod_users)}")
        print(f"👤 Regular users: {len(regular_users)}")
        
        print("\n" + "=" * 60)
        print("🔑 TÀI KHOẢN ĐĂNG NHẬP KHUYẾN NGHỊ:")
        print("=" * 60)
        
        if admin_users:
            user = admin_users[0]
            username = user[1] or "admin"
            print(f"👑 ADMIN: username='{username}' | email='{user[2]}'")
            
        if mod_users:
            user = mod_users[0]
            username = user[1] or "moderator"
            print(f"🛡️  MOD: username='{username}' | email='{user[2]}'")
            
        if regular_users:
            user = regular_users[0]
            username = user[1] or "user"
            print(f"👤 USER: username='{username}' | email='{user[2]}'")
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    check_database_detailed()