from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.story import Story
from models.user import User
from sqlalchemy import desc, and_
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
import os
import uuid

stories_bp = Blueprint('stories', __name__)

# Allowed file extensions for stories
ALLOWED_STORY_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mov'}
MAX_STORY_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_STORY_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB for short videos

def allowed_file(filename, allowed_extensions):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def generate_unique_filename(original_filename):
    """Generate unique filename using UUID"""
    ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    unique_name = f"{uuid.uuid4().hex}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    return f"{unique_name}.{ext}" if ext else unique_name

@stories_bp.route('/api/stories', methods=['GET'])
def get_stories():
    """Get active stories (not expired and not archived)"""
    try:
        # Get only non-expired and non-archived stories
        now = datetime.utcnow()
        
        # First, auto-archive expired stories
        expired_stories = Story.query\
            .filter(and_(
                Story.expires_at <= now,
                Story.is_archived == False
            ))\
            .all()
        
        for story in expired_stories:
            story.is_archived = True
        
        if expired_stories:
            db.session.commit()
        
        # Get active stories (not expired and not archived)
        stories = Story.query\
            .filter(and_(
                Story.expires_at > now,
                Story.is_archived == False
            ))\
            .order_by(desc(Story.created_at))\
            .all()
        
        # Group stories by user - now includes ALL active stories for each user
        stories_by_user = {}
        for story in stories:
            user = User.query.get(story.user_id)
            if user:
                if user.id not in stories_by_user:
                    stories_by_user[user.id] = {
                        'user': user.to_dict_public(),
                        'stories': []
                    }
                stories_by_user[user.id]['stories'].append(story.to_dict())
        
        # Sort stories within each user by created_at (newest first)
        for user_data in stories_by_user.values():
            user_data['stories'].sort(key=lambda x: x['created_at'], reverse=True)
        
        result = list(stories_by_user.values())
        
        return jsonify({
            'success': True,
            'data': result,
            'total': len(stories)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy stories: {str(e)}'
        }), 500

@stories_bp.route('/api/stories/<int:story_id>', methods=['GET'])
def get_story(story_id):
    """Get a single story by ID"""
    try:
        story = Story.query.get(story_id)
        
        if not story:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy story'
            }), 404
        
        # Check if expired
        if story.expires_at < datetime.utcnow():
            return jsonify({
                'success': False,
                'error': 'Story đã hết hạn'
            }), 410  # Gone
        
        return jsonify({
            'success': True,
            'data': story.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy story: {str(e)}'
        }), 500

@stories_bp.route('/api/stories/user/<int:user_id>', methods=['GET'])
def get_user_stories(user_id):
    """Get active stories by user ID (not expired and not archived)"""
    try:
        now = datetime.utcnow()
        
        stories = Story.query\
            .filter(and_(
                Story.user_id == user_id,
                Story.expires_at > now,
                Story.is_archived == False
            ))\
            .order_by(desc(Story.created_at))\
            .all()
        
        return jsonify({
            'success': True,
            'data': [story.to_dict() for story in stories]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy user stories: {str(e)}'
        }), 500

@stories_bp.route('/api/stories/user/<int:user_id>/archived', methods=['GET'])
@jwt_required()
def get_user_archived_stories(user_id):
    """Get archived stories by user ID (only for the logged-in user)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Only allow users to view their own archived stories
        if current_user_id != user_id:
            return jsonify({
                'success': False,
                'error': 'Không có quyền xem stories của người dùng khác'
            }), 403
        
        stories = Story.query\
            .filter(and_(
                Story.user_id == user_id,
                Story.is_archived == True
            ))\
            .order_by(desc(Story.created_at))\
            .all()
        
        return jsonify({
            'success': True,
            'data': [story.to_dict() for story in stories],
            'total': len(stories)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy archived stories: {str(e)}'
        }), 500

@stories_bp.route('/api/stories/<int:story_id>/view', methods=['POST'])
def view_story(story_id):
    """Increment story view count"""
    try:
        story = Story.query.get(story_id)
        
        if not story:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy story'
            }), 404
        
        # Increment view count
        story.view_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'view_count': story.view_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Lỗi tăng view count: {str(e)}'
        }), 500

@stories_bp.route('/api/stories', methods=['POST'])
@jwt_required()
def create_story():
    """Create a new story (image or video)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy người dùng'
            }), 404
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'Không có file được upload'
            }), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Không có file được chọn'
            }), 400
        
        # Validate file type
        if not allowed_file(file.filename, ALLOWED_STORY_EXTENSIONS):
            return jsonify({
                'success': False,
                'error': f'Định dạng file không hợp lệ. Chỉ chấp nhận: {", ".join(ALLOWED_STORY_EXTENSIONS)}'
            }), 400
        
        # Determine media type
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        media_type = 'video' if file_ext in ['mp4', 'webm', 'mov'] else 'image'
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        max_size = MAX_STORY_VIDEO_SIZE if media_type == 'video' else MAX_STORY_IMAGE_SIZE
        if file_size > max_size:
            max_mb = max_size / (1024 * 1024)
            return jsonify({
                'success': False,
                'error': f'File quá lớn. Kích thước tối đa: {max_mb}MB'
            }), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        
        # Upload to Cloudinary
        from utils.cloudinary_helper import upload_to_cloudinary
        
        folder_name = "viego_blog/stories/images"
        resource_type = "image"
        
        if media_type == 'video':
            folder_name = "viego_blog/stories/videos"
            resource_type = "video"
            
        media_url = upload_to_cloudinary(file, folder=folder_name, resource_type=resource_type)
        
        if not media_url:
            return jsonify({
                'success': False,
                'error': 'Lỗi khi upload file lên Cloudinary'
            }), 500
        
        # Get content from form data (optional)
        content = request.form.get('content', '')
        
        # Create story
        story = Story(
            user_id=user_id,
            content=content if content else None,
            media_url=media_url,
            media_type=media_type
        )
        
        db.session.add(story)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Tạo story thành công!',
            'data': story.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Lỗi tạo story: {str(e)}'
        }), 500
