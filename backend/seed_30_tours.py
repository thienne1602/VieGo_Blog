
import os
import sys
from datetime import datetime, timedelta
import random
import json

# Add backend to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv()

# Initialize Flask app and database
from main import app
import models
# db is already initialized in main.py when importing app
db = models.db

from models.user import User
from models.tour import Tour
from utils.tour_content_generator import build_tour_content

def generate_available_dates():
    """Generate available dates for next 3 months"""
    today = datetime.now()
    dates = []
    for i in range(1, 91, 3):  # Every 3 days
        date = today + timedelta(days=i)
        dates.append(date.strftime('%Y-%m-%d'))
    return dates

def seed_30_tours():
    print("\n" + "="*70)
    print("🎫 Seeding 30 New Tours...")
    print("="*70)
    
    with app.app_context():
        # Find any seller
        seller = User.query.filter_by(role='seller').first()
        if not seller:
            seller = User.query.filter_by(role='admin').first()
            
        if not seller:
            print("❌ No seller found. Please create a seller first.")
            return

        print(f"✅ Assigning tours to seller: {seller.username} (ID: {seller.id})")
        
        vietnam_locations = [
            ("Hà Giang", "adventure", "https://images.unsplash.com/photo-1626015628767-7f6c6a9c0c7d?q=80&w=1000&auto=format&fit=crop"),
            ("Cao Bằng", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Sapa", "cultural", "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1000&auto=format&fit=crop"),
            ("Ninh Bình", "nature", "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1000&auto=format&fit=crop"),
            ("Hạ Long", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Hà Nội", "urban", "https://images.unsplash.com/photo-1555921015-5532091f6026?q=80&w=1000&auto=format&fit=crop"),
            ("Huế", "cultural", "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1000&auto=format&fit=crop"),
            ("Đà Nẵng", "urban", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Hội An", "cultural", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Nha Trang", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Đà Lạt", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Mũi Né", "adventure", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("TP. Hồ Chí Minh", "urban", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Cần Thơ", "cultural", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Phú Quốc", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Côn Đảo", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Buôn Ma Thuột", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Quy Nhơn", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Phú Yên", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Quảng Bình", "adventure", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Mộc Châu", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Mai Châu", "cultural", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Tam Đảo", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Ba Vì", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Cát Bà", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Lý Sơn", "adventure", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Tuy Hòa", "nature", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Vũng Tàu", "urban", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("Tây Ninh", "spiritual", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
            ("An Giang", "cultural", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1000&auto=format&fit=crop"),
        ]

        tour_templates = [
            "Khám phá vẻ đẹp {loc}",
            "Hành trình {loc} 3 ngày 2 đêm",
            "Tour {loc} trọn gói giá rẻ",
            "Trải nghiệm văn hóa {loc}",
            "Du lịch {loc} - Thiên đường nghỉ dưỡng",
            "Phượt {loc} cùng hướng dẫn viên bản địa"
        ]

        for i, (loc, cat, img) in enumerate(vietnam_locations):
            title = random.choice(tour_templates).format(loc=loc)
            price = random.randint(15, 150) * 100000
            duration = random.randint(1, 5)
            
            tour = Tour(
                title=title,
                description=f"Chuyến đi tuyệt vời đến {loc}. Khám phá những địa điểm nổi tiếng, thưởng thức ẩm thực đặc sắc và trải nghiệm văn hóa độc đáo của vùng đất này. Tour bao gồm xe đưa đón, khách sạn và các bữa ăn chính.",
                seller_id=seller.id
            )
            
            tour.duration_days = duration
            tour.starting_location = loc
            tour.price_per_person = float(price)
            tour.category = cat
            tour.status = 'active'
            tour.featured_image = img
            tour.difficulty_level = random.choice(['easy', 'moderate', 'hard'])
            tour.max_participants = random.randint(10, 30)
            tour.min_participants = 2
            tour.discount_percentage = random.choice([0, 0, 0, 5, 10, 15, 20, 25, 30])
            tour.rating = round(random.uniform(3.5, 5.0), 1)
            tour.reviews_count = random.randint(0, 50)
            tour.views_count = random.randint(100, 5000)
            
            content = build_tour_content(
                location_name=loc,
                duration_days=duration,
                category=cat,
                starting_point=loc,
            )

            tour.description = content['description']
            tour.set_itinerary(content['itinerary'])
            tour.set_inclusions(content['inclusions'])
            tour.set_exclusions(content['exclusions'])
            tour.cancellation_policy = content['policy']
            tour.set_available_dates(generate_available_dates())
            
            db.session.add(tour)
            print(f"Created tour: {title}")
            
        db.session.commit()
        print("✅ Successfully created 30 new tours!")

if __name__ == '__main__':
    seed_30_tours()
