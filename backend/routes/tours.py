"""
Tours Routes for VieGo Blog
Handles tour listings, bookings, and tour management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, desc
from datetime import datetime
import json

from models import db
from models.user import User
from models.tour import Tour

tours_bp = Blueprint('tours', __name__, url_prefix='/api/tours')

@tours_bp.route('/', methods=['GET'])
def get_tours():
    """Get all tours with filtering and pagination"""
    try:
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 50)
        category = request.args.get('category')
        difficulty = request.args.get('difficulty')
        search = request.args.get('search')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        
        # Base query - only published tours
        query = Tour.query.filter_by(status='published')
        
        # Apply filters
        if category:
            query = query.filter_by(category=category)
        
        if difficulty:
            query = query.filter_by(difficulty_level=difficulty)
        
        if min_price is not None:
            query = query.filter(Tour.price_per_person >= min_price)
        
        if max_price is not None:
            query = query.filter(Tour.price_per_person <= max_price)
        
        if search:
            search_filter = or_(
                Tour.title.contains(search),
                Tour.description.contains(search),
                Tour.starting_location.contains(search)
            )
            query = query.filter(search_filter)
        
        # Order by rating and views
        query = query.order_by(desc(Tour.rating), desc(Tour.views_count))
        
        # Paginate
        tours_pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Format response
        tours_data = []
        for tour in tours_pagination.items:
            tour_dict = tour.to_dict(include_sensitive=False)
            # Include seller info
            seller = User.query.get(tour.seller_id)
            tour_dict['seller'] = {
                'id': seller.id,
                'username': seller.username,
                'full_name': seller.full_name,
                'avatar_url': seller.avatar_url
            } if seller else None
            tours_data.append(tour_dict)
        
        return jsonify({
            'tours': tours_data,
            'pagination': {
                'page': tours_pagination.page,
                'pages': tours_pagination.pages,
                'per_page': tours_pagination.per_page,
                'total': tours_pagination.total,
                'has_next': tours_pagination.has_next,
                'has_prev': tours_pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách tour: {str(e)}'}), 500

@tours_bp.route('/<int:tour_id>', methods=['GET'])
def get_tour(tour_id):
    """Get single tour by ID"""
    try:
        tour = Tour.query.get_or_404(tour_id)
        
        if tour.status != 'published':
            return jsonify({'error': 'Tour không tồn tại hoặc chưa được xuất bản'}), 404
        
        # Increment view count
        tour.increment_views()
        db.session.commit()
        
        # Get tour data
        tour_dict = tour.to_dict(include_sensitive=False)
        
        # Include seller info
        seller = User.query.get(tour.seller_id)
        tour_dict['seller'] = {
            'id': seller.id,
            'username': seller.username,
            'full_name': seller.full_name,
            'bio': seller.bio,
            'avatar_url': seller.avatar_url
        } if seller else None
        
        return jsonify(tour_dict), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thông tin tour: {str(e)}'}), 500

@tours_bp.route('/', methods=['POST'])
@jwt_required()
def create_tour():
    """Create a new tour (sellers only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Check if user is seller
        if user.role not in ['seller', 'admin']:
            return jsonify({'error': 'Bạn cần có quyền seller để tạo tour'}), 403
        
        data = request.get_json()
        
        # Required fields
        required_fields = ['title', 'description', 'duration_days', 'starting_location', 
                          'price_per_person', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Thiếu trường bắt buộc: {field}'}), 400
        
        # Create new tour
        tour = Tour(
            title=data['title'],
            description=data['description'],
            seller_id=current_user_id
        )
        
        # Set required fields
        tour.duration_days = data['duration_days']
        tour.starting_location = data['starting_location']
        tour.price_per_person = data['price_per_person']
        tour.category = data['category']
        
        # Set optional fields
        optional_fields = [
            'ending_location', 'max_participants', 'min_participants',
            'difficulty_level', 'featured_image', 'video_url',
            'booking_deadline_days', 'cancellation_policy', 'currency'
        ]
        
        for field in optional_fields:
            if field in data:
                setattr(tour, field, data[field])
        
        # Set JSON fields
        if 'itinerary' in data:
            tour.set_itinerary(data['itinerary'])
        
        if 'inclusions' in data:
            tour.set_inclusions(data['inclusions'])
        
        if 'exclusions' in data:
            tour.set_exclusions(data['exclusions'])
        
        if 'available_dates' in data:
            tour.set_available_dates(data['available_dates'])
        
        if 'tags' in data:
            tour.set_tags(data['tags'])
        
        if 'gallery_images' in data:
            tour.set_gallery_images(data['gallery_images'])
        
        if 'locations_covered' in data:
            tour.set_locations_covered(data['locations_covered'])
        
        db.session.add(tour)
        db.session.commit()
        
        return jsonify({
            'message': 'Tạo tour thành công!',
            'tour': tour.to_dict(include_sensitive=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi tạo tour: {str(e)}'}), 500

@tours_bp.route('/<int:tour_id>', methods=['PUT'])
@jwt_required()
def update_tour(tour_id):
    """Update tour (seller or admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        tour = Tour.query.get_or_404(tour_id)
        
        # Check permissions
        if tour.seller_id != current_user_id and user.role != 'admin':
            return jsonify({'error': 'Bạn không có quyền chỉnh sửa tour này'}), 403
        
        data = request.get_json()
        
        # Update fields
        updateable_fields = [
            'title', 'description', 'duration_days', 'starting_location',
            'ending_location', 'price_per_person', 'category', 'difficulty_level',
            'max_participants', 'min_participants', 'featured_image', 'video_url',
            'booking_deadline_days', 'cancellation_policy', 'currency', 'status'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(tour, field, data[field])
        
        # Update JSON fields
        if 'itinerary' in data:
            tour.set_itinerary(data['itinerary'])
        
        if 'inclusions' in data:
            tour.set_inclusions(data['inclusions'])
        
        if 'exclusions' in data:
            tour.set_exclusions(data['exclusions'])
        
        if 'available_dates' in data:
            tour.set_available_dates(data['available_dates'])
        
        if 'tags' in data:
            tour.set_tags(data['tags'])
        
        if 'gallery_images' in data:
            tour.set_gallery_images(data['gallery_images'])
        
        if 'locations_covered' in data:
            tour.set_locations_covered(data['locations_covered'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật tour thành công!',
            'tour': tour.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cập nhật tour: {str(e)}'}), 500

@tours_bp.route('/<int:tour_id>', methods=['DELETE'])
@jwt_required()
def delete_tour(tour_id):
    """Delete tour (seller or admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        tour = Tour.query.get_or_404(tour_id)
        
        # Check permissions
        if tour.seller_id != current_user_id and user.role != 'admin':
            return jsonify({'error': 'Bạn không có quyền xóa tour này'}), 403
        
        db.session.delete(tour)
        db.session.commit()
        
        return jsonify({'message': 'Đã xóa tour thành công!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa tour: {str(e)}'}), 500

@tours_bp.route('/<int:tour_id>/book', methods=['POST'])
@jwt_required()
def book_tour(tour_id):
    """Book a tour"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        tour = Tour.query.get_or_404(tour_id)
        
        if tour.status != 'published':
            return jsonify({'error': 'Tour không khả dụng'}), 400
        
        data = request.get_json()
        
        # Validate booking data
        required_fields = ['date', 'participants']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Thiếu trường bắt buộc: {field}'}), 400
        
        participants = data['participants']
        
        # Check participant limits
        if participants < tour.min_participants:
            return jsonify({'error': f'Số người tham gia tối thiểu là {tour.min_participants}'}), 400
        
        if participants > tour.max_participants:
            return jsonify({'error': f'Số người tham gia tối đa là {tour.max_participants}'}), 400
        
        # Calculate total price
        total_price = tour.price_per_person * participants
        
        # Apply discount if any
        if tour.discount_percentage > 0:
            total_price = total_price * (1 - tour.discount_percentage / 100)
        
        # Here you would create a booking record (not implemented yet)
        # For now, just return booking info
        
        # Add points to user for booking
        user.add_points(100)
        db.session.commit()
        
        return jsonify({
            'message': 'Đặt tour thành công!',
            'booking': {
                'tour_id': tour.id,
                'tour_title': tour.title,
                'date': data['date'],
                'participants': participants,
                'total_price': total_price,
                'currency': tour.currency
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi đặt tour: {str(e)}'}), 500

@tours_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get available tour categories"""
    return jsonify({
        'categories': [
            {'value': 'adventure', 'label': 'Phiêu lưu'},
            {'value': 'cultural', 'label': 'Văn hóa'},
            {'value': 'food', 'label': 'Ẩm thực'},
            {'value': 'nature', 'label': 'Thiên nhiên'},
            {'value': 'urban', 'label': 'Đô thị'},
            {'value': 'spiritual', 'label': 'Tâm linh'}
        ]
    }), 200
