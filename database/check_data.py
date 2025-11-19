"""
Kiểm tra dữ liệu trong database
Check if seller và tours đã được tạo
"""

import pymysql
import sys

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def get_connection():
    """Kết nối database"""
    try:
        conn = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            database='viego_blog',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        return conn
    except Exception as e:
        print(f"❌ Lỗi kết nối (password=''): {e}")
        try:
            conn = pymysql.connect(
                host='localhost',
                user='root',
                password='root',
                database='viego_blog',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            return conn
        except Exception as e2:
            print(f"❌ Lỗi kết nối (password='root'): {e2}")
            return None

def main():
    print("="*70)
    print("🔍 Kiểm tra dữ liệu trong database")
    print("="*70)
    
    conn = get_connection()
    if not conn:
        print("\n❌ Không thể kết nối database!")
        return
    
    cursor = conn.cursor()
    
    try:
        # Check seller
        print("\n1️⃣ Kiểm tra Seller:")
        cursor.execute("SELECT id, username, email, full_name, role FROM users WHERE role = 'seller'")
        sellers = cursor.fetchall()
        
        if sellers:
            print(f"   ✅ Tìm thấy {len(sellers)} seller(s):")
            for seller in sellers:
                print(f"      - ID: {seller['id']}, Username: {seller['username']}")
                print(f"        Email: {seller['email']}, Name: {seller['full_name']}")
        else:
            print("   ❌ Không tìm thấy seller nào!")
        
        # Check tours
        print("\n2️⃣ Kiểm tra Tours:")
        cursor.execute("SELECT COUNT(*) as count FROM tours")
        tour_count = cursor.fetchone()['count']
        print(f"   📊 Tổng số tours: {tour_count}")
        
        if tour_count > 0:
            cursor.execute("""
                SELECT id, title, status, category, seller_id, price_per_person 
                FROM tours 
                ORDER BY id 
                LIMIT 10
            """)
            tours = cursor.fetchall()
            print(f"   ✅ Tìm thấy {len(tours)} tour(s) đầu tiên:")
            for tour in tours:
                print(f"      - ID: {tour['id']}, Title: {tour['title'][:50]}...")
                print(f"        Status: {tour['status']}, Category: {tour['category']}")
                print(f"        Seller ID: {tour['seller_id']}, Price: {tour['price_per_person']:,.0f} VND")
            
            # Check published tours
            cursor.execute("SELECT COUNT(*) as count FROM tours WHERE status = 'published'")
            published_count = cursor.fetchone()['count']
            print(f"\n   📢 Tours đã xuất bản (published): {published_count}")
        else:
            print("   ❌ Không có tour nào trong database!")
        
        # Check locations
        print("\n3️⃣ Kiểm tra Locations:")
        cursor.execute("SELECT COUNT(*) as count FROM locations")
        loc_count = cursor.fetchone()['count']
        print(f"   📍 Tổng số locations: {loc_count}")
        
        if loc_count > 0:
            cursor.execute("SELECT id, name, city, category FROM locations LIMIT 5")
            locations = cursor.fetchall()
            print(f"   ✅ Một số locations:")
            for loc in locations:
                print(f"      - ID: {loc['id']}, Name: {loc['name']}, City: {loc['city']}")
        else:
            print("   ❌ Không có location nào trong database!")
            
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()
        print("\n✅ Đã đóng kết nối")

if __name__ == '__main__':
    main()

