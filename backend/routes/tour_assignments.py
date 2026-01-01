from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.user import User
from models.tour import Tour
from models.booking import Booking
from models.tour_assignment import TourAssignment
from datetime import datetime

# Try to import email utility
send_tour_assignment_email = None
EMAIL_AVAILABLE = False
try:
    from utils.email import send_tour_assignment_email
    EMAIL_AVAILABLE = True
except ImportError as e:
    EMAIL_AVAILABLE = False
    print(f"⚠️  Email utility not available: {str(e)}")

tour_assignments_bp = Blueprint('tour_assignments', __name__, url_prefix='/api/tour-assignments')


@tour_assignments_bp.route('', methods=['POST'])
@jwt_required()
def create_assignment():
    """Assign a tour guide to a booking (seller only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Only seller and admin can assign tour guides
        if user.role not in ['seller', 'admin']:
            return jsonify({'error': 'Unauthorized. Only sellers and admins can assign tour guides'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        if not data or 'booking_id' not in data or 'tour_guide_id' not in data:
            return jsonify({'error': 'booking_id and tour_guide_id are required'}), 400
        
        booking_id = data['booking_id']
        tour_guide_id = data['tour_guide_id']
        
        # Check if booking exists
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check if tour guide exists and has the correct role
        tour_guide = User.query.get(tour_guide_id)
        if not tour_guide:
            return jsonify({'error': 'Tour guide not found'}), 404
        
        if tour_guide.role != 'tour_guide':
            return jsonify({'error': 'Selected user is not a tour guide'}), 400
        
        # Get tour and verify seller permissions
        tour = Tour.query.get(booking.tour_id)
        if not tour:
            return jsonify({'error': 'Tour not found'}), 404
        
        # Verify that user is the tour owner (seller) or admin
        if user.role != 'admin' and tour.seller_id != current_user_id:
            return jsonify({'error': 'Unauthorized. You can only assign guides to your own tours'}), 403
        
        # Check if assignment already exists
        existing_assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        if existing_assignment:
            # Update existing assignment
            existing_assignment.tour_guide_id = tour_guide_id
            existing_assignment.assigned_by = current_user_id
            existing_assignment.assignment_date = datetime.utcnow()
            existing_assignment.status = 'assigned'
            existing_assignment.notes = data.get('notes', existing_assignment.notes)
            existing_assignment.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            assignment = existing_assignment
            message = 'Tour guide reassigned successfully'
        else:
            # Create new assignment
            assignment = TourAssignment(
                booking_id=booking_id,
                tour_guide_id=tour_guide_id,
                assigned_by=current_user_id,
                notes=data.get('notes')
            )
            
            db.session.add(assignment)
            db.session.commit()
            
            message = 'Tour guide assigned successfully'
        
        # Send email notification to customer and tour guide
        email_sent = False
        if EMAIL_AVAILABLE and send_tour_assignment_email:
            try:
                email_sent = send_tour_assignment_email(
                    booking=booking,
                    tour=tour,
                    tour_guide=tour_guide,
                    customer_email=booking.email,
                    seller=user
                )
            except Exception as e:
                print(f"Failed to send assignment email: {str(e)}")
        
        return jsonify({
            'message': message,
            'assignment': assignment.to_dict(include_booking=True, include_guide=True),
            'email_sent': email_sent
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error creating assignment: {str(e)}'}), 500


@tour_assignments_bp.route('/booking/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_assignment_by_booking(booking_id):
    """Get tour assignment for a specific booking"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        
        if not assignment:
            return jsonify({'error': 'No assignment found for this booking'}), 404
        
        # Get booking and tour
        booking = Booking.query.get(booking_id)
        tour = Tour.query.get(booking.tour_id) if booking else None
        
        # Permission check: seller, assigned guide, or admin
        is_seller = tour and tour.seller_id == current_user_id
        is_assigned_guide = assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_seller or is_assigned_guide or is_admin):
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'assignment': assignment.to_dict(include_booking=True, include_guide=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching assignment: {str(e)}'}), 500


@tour_assignments_bp.route('/my-assignments', methods=['GET'])
@jwt_required()
def get_my_assignments():
    """Get all tours assigned to the current tour guide"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role != 'tour_guide':
            return jsonify({'error': 'Only tour guides can access this endpoint'}), 403
        
        # Get all assignments for this guide
        assignments = TourAssignment.query.filter_by(
            tour_guide_id=current_user_id
        ).order_by(TourAssignment.assignment_date.desc()).all()
        
        # Enrich with booking and tour information
        result = []
        for assignment in assignments:
            assignment_data = assignment.to_dict(include_guide=False)
            
            # Get booking
            booking = Booking.query.get(assignment.booking_id)
            if booking:
                booking_dict = booking.to_dict()
                
                # Get tour and include it in booking
                tour = Tour.query.get(booking.tour_id)
                if tour:
                    booking_dict['tour'] = {
                        'id': tour.id,
                        'title': tour.title,
                        'description': tour.description,
                        'duration_days': tour.duration_days,
                        'starting_location': tour.starting_location,
                        'ending_location': tour.ending_location,
                        'featured_image': tour.featured_image,
                        'itinerary': tour.get_itinerary() if hasattr(tour, 'get_itinerary') else None
                    }
                    # Also add tour at assignment level for backward compatibility
                    assignment_data['tour'] = booking_dict['tour']
                
                assignment_data['booking'] = booking_dict
                
                # Get customer info
                customer = User.query.get(booking.user_id)
                if customer:
                    assignment_data['customer'] = {
                        'id': customer.id,
                        'username': customer.username,
                        'full_name': customer.full_name,
                        'email': customer.email,
                        'phone': getattr(customer, 'phone', None)
                    }
            
            result.append(assignment_data)
        
        return jsonify({'assignments': result}), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching assignments: {str(e)}'}), 500


@tour_assignments_bp.route('/<int:assignment_id>', methods=['PATCH'])
@jwt_required()
def update_assignment_status(assignment_id):
    """Update assignment status (tour guide can update)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        assignment = TourAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Permission check: assigned guide or admin
        if assignment.tour_guide_id != current_user_id and user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update allowed fields
        if 'status' in data:
            if data['status'] not in ['assigned', 'accepted', 'in_progress', 'completed', 'cancelled']:
                return jsonify({'error': 'Invalid status'}), 400
            assignment.status = data['status']
        
        if 'guide_notes' in data:
            assignment.guide_notes = data['guide_notes']
        
        assignment.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Assignment updated successfully',
            'assignment': assignment.to_dict(include_booking=True, include_guide=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating assignment: {str(e)}'}), 500


@tour_assignments_bp.route('/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
def delete_assignment(assignment_id):
    """Delete/unassign a tour guide (seller only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        assignment = TourAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Get booking and tour for permission check
        booking = Booking.query.get(assignment.booking_id)
        tour = Tour.query.get(booking.tour_id) if booking else None
        
        # Only seller or admin can delete assignments
        if user.role != 'admin' and (not tour or tour.seller_id != current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(assignment)
        db.session.commit()
        
        return jsonify({'message': 'Assignment deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error deleting assignment: {str(e)}'}), 500


@tour_assignments_bp.route('/<int:assignment_id>/pin', methods=['POST'])
@jwt_required()
def toggle_pin_assignment(assignment_id):
    """Toggle pin status for a tour assignment - ghim/bỏ ghim tour trong danh sách hành trình cho tour guide"""
    try:
        from datetime import datetime
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role != 'tour_guide':
            return jsonify({'error': 'Chỉ hướng dẫn viên mới có thể ghim tour'}), 403
        
        assignment = TourAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Check permission - only the assigned tour guide can pin
        if assignment.tour_guide_id != current_user_id:
            return jsonify({'error': 'Bạn không có quyền ghim tour này'}), 403
        
        # Toggle pin status
        if assignment.is_pinned:
            # Unpin
            assignment.is_pinned = False
            assignment.pinned_at = None
            action = 'unpinned'
            message = 'Đã bỏ ghim tour khỏi danh sách hành trình'
        else:
            # Pin
            assignment.is_pinned = True
            assignment.pinned_at = datetime.utcnow()
            action = 'pinned'
            message = 'Đã ghim tour lên đầu danh sách hành trình'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': message,
            'action': action,
            'assignment': {
                'id': assignment.id,
                'is_pinned': assignment.is_pinned,
                'pinned_at': assignment.pinned_at.isoformat() if assignment.pinned_at else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi khi ghim tour: {str(e)}'}), 500

