from main import app
from models import db
from models.booking import Booking
import random
from datetime import datetime, timedelta

with app.app_context():
    print("Seeding revenue data...")
    
    bookings = Booking.query.all()
    
    if not bookings:
        print("No bookings found to update.")
    else:
        # Update about 50% of bookings to be confirmed and paid
        count = 0
        for booking in bookings:
            # Randomly decide to make it a successful booking
            if random.choice([True, False]):
                booking.status = 'confirmed'
                booking.payment_status = 'paid'
                # Ensure total_price is set
                if not booking.total_price:
                    booking.total_price = random.randint(1000000, 5000000)
                
                # Spread dates over the last 30 days for the chart
                days_ago = random.randint(0, 30)
                booking.created_at = datetime.utcnow() - timedelta(days=days_ago)
                
                count += 1
                print(f"Updated Booking {booking.id}: Status=confirmed, Payment=paid, Price={booking.total_price}")
        
        db.session.commit()
        print(f"Successfully updated {count} bookings to generate revenue.")

