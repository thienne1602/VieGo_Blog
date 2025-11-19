"""
Script to assign all tours to a specific seller
Usage: python backend/assign_tours_to_seller.py <seller_username>
Example: python backend/assign_tours_to_seller.py tour_seller_vn
"""
import os
import sys

# Add backend to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional

# Initialize Flask app and database
from main import app
import models
db = models.init_db(app)

from models.user import User
from models.tour import Tour

def assign_tours_to_seller(seller_username):
    """Assign all tours to a specific seller"""
    print("\n" + "="*70)
    print("🔄 Assigning Tours to Seller...")
    print("="*70)
    
    with app.app_context():
        # Find seller by username
        seller = User.query.filter_by(username=seller_username).first()
        
        if not seller:
            print(f"❌ Error: Seller '{seller_username}' not found!")
            print("\nAvailable sellers:")
            sellers = User.query.filter_by(role='seller').all()
            for s in sellers:
                print(f"  - {s.username} (ID: {s.id})")
            return False
        
        if seller.role != 'seller' and seller.role != 'admin':
            print(f"⚠️  Warning: User '{seller_username}' has role '{seller.role}', not 'seller'")
            response = input("Continue anyway? (y/n): ")
            if response.lower() != 'y':
                return False
        
        print(f"✅ Found seller: {seller.username} (ID: {seller.id})")
        
        # Get all tours
        all_tours = Tour.query.all()
        print(f"\n📊 Total tours in database: {len(all_tours)}")
        
        # Count tours already assigned to this seller
        already_assigned = Tour.query.filter_by(seller_id=seller.id).count()
        print(f"   - Already assigned to {seller.username}: {already_assigned}")
        
        # Assign all tours to this seller
        updated_count = 0
        for tour in all_tours:
            if tour.seller_id != seller.id:
                old_seller = User.query.get(tour.seller_id)
                old_seller_name = old_seller.username if old_seller else f"ID:{tour.seller_id}"
                tour.seller_id = seller.id
                updated_count += 1
                print(f"  ✅ Assigned '{tour.title[:50]}...' to {seller.username} (was: {old_seller_name})")
        
        if updated_count > 0:
            db.session.commit()
            print(f"\n✅ Successfully assigned {updated_count} tours to {seller.username}")
        else:
            print(f"\n✅ All tours are already assigned to {seller.username}")
        
        # Final count
        final_count = Tour.query.filter_by(seller_id=seller.id).count()
        print(f"   - Total tours now assigned to {seller.username}: {final_count}\n")
        return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python assign_tours_to_seller.py <seller_username>")
        print("Example: python assign_tours_to_seller.py tour_seller_vn")
        sys.exit(1)
    
    seller_username = sys.argv[1]
    success = assign_tours_to_seller(seller_username)
    sys.exit(0 if success else 1)

