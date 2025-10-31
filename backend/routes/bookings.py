from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.user import User
from models.tour import Tour
from models.booking import Booking
from datetime import datetime

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')


@bookings_bp.route('/mine', methods=['GET'])
@jwt_required()
def get_my_bookings():
    """Return bookings for tours owned by the authenticated seller, or all bookings for admin"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.role == 'admin':
            bookings = Booking.query.order_by(Booking.created_at.desc()).all()
        else:
            # Seller: bookings for tours where seller_id == current_user_id
            bookings = Booking.query.join(Tour).filter(Tour.seller_id == current_user_id).order_by(Booking.created_at.desc()).all()

        bookings_data = [b.to_dict() for b in bookings]
        # Enrich with basic user and tour info
        for b in bookings_data:
            u = User.query.get(b['user_id'])
            t = Tour.query.get(b['tour_id'])
            b['user'] = {'id': u.id, 'username': u.username, 'full_name': u.full_name, 'avatar_url': u.avatar_url} if u else None
            b['tour'] = {'id': t.id, 'title': t.title, 'featured_image': t.featured_image} if t else None

        return jsonify({'bookings': bookings_data}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching bookings: {str(e)}'}), 500


@bookings_bp.route('/<int:booking_id>', methods=['PATCH'])
@jwt_required()
def update_booking_status(booking_id):
    """Allow seller (owner of tour) or admin to update booking status (confirm/cancel)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        booking = Booking.query.get_or_404(booking_id)
        tour = Tour.query.get(booking.tour_id)

        # Permission: must be admin or the tour owner
        if user.role != 'admin' and tour.seller_id != current_user_id:
            return jsonify({'error': 'Bạn không có quyền cập nhật booking này'}), 403

        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'error': 'Thiếu trường status'}), 400

        new_status = data['status']
        if new_status not in ['pending', 'confirmed', 'cancelled']:
            return jsonify({'error': 'Giá trị status không hợp lệ'}), 400

        booking.status = new_status
        booking.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': 'Booking cập nhật', 'booking': booking.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating booking: {str(e)}'}), 500
