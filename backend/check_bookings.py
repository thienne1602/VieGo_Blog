from main import app
from models import db
from models.user import User
from models.booking import Booking
from models.tour_assignment import TourAssignment

with app.app_context():
    # Find user ngocthien
    user = User.query.filter_by(username='ngocthien').first()
    if user:
        print(f"\n✅ User found: {user.username} (ID: {user.id}, Role: {user.role})")
        
        # Find bookings for this user
        bookings = Booking.query.filter_by(user_id=user.id).all()
        print(f"\n📦 Bookings where user_id = {user.id}:")
        if bookings:
            for b in bookings:
                assignment = TourAssignment.query.filter_by(booking_id=b.id).first()
                print(f"  - Booking ID: {b.id}")
                print(f"    Status: {b.status}")
                print(f"    Tour ID: {b.tour_id}")
                print(f"    Assignment: {'Yes (ID: ' + str(assignment.id) + ')' if assignment else 'No'}")
        else:
            print("  ❌ No bookings found for this user")
        
        # Check all bookings in database
        all_bookings = Booking.query.all()
        print(f"\n📊 Total bookings in database: {len(all_bookings)}")
        print("\nAll bookings:")
        for b in all_bookings[:10]:
            u = User.query.get(b.user_id)
            assignment = TourAssignment.query.filter_by(booking_id=b.id).first()
            print(f"  - Booking {b.id}: user_id={b.user_id} ({u.username if u else 'N/A'}), status={b.status}, has_assignment={assignment is not None}")
    else:
        print("❌ User 'ngocthien' not found")
