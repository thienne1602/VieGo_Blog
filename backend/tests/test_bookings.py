import os
import tempfile
import pytest
from backend.main import app, db
from models.user import User
from models.tour import Tour
from models.booking import Booking

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def create_user(username='seller', role='seller'):
    u = User(username=username, full_name=username, role=role)
    u.set_password('password123')
    db.session.add(u)
    db.session.commit()
    return u


def test_booking_flow(client):
    with app.app_context():
        # Create seller and buyer
        seller = create_user('seller1', role='seller')
        buyer = create_user('buyer1', role='user')

        # Create tour
        tour = Tour(title='Test Tour', description='x', seller_id=seller.id)
        tour.duration_days = 1
        tour.starting_location = 'HN'
        tour.price_per_person = 100
        tour.max_participants = 5
        tour.min_participants = 1
        tour.status = 'published'
        db.session.add(tour)
        db.session.commit()

        # Buyer posts booking (simulate by directly creating Booking)
        booking = Booking(tour_id=tour.id, user_id=buyer.id, date='2025-10-22', participants=2, total_price=200, currency='VND', status='pending')
        db.session.add(booking)
        db.session.commit()

        assert booking.id is not None

        # Seller fetches bookings for their tours
        bookings = Booking.query.join(Tour).filter(Tour.seller_id == seller.id).all()
        assert len(bookings) == 1

        # Seller confirms booking
        booking.status = 'confirmed'
        db.session.commit()

        b = Booking.query.get(booking.id)
        assert b.status == 'confirmed'
