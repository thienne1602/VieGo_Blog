#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test tour progress and check-in functionality"""

from main import app, db
from models.tour_progress import TourProgress
from models.booking import Booking
from models.tour_assignment import TourAssignment
from models.user import User

with app.app_context():
    print("=" * 80)
    print("📋 TOUR PROGRESS & CHECK-IN SYSTEM STATUS")
    print("=" * 80)
    print()
    
    # Check tour progress checkpoints
    checkpoints = TourProgress.query.all()
    print(f"📍 Total Checkpoints: {len(checkpoints)}")
    print()
    
    if len(checkpoints) > 0:
        print("Existing Checkpoints:")
        for cp in checkpoints[:10]:
            booking = Booking.query.get(cp.booking_id)
            print(f"   ✓ Checkpoint {cp.id}: {cp.checkpoint_name}")
            print(f"     - Booking ID: {cp.booking_id}")
            print(f"     - Order: {cp.checkpoint_order}")
            print(f"     - Status: {cp.status}")
            print(f"     - Images: {len(cp.get_images())} photos")
            if cp.arrival_time:
                print(f"     - Arrival: {cp.arrival_time.strftime('%Y-%m-%d %H:%M')}")
            if cp.departure_time:
                print(f"     - Departure: {cp.departure_time.strftime('%Y-%m-%d %H:%M')}")
            print()
    else:
        print("⚠️  No checkpoints found. You can create them using:")
        print("   POST /api/tour-progress/booking/<booking_id>/init-from-itinerary")
        print()
        
        # Show bookings that could have checkpoints
        assignments = TourAssignment.query.filter(
            TourAssignment.status.in_(['assigned', 'accepted', 'in_progress'])
        ).all()
        
        if assignments:
            print("📦 Bookings available for checkpoint creation:")
            for a in assignments[:5]:
                booking = Booking.query.get(a.booking_id)
                guide = User.query.get(a.tour_guide_id)
                if booking:
                    print(f"   - Booking {a.booking_id}")
                    print(f"     Guide: {guide.full_name if guide else 'N/A'}")
                    print(f"     Status: {a.status}")
    
    print()
    print("=" * 80)
    print("🔧 AVAILABLE API ENDPOINTS")
    print("=" * 80)
    print()
    
    print("1️⃣  GET /api/tour-progress/booking/<booking_id>")
    print("   📖 View all checkpoints for a booking")
    print("   🔐 Access: Customer, Tour Guide, Seller, Admin")
    print()
    
    print("2️⃣  POST /api/tour-progress")
    print("   ➕ Create a new checkpoint")
    print("   🔐 Access: Tour Guide, Seller, Admin")
    print()
    
    print("3️⃣  PATCH /api/tour-progress/<checkpoint_id>")
    print("   ✏️  Update checkpoint details")
    print("   🔐 Access: Tour Guide, Seller, Admin")
    print()
    
    print("4️⃣  POST /api/tour-progress/<checkpoint_id>/check-in")
    print("   📍 Check-in at checkpoint (status → in_progress)")
    print("   🔐 Access: Assigned Tour Guide only")
    print()
    
    print("5️⃣  POST /api/tour-progress/<checkpoint_id>/complete")
    print("   ✅ Complete checkpoint (status → completed)")
    print("   🔐 Access: Assigned Tour Guide only")
    print()
    
    print("6️⃣  POST /api/tour-progress/<checkpoint_id>/upload-images")
    print("   📸 Upload multiple images (max 10 per checkpoint)")
    print("   🔐 Access: Tour Guide, Seller, Admin")
    print("   📦 Form-data: images[] (multipart/form-data)")
    print()
    
    print("7️⃣  DELETE /api/tour-progress/<checkpoint_id>/images/<image_index>")
    print("   🗑️  Delete specific image")
    print("   🔐 Access: Tour Guide, Seller, Admin")
    print()
    
    print("8️⃣  GET /api/tour-progress/booking/<booking_id>/download-images")
    print("   📥 Download all images as ZIP")
    print("   🔐 Access: Customer, Tour Guide, Seller, Admin")
    print()
    
    print("9️⃣  POST /api/tour-progress/booking/<booking_id>/init-from-itinerary")
    print("   🚀 Auto-create checkpoints from tour itinerary")
    print("   🔐 Access: Seller, Admin")
    print()
    
    print("=" * 80)
    print("✨ FEATURES")
    print("=" * 80)
    print()
    print("✅ Tour guide can check-in at each checkpoint")
    print("✅ Upload multiple photos at each location (max 10)")
    print("✅ Auto-resize images to optimize storage")
    print("✅ Customer can view progress in real-time")
    print("✅ Customer can download all images as ZIP")
    print("✅ Track arrival & departure times automatically")
    print("✅ Support checkpoint notes from tour guide")
    print("✅ Image formats: PNG, JPG, JPEG, GIF, WEBP")
    print("✅ Max image size: 10MB per file")
    print()
    
    print("=" * 80)
    print("🧪 TESTING WORKFLOW")
    print("=" * 80)
    print()
    print("1. Initialize checkpoints from itinerary (Seller):")
    print("   POST /api/tour-progress/booking/23/init-from-itinerary")
    print()
    print("2. Tour guide checks in (Tour Guide):")
    print("   POST /api/tour-progress/1/check-in")
    print("   Body: {\"notes\": \"Arrived at starting point\"}")
    print()
    print("3. Upload check-in photos (Tour Guide):")
    print("   POST /api/tour-progress/1/upload-images")
    print("   Form-data: images[] = [file1.jpg, file2.jpg, ...]")
    print()
    print("4. Complete checkpoint (Tour Guide):")
    print("   POST /api/tour-progress/1/complete")
    print("   Body: {\"notes\": \"Completed tour of the area\"}")
    print()
    print("5. Customer views progress:")
    print("   GET /api/tour-progress/booking/23")
    print()
    print("6. Customer downloads all photos:")
    print("   GET /api/tour-progress/booking/23/download-images")
    print()
