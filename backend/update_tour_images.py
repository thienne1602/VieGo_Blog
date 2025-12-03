
import os
import sys
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
db = models.db
from models.tour import Tour

# List of high-quality Vietnam travel images
VIETNAM_IMAGES = [
    "https://images.unsplash.com/photo-1528127269322-539801943592?w=800", # Ha Long Bay
    "https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=800", # Hoi An Lanterns
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", # Sapa Rice Fields
    "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800", # Golden Bridge
    "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800", # Hanoi Train Street
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", # Mui Ne Sand Dunes
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800", # Da Lat
    "https://images.unsplash.com/photo-1565060169194-196e927284b4?w=800", # Ninh Binh
    "https://images.unsplash.com/photo-1552493450-2c954569a5bb?w=800", # Mekong Delta
    "https://images.unsplash.com/photo-1599708153386-62e27c51b354?w=800", # Hue Imperial City
    "https://images.unsplash.com/photo-1558618047-f4b511aae74d?w=800", # Phu Quoc
    "https://images.unsplash.com/photo-1565118531796-7a30127b4171?w=800", # Da Nang Dragon Bridge
    "https://images.unsplash.com/photo-1540202404-a6f74cc11a04?w=800", # Son Doong Cave
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800", # Phong Nha
    "https://images.unsplash.com/photo-1578241561880-0a1d5db283cb?w=800", # Hoi An Street
    "https://images.unsplash.com/photo-1531737212413-667205e1cda7?w=800", # Ha Giang
    "https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=800", # Ban Gioc Waterfall
    "https://images.unsplash.com/photo-1555921015-5532091f6026?w=800", # Ho Chi Minh City
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800", # Landscape
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800", # Travel Vibe
]

def update_tour_images():
    with app.app_context():
        tours = Tour.query.all()
        print(f"Found {len(tours)} tours. Updating images...")
        
        count = 0
        for tour in tours:
            # Select 3-5 random images
            num_images = random.randint(3, 5)
            selected_images = random.sample(VIETNAM_IMAGES, num_images)
            
            # Update gallery_images
            tour.gallery_images = json.dumps(selected_images)
            count += 1
            
        try:
            db.session.commit()
            print(f"Successfully updated images for {count} tours!")
        except Exception as e:
            db.session.rollback()
            print(f"Error updating tours: {e}")

if __name__ == "__main__":
    update_tour_images()
