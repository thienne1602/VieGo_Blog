#!/usr/bin/env python3
"""
Script tạo tài khoản qua API Backend VieGo Blog
"""

import requests
import json
import time

API_BASE = "http://localhost:5000/api"

def test_api_connection():
    """Test kết nối API"""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Server: {data.get('status', 'Unknown')}")
            return True
    except Exception as e:
        print(f"❌ API Server không kết nối được: {e}")
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
                print(f"✅ {username}: Đăng nhập thành công!")
                print(f"   - Tên: {user.get('full_name', 'N/A')}")
                print(f"   - Role: {user.get('role', 'N/A')}")
                print(f"   - Points: {user.get('points', 0)}")
                print(f"   - Level: {user.get('level', 1)}")
                return True
            else:
                print(f"❌ {username}: {result.get('error', 'Lỗi không xác định')}")
        else:
            print(f"❌ {username}: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ {username}: Lỗi kết nối - {e}")
    
    return False

def main():
    print("🔑 VieGo Blog - Test Tài Khoản Demo")
    print("=" * 60)
    
    # Test API connection
    if not test_api_connection():
        print("\n💡 Hướng dẫn:")
        print("1. Đảm bảo Backend server đang chạy: py backend/server.py")
        print("2. Đảm bảo database đã được tạo")
        return
    
    print(f"\n🌐 Test Database: {API_BASE}/test/database")
    try:
        response = requests.get(f"{API_BASE}/test/database", timeout=10)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                stats = result.get('data', {}).get('stats', {})
                print(f"✅ Database kết nối thành công!")
                print(f"   - Posts: {stats.get('total_posts', 0)}")
                print(f"   - Categories: {stats.get('total_categories', 0)}")
                print(f"   - Locations: {stats.get('total_locations', 0)}")
            else:
                print(f"❌ Database lỗi: {result.get('error')}")
        else:
            print(f"❌ Database HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Database lỗi: {e}")
    
    # Test login với các tài khoản demo
    print("\n🔐 Test Đăng Nhập Các Tài Khoản Demo:")
    print("-" * 60)
    
    demo_accounts = [
        ("admin", "admin123", "👑 ADMIN"),
        ("demo_user", "demo123", "👤 USER"),
        ("moderator", "mod123", "🛡️ MODERATOR"),
        ("blogger_hanoi", "blogger123", "✍️ BLOGGER"),
        ("foodie_saigon", "foodie123", "🍜 FOODIE"),
        ("tour_seller", "seller123", "🏪 SELLER"),
        ("content_writer", "writer123", "📝 WRITER"),
        ("backpacker_vn", "backpack123", "🎒 BACKPACKER")
    ]
    
    successful_logins = 0
    
    for username, password, role_icon in demo_accounts:
        print(f"\n{role_icon} Testing {username}...")
        if test_login(username, password):
            successful_logins += 1
        time.sleep(0.5)  # Tránh spam requests
    
    print(f"\n📊 Kết quả: {successful_logins}/{len(demo_accounts)} tài khoản hoạt động")
    
    if successful_logins > 0:
        print(f"\n🎉 Có {successful_logins} tài khoản sẵn sàng sử dụng!")
        print("\n🌐 Test trực tiếp tại:")
        print("   - Login Page: http://localhost:3000/login/test-api")
        print("   - API Test:   http://localhost:3000/api-test")
        print("   - Homepage:   http://localhost:3000")
        
        print(f"\n💡 Thông tin đăng nhập:")
        print("-" * 40)
        for username, password, role_icon in demo_accounts[:4]:  # Show top 4
            print(f"{role_icon:12} | {username:15} | {password}")
    
    else:
        print("\n❌ Không có tài khoản nào hoạt động.")
        print("💡 Cần chạy script tạo database trước:")
        print("   py database/init_database.py")

if __name__ == "__main__":
    main()