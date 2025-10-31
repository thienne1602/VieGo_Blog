"""
Seller routes - statistics and seller-specific utilities
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from models import db
from models.user import User
from models.tour import Tour
from models.booking import Booking

seller_bp = Blueprint('seller', __name__, url_prefix='/api/seller')


@seller_bp.route('/stats', methods=['GET'])
@jwt_required()
def seller_stats():
    """Return aggregated stats for the authenticated seller (or admin).

    Response:
      - total_tours
      - bookings_count
      - income_sum
      - average_rating
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Admins can view global aggregates
        if user.role == 'admin':
            total_tours = db.session.query(func.count(Tour.id)).scalar() or 0
            bookings_count = db.session.query(func.count(Booking.id)).scalar() or 0
            income_sum = db.session.query(func.coalesce(func.sum(Booking.total_price), 0)).scalar() or 0
            average_rating = db.session.query(func.coalesce(func.avg(Tour.rating), 0)).scalar() or 0
        else:
            total_tours = db.session.query(func.count(Tour.id)).filter(Tour.seller_id == current_user_id).scalar() or 0
            bookings_count = (
                db.session.query(func.count(Booking.id))
                .join(Tour, Booking.tour_id == Tour.id)
                .filter(Tour.seller_id == current_user_id)
                .scalar()
                or 0
            )
            income_sum = (
                db.session.query(func.coalesce(func.sum(Booking.total_price), 0))
                .join(Tour, Booking.tour_id == Tour.id)
                .filter(Tour.seller_id == current_user_id)
                .scalar()
                or 0
            )
            average_rating = (
                db.session.query(func.coalesce(func.avg(Tour.rating), 0))
                .filter(Tour.seller_id == current_user_id)
                .scalar()
                or 0
            )

        return jsonify({
            'total_tours': int(total_tours),
            'bookings_count': int(bookings_count),
            'income_sum': float(income_sum),
            'average_rating': float(average_rating)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error computing stats: {str(e)}'}), 500
