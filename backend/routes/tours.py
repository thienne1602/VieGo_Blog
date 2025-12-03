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
from models.booking import Booking

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
        
        # Base query - only active tours
        query = Tour.query.filter_by(status='active')
        
        # Debug: Log total active tours
        total_active = query.count()
        print(f'[API] Total active tours: {total_active}')
        
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
        
        print(f'[API] Returning {len(tours_data)} tours (page {page}, total: {tours_pagination.total})')
        
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
@jwt_required(optional=True)
def get_tour(tour_id):
    """Get single tour by ID with full details"""
    try:
        tour = Tour.query.get_or_404(tour_id)
        
        # Check if user is authenticated and has permission
        current_user_id = None
        user = None
        try:
            current_user_id = get_jwt_identity()
            if current_user_id:
                user = User.query.get(current_user_id)
        except:
            pass
        
        # Allow seller/admin to view their own tours regardless of status
        is_owner = user and (user.role == 'admin' or tour.seller_id == current_user_id)
        
        # Public users can only view active tours
        if not is_owner and tour.status != 'active':
            return jsonify({'error': 'Tour không tồn tại hoặc chưa được kích hoạt'}), 404
        
        # Only increment view count for public users viewing active tours
        if not is_owner and tour.status == 'active':
            tour.increment_views()
            db.session.commit()
        
        # Get tour data with sensitive information for detail view (if owner or active tour)
        tour_dict = tour.to_dict(include_sensitive=is_owner or tour.status == 'active')
        
        # Include seller info with company information
        seller = User.query.get(tour.seller_id)
        tour_dict['seller'] = {
            'id': seller.id,
            'username': seller.username,
            'full_name': seller.full_name,
            'bio': seller.bio,
            'avatar_url': seller.avatar_url,
            'company_name': seller.company_name,
            'company_address': seller.company_address,
            'company_phone': seller.company_phone,
            'company_email': seller.company_email,
            'company_tax_id': seller.company_tax_id,
            'bank_account_number': seller.bank_account_number,
            'bank_name': seller.bank_name,
            'bank_account_holder': seller.bank_account_holder
        } if seller else None
        
        return jsonify({
            'success': True,
            'data': tour_dict
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Lỗi lấy thông tin tour: {str(e)}'}), 500

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
        
        # Validate data types and values
        if not isinstance(data['duration_days'], int) or data['duration_days'] < 1:
            return jsonify({'error': 'Số ngày tour phải là số nguyên dương'}), 400
        
        if not isinstance(data['price_per_person'], (int, float)) or data['price_per_person'] <= 0:
            return jsonify({'error': 'Giá tour phải là số dương'}), 400
        
        if data['category'] not in ['adventure', 'cultural', 'food', 'nature', 'urban', 'spiritual']:
            return jsonify({'error': 'Danh mục tour không hợp lệ'}), 400
        
        # Validate optional numeric fields
        if 'max_participants' in data:
            if not isinstance(data['max_participants'], int) or data['max_participants'] < 1:
                return jsonify({'error': 'Số người tối đa phải là số nguyên dương'}), 400
        
        if 'min_participants' in data:
            if not isinstance(data['min_participants'], int) or data['min_participants'] < 1:
                return jsonify({'error': 'Số người tối thiểu phải là số nguyên dương'}), 400
        
        # Validate min <= max participants
        max_participants = data.get('max_participants', 10)
        min_participants = data.get('min_participants', 2)
        if min_participants > max_participants:
            return jsonify({'error': 'Số người tối thiểu không được lớn hơn số người tối đa'}), 400
        
        # Create new tour
        tour = Tour(
            title=data['title'].strip(),
            description=data['description'].strip(),
            seller_id=current_user_id
        )
        
        # Set required fields
        tour.duration_days = data['duration_days']
        tour.starting_location = data['starting_location'].strip()
        tour.price_per_person = float(data['price_per_person'])
        tour.category = data['category']
        
        # Set default status to 'draft' (seller needs to activate manually)
        tour.status = data.get('status', 'draft')
        
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
        # Convert to int if it's a string (JWT identity might be stored as string)
        current_user_id = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        tour = Tour.query.get_or_404(tour_id)
        
        # Check permissions - ensure both IDs are integers for proper comparison
        tour_seller_id = int(tour.seller_id) if tour.seller_id is not None else None
        if tour_seller_id != current_user_id and user.role != 'admin':
            return jsonify({'error': 'Bạn không có quyền chỉnh sửa tour này'}), 403
        
        data = request.get_json()
        
        # Validate data types and values if provided
        if 'duration_days' in data:
            if not isinstance(data['duration_days'], int) or data['duration_days'] < 1:
                return jsonify({'error': 'Số ngày tour phải là số nguyên dương'}), 400
            tour.duration_days = data['duration_days']
        
        if 'price_per_person' in data:
            if not isinstance(data['price_per_person'], (int, float)) or data['price_per_person'] <= 0:
                return jsonify({'error': 'Giá tour phải là số dương'}), 400
            tour.price_per_person = float(data['price_per_person'])
        
        if 'category' in data:
            if data['category'] not in ['adventure', 'cultural', 'food', 'nature', 'urban', 'spiritual']:
                return jsonify({'error': 'Danh mục tour không hợp lệ'}), 400
            tour.category = data['category']
        
        if 'max_participants' in data:
            if not isinstance(data['max_participants'], int) or data['max_participants'] < 1:
                return jsonify({'error': 'Số người tối đa phải là số nguyên dương'}), 400
            tour.max_participants = data['max_participants']
        
        if 'min_participants' in data:
            if not isinstance(data['min_participants'], int) or data['min_participants'] < 1:
                return jsonify({'error': 'Số người tối thiểu phải là số nguyên dương'}), 400
            tour.min_participants = data['min_participants']
        
        # Validate min <= max participants
        max_participants = tour.max_participants or data.get('max_participants', 10)
        min_participants = tour.min_participants or data.get('min_participants', 2)
        if min_participants > max_participants:
            return jsonify({'error': 'Số người tối thiểu không được lớn hơn số người tối đa'}), 400
        
        # Update text fields (strip whitespace)
        text_fields = ['title', 'description', 'starting_location', 'ending_location', 
                      'cancellation_policy', 'currency', 'status']
        for field in text_fields:
            if field in data:
                value = data[field]
                if isinstance(value, str):
                    setattr(tour, field, value.strip())
                else:
                    setattr(tour, field, value)
        
        # Update other fields
        other_fields = ['difficulty_level', 'featured_image', 'video_url', 
                       'booking_deadline_days']
        for field in other_fields:
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
    """Book a tour with detailed information"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        tour = Tour.query.get_or_404(tour_id)
        
        if tour.status != 'active':
            return jsonify({'error': 'Tour không khả dụng'}), 400
        
        data = request.get_json()
        
        # Validate booking data
        required_fields = ['date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Thiếu trường bắt buộc: {field}'}), 400
        
        # Get participant counts (default to adults if only participants is provided for backward compatibility)
        adults = data.get('adults', data.get('participants', 1))
        children = data.get('children', 0)
        infants = data.get('infants', 0)
        total_participants = adults + children + infants
        
        # Validate participant counts
        if total_participants < tour.min_participants:
            return jsonify({'error': f'Số người tham gia tối thiểu là {tour.min_participants}'}), 400
        
        if total_participants > tour.max_participants:
            return jsonify({'error': f'Số người tham gia tối đa là {tour.max_participants}'}), 400
        
        # Calculate prices
        # Default pricing: adult = full price, child = 80%, infant = 50%
        adult_price = tour.price_per_person
        child_price = tour.price_per_person * 0.8  # 80% of adult price
        infant_price = tour.price_per_person * 0.5  # 50% of adult price
        
        # If tour has specific pricing, use those (would need to add to tour model)
        # For now, using defaults above
        
        base_price = (adult_price * adults) + (child_price * children) + (infant_price * infants)
        
        # Apply tour discount if any
        if tour.discount_percentage > 0:
            base_price = base_price * (1 - tour.discount_percentage / 100)
        
        # Apply discount code if provided
        discount_code = data.get('discount_code', '').strip().upper()
        discount_amount = 0.0
        if discount_code:
            # Simple discount code logic - can be extended
            discount_codes = {
                'GIAM10': 0.1,  # 10% discount
                'GIAM20': 0.2,  # 20% discount
                'GIAM30': 0.3,  # 30% discount
            }
            if discount_code in discount_codes:
                discount_amount = base_price * discount_codes[discount_code]
                base_price = base_price - discount_amount
        
        total_price = base_price
        
        # Get customer information
        full_name = data.get('full_name', user.full_name if user else '')
        email = data.get('email', user.email if user else '')
        phone = data.get('phone', '')
        address = data.get('address', '')
        payment_method = data.get('payment_method', 'office')
        
        # Create booking record
        booking = Booking(
            tour_id=tour.id,
            user_id=current_user_id,
            date=data['date'],
            participants=total_participants,
            adults=adults,
            children=children,
            infants=infants,
            full_name=full_name,
            email=email,
            phone=phone,
            address=address,
            base_price=base_price + discount_amount,  # Store original before discount
            adult_price=adult_price,
            child_price=child_price,
            infant_price=infant_price,
            discount_code=discount_code if discount_code else None,
            discount_amount=discount_amount,
            total_price=total_price,
            currency=tour.currency or 'VND',
            payment_method=payment_method,
            status='pending'
        )

        db.session.add(booking)

        # Add points to user for booking
        if user:
            user.add_points(100)

        # Increment tour bookings counter
        tour.increment_bookings()

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Đặt tour thành công!',
            'booking': booking.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f'Lỗi đặt tour: {str(e)}'}), 500

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


@tours_bp.route('/mine', methods=['GET'])
@jwt_required()
def get_my_tours():
    """Get tours created by the authenticated seller (or admin)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Admins can view all tours; sellers only their own
        if user.role == 'admin':
            tours = Tour.query.order_by(desc(Tour.created_at)).all()
        else:
            tours = Tour.query.filter_by(seller_id=current_user_id).order_by(desc(Tour.created_at)).all()

        tours_data = [t.to_dict(include_sensitive=True) for t in tours]
        return jsonify({'tours': tours_data}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching user tours: {str(e)}'}), 500


@tours_bp.route('/seller/<int:seller_id>', methods=['GET'])
@jwt_required(optional=True)
def get_seller_tours(seller_id):
    """Get active tours by seller ID (public endpoint)"""
    try:
        seller = User.query.get(seller_id)
        if not seller:
            return jsonify({'error': 'Seller not found'}), 404
        
        # Only get active tours for public viewing
        tours = Tour.query.filter_by(
            seller_id=seller_id,
            status='active'
        ).order_by(desc(Tour.created_at)).all()

        tours_data = []
        for tour in tours:
            tour_dict = tour.to_dict(include_sensitive=False)
            tours_data.append(tour_dict)

        return jsonify({
            'success': True,
            'tours': tours_data,
            'seller': {
                'id': seller.id,
                'username': seller.username,
                'full_name': seller.full_name,
                'avatar_url': seller.avatar_url,
                'company_name': seller.company_name,
                'company_address': seller.company_address,
                'company_phone': seller.company_phone,
                'company_email': seller.company_email,
            }
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching seller tours: {str(e)}'}), 500

@tours_bp.route('/destinations/ranking', methods=['GET'])
def get_destination_ranking():
    """Get ranking of popular destinations based on tour counts"""
    try:
        # List of all 63 provinces/cities in Vietnam
        provinces = [
            {"name": "Hà Nội", "keywords": ["Hanoi", "Ha Noi", "Hà Nội"], "image": "https://images.unsplash.com/photo-1555921015-5532091f6026?w=800"},
            {"name": "TP Hồ Chí Minh", "keywords": ["Ho Chi Minh", "Saigon", "Sài Gòn", "HCM"], "image": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800"},
            {"name": "Đà Nẵng", "keywords": ["Da Nang", "Đà Nẵng"], "image": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800"},
            {"name": "Quảng Nam", "keywords": ["Hoi An", "Hội An", "Quảng Nam"], "image": "https://images.unsplash.com/photo-1578241561880-0a1d5db283cb?w=800"},
            {"name": "Lào Cai", "keywords": ["Sapa", "Sa Pa", "Lào Cai"], "image": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800"},
            {"name": "Quảng Ninh", "keywords": ["Ha Long", "Hạ Long", "Quảng Ninh"], "image": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800"},
            {"name": "Ninh Bình", "keywords": ["Ninh Binh", "Ninh Bình", "Trang An", "Tam Coc"], "image": "https://images.unsplash.com/photo-1565060169194-196e927284b4?w=800"},
            {"name": "Thừa Thiên Huế", "keywords": ["Hue", "Huế"], "image": "https://images.unsplash.com/photo-1599708153386-62e27c51b354?w=800"},
            {"name": "Kiên Giang", "keywords": ["Phu Quoc", "Phú Quốc", "Kiên Giang"], "image": "https://images.unsplash.com/photo-1558618047-f4b511aae74d?w=800"},
            {"name": "Lâm Đồng", "keywords": ["Da Lat", "Đà Lạt", "Lâm Đồng"], "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"},
            {"name": "Khánh Hòa", "keywords": ["Nha Trang", "Khánh Hòa"], "image": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800"},
            {"name": "Bình Thuận", "keywords": ["Mui Ne", "Mũi Né", "Phan Thiet", "Bình Thuận"], "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"},
            {"name": "Quảng Bình", "keywords": ["Phong Nha", "Quảng Bình"], "image": "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800"},
            {"name": "Hà Giang", "keywords": ["Ha Giang", "Hà Giang"], "image": "https://images.unsplash.com/photo-1531737212413-667205e1cda7?w=800"},
            {"name": "Cần Thơ", "keywords": ["Can Tho", "Cần Thơ"], "image": "https://images.unsplash.com/photo-1552493450-2c954569a5bb?w=800"},
            {"name": "An Giang", "keywords": ["An Giang", "Chau Doc"], "image": None},
            {"name": "Bà Rịa - Vũng Tàu", "keywords": ["Vung Tau", "Vũng Tàu", "Ba Ria"], "image": "https://images.unsplash.com/photo-1625409723595-667034081342?w=800"},
            {"name": "Bắc Giang", "keywords": ["Bac Giang", "Bắc Giang"], "image": None},
            {"name": "Bắc Kạn", "keywords": ["Bac Kan", "Bắc Kạn", "Ba Be"], "image": None},
            {"name": "Bạc Liêu", "keywords": ["Bac Lieu", "Bạc Liêu"], "image": None},
            {"name": "Bắc Ninh", "keywords": ["Bac Ninh", "Bắc Ninh"], "image": None},
            {"name": "Bến Tre", "keywords": ["Ben Tre", "Bến Tre"], "image": None},
            {"name": "Bình Định", "keywords": ["Binh Dinh", "Bình Định", "Quy Nhon"], "image": "https://images.unsplash.com/photo-1646622765668-225053019c12?w=800"},
            {"name": "Bình Dương", "keywords": ["Binh Duong", "Bình Dương"], "image": None},
            {"name": "Bình Phước", "keywords": ["Binh Phuoc", "Bình Phước"], "image": None},
            {"name": "Cà Mau", "keywords": ["Ca Mau", "Cà Mau"], "image": None},
            {"name": "Cao Bằng", "keywords": ["Cao Bang", "Cao Bằng", "Ban Gioc"], "image": "https://images.unsplash.com/photo-1618802324738-4f0527a47153?w=800"},
            {"name": "Đắk Lắk", "keywords": ["Dak Lak", "Đắk Lắk", "Buon Ma Thuot"], "image": None},
            {"name": "Đắk Nông", "keywords": ["Dak Nong", "Đắk Nông"], "image": None},
            {"name": "Điện Biên", "keywords": ["Dien Bien", "Điện Biên"], "image": None},
            {"name": "Đồng Nai", "keywords": ["Dong Nai", "Đồng Nai"], "image": None},
            {"name": "Đồng Tháp", "keywords": ["Dong Thap", "Đồng Tháp"], "image": None},
            {"name": "Gia Lai", "keywords": ["Gia Lai", "Pleiku"], "image": None},
            {"name": "Hà Nam", "keywords": ["Ha Nam", "Hà Nam"], "image": None},
            {"name": "Hà Tĩnh", "keywords": ["Ha Tinh", "Hà Tĩnh"], "image": None},
            {"name": "Hải Dương", "keywords": ["Hai Duong", "Hải Dương"], "image": None},
            {"name": "Hải Phòng", "keywords": ["Hai Phong", "Hải Phòng", "Cat Ba"], "image": "https://images.unsplash.com/photo-1598527782678-d46a66527530?w=800"},
            {"name": "Hậu Giang", "keywords": ["Hau Giang", "Hậu Giang"], "image": None},
            {"name": "Hòa Bình", "keywords": ["Hoa Binh", "Hòa Bình", "Mai Chau"], "image": None},
            {"name": "Hưng Yên", "keywords": ["Hung Yen", "Hưng Yên"], "image": None},
            {"name": "Kon Tum", "keywords": ["Kon Tum"], "image": None},
            {"name": "Lai Châu", "keywords": ["Lai Chau", "Lai Châu"], "image": None},
            {"name": "Lạng Sơn", "keywords": ["Lang Son", "Lạng Sơn"], "image": None},
            {"name": "Long An", "keywords": ["Long An"], "image": None},
            {"name": "Nam Định", "keywords": ["Nam Dinh", "Nam Định"], "image": None},
            {"name": "Nghệ An", "keywords": ["Nghe An", "Nghệ An", "Vinh"], "image": None},
            {"name": "Ninh Thuận", "keywords": ["Ninh Thuan", "Ninh Thuận", "Phan Rang"], "image": "https://images.unsplash.com/photo-1596627828222-4747251485f7?w=800"},
            {"name": "Phú Thọ", "keywords": ["Phu Tho", "Phú Thọ"], "image": None},
            {"name": "Phú Yên", "keywords": ["Phu Yen", "Phú Yên"], "image": "https://images.unsplash.com/photo-1623656588286-a1e24d543495?w=800"},
            {"name": "Quảng Ngãi", "keywords": ["Quang Ngai", "Quảng Ngãi", "Ly Son"], "image": None},
            {"name": "Quảng Trị", "keywords": ["Quang Tri", "Quảng Trị"], "image": None},
            {"name": "Sóc Trăng", "keywords": ["Soc Trang", "Sóc Trăng"], "image": None},
            {"name": "Sơn La", "keywords": ["Son La", "Sơn La", "Moc Chau"], "image": "https://images.unsplash.com/photo-1611024847487-e26177381a3f?w=800"},
            {"name": "Tây Ninh", "keywords": ["Tay Ninh", "Tây Ninh"], "image": None},
            {"name": "Thái Bình", "keywords": ["Thai Binh", "Thái Bình"], "image": None},
            {"name": "Thái Nguyên", "keywords": ["Thai Nguyen", "Thái Nguyên"], "image": None},
            {"name": "Thanh Hóa", "keywords": ["Thanh Hoa", "Thanh Hóa", "Pu Luong"], "image": None},
            {"name": "Tiền Giang", "keywords": ["Tien Giang", "Tiền Giang", "My Tho"], "image": None},
            {"name": "Trà Vinh", "keywords": ["Tra Vinh", "Trà Vinh"], "image": None},
            {"name": "Tuyên Quang", "keywords": ["Tuyen Quang", "Tuyên Quang"], "image": None},
            {"name": "Vĩnh Long", "keywords": ["Vinh Long", "Vĩnh Long"], "image": None},
            {"name": "Vĩnh Phúc", "keywords": ["Vinh Phuc", "Vĩnh Phúc", "Tam Dao"], "image": None},
            {"name": "Yên Bái", "keywords": ["Yen Bai", "Yên Bái", "Mu Cang Chai"], "image": "https://images.unsplash.com/photo-1568318266362-d4f7a7c4d1d3?w=800"},
        ]
        
        # Get all active tours
        tours = Tour.query.filter_by(status='active').all()
        
        ranking = []
        for province in provinces:
            count = 0
            rating_sum = 0
            reviews_count = 0
            
            for tour in tours:
                # Check if tour location matches any keyword
                location_match = False
                if tour.starting_location:
                    for keyword in province['keywords']:
                        if keyword.lower() in tour.starting_location.lower():
                            location_match = True
                            break
                
                if location_match:
                    count += 1
                    rating_sum += tour.rating or 0
                    reviews_count += tour.reviews_count or 0
            
            if count > 0:
                avg_rating = rating_sum / count if count > 0 else 0
                ranking.append({
                    "name": province['name'],
                    "tour_count": count,
                    "avg_rating": round(avg_rating, 1),
                    "total_reviews": reviews_count,
                    "image": province['image']
                })
        
        # Sort by tour count descending
        ranking.sort(key=lambda x: x['tour_count'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': ranking
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy bảng xếp hạng: {str(e)}'}), 500