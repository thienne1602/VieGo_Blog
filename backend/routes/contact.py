"""
Contact/Support Routes for VieGo Blog
Handles user contact and support requests
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import desc

from models import db
from models.user import User
from models.contact import Contact

contact_bp = Blueprint('contact', __name__, url_prefix='/api/contact')

@contact_bp.route('/', methods=['POST'])
def create_contact():
    """Create a new contact/support request"""
    try:
        data = request.get_json()
        
        # Get user info if authenticated
        user_id = None
        try:
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            if current_user_id:
                user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
                user = User.query.get(user_id_int)
                if user:
                    user_id = user_id_int
                    # Use user info if not provided
                    if not data.get('name'):
                        data['name'] = user.full_name or user.username
                    if not data.get('email'):
                        data['email'] = user.email
        except:
            pass
        
        # Validate required fields
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()
        category = data.get('category', 'general')
        
        if not all([name, email, subject, message]):
            return jsonify({'error': 'Vui lòng điền đầy đủ thông tin'}), 400
        
        # Create contact request
        contact = Contact(
            user_id=user_id,
            name=name,
            email=email,
            phone=data.get('phone', ''),
            subject=subject,
            message=message,
            category=category,
            priority=data.get('priority', 'medium'),
            status='pending'
        )
        
        # Set attachments if provided
        if 'attachments' in data:
            contact.set_attachments(data['attachments'])
        
        db.session.add(contact)
        db.session.commit()
        
        return jsonify({
            'message': 'Gửi yêu cầu hỗ trợ thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.',
            'contact': contact.to_dict(include_message=False)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi gửi yêu cầu: {str(e)}'}), 500

@contact_bp.route('/my-requests', methods=['GET'])
@jwt_required()
def get_my_contacts():
    """Get current user's contact requests"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        query = Contact.query.filter_by(user_id=user_id_int)
        query = query.order_by(desc(Contact.created_at))
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        contacts = [contact.to_dict(include_message=True) for contact in pagination.items]
        
        return jsonify({
            'contacts': contacts,
            'pagination': {
                'currentPage': page,
                'perPage': per_page,
                'totalPages': pagination.pages,
                'totalItems': pagination.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách yêu cầu: {str(e)}'}), 500

@contact_bp.route('/<int:contact_id>', methods=['GET'])
@jwt_required()
def get_contact(contact_id):
    """Get a specific contact request (user can only see their own)"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        contact = Contact.query.get_or_404(contact_id)
        
        # Check if user owns this contact or is moderator/admin
        user = User.query.get(user_id_int)
        if contact.user_id != user_id_int and user.role not in ['admin', 'moderator']:
            return jsonify({'error': 'Không có quyền xem yêu cầu này'}), 403
        
        return jsonify({'contact': contact.to_dict(include_message=True)}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thông tin yêu cầu: {str(e)}'}), 500

