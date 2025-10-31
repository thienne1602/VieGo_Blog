from flask import Blueprint, jsonify, request
from models import db
from models.user import User
from sqlalchemy import desc, or_

users_bp = Blueprint('users', __name__)

@users_bp.route('/api/users', methods=['GET'])
def get_users():
    """Get all users (public info only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        # Query users
        users_query = User.query
        
        # Search filter
        if search:
            users_query = users_query.filter(
                or_(
                    User.username.like(f'%{search}%'),
                    User.full_name.like(f'%{search}%')
                )
            )
        
        # Order by created_at
        users_query = users_query.order_by(desc(User.created_at))
        
        # Pagination
        pagination = users_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        users = [user.to_dict_public() for user in pagination.items]
        
        return jsonify({
            'success': True,
            'data': users,
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
            'error': f'Lỗi lấy users: {str(e)}'
        }), 500

@users_bp.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get a single user by ID (public info)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy user'
            }), 404
        
        return jsonify({
            'success': True,
            'data': user.to_dict_public()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy user: {str(e)}'
        }), 500

@users_bp.route('/api/users/<string:username>/profile', methods=['GET'])
def get_user_profile(username):
    """Get user profile by username"""
    try:
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy user'
            }), 404
        
        return jsonify({
            'success': True,
            'data': user.to_dict_public()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy profile: {str(e)}'
        }), 500
