# -*- coding: utf-8 -*-
"""
Reset user passwords to simple, easy-to-remember ones
VieGo Blog - Laragon
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
import pymysql
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env'))

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'viego_blog',
    'charset': 'utf8mb4'
}

def reset_passwords():
    """Reset all user passwords to simple ones"""
    
    print("=" * 70)
    print("🔐 RESET USER PASSWORDS - VIEGO BLOG")
    print("=" * 70)
    print()
    
    # Simple password configurations
    users = [
        {
            'email': 'admin@viego.com',
            'password': '123456',
            'display_name': 'Admin (Quản trị viên)'
        },
        {
            'email': 'editor@viego.com',
            'password': '123456',
            'display_name': 'Editor (Biên tập viên)'
        },
        {
            'email': 'vana@gmail.com',
            'password': '123456',
            'display_name': 'User 1 (Nguyễn Văn A)'
        },
        {
            'email': 'thib@gmail.com',
            'password': '123456',
            'display_name': 'User 2 (Trần Thị B)'
        },
        {
            'email': 'minhtuan@gmail.com',
            'password': '123456',
            'display_name': 'User 3 (Lê Minh Tuấn)'
        },
        {
            'email': 'thuhang@gmail.com',
            'password': '123456',
            'display_name': 'User 4 (Phạm Thu Hằng)'
        }
    ]
    
    try:
        # Connect to database
        print("📡 Connecting to database...")
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ Connected to database: viego_blog")
        print()
        
        print("🔑 Resetting passwords...")
        print()
        
        updated_count = 0
        
        for user in users:
            email = user['email']
            password = user['password']
            display_name = user['display_name']
            
            # Generate password hash using bcrypt (compatible with Flask User model)
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Update password
            sql = "UPDATE users SET password_hash = %s WHERE email = %s"
            cursor.execute(sql, (password_hash, email))
            
            if cursor.rowcount > 0:
                print(f"✅ {display_name}")
                print(f"   Email: {email}")
                print(f"   Password: {password}")
                print()
                updated_count += 1
            else:
                print(f"⚠️  {display_name} - Not found!")
                print()
        
        # Commit changes
        conn.commit()
        
        print("=" * 70)
        print(f"✅ COMPLETED! Updated {updated_count}/{len(users)} accounts")
        print("=" * 70)
        print()
        
        # Display summary
        print("📋 LOGIN CREDENTIALS:")
        print()
        print("┌" + "─" * 68 + "┐")
        print("│ " + "ADMIN ACCOUNT".center(66) + " │")
        print("├" + "─" * 68 + "┤")
        print("│  Email:    admin@viego.com" + " " * 40 + "│")
        print("│  Password: 123456" + " " * 49 + "│")
        print("│  Role:     Administrator (Full access)" + " " * 28 + "│")
        print("├" + "─" * 68 + "┤")
        print("│ " + "EDITOR ACCOUNT".center(66) + " │")
        print("├" + "─" * 68 + "┤")
        print("│  Email:    editor@viego.com" + " " * 39 + "│")
        print("│  Password: 123456" + " " * 49 + "│")
        print("│  Role:     Editor (Can manage posts)" + " " * 30 + "│")
        print("├" + "─" * 68 + "┤")
        print("│ " + "USER ACCOUNTS (All password: 123456)".center(66) + " │")
        print("├" + "─" * 68 + "┤")
        print("│  1. vana@gmail.com      - Nguyễn Văn A" + " " * 27 + "│")
        print("│  2. thib@gmail.com      - Trần Thị B" + " " * 29 + "│")
        print("│  3. minhtuan@gmail.com  - Lê Minh Tuấn" + " " * 27 + "│")
        print("│  4. thuhang@gmail.com   - Phạm Thu Hằng" + " " * 26 + "│")
        print("└" + "─" * 68 + "┘")
        print()
        
        print("🌐 URLs:")
        print("   - Frontend: http://localhost:3000")
        print("   - Backend:  http://localhost:5000")
        print()
        
        print("✅ You can now login with these credentials!")
        print()
        
        cursor.close()
        conn.close()
        
        return True
        
    except pymysql.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = reset_passwords()
    
    if success:
        print("=" * 70)
        print("🎉 PASSWORD RESET SUCCESSFUL!")
        print("=" * 70)
        print()
        print("💡 TIP: Đăng nhập với:")
        print("   Email: admin@viego.com")
        print("   Password: 123456")
        print()
    else:
        print()
        print("=" * 70)
        print("❌ PASSWORD RESET FAILED!")
        print("=" * 70)
        print()
        print("💡 Troubleshooting:")
        print("   1. Check if Laragon MySQL is running")
        print("   2. Check database 'viego_blog' exists")
        print("   3. Check if virtual environment is activated")
        print()
    
    input("Press Enter to exit...")
