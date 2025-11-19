"""
Authentication and Authorization Decorators
"""
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models.user import User


def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get(current_user_id)
            
            if not current_user:
                return jsonify({'error': 'User not found'}), 404
            
            if not current_user.is_active:
                return jsonify({'error': 'Account is deactivated'}), 403
            
            return f(current_user, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': f'Authentication failed: {str(e)}'}), 401
    
    return decorated_function


def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated_function


def seller_required(f):
    """Decorator to require seller or admin role"""
    @wraps(f)
    def decorated_function(current_user, *args, **kwargs):
        if current_user.role not in ['seller', 'admin']:
            return jsonify({'error': 'Seller access required'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated_function


def tour_guide_required(f):
    """Decorator to require tour_guide role"""
    @wraps(f)
    def decorated_function(current_user, *args, **kwargs):
        if current_user.role not in ['tour_guide', 'admin']:
            return jsonify({'error': 'Tour guide access required'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated_function


def moderator_required(f):
    """Decorator to require moderator or admin role"""
    @wraps(f)
    def decorated_function(current_user, *args, **kwargs):
        if current_user.role not in ['moderator', 'admin']:
            return jsonify({'error': 'Moderator access required'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated_function
