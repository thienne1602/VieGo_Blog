from flask import Blueprint, jsonify, request
from models import db
from models.location import Location
from sqlalchemy import desc

locations_bp = Blueprint('locations', __name__)

@locations_bp.route('/api/locations', methods=['GET'])
def get_locations():
    """Get all locations"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Query locations
        locations_query = Location.query.order_by(desc(Location.created_at))
        
        # Pagination
        pagination = locations_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        locations = [location.to_dict() for location in pagination.items]
        
        return jsonify({
            'success': True,
            'data': locations,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy locations: {str(e)}'
        }), 500

@locations_bp.route('/api/locations/<int:location_id>', methods=['GET'])
def get_location(location_id):
    """Get a single location by ID"""
    try:
        location = Location.query.get(location_id)
        
        if not location:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy location'
            }), 404
        
        return jsonify({
            'success': True,
            'data': location.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy location: {str(e)}'
        }), 500

@locations_bp.route('/api/locations/featured', methods=['GET'])
def get_featured_locations():
    """Get featured locations"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        locations = Location.query.filter_by(is_featured=True)\
            .order_by(desc(Location.created_at))\
            .limit(limit)\
            .all()
        
        return jsonify({
            'success': True,
            'data': [location.to_dict() for location in locations]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy featured locations: {str(e)}'
        }), 500
