"""
Upload Routes for VieGo Blog
Handles file uploads (images, videos) with validation and optimization
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

from models import db
from models.user import User

upload_bp = Blueprint('upload', __name__, url_prefix='/api/upload')

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'mov', 'avi'}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB


def allowed_file(filename, allowed_extensions):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


def generate_unique_filename(original_filename):
    """Generate unique filename using UUID"""
    ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    unique_name = f"{uuid.uuid4().hex}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    return f"{unique_name}.{ext}" if ext else unique_name


@upload_bp.route('/image', methods=['POST'])
@jwt_required()
def upload_image():
    """Upload image file"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'Không có file được upload'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'Không có file được chọn'}), 400
        
        # Validate file type
        if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            return jsonify({
                'error': f'Định dạng file không hợp lệ. Chỉ chấp nhận: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}'
            }), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_IMAGE_SIZE:
            return jsonify({'error': f'File quá lớn. Kích thước tối đa: {MAX_IMAGE_SIZE / (1024*1024)}MB'}), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = generate_unique_filename(filename)
        
        # Create upload directory if not exists
        upload_folder = current_app.config['UPLOAD_FOLDER']
        images_folder = os.path.join(upload_folder, 'images')
        os.makedirs(images_folder, exist_ok=True)
        
        # Save file
        file_path = os.path.join(images_folder, unique_filename)
        file.save(file_path)
        
        # Generate URL
        file_url = f"/uploads/images/{unique_filename}"
        
        return jsonify({
            'message': 'Upload ảnh thành công!',
            'url': file_url,
            'filename': unique_filename,
            'size': file_size
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Lỗi upload ảnh: {str(e)}'}), 500


@upload_bp.route('/images', methods=['POST'])
@jwt_required()
def upload_multiple_images():
    """Upload multiple image files"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Check if files are in request
        if 'files' not in request.files:
            return jsonify({'error': 'Không có file được upload'}), 400
        
        files = request.files.getlist('files')
        
        if not files or len(files) == 0:
            return jsonify({'error': 'Không có file được chọn'}), 400
        
        # Limit number of files
        max_files = 10
        if len(files) > max_files:
            return jsonify({'error': f'Chỉ được upload tối đa {max_files} ảnh cùng lúc'}), 400
        
        uploaded_files = []
        errors = []
        
        # Create upload directory
        upload_folder = current_app.config['UPLOAD_FOLDER']
        images_folder = os.path.join(upload_folder, 'images')
        os.makedirs(images_folder, exist_ok=True)
        
        for file in files:
            try:
                # Validate file
                if not file.filename:
                    errors.append({'filename': 'unknown', 'error': 'Tên file không hợp lệ'})
                    continue
                
                if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
                    errors.append({'filename': file.filename, 'error': 'Định dạng không hợp lệ'})
                    continue
                
                # Check file size
                file.seek(0, os.SEEK_END)
                file_size = file.tell()
                file.seek(0)
                
                if file_size > MAX_IMAGE_SIZE:
                    errors.append({'filename': file.filename, 'error': 'File quá lớn'})
                    continue
                
                # Generate unique filename
                filename = secure_filename(file.filename)
                unique_filename = generate_unique_filename(filename)
                
                # Save file
                file_path = os.path.join(images_folder, unique_filename)
                file.save(file_path)
                
                # Add to uploaded list
                uploaded_files.append({
                    'url': f"/uploads/images/{unique_filename}",
                    'filename': unique_filename,
                    'original_name': filename,
                    'size': file_size
                })
                
            except Exception as e:
                errors.append({'filename': file.filename, 'error': str(e)})
        
        return jsonify({
            'message': f'Upload thành công {len(uploaded_files)}/{len(files)} ảnh',
            'uploaded': uploaded_files,
            'errors': errors if errors else None
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Lỗi upload ảnh: {str(e)}'}), 500


@upload_bp.route('/video', methods=['POST'])
@jwt_required()
def upload_video():
    """Upload video file"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'Không có file được upload'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'Không có file được chọn'}), 400
        
        # Validate file type
        if not allowed_file(file.filename, ALLOWED_VIDEO_EXTENSIONS):
            return jsonify({
                'error': f'Định dạng file không hợp lệ. Chỉ chấp nhận: {", ".join(ALLOWED_VIDEO_EXTENSIONS)}'
            }), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_VIDEO_SIZE:
            return jsonify({'error': f'Video quá lớn. Kích thước tối đa: {MAX_VIDEO_SIZE / (1024*1024)}MB'}), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = generate_unique_filename(filename)
        
        # Create upload directory if not exists
        upload_folder = current_app.config['UPLOAD_FOLDER']
        videos_folder = os.path.join(upload_folder, 'videos')
        os.makedirs(videos_folder, exist_ok=True)
        
        # Save file
        file_path = os.path.join(videos_folder, unique_filename)
        file.save(file_path)
        
        # Generate URL
        file_url = f"/uploads/videos/{unique_filename}"
        
        return jsonify({
            'message': 'Upload video thành công!',
            'url': file_url,
            'filename': unique_filename,
            'size': file_size
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Lỗi upload video: {str(e)}'}), 500


@upload_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    """Upload user avatar"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'Không có file được upload'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'Không có file được chọn'}), 400
        
        # Validate file type
        if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            return jsonify({
                'error': f'Định dạng file không hợp lệ. Chỉ chấp nhận: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}'
            }), 400
        
        # Check file size (max 5MB for avatar)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        max_avatar_size = 5 * 1024 * 1024  # 5MB
        if file_size > max_avatar_size:
            return jsonify({'error': 'Avatar quá lớn. Kích thước tối đa: 5MB'}), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = generate_unique_filename(filename)
        
        # Create upload directory if not exists
        upload_folder = current_app.config['UPLOAD_FOLDER']
        avatars_folder = os.path.join(upload_folder, 'avatars')
        os.makedirs(avatars_folder, exist_ok=True)
        
        # Save file
        file_path = os.path.join(avatars_folder, unique_filename)
        file.save(file_path)
        
        # Update user avatar URL
        avatar_url = f"/uploads/avatars/{unique_filename}"
        user.avatar_url = avatar_url
        db.session.commit()
        
        return jsonify({
            'message': 'Upload avatar thành công!',
            'url': avatar_url,
            'filename': unique_filename
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi upload avatar: {str(e)}'}), 500
