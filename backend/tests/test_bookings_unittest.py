import os
import unittest
import sys
import os

# Ensure local backend directory is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app, db
from models.user import User
from models.tour import Tour
from models.booking import Booking

class BookingFlowTest(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def create_user(self, username='seller', role='seller'):
        u = User(username=username, full_name=username, role=role)
        u.set_password('password123')
        db.session.add(u)
        db.session.commit()
        return u

    def test_booking_flow(self):
        with app.app_context():
            seller = self.create_user('seller1', role='seller')
            buyer = self.create_user('buyer1', role='user')

            tour = Tour(title='Test Tour', description='x', seller_id=seller.id)
            tour.duration_days = 1
            tour.starting_location = 'HN'
            tour.price_per_person = 100
            tour.max_participants = 5
            tour.min_participants = 1
            tour.status = 'published'
            db.session.add(tour)
            db.session.commit()

            booking = Booking(tour_id=tour.id, user_id=buyer.id, date='2025-10-22', participants=2, total_price=200, currency='VND', status='pending')
            db.session.add(booking)
            db.session.commit()

            self.assertIsNotNone(booking.id)

            bookings = Booking.query.join(Tour).filter(Tour.seller_id == seller.id).all()
            self.assertEqual(len(bookings), 1)

            booking.status = 'confirmed'
            db.session.commit()

            b = Booking.query.get(booking.id)
            self.assertEqual(b.status, 'confirmed')

if __name__ == '__main__':
    unittest.main()
