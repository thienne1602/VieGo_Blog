"""
Tour Itinerary Routes
Routes for managing tour itineraries and check-ins
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
import os
from models import db
from models.tour import Tour
from models.booking import Booking
from models.tour_itinerary import TourItineraryTemplate, TourItineraryDay, ItineraryCheckpoint
from models.booking_itinerary import BookingItineraryDay, CheckpointCheckin
from models.tour_assignment import TourAssignment
from utils.auth import token_required, seller_required, tour_guide_required

itinerary_bp = Blueprint('itinerary', __name__, url_prefix='/api/itinerary')

# Upload configuration
UPLOAD_FOLDER = 'uploads/checkpoint_photos'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# =====================================================
# SELLER/ADMIN ROUTES - Template Management
# =====================================================

@itinerary_bp.route('/templates', methods=['POST'])
@token_required
@seller_required
def create_itinerary_template(current_user):
    """Create a new itinerary template for a tour"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ['tour_id', 'template_name', 'total_days']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if tour exists and belongs to seller
        tour = Tour.query.get(data['tour_id'])
        if not tour:
            return jsonify({'error': 'Tour not found'}), 404
        
        if tour.seller_id != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Create template
        template = TourItineraryTemplate(
            tour_id=data['tour_id'],
            template_name=data['template_name'],
            total_days=data['total_days'],
            total_nights=data.get('total_nights', data['total_days'] - 1),
            description=data.get('description'),
            created_by=current_user.id
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'message': 'Template created successfully',
            'template': template.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@itinerary_bp.route('/templates/<int:template_id>/days', methods=['POST'])
@token_required
@seller_required
def add_itinerary_day(current_user, template_id):
    """Add a day to itinerary template"""
    try:
        data = request.get_json()
        
        template = TourItineraryTemplate.query.get(template_id)
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check authorization
        tour = Tour.query.get(template.tour_id)
        if tour.seller_id != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Create day
        day = TourItineraryDay(
            template_id=template_id,
            day_number=data['day_number'],
            day_title=data['day_title'],
            day_description=data.get('day_description'),
            breakfast=data.get('breakfast', False),
            lunch=data.get('lunch', False),
            dinner=data.get('dinner', False),
            accommodation=data.get('accommodation'),
            accommodation_type=data.get('accommodation_type', 'hotel'),
            transportation=data.get('transportation'),
            estimated_duration_hours=data.get('estimated_duration_hours', 0),
            notes=data.get('notes'),
            special_requirements=data.get('special_requirements')
        )
        
        db.session.add(day)
        db.session.commit()
        
        return jsonify({
            'message': 'Day added successfully',
            'day': day.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@itinerary_bp.route('/days/<int:day_id>/checkpoints', methods=['POST'])
@token_required
@seller_required
def add_checkpoint(current_user, day_id):
    """Add checkpoint to a day"""
    try:
        data = request.get_json()
        
        day = TourItineraryDay.query.get(day_id)
        if not day:
            return jsonify({'error': 'Day not found'}), 404
        
        # Check authorization
        template = TourItineraryTemplate.query.get(day.template_id)
        tour = Tour.query.get(template.tour_id)
        if tour.seller_id != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Create checkpoint
        checkpoint = ItineraryCheckpoint(
            itinerary_day_id=day_id,
            checkpoint_order=data['checkpoint_order'],
            checkpoint_name=data['checkpoint_name'],
            checkpoint_type=data.get('checkpoint_type', 'attraction'),
            description=data.get('description'),
            location_name=data.get('location_name'),
            location_address=data.get('location_address'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            scheduled_time=data.get('scheduled_time'),
            estimated_duration_minutes=data.get('estimated_duration_minutes', 30),
            tips=data.get('tips'),
            warnings=data.get('warnings'),
            is_mandatory=data.get('is_mandatory', True),
            requires_photo=data.get('requires_photo', False)
        )
        
        if 'images' in data:
            checkpoint.set_images(data['images'])
        
        db.session.add(checkpoint)
        db.session.commit()
        
        return jsonify({
            'message': 'Checkpoint added successfully',
            'checkpoint': checkpoint.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@itinerary_bp.route('/templates/<int:template_id>', methods=['GET'])
@token_required
def get_template(current_user, template_id):
    """Get template with all days and checkpoints"""
    try:
        template = TourItineraryTemplate.query.get(template_id)
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        return jsonify(template.to_dict(include_days=True)), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@itinerary_bp.route('/tours/<int:tour_id>/templates', methods=['GET'])
@token_required
def get_tour_templates(current_user, tour_id):
    """Get all templates for a tour"""
    try:
        templates = TourItineraryTemplate.query.filter_by(tour_id=tour_id).all()
        return jsonify({
            'templates': [t.to_dict(include_days=True) for t in templates]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================================
# BOOKING ITINERARY - Initialize from template
# =====================================================

@itinerary_bp.route('/bookings/<int:booking_id>/initialize', methods=['POST'])
@token_required
@seller_required
def initialize_booking_itinerary(current_user, booking_id):
    """Initialize booking itinerary from template"""
    try:
        data = request.get_json()
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check authorization
        tour = Tour.query.get(booking.tour_id)
        if tour.seller_id != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get template
        template_id = data.get('template_id')
        if not template_id:
            # Get active template for tour
            template = TourItineraryTemplate.query.filter_by(
                tour_id=booking.tour_id, 
                is_active=True
            ).first()
        else:
            template = TourItineraryTemplate.query.get(template_id)
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Parse start date
        start_date = datetime.strptime(booking.date, '%Y-%m-%d').date()
        
        # Create booking itinerary days
        for template_day in template.days:
            actual_date = start_date + timedelta(days=template_day.day_number - 1)
            
            booking_day = BookingItineraryDay(
                booking_id=booking_id,
                template_day_id=template_day.id,
                day_number=template_day.day_number,
                actual_date=actual_date,
                day_title=template_day.day_title,
                day_description=template_day.day_description,
                actual_breakfast=template_day.breakfast,
                actual_lunch=template_day.lunch,
                actual_dinner=template_day.dinner,
                actual_accommodation=template_day.accommodation,
                actual_transportation=template_day.transportation,
                total_checkpoints=len(template_day.checkpoints)
            )
            
            db.session.add(booking_day)
            db.session.flush()
            
            # Create checkpoint check-ins
            for checkpoint in template_day.checkpoints:
                # Calculate scheduled time
                if checkpoint.scheduled_time:
                    scheduled_datetime = datetime.combine(
                        actual_date, 
                        checkpoint.scheduled_time
                    )
                else:
                    scheduled_datetime = None
                
                checkin = CheckpointCheckin(
                    booking_day_id=booking_day.id,
                    checkpoint_id=checkpoint.id,
                    scheduled_time=scheduled_datetime,
                    status='pending'
                )
                
                db.session.add(checkin)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking itinerary initialized successfully',
            'booking_id': booking_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# =====================================================
# TOUR GUIDE ROUTES - Check-in and Progress Updates
# =====================================================

@itinerary_bp.route('/checkins/<int:checkin_id>/checkin', methods=['POST'])
@token_required
@tour_guide_required
def perform_checkin(current_user, checkin_id):
    """Tour guide checks in at a checkpoint"""
    try:
        data = request.get_json()
        
        checkin = CheckpointCheckin.query.get(checkin_id)
        if not checkin:
            return jsonify({'error': 'Check-in not found'}), 404
        
        # Verify tour guide is assigned to this booking
        booking_day = BookingItineraryDay.query.get(checkin.booking_day_id)
        booking = Booking.query.get(booking_day.booking_id)
        assignment = TourAssignment.query.filter_by(booking_id=booking.id).first()
        
        if not assignment or assignment.tour_guide_id != current_user.id:
            if current_user.role not in ['admin', 'seller']:
                return jsonify({'error': 'Unauthorized - Not assigned to this tour'}), 403
        
        # Update check-in
        checkin.status = 'checked_in'
        checkin.actual_checkin_time = datetime.utcnow()
        checkin.checked_in_by = current_user.id
        checkin.checkin_latitude = data.get('latitude')
        checkin.checkin_longitude = data.get('longitude')
        checkin.guide_notes = data.get('notes')
        checkin.weather_condition = data.get('weather_condition')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Checked in successfully',
            'checkin': checkin.to_dict(include_checkpoint=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@itinerary_bp.route('/checkins/<int:checkin_id>/photos', methods=['POST'])
@token_required
@tour_guide_required
def upload_checkin_photo(current_user, checkin_id):
    """Upload check-in photo"""
    try:
        checkin = CheckpointCheckin.query.get(checkin_id)
        if not checkin:
            return jsonify({'error': 'Check-in not found'}), 404
        
        # Verify authorization
        booking_day = BookingItineraryDay.query.get(checkin.booking_day_id)
        booking = Booking.query.get(booking_day.booking_id)
        assignment = TourAssignment.query.filter_by(booking_id=booking.id).first()
        
        if not assignment or assignment.tour_guide_id != current_user.id:
            if current_user.role not in ['admin', 'seller']:
                return jsonify({'error': 'Unauthorized'}), 403
        
        # Check if photo was uploaded
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo uploaded'}), 400
        
        file = request.files['photo']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Upload to Cloudinary
            from utils.cloudinary_helper import upload_to_cloudinary
            photo_url = upload_to_cloudinary(file, folder="viego_blog/checkpoint_photos")
            
            if not photo_url:
                return jsonify({'error': 'Failed to upload photo to Cloudinary'}), 500
            
            # Add photo URL to checkin
            checkin.add_photo(photo_url)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Photo uploaded successfully',
                'photo_url': photo_url,
                'total_photos': checkin.photo_count
            }), 200
        
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@itinerary_bp.route('/checkins/<int:checkin_id>/checkout', methods=['POST'])
@token_required
@tour_guide_required
def perform_checkout(current_user, checkin_id):
    """Tour guide checks out from a checkpoint"""
    try:
        checkin = CheckpointCheckin.query.get(checkin_id)
        if not checkin:
            return jsonify({'error': 'Check-in not found'}), 404
        
        # Update checkout time and calculate duration
        checkin.actual_checkout_time = datetime.utcnow()
        
        if checkin.actual_checkin_time:
            duration = (checkin.actual_checkout_time - checkin.actual_checkin_time).total_seconds() / 60
            checkin.duration_minutes = int(duration)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Checked out successfully',
            'checkin': checkin.to_dict(include_checkpoint=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@itinerary_bp.route('/bookings/<int:booking_id>/days/<int:day_number>', methods=['GET'])
@token_required
def get_booking_day(current_user, booking_id, day_number):
    """Get booking day with all check-ins"""
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check authorization
        if booking.user_id != current_user.id:
            # Check if tour guide
            assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
            if not assignment or assignment.tour_guide_id != current_user.id:
                if current_user.role not in ['admin', 'seller']:
                    return jsonify({'error': 'Unauthorized'}), 403
        
        booking_day = BookingItineraryDay.query.filter_by(
            booking_id=booking_id,
            day_number=day_number
        ).first()
        
        if not booking_day:
            return jsonify({'error': 'Day not found'}), 404
        
        return jsonify(booking_day.to_dict(include_checkins=True)), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@itinerary_bp.route('/bookings/<int:booking_id>/progress', methods=['GET'])
@token_required
def get_booking_progress(current_user, booking_id):
    """Get overall booking progress"""
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check authorization
        if booking.user_id != current_user.id:
            assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
            if not assignment or assignment.tour_guide_id != current_user.id:
                if current_user.role not in ['admin', 'seller']:
                    return jsonify({'error': 'Unauthorized'}), 403
        
        days = BookingItineraryDay.query.filter_by(booking_id=booking_id).order_by(
            BookingItineraryDay.day_number
        ).all()
        
        # Calculate overall progress
        total_checkpoints = sum(day.total_checkpoints for day in days)
        completed_checkpoints = sum(day.completed_checkpoints for day in days)
        overall_progress = (completed_checkpoints / total_checkpoints * 100) if total_checkpoints > 0 else 0
        
        return jsonify({
            'booking_id': booking_id,
            'total_days': len(days),
            'total_checkpoints': total_checkpoints,
            'completed_checkpoints': completed_checkpoints,
            'overall_progress': round(overall_progress, 2),
            'days': [day.to_dict(include_checkins=True) for day in days]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================================
# USER ROUTES - View progress and photos
# =====================================================

@itinerary_bp.route('/my-bookings/<int:booking_id>/itinerary', methods=['GET'])
@token_required
def get_my_booking_itinerary(current_user, booking_id):
    """User views their booking itinerary and progress"""
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        days = BookingItineraryDay.query.filter_by(booking_id=booking_id).order_by(
            BookingItineraryDay.day_number
        ).all()
        
        # Get only visible check-ins with photos
        result = []
        for day in days:
            day_data = day.to_dict()
            day_data['checkins'] = []
            
            for checkin in day.checkins:
                if checkin.is_visible_to_participants and checkin.status == 'checked_in':
                    day_data['checkins'].append(checkin.to_dict(include_checkpoint=True, include_guide=True))
            
            result.append(day_data)
        
        return jsonify({
            'booking_id': booking_id,
            'days': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
