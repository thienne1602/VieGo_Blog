from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
import re
from sqlalchemy import func

from models.user import User, db
from models.user_settings import UserSettings
from utils.jwt_utils import get_current_user_id
from utils.participant_onboarding import reset_user_password
from utils.email import send_password_reset_email

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Mật khẩu phải có ít nhất 8 ký tự"
    if not re.search(r'[A-Za-z]', password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ cái"
    if not re.search(r'[0-9]', password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ số"
    return True, "Hợp lệ"


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Reset password and send new password to user's email.

    Security note: response is generic to avoid account enumeration.
    """
    try:
        data = request.get_json() or {}
        identifier = (data.get('identifier') or '').strip().lower()
        if not identifier:
            return jsonify({'error': 'Vui lòng nhập tên đăng nhập hoặc email'}), 400

        # Helpful diagnostics (does not change the response to clients).
        try:
            print(f"[AUTH] Forgot-password requested identifier={identifier} ip={request.remote_addr}")
        except Exception:
            pass

        user = User.query.filter(
            (func.lower(User.username) == identifier) | (func.lower(User.email) == identifier)
        ).first()

        # Always return generic success message.
        generic_ok = {
            'message': 'Nếu tài khoản tồn tại, mật khẩu mới đã được gửi về email của bạn.'
        }

        if not user or not user.is_active:
            print(f"[EMAIL] Forgot-password no-op: user_not_found_or_inactive identifier={identifier}")
            return jsonify(generic_ok), 200

        if not getattr(user, 'email', None):
            print(f"[EMAIL] Forgot-password skipped: user_id={user.id} has no email")
            return jsonify(generic_ok), 200

        # IMPORTANT: don't commit the password change unless email was accepted for delivery.
        new_password = reset_user_password(user, length=12)
        ok, err = send_password_reset_email(
            recipient_email=user.email,
            username=user.username,
            new_password=new_password,
            full_name=user.full_name,
        )
        if not ok:
            # Don't leak user existence; but provide actionable error for configured environments.
            # Keep generic response, log for server.
            print(
                f"[EMAIL] Forgot-password send failed for user_id={user.id} to={user.email}: {err} (rolling back password reset)"
            )
            db.session.rollback()
        else:
            db.session.commit()
            print(f"[EMAIL] Forgot-password email queued for user_id={user.id} to={user.email}")
        return jsonify(generic_ok), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi quên mật khẩu: {str(e)}'}), 500


def _coerce_user_id(user_id):
    if isinstance(user_id, str) and user_id.isdigit():
        return int(user_id)
    return user_id


def _get_or_create_user_settings(user_id) -> UserSettings:
    user_id = _coerce_user_id(user_id)
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if settings:
        return settings
    settings = UserSettings(user_id=user_id)
    db.session.add(settings)
    return settings


@auth_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_settings():
    try:
        user_id = _coerce_user_id(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404

        settings = _get_or_create_user_settings(user_id)
        db.session.commit()
        return jsonify({'settings': settings.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi lấy cài đặt: {str(e)}'}), 500


@auth_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    try:
        user_id = _coerce_user_id(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404

        data = request.get_json() or {}
        settings = _get_or_create_user_settings(user_id)

        privacy = data.get('privacy') or {}
        web = data.get('web') or {}

        if 'show_email' in privacy:
            settings.privacy_show_email = bool(privacy.get('show_email'))
        if 'allow_messages' in privacy:
            settings.privacy_allow_messages = bool(privacy.get('allow_messages'))
        if 'allow_friend_requests' in privacy:
            settings.privacy_allow_friend_requests = bool(privacy.get('allow_friend_requests'))

        if 'email_notifications' in web:
            settings.web_email_notifications = bool(web.get('email_notifications'))
        if 'ui_theme' in web:
            theme = (web.get('ui_theme') or 'system').strip().lower()
            if theme not in ('system', 'light', 'dark'):
                return jsonify({'error': 'ui_theme không hợp lệ'}), 400
            settings.web_ui_theme = theme

        db.session.commit()
        return jsonify({'message': 'Cập nhật cài đặt thành công!', 'settings': settings.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cập nhật cài đặt: {str(e)}'}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        
        # Validate required fields
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        
        if not all([username, email, password]):
            return jsonify({'error': 'Thiếu thông tin bắt buộc'}), 400
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Email không hợp lệ'}), 400
        
        # Validate password strength
        is_valid, password_msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': password_msg}), 400
        
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Tên người dùng đã tồn tại'}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email đã được sử dụng'}), 409
        
        # Create new user
        user = User(username=username, email=email, password=password)
        if full_name:
            user.full_name = full_name
        
        # Add initial points for registration
        user.add_points(50)
        user.add_badge('welcome')
        
        db.session.add(user)
        db.session.commit()
        
        # Generate access token - identity must be string
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(days=7)
        )
        
        return jsonify({
            'message': 'Đăng ký thành công!',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi đăng ký: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        # Get login credentials
        identifier = data.get('identifier', '').strip().lower()  # username or email
        password = data.get('password', '')
        
        if not all([identifier, password]):
            return jsonify({'error': 'Thiếu thông tin đăng nhập'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == identifier) | (User.email == identifier)
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Thông tin đăng nhập không chính xác'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Tài khoản đã bị vô hiệu hóa'}), 403
        
        # Check if account is banned
        if user.is_account_banned():
            banned_until = user.account_banned_until
            if banned_until:
                banned_until_str = banned_until.strftime("%d/%m/%Y %H:%M")
                return jsonify({
                    'error': f'Tài khoản của bạn đã bị khóa đến {banned_until_str}',
                    'ban_type': 'account',
                    'banned_until': banned_until.isoformat()
                }), 403
            else:
                return jsonify({
                    'error': 'Tài khoản của bạn đã bị khóa vĩnh viễn',
                    'ban_type': 'account'
                }), 403
        
        # Update updated_at timestamp
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Generate access token - identity must be string
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(days=7)
        )
        
        # Store language preference in session - default to Vietnamese
        session['language'] = 'vi'
        
        return jsonify({
            'message': 'Đăng nhập thành công!',
            'access_token': access_token,
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi đăng nhập: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """Get current user profile (alias for /profile)"""
    try:
        user_id = get_current_user_id()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        return jsonify({
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thông tin: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = get_current_user_id()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        return jsonify({
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thông tin: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = ['full_name', 'bio', 'avatar_url', 'cover_image_url', 
                         'location', 'language', 'timezone']
        
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        # Update seller email and password if user is seller and fields are provided
        if user.role == 'seller':
            if 'seller_email' in data:
                seller_email = data['seller_email'].strip().lower() if data['seller_email'] else None
                if seller_email:
                    # Validate email format
                    if not validate_email(seller_email):
                        return jsonify({'error': 'Email seller không hợp lệ'}), 400
                user.seller_email = seller_email
            
            if 'seller_email_password' in data:
                seller_password = data['seller_email_password']
                if seller_password:
                    # Only update if password is provided (not empty)
                    user.set_seller_email_password(seller_password)
                elif seller_password == '':
                    # Empty string means clear the password
                    user.seller_email_password = None
            
            # Update company information fields
            company_fields = [
                'company_name', 'company_address', 'company_phone', 
                'company_tax_id', 'company_email', 'bank_account_number',
                'bank_name', 'bank_account_holder'
            ]
            for field in company_fields:
                if field in data:
                    setattr(user, field, data[field].strip() if isinstance(data[field], str) else data[field])
            
            # Validate company email if provided
            if 'company_email' in data and data['company_email']:
                company_email = data['company_email'].strip().lower()
                if not validate_email(company_email):
                    return jsonify({'error': 'Email công ty không hợp lệ'}), 400
        
        # Update social links if provided
        if 'social_links' in data:
            user.set_social_links(data['social_links'])
        
        # Update session language if changed - default to Vietnamese
        session['language'] = 'vi'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật thông tin thành công!',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cập nhật: {str(e)}'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not all([current_password, new_password]):
            return jsonify({'error': 'Thiếu thông tin mật khẩu'}), 400
        
        # Verify current password
        if not user.check_password(current_password):
            return jsonify({'error': 'Mật khẩu hiện tại không đúng'}), 401
        
        # Validate new password
        is_valid, password_msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': password_msg}), 400
        
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Đổi mật khẩu thành công!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi đổi mật khẩu: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout"""
    # Clear session
    session.clear()
    
    return jsonify({'message': 'Đăng xuất thành công!'}), 200

@auth_bp.route('/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify JWT token validity"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'Token không hợp lệ'}), 401
        
        return jsonify({
            'valid': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Token không hợp lệ'}), 401

@auth_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user statistics for gamification"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        stats = user.get_stats()
        
        # Calculate progress to next level
        current_level_points = (user.level - 1) * 1000
        next_level_points = user.level * 1000
        level_progress = ((user.points - current_level_points) / 1000) * 100
        
        return jsonify({
            'stats': stats,
            'gamification': {
                'level': user.level,
                'points': user.points,
                'badges': user.get_badges(),
                'level_progress': min(100, max(0, level_progress)),
                'next_level_points': next_level_points
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thống kê: {str(e)}'}), 500