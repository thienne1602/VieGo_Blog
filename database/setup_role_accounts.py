#!/usr/bin/env python3
"""
Script tạo tài khoản cho từng role trong VieGo Blog
Sử dụng API để tạo tài khoản thông qua endpoint register
"""

import requests
import json
import time
from datetime import datetime

API_BASE = "http://localhost:5000/api"

def test_api_connection():
    """Test kết nối API"""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Server: {data.get('status', 'Online')}")
            return True
    except Exception as e:
        print(f"❌ API Server không kết nối được: {e}")
        return False

def create_account(account_data):
    """Tạo tài khoản mới qua API"""
    try:
        response = requests.post(f"{API_BASE}/auth/register", 
                               json=account_data, 
                               timeout=10,
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 201:
            result = response.json()
            if result.get('success'):
                user = result.get('user', {})
                print(f"✅ Tạo thành công: {account_data['username']}")
                print(f"   - ID: {user.get('id')}")
                print(f"   - Tên: {user.get('full_name')}")
                print(f"   - Role: {user.get('role')}")
                print(f"   - Email: {user.get('email')}")
                return True
            else:
                error_msg = result.get('error', 'Lỗi không xác định')
                print(f"❌ Lỗi tạo {account_data['username']}: {error_msg}")
        else:
            print(f"❌ HTTP {response.status_code} cho {account_data['username']}")
            try:
                error_data = response.json()
                print(f"   - Chi tiết: {error_data}")
            except:
                print(f"   - Response: {response.text}")
    except Exception as e:
        print(f"❌ Lỗi kết nối khi tạo {account_data['username']}: {e}")
    
    return False

def test_login(username, password):
    """Test đăng nhập"""
    try:
        data = {
            "username": username,
            "password": password
        }
        
        response = requests.post(f"{API_BASE}/auth/login", 
                               json=data, 
                               timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                user = result.get('user', {})
                token = result.get('access_token')
                print(f"✅ Đăng nhập thành công: {username}")
                print(f"   - Role: {user.get('role')}")
                print(f"   - Level: {user.get('level', 1)}")
                print(f"   - Token: {token[:20]}...")
                return True
        
        print(f"❌ Đăng nhập thất bại: {username}")
        return False
    except Exception as e:
        print(f"❌ Lỗi đăng nhập {username}: {e}")
        return False

def main():
    print("🎯 VieGo Blog - Tạo Tài Khoản Role Demo")
    print("=" * 60)
    print(f"⏰ Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test API connection
    if not test_api_connection():
        print("\n💡 Hướng dẫn:")
        print("1. Khởi động Backend server: py backend/server.py")
        print("2. Đảm bảo database đã được tạo")
        return
    
    print("\n📋 Tạo các tài khoản role demo...")
    print("-" * 60)
    
    # Định nghĩa các tài khoản cần tạo
    demo_accounts = [
        # ADMIN - Quản trị viên
        {
            "username": "admin",
            "password": "admin123",
            "email": "admin@viego.com",
            "full_name": "Administrator VieGo",
            "role": "admin",
            "bio": "Quản trị viên hệ thống VieGo Blog",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
        },
        
        # MODERATOR - Kiểm duyệt viên
        {
            "username": "moderator",
            "password": "mod123",
            "email": "moderator@viego.com", 
            "full_name": "Nguyễn Văn Moderator",
            "role": "moderator",
            "bio": "Kiểm duyệt viên nội dung VieGo",
            "avatar_url": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
        },
        
        # SELLER - Người bán tour
        {
            "username": "tour_seller",
            "password": "seller123",
            "email": "seller@viego.com",
            "full_name": "Phạm Thị Tour Guide", 
            "role": "seller",
            "bio": "Chuyên gia tư vấn và bán tour du lịch Việt Nam",
            "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
        },
        
        # USER - Blogger Hà Nội
        {
            "username": "blogger_hanoi",
            "password": "blogger123",
            "email": "blogger@viego.com",
            "full_name": "Trần Minh Blogger",
            "role": "user",
            "bio": "Travel blogger chuyên về miền Bắc và ẩm thực Hà Nội",
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
        },
        
        # USER - Foodie Sài Gòn
        {
            "username": "foodie_saigon", 
            "password": "foodie123",
            "email": "foodie@viego.com",
            "full_name": "Lê Thị Foodie",
            "role": "user",
            "bio": "Food blogger chuyên khám phá ẩm thực Sài Gòn và miền Nam",
            "avatar_url": "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face"
        },
        
        # USER - Content Writer
        {
            "username": "content_writer",
            "password": "writer123", 
            "email": "writer@viego.com",
            "full_name": "Hoàng Văn Writer",
            "role": "user",
            "bio": "Content writer chuyên viết bài về văn hóa và du lịch Việt Nam",
            "avatar_url": "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face"
        },
        
        # USER - Backpacker
        {
            "username": "backpacker_vn",
            "password": "backpack123",
            "email": "backpacker@viego.com", 
            "full_name": "Ngô Thành Backpacker",
            "role": "user",
            "bio": "Backpacker chuyên du lịch bụi khắp Việt Nam với budget tiết kiệm",
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
        },
        
        # USER - Demo User
        {
            "username": "demo_user",
            "password": "demo123",
            "email": "demo@viego.com",
            "full_name": "Người Dùng Demo",
            "role": "user", 
            "bio": "Tài khoản demo để test các chức năng cơ bản",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"
        }
    ]
    
    successful_creates = 0
    
    for account in demo_accounts:
        role_emoji = {
            'admin': '👑',
            'moderator': '🛡️', 
            'seller': '🏪',
            'user': '👤'
        }.get(account['role'], '👤')
        
        print(f"\n{role_emoji} Tạo tài khoản {account['role'].upper()}: {account['username']}")
        
        if create_account(account):
            successful_creates += 1
        
        time.sleep(0.5)  # Tránh spam requests
    
    print(f"\n📊 Kết quả tạo tài khoản: {successful_creates}/{len(demo_accounts)} thành công")
    
    if successful_creates > 0:
        print(f"\n🔐 Test đăng nhập các tài khoản đã tạo...")
        print("-" * 60)
        
        successful_logins = 0
        for account in demo_accounts:
            if test_login(account['username'], account['password']):
                successful_logins += 1
            time.sleep(0.3)
        
        print(f"\n📈 Kết quả đăng nhập: {successful_logins}/{successful_creates} tài khoản hoạt động")
        
        if successful_logins > 0:
            print(f"\n🎉 Hệ thống tài khoản VieGo sẵn sàng!")
            print("\n💼 Thông tin đăng nhập:")
            print("-" * 50)
            print(f"{'ROLE':12} | {'USERNAME':15} | {'PASSWORD':12} | {'MÔ TẢ'}")
            print("-" * 50)
            
            for account in demo_accounts[:8]:
                role_emoji = {
                    'admin': '👑 ADMIN',
                    'moderator': '🛡️ MOD', 
                    'seller': '🏪 SELLER',
                    'user': '👤 USER'
                }.get(account['role'], '👤 USER')
                
                print(f"{role_emoji:12} | {account['username']:15} | {account['password']:12} | {account['bio'][:30]}...")
            
            print(f"\n🌐 Test ngay tại:")
            print("   - Login: http://localhost:3000/auth/login")
            print("   - Admin: http://localhost:3000/admin") 
            print("   - Home:  http://localhost:3000")
    
    else:
        print("\n❌ Không tạo được tài khoản nào.")
        print("💡 Kiểm tra:")
        print("   - Backend server có đang chạy?")
        print("   - Database có kết nối được?")
        print("   - Endpoint /api/auth/register có tồn tại?")

if __name__ == "__main__":
    main()