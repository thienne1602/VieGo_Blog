#!/usr/bin/env python3
"""
Script tạo tài khoản cho các role khác nhau trong VieGo Blog
Roles: admin, moderator, user, seller
"""

import pymysql
import bcrypt
from datetime import datetime
import json

def get_db_connection():
    """Kết nối database"""
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='viego_blog',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def hash_password(password):
    """Tạo password hash"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_role_accounts():
    """Tạo tài khoản cho các role khác nhau"""
    
    # Thông tin tài khoản cho từng role
    accounts = [
        {
            'username': 'admin',
            'email': 'admin@viego.com',
            'password': 'admin123',
            'full_name': 'VieGo Administrator',
            'role': 'admin',
            'bio': 'Quản trị viên hệ thống VieGo Blog',
            'points': 1000,
            'level': 10,
            'badges': '["Admin", "Founder", "Expert"]',
            'location': 'Hà Nội, Việt Nam',
            'website': 'https://viego.com',
            'social_links': '{"facebook": "https://fb.com/viego", "twitter": "@viegoblog"}'
        },
        {
            'username': 'moderator',
            'email': 'moderator@viego.com',
            'password': 'mod123',
            'full_name': 'Điều hành viên VieGo',
            'role': 'moderator',
            'bio': 'Điều hành viên quản lý nội dung và cộng đồng',
            'points': 500,
            'level': 5,
            'badges': '["Moderator", "Community Leader"]',
            'location': 'TP.HCM, Việt Nam',
            'website': '',
            'social_links': '{"instagram": "@viego_mod"}'
        },
        {
            'username': 'blogger_hanoi',
            'email': 'blogger@viego.com',
            'password': 'blogger123',
            'full_name': 'Nguyễn Travel Blogger',
            'role': 'user',
            'bio': 'Travel blogger chuyên viết về du lịch miền Bắc',
            'points': 250,
            'level': 3,
            'badges': '["Active Writer", "Travel Expert"]',
            'location': 'Hà Nội, Việt Nam',
            'website': 'https://travelblog.vn',
            'social_links': '{"youtube": "TravelVN", "instagram": "@travelblogger"}'
        },
        {
            'username': 'foodie_saigon',
            'email': 'foodie@viego.com',
            'password': 'foodie123',
            'full_name': 'Trần Food Explorer',
            'role': 'user',
            'bio': 'Food blogger khám phá ẩm thực Sài Gòn',
            'points': 180,
            'level': 2,
            'badges': '["Food Lover", "Reviewer"]',
            'location': 'TP.HCM, Việt Nam',
            'website': 'https://saigonfoodie.com',
            'social_links': '{"tiktok": "@saigonfoodie", "facebook": "SaigonFoodie"}'
        },
        {
            'username': 'tour_seller',
            'email': 'seller@viego.com',
            'password': 'seller123',
            'full_name': 'Công ty Du lịch Việt',
            'role': 'seller',
            'bio': 'Nhà cung cấp tour du lịch chất lượng cao',
            'points': 300,
            'level': 4,
            'badges': '["Verified Seller", "Tour Provider"]',
            'location': 'Đà Nẵng, Việt Nam',
            'website': 'https://tourdulichviet.com',
            'social_links': '{"website": "tourdulichviet.com", "hotline": "1900-123-456"}'
        },
        {
            'username': 'demo_user',
            'email': 'demo@viego.com',
            'password': 'demo123',
            'full_name': 'Người dùng Demo',
            'role': 'user',
            'bio': 'Tài khoản demo cho test',
            'points': 50,
            'level': 1,
            'badges': '["New Member"]',
            'location': 'Việt Nam',
            'website': '',
            'social_links': '{}'
        },
        {
            'username': 'content_writer',
            'email': 'writer@viego.com',
            'password': 'writer123',
            'full_name': 'Lê Content Writer',
            'role': 'user',
            'bio': 'Nhà văn chuyên viết nội dung du lịch - văn hóa',
            'points': 420,
            'level': 4,
            'badges': '["Content Creator", "Cultural Expert", "Popular Writer"]',
            'location': 'Huế, Việt Nam',
            'website': 'https://culturewrite.vn',
            'social_links': '{"medium": "@culturewriter", "linkedin": "le-content-writer"}'
        },
        {
            'username': 'backpacker_vn',
            'email': 'backpacker@viego.com',
            'password': 'backpack123',
            'full_name': 'Phạm Backpacker',
            'role': 'user',
            'bio': 'Backpacker chuyên du lịch bụi khắp Việt Nam',
            'points': 150,
            'level': 2,
            'badges': '["Adventurer", "Budget Travel Expert"]',
            'location': 'Đà Lạt, Việt Nam',
            'website': '',
            'social_links': '{"instagram": "@backpackervn", "youtube": "BackpackerVietnam"}'
        }
    ]
    
    connection = get_db_connection()
    
    try:
        with connection.cursor() as cursor:
            # Xóa tài khoản cũ (trừ admin gốc nếu có)
            cursor.execute("DELETE FROM users WHERE username != 'admin_original'")
            
            for account in accounts:
                # Hash password
                password_hash = hash_password(account['password'])
                
                # Chèn tài khoản
                cursor.execute("""
                    INSERT INTO users (
                        username, email, password_hash, full_name, role, bio,
                        points, level, badges, location, website, social_links,
                        email_verified, is_active, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    account['username'],
                    account['email'], 
                    password_hash,
                    account['full_name'],
                    account['role'],
                    account['bio'],
                    account['points'],
                    account['level'],
                    account['badges'],
                    account['location'],
                    account['website'],
                    account['social_links'],
                    True,  # email_verified
                    True,  # is_active
                    datetime.now(),
                    datetime.now()
                ))
                
                print(f"✅ Tạo tài khoản: {account['username']} ({account['role']}) - {account['full_name']}")
        
        connection.commit()
        print(f"\n🎉 Đã tạo thành công {len(accounts)} tài khoản!")
        
    except Exception as e:
        print(f"❌ Lỗi tạo tài khoản: {e}")
        connection.rollback()
    finally:
        connection.close()

def display_accounts_info():
    """Hiển thị thông tin tài khoản đã tạo"""
    connection = get_db_connection()
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT username, email, full_name, role, points, level, location
                FROM users 
                ORDER BY 
                    CASE role 
                        WHEN 'admin' THEN 1 
                        WHEN 'moderator' THEN 2 
                        WHEN 'seller' THEN 3 
                        ELSE 4 
                    END,
                    points DESC
            """)
            
            users = cursor.fetchall()
            
            print("\n" + "="*80)
            print("📋 DANH SÁCH TÀI KHOẢN VIEGO BLOG")
            print("="*80)
            
            role_groups = {}
            for user in users:
                role = user['role'].upper()
                if role not in role_groups:
                    role_groups[role] = []
                role_groups[role].append(user)
            
            role_icons = {
                'ADMIN': '👑',
                'MODERATOR': '🛡️', 
                'SELLER': '🏪',
                'USER': '👤'
            }
            
            for role, users_list in role_groups.items():
                icon = role_icons.get(role, '👤')
                print(f"\n{icon} {role} ({len(users_list)} tài khoản):")
                print("-" * 50)
                
                for user in users_list:
                    print(f"  • {user['username']:15} | {user['full_name']:25} | {user['location']:20}")
                    print(f"    Email: {user['email']:30} | Points: {user['points']:4} | Level: {user['level']}")
                    print()
    
    except Exception as e:
        print(f"❌ Lỗi hiển thị tài khoản: {e}")
    finally:
        connection.close()

def main():
    print("🚀 VieGo Blog - Tạo tài khoản cho các Role")
    print("=" * 50)
    
    # Tạo tài khoản
    create_role_accounts()
    
    # Hiển thị thông tin
    display_accounts_info()
    
    print("\n🔑 THÔNG TIN ĐĂNG NHẬP:")
    print("=" * 50)
    
    login_info = [
        ("👑 ADMIN", "admin", "admin123", "Quản trị viên hệ thống"),
        ("🛡️ MODERATOR", "moderator", "mod123", "Điều hành viên"), 
        ("✍️ BLOGGER", "blogger_hanoi", "blogger123", "Travel blogger"),
        ("🍜 FOODIE", "foodie_saigon", "foodie123", "Food blogger"),
        ("🏪 SELLER", "tour_seller", "seller123", "Nhà cung cấp tour"),
        ("📝 WRITER", "content_writer", "writer123", "Content writer"),
        ("🎒 BACKPACKER", "backpacker_vn", "backpack123", "Backpacker"),
        ("👤 DEMO", "demo_user", "demo123", "Tài khoản demo")
    ]
    
    for role, username, password, description in login_info:
        print(f"{role:12} | {username:15} | {password:12} | {description}")
    
    print("\n🌐 Test URL:")
    print(f"   Frontend: http://localhost:3000/login/test-api")
    print(f"   API Test: http://localhost:3000/api-test") 
    print(f"   Backend:  http://localhost:5000/api/health")

if __name__ == "__main__":
    main()