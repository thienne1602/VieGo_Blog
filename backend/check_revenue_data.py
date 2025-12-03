from main import app
from models import db
from models.booking import Booking
from sqlalchemy import func

with app.app_context():
    print("Checking for revenue-generating bookings...")
    
    # Check for confirmed and paid bookings
    revenue_bookings = Booking.query.filter(
        Booking.status == 'confirmed',
        Booking.payment_status == 'paid'
    ).all()
    
    print(f"Found {len(revenue_bookings)} confirmed and paid bookings.")
    
    total_revenue = 0
    for b in revenue_bookings:
        print(f"Booking ID: {b.id}, Total Price: {b.total_price}, Created At: {b.created_at}")
        total_revenue += b.total_price
        
    print(f"Total Revenue (Base): {total_revenue}")
    print(f"Admin Revenue (5%): {total_revenue * 0.05}")

    # Check if there are any bookings at all
    all_bookings_count = Booking.query.count()
    print(f"Total bookings in DB: {all_bookings_count}")
    
    if all_bookings_count > 0 and len(revenue_bookings) == 0:
        print("There are bookings, but none are 'confirmed' AND 'paid'.")
        sample = Booking.query.first()
        print(f"Sample Booking ID: {sample.id}, Status: {sample.status}, Payment Status: {sample.payment_status}")

