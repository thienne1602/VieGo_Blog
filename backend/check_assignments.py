#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Check tour assignments in the database"""

from main import app, db
from models.tour_assignment import TourAssignment
from models.booking import Booking
from models.user import User
from models.tour import Tour

with app.app_context():
    # Check tour assignments
    assignments = TourAssignment.query.all()
    print(f'📊 Total tour assignments: {len(assignments)}')
    print()
    
    if len(assignments) == 0:
        print('⚠️  No tour assignments found!')
        print()
        print('Checking bookings that need assignment:')
        bookings = Booking.query.filter(Booking.status.in_(['confirmed', 'pending'])).all()
        print(f'   Found {len(bookings)} bookings that could be assigned')
        for b in bookings[:5]:
            tour = Tour.query.get(b.tour_id)
            print(f'   - Booking {b.id}: Tour "{tour.title if tour else "Unknown"}" (ID: {b.tour_id}), Status: {b.status}')
    else:
        print('Tour Assignments:')
        for a in assignments[:10]:
            booking = Booking.query.get(a.booking_id)
            guide = User.query.get(a.tour_guide_id)
            tour = Tour.query.get(booking.tour_id) if booking else None
            
            print(f'   ✅ Assignment {a.id}:')
            print(f'      - Booking ID: {a.booking_id}')
            print(f'      - Tour: {tour.title if tour else "Unknown"} (ID: {booking.tour_id if booking else "N/A"})')
            print(f'      - Guide: {guide.full_name if guide else "Unknown"} (ID: {a.tour_guide_id})')
            print(f'      - Status: {a.status}')
            print()
    
    # Check tour guides
    print()
    print('Tour Guides:')
    guides = User.query.filter_by(role='tour_guide').all()
    print(f'   Total tour guides: {len(guides)}')
    for g in guides:
        print(f'   - {g.full_name} (ID: {g.id}, username: {g.username})')
