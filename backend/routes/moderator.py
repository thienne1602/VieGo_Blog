"""
Moderator Routes for VieGo Blog
Handles moderator-specific operations: post/comment management, banned keywords, notifications, and contact support
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy import func, desc, or_, and_
import json
import re

from models import db
from models.user import User
from models.post import Post
from models.comment import Comment
from models.banned_keyword import BannedKeyword
from models.contact import Contact
from models.notification import Notification
from models.chat import Chat
from routes.notifications import create_notification
from utils.socket_utils import emit_to_user

moderator_bp = Blueprint('moderator', __name__, url_prefix='/api/moderator')

# Moderator authorization decorator
def moderator_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
            user = User.query.get(user_id_int)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user.role not in ['admin', 'moderator']:
                return jsonify({'error': 'Moderator access required', 'current_role': user.role}), 403
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': f'Authorization error: {str(e)}'}), 500
    return decorated_function

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def check_banned_keywords(text):
    """Check if text contains any banned keywords"""
    if not text:
        return []
    
    text_lower = text.lower()
    banned_keywords = BannedKeyword.query.filter_by(is_active=True).all()
    
    found_keywords = []
    for keyword_obj in banned_keywords:
        keyword = keyword_obj.keyword.lower()
        # Check if keyword appears in text (case-insensitive)
        if keyword in text_lower:
            found_keywords.append({
                'keyword': keyword_obj.keyword,
                'severity': keyword_obj.severity,
                'description': keyword_obj.description
            })
    
    return found_keywords

# ============================================================================
# POSTS MANAGEMENT
# ============================================================================

@moderator_bp.route('/posts', methods=['GET'])
@moderator_required
def get_posts():
    """Get all posts with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        category = request.args.get('category', '')
        
        query = Post.query
        
        # Apply filters
        if search:
            query = query.filter(or_(
                Post.title.contains(search),
                Post.content.contains(search),
                Post.excerpt.contains(search)
            ))
        
        if status:
            query = query.filter_by(status=status)
        
        if category:
            query = query.filter_by(category=category)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Post.created_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        posts = []
        for post in pagination.items:
            author = User.query.get(post.author_id)
            post_dict = post.to_dict(include_content=True)
            post_dict['author'] = {
                'id': author.id,
                'username': author.username,
                'full_name': author.full_name,
                'avatar_url': author.avatar_url
            } if author else None
            
            # Check for banned keywords
            content_text = f"{post.title} {post.content} {post.excerpt or ''}"
            banned_found = check_banned_keywords(content_text)
            post_dict['has_banned_keywords'] = len(banned_found) > 0
            post_dict['banned_keywords'] = banned_found
            
            posts.append(post_dict)
        
        return jsonify({
            'posts': posts,
            'pagination': {
                'currentPage': page,
                'perPage': per_page,
                'totalPages': pagination.pages,
                'totalItems': pagination.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách bài viết: {str(e)}'}), 500

@moderator_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@moderator_required
def delete_post(post_id):
    """Delete a post"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        post = Post.query.get_or_404(post_id)
        author = User.query.get(post.author_id)
        
        # Delete the post
        db.session.delete(post)
        db.session.commit()
        
        # Send notification to author
        if author:
            create_notification(
                user_id=author.id,
                type='post_deleted',
                message=f'Bài viết "{post.title}" của bạn đã bị xóa bởi moderator',
                title='Bài viết đã bị xóa',
                actor_id=user_id_int,
                related_type='post',
                related_id=post_id,
                action_url=f'/posts/{post.slug}'
            )
        
        return jsonify({'message': 'Xóa bài viết thành công!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa bài viết: {str(e)}'}), 500

@moderator_bp.route('/posts/search-banned', methods=['GET'])
@moderator_required
def search_posts_with_banned_keywords():
    """Search for posts containing banned keywords"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        keyword = request.args.get('keyword', '').lower()
        
        # Get all active banned keywords
        banned_keywords = BannedKeyword.query.filter_by(is_active=True).all()
        
        if keyword:
            # Filter by specific keyword
            banned_keywords = [bk for bk in banned_keywords if keyword in bk.keyword.lower()]
        
        if not banned_keywords:
            return jsonify({
                'posts': [],
                'pagination': {
                    'currentPage': page,
                    'perPage': per_page,
                    'totalPages': 0,
                    'totalItems': 0
                }
            }), 200
        
        # Search posts containing banned keywords
        keyword_list = [bk.keyword.lower() for bk in banned_keywords]
        all_posts = Post.query.all()
        
        matching_posts = []
        for post in all_posts:
            content_text = f"{post.title} {post.content} {post.excerpt or ''}".lower()
            found_keywords = []
            for kw in keyword_list:
                if kw in content_text:
                    found_keywords.append(kw)
            
            if found_keywords:
                author = User.query.get(post.author_id)
                post_dict = post.to_dict(include_content=True)
                post_dict['author'] = {
                    'id': author.id,
                    'username': author.username,
                    'full_name': author.full_name,
                    'avatar_url': author.avatar_url
                } if author else None
                post_dict['found_banned_keywords'] = found_keywords
                matching_posts.append(post_dict)
        
        # Paginate
        total = len(matching_posts)
        start = (page - 1) * per_page
        end = start + per_page
        paginated_posts = matching_posts[start:end]
        
        return jsonify({
            'posts': paginated_posts,
            'pagination': {
                'currentPage': page,
                'perPage': per_page,
                'totalPages': (total + per_page - 1) // per_page,
                'totalItems': total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi tìm kiếm: {str(e)}'}), 500

# ============================================================================
# COMMENTS MANAGEMENT
# ============================================================================

@moderator_bp.route('/comments', methods=['GET'])
@moderator_required
def get_comments():
    """Get all comments with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        post_id = request.args.get('post_id', type=int)
        
        query = Comment.query
        
        # Apply filters
        if search:
            query = query.filter(Comment.content.contains(search))
        
        if status:
            query = query.filter_by(status=status)
        
        if post_id:
            query = query.filter_by(post_id=post_id)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Comment.created_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        comments = []
        for comment in pagination.items:
            author = User.query.get(comment.author_id)
            post = Post.query.get(comment.post_id)
            
            comment_dict = comment.to_dict(include_replies=False)
            comment_dict['author'] = {
                'id': author.id,
                'username': author.username,
                'full_name': author.full_name,
                'avatar_url': author.avatar_url
            } if author else None
            comment_dict['post'] = {
                'id': post.id,
                'title': post.title,
                'slug': post.slug
            } if post else None
            
            # Check for banned keywords
            banned_found = check_banned_keywords(comment.content)
            comment_dict['has_banned_keywords'] = len(banned_found) > 0
            comment_dict['banned_keywords'] = banned_found
            
            comments.append(comment_dict)
        
        return jsonify({
            'comments': comments,
            'pagination': {
                'currentPage': page,
                'perPage': per_page,
                'totalPages': pagination.pages,
                'totalItems': pagination.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách bình luận: {str(e)}'}), 500

@moderator_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@moderator_required
def delete_comment(comment_id):
    """Delete a comment"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        comment = Comment.query.get_or_404(comment_id)
        author = User.query.get(comment.author_id)
        post = Post.query.get(comment.post_id)
        
        # Soft delete - change status
        comment.status = 'rejected'
        
        # Update post comment count
        if post and post.comments_count > 0:
            post.comments_count -= 1
        
        db.session.commit()
        
        # Send notification to author
        if author:
            create_notification(
                user_id=author.id,
                type='comment_deleted',
                message=f'Bình luận của bạn về bài viết "{post.title if post else ""}" đã bị xóa bởi moderator',
                title='Bình luận đã bị xóa',
                actor_id=user_id_int,
                related_type='comment',
                related_id=comment_id,
                action_url=f'/posts/{post.slug}' if post else None
            )
        
        return jsonify({'message': 'Xóa bình luận thành công!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa bình luận: {str(e)}'}), 500

@moderator_bp.route('/comments/search-banned', methods=['GET'])
@moderator_required
def search_comments_with_banned_keywords():
    """Search for comments containing banned keywords"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        keyword = request.args.get('keyword', '').lower()
        
        # Get all active banned keywords
        banned_keywords = BannedKeyword.query.filter_by(is_active=True).all()
        
        if keyword:
            banned_keywords = [bk for bk in banned_keywords if keyword in bk.keyword.lower()]
        
        if not banned_keywords:
            return jsonify({
                'comments': [],
                'pagination': {
                    'currentPage': page,
                    'perPage': per_page,
                    'totalPages': 0,
                    'totalItems': 0
                }
            }), 200
        
        # Search comments containing banned keywords
        keyword_list = [bk.keyword.lower() for bk in banned_keywords]
        all_comments = Comment.query.all()
        
        matching_comments = []
        for comment in all_comments:
            content_lower = comment.content.lower()
            found_keywords = []
            for kw in keyword_list:
                if kw in content_lower:
                    found_keywords.append(kw)
            
            if found_keywords:
                author = User.query.get(comment.author_id)
                post = Post.query.get(comment.post_id)
                
                comment_dict = comment.to_dict(include_replies=False)
                comment_dict['author'] = {
                    'id': author.id,
                    'username': author.username,
                    'full_name': author.full_name,
                    'avatar_url': author.avatar_url
                } if author else None
                comment_dict['post'] = {
                    'id': post.id,
                    'title': post.title,
                    'slug': post.slug
                } if post else None
                comment_dict['found_banned_keywords'] = found_keywords
                matching_comments.append(comment_dict)
        
        # Paginate
        total = len(matching_comments)
        start = (page - 1) * per_page
        end = start + per_page
        paginated_comments = matching_comments[start:end]
        
        return jsonify({
            'comments': paginated_comments,
            'pagination': {
                'currentPage': page,
                'perPage': per_page,
                'totalPages': (total + per_page - 1) // per_page,
                'totalItems': total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi tìm kiếm: {str(e)}'}), 500

# ============================================================================
# BANNED KEYWORDS MANAGEMENT
# ============================================================================

@moderator_bp.route('/banned-keywords', methods=['GET'])
@moderator_required
def get_banned_keywords():
    """Get all banned keywords"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        search = request.args.get('search', '')
        is_active = request.args.get('is_active', type=bool)
        
        query = BannedKeyword.query
        
        if search:
            query = query.filter(BannedKeyword.keyword.contains(search))
        
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        query = query.order_by(desc(BannedKeyword.created_at))
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        keywords = [kw.to_dict() for kw in pagination.items]
        
        return jsonify({
            'keywords': keywords,
            'pagination': {
                'currentPage': page,
                'perPage': per_page,
                'totalPages': pagination.pages,
                'totalItems': pagination.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách từ khóa cấm: {str(e)}'}), 500

@moderator_bp.route('/banned-keywords', methods=['POST'])
@moderator_required
def create_banned_keyword():
    """Create a new banned keyword"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        data = request.get_json()
        keyword = data.get('keyword', '').strip()
        severity = data.get('severity', 'medium')
        description = data.get('description', '')
        
        if not keyword:
            return jsonify({'error': 'Từ khóa không được để trống'}), 400
        
        # Check if keyword already exists
        existing = BannedKeyword.query.filter_by(keyword=keyword).first()
        if existing:
            return jsonify({'error': 'Từ khóa này đã tồn tại'}), 400
        
        banned_keyword = BannedKeyword(
            keyword=keyword,
            severity=severity,
            description=description,
            created_by=user_id_int,
            is_active=True
        )
        
        db.session.add(banned_keyword)
        db.session.commit()
        
        return jsonify({
            'message': 'Thêm từ khóa cấm thành công!',
            'keyword': banned_keyword.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi thêm từ khóa cấm: {str(e)}'}), 500

@moderator_bp.route('/banned-keywords/<int:keyword_id>', methods=['PUT'])
@moderator_required
def update_banned_keyword(keyword_id):
    """Update a banned keyword"""
    try:
        banned_keyword = BannedKeyword.query.get_or_404(keyword_id)
        data = request.get_json()
        
        if 'keyword' in data:
            keyword = data['keyword'].strip()
            if keyword and keyword != banned_keyword.keyword:
                # Check if new keyword already exists
                existing = BannedKeyword.query.filter_by(keyword=keyword).first()
                if existing:
                    return jsonify({'error': 'Từ khóa này đã tồn tại'}), 400
                banned_keyword.keyword = keyword
        
        if 'severity' in data:
            banned_keyword.severity = data['severity']
        
        if 'description' in data:
            banned_keyword.description = data['description']
        
        if 'is_active' in data:
            banned_keyword.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật từ khóa cấm thành công!',
            'keyword': banned_keyword.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cập nhật từ khóa cấm: {str(e)}'}), 500

@moderator_bp.route('/banned-keywords/<int:keyword_id>', methods=['DELETE'])
@moderator_required
def delete_banned_keyword(keyword_id):
    """Delete a banned keyword"""
    try:
        banned_keyword = BannedKeyword.query.get_or_404(keyword_id)
        db.session.delete(banned_keyword)
        db.session.commit()
        
        return jsonify({'message': 'Xóa từ khóa cấm thành công!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa từ khóa cấm: {str(e)}'}), 500

# ============================================================================
# NOTIFICATIONS & WARNINGS
# ============================================================================

@moderator_bp.route('/notifications/send', methods=['POST'])
@moderator_required
def send_notification():
    """Send notification/warning to a user"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        data = request.get_json()
        user_id = data.get('user_id')
        message = data.get('message')
        title = data.get('title', 'Thông báo từ Moderator')
        notification_type = data.get('type', 'warning')
        action_url = data.get('action_url')
        
        if not user_id or not message:
            return jsonify({'error': 'Thiếu user_id hoặc message'}), 400
        
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        
        # Create notification
        notification = create_notification(
            user_id=user_id,
            type=notification_type,
            message=message,
            title=title,
            actor_id=user_id_int,
            action_url=action_url,
            emit_realtime=True
        )
        
        if notification:
            return jsonify({
                'message': 'Gửi thông báo thành công!',
                'notification': {
                    'id': notification.id,
                    'type': notification.type,
                    'message': notification.message,
                    'title': notification.title
                }
            }), 200
        else:
            return jsonify({'error': 'Không thể tạo thông báo'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Lỗi gửi thông báo: {str(e)}'}), 500

@moderator_bp.route('/warnings/send', methods=['POST'])
@moderator_required
def send_warning():
    """Send violation warning to a user"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        data = request.get_json()
        user_id = data.get('user_id')
        reason = data.get('reason', 'Vi phạm quy định cộng đồng')
        content_id = data.get('content_id')
        content_type = data.get('content_type', 'post')  # 'post' or 'comment'
        
        if not user_id:
            return jsonify({'error': 'Thiếu user_id'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        
        # Create warning notification
        warning_message = f'Bạn đã nhận cảnh báo vi phạm: {reason}'
        if content_id:
            if content_type == 'post':
                post = Post.query.get(content_id)
                if post:
                    warning_message += f'\n\nBài viết: "{post.title}"'
                    action_url = f'/posts/{post.slug}'
                else:
                    action_url = None
            else:
                comment = Comment.query.get(content_id)
                if comment:
                    post = Post.query.get(comment.post_id)
                    warning_message += f'\n\nBình luận trong bài viết: "{post.title if post else ""}"'
                    action_url = f'/posts/{post.slug}' if post else None
                else:
                    action_url = None
        else:
            action_url = None
        
        notification = create_notification(
            user_id=user_id,
            type='violation_warning',
            message=warning_message,
            title='⚠️ Cảnh báo vi phạm',
            actor_id=user_id_int,
            related_type=content_type,
            related_id=content_id,
            action_url=action_url,
            emit_realtime=True
        )
        
        if notification:
            return jsonify({
                'message': 'Gửi cảnh báo thành công!',
                'warning': {
                    'id': notification.id,
                    'message': notification.message,
                    'user_id': user_id
                }
            }), 200
        else:
            return jsonify({'error': 'Không thể gửi cảnh báo'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Lỗi gửi cảnh báo: {str(e)}'}), 500

# ============================================================================
# USER BAN/RESTRICTION MANAGEMENT
# ============================================================================

def calculate_ban_duration(duration_type):
    """Calculate ban expiry datetime based on duration type"""
    now = datetime.utcnow()
    duration_map = {
        '30min': timedelta(minutes=30),
        '2h': timedelta(hours=2),
        '1d': timedelta(days=1),
        '3d': timedelta(days=3),
        '7d': timedelta(days=7),
        'permanent': None  # None means permanent ban
    }
    
    duration = duration_map.get(duration_type)
    if duration is None:  # Permanent ban
        return None  # Will be set to a far future date
    else:
        return now + duration

@moderator_bp.route('/users/banned', methods=['GET'])
@moderator_required
def get_banned_users():
    """Get list of banned users"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '')
        ban_type = request.args.get('ban_type', 'all')  # all, account, post, comment
        
        now = datetime.utcnow()
        query = User.query
        
        # Filter by ban type
        if ban_type == 'account':
            query = query.filter(User.account_banned_until.isnot(None)).filter(User.account_banned_until > now)
        elif ban_type == 'post':
            query = query.filter(User.post_banned_until.isnot(None)).filter(User.post_banned_until > now)
        elif ban_type == 'comment':
            query = query.filter(User.comment_banned_until.isnot(None)).filter(User.comment_banned_until > now)
        else:
            # All banned users (account, post, or comment)
            query = query.filter(
                or_(
                    and_(User.account_banned_until.isnot(None), User.account_banned_until > now),
                    and_(User.post_banned_until.isnot(None), User.post_banned_until > now),
                    and_(User.comment_banned_until.isnot(None), User.comment_banned_until > now)
                )
            )
        
        # Search filter
        if search:
            query = query.filter(
                or_(
                    User.username.like(f'%{search}%'),
                    User.email.like(f'%{search}%'),
                    User.full_name.like(f'%{search}%')
                )
            )
        
        # Order by most recently banned
        query = query.order_by(desc(User.account_banned_until), desc(User.post_banned_until), desc(User.comment_banned_until))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        users = []
        for user in pagination.items:
            user_dict = user.to_dict(include_sensitive=True)
            users.append(user_dict)
        
        return jsonify({
            'users': users,
            'pagination': {
                'currentPage': page,
                'perPage': per_page,
                'totalPages': pagination.pages,
                'totalItems': pagination.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách tài khoản bị khóa: {str(e)}'}), 500

@moderator_bp.route('/users/<int:user_id>/ban', methods=['POST'])
@moderator_required
def ban_user(user_id):
    """Ban user account temporarily or permanently"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        data = request.get_json()
        duration_type = data.get('duration', '1d')  # Default 1 day
        reason = data.get('reason', 'Vi phạm quy định cộng đồng')
        
        user = User.query.get_or_404(user_id)
        
        # Calculate ban expiry
        if duration_type == 'permanent':
            # Set to far future date (100 years)
            user.account_banned_until = datetime.utcnow() + timedelta(days=36500)
        else:
            user.account_banned_until = calculate_ban_duration(duration_type)
        
        db.session.commit()
        
        # Send notification
        duration_text = {
            '30min': '30 phút',
            '2h': '2 giờ',
            '1d': '1 ngày',
            '3d': '3 ngày',
            '7d': '7 ngày',
            'permanent': 'vĩnh viễn'
        }.get(duration_type, duration_type)
        
        ban_message = f'Tài khoản của bạn đã bị khóa {duration_text}. Lý do: {reason}'
        if duration_type != 'permanent' and user.account_banned_until:
            ban_message += f'\n\nTài khoản sẽ được mở khóa vào: {user.account_banned_until.strftime("%d/%m/%Y %H:%M")}'
        
        # IMPORTANT: user_id is the user being banned (receiver of notification)
        # actor_id is the moderator (current_user_id)
        print(f'[Moderator] Creating account ban notification: user_id={user_id} (banned user), actor_id={user_id_int} (moderator)')
        print(f'[Moderator] This notification should ONLY go to user_id={user_id}')
        
        create_notification(
            user_id=user_id,  # User being banned - this is who should receive the notification
            type='account_banned',
            message=ban_message,
            title='🔒 Tài khoản bị khóa',
            related_type='user',
            actor_id=user_id_int,  # Moderator who performed the ban
            emit_realtime=True
        )
        
        print(f'[Moderator] Account ban notification created for user_id={user_id}')
        
        return jsonify({
            'message': f'Khóa tài khoản thành công ({duration_text})',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi khóa tài khoản: {str(e)}'}), 500

@moderator_bp.route('/users/<int:user_id>/unban', methods=['POST'])
@moderator_required
def unban_user(user_id):
    """Unban user account"""
    try:
        user = User.query.get_or_404(user_id)
        user.account_banned_until = None
        db.session.commit()
        
        # Send notification
        create_notification(
            user_id=user_id,
            type='account_unbanned',
            message='Tài khoản của bạn đã được mở khóa. Bạn có thể sử dụng lại tài khoản.',
            title='✅ Tài khoản đã được mở khóa',
            related_type='user',
            emit_realtime=True
        )
        
        return jsonify({
            'message': 'Mở khóa tài khoản thành công',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi mở khóa tài khoản: {str(e)}'}), 500

@moderator_bp.route('/users/<int:user_id>/ban-post', methods=['POST'])
@moderator_required
def ban_user_post(user_id):
    """Ban user from posting temporarily or permanently"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        data = request.get_json()
        duration_type = data.get('duration', '1d')
        reason = data.get('reason', 'Vi phạm quy định đăng bài')
        
        user = User.query.get_or_404(user_id)
        
        # Calculate ban expiry
        if duration_type == 'permanent':
            user.post_banned_until = datetime.utcnow() + timedelta(days=36500)
        else:
            user.post_banned_until = calculate_ban_duration(duration_type)
        
        db.session.commit()
        
        # Send notification
        duration_text = {
            '30min': '30 phút',
            '2h': '2 giờ',
            '1d': '1 ngày',
            '3d': '3 ngày',
            '7d': '7 ngày',
            'permanent': 'vĩnh viễn'
        }.get(duration_type, duration_type)
        
        ban_message = f'Bạn đã bị cấm đăng bài trong {duration_text}. Lý do: {reason}'
        if duration_type != 'permanent' and user.post_banned_until:
            ban_message += f'\n\nBạn có thể đăng bài lại vào: {user.post_banned_until.strftime("%d/%m/%Y %H:%M")}'
        
        # IMPORTANT: user_id is the user being banned from posting (receiver of notification)
        # actor_id is the moderator (current_user_id)
        print(f'[Moderator] Creating post ban notification: user_id={user_id} (banned user), actor_id={user_id_int} (moderator)')
        print(f'[Moderator] This notification should ONLY go to user_id={user_id}')
        
        create_notification(
            user_id=user_id,  # User being banned - this is who should receive the notification
            type='post_banned',
            message=ban_message,
            title='📝 Cấm đăng bài',
            related_type='user',
            actor_id=user_id_int,  # Moderator who performed the ban
            emit_realtime=True
        )
        
        print(f'[Moderator] Post ban notification created for user_id={user_id}')
        
        return jsonify({
            'message': f'Cấm đăng bài thành công ({duration_text})',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cấm đăng bài: {str(e)}'}), 500

@moderator_bp.route('/users/<int:user_id>/unban-post', methods=['POST'])
@moderator_required
def unban_user_post(user_id):
    """Unban user from posting"""
    try:
        user = User.query.get_or_404(user_id)
        user.post_banned_until = None
        db.session.commit()
        
        # Send notification
        create_notification(
            user_id=user_id,
            type='post_unbanned',
            message='Bạn đã được phép đăng bài trở lại.',
            title='✅ Đã được phép đăng bài',
            related_type='user',
            emit_realtime=True
        )
        
        return jsonify({
            'message': 'Mở khóa đăng bài thành công',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi mở khóa đăng bài: {str(e)}'}), 500

@moderator_bp.route('/users/<int:user_id>/ban-comment', methods=['POST'])
@moderator_required
def ban_user_comment(user_id):
    """Ban user from commenting temporarily or permanently"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        data = request.get_json()
        duration_type = data.get('duration', '1d')
        reason = data.get('reason', 'Vi phạm quy định bình luận')
        
        user = User.query.get_or_404(user_id)
        
        # Calculate ban expiry
        if duration_type == 'permanent':
            user.comment_banned_until = datetime.utcnow() + timedelta(days=36500)
        else:
            user.comment_banned_until = calculate_ban_duration(duration_type)
        
        db.session.commit()
        
        # Send notification
        duration_text = {
            '30min': '30 phút',
            '2h': '2 giờ',
            '1d': '1 ngày',
            '3d': '3 ngày',
            '7d': '7 ngày',
            'permanent': 'vĩnh viễn'
        }.get(duration_type, duration_type)
        
        ban_message = f'Bạn đã bị cấm bình luận trong {duration_text}. Lý do: {reason}'
        if duration_type != 'permanent' and user.comment_banned_until:
            ban_message += f'\n\nBạn có thể bình luận lại vào: {user.comment_banned_until.strftime("%d/%m/%Y %H:%M")}'
        
        # IMPORTANT: user_id is the user being banned from commenting (receiver of notification)
        # actor_id is the moderator (current_user_id)
        print(f'[Moderator] Creating comment ban notification: user_id={user_id} (banned user), actor_id={user_id_int} (moderator)')
        print(f'[Moderator] This notification should ONLY go to user_id={user_id}')
        
        create_notification(
            user_id=user_id,  # User being banned - this is who should receive the notification
            type='comment_banned',
            message=ban_message,
            title='💬 Cấm bình luận',
            related_type='user',
            actor_id=user_id_int,  # Moderator who performed the ban
            emit_realtime=True
        )
        
        print(f'[Moderator] Comment ban notification created for user_id={user_id}')
        
        return jsonify({
            'message': f'Cấm bình luận thành công ({duration_text})',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cấm bình luận: {str(e)}'}), 500

@moderator_bp.route('/users/<int:user_id>/unban-comment', methods=['POST'])
@moderator_required
def unban_user_comment(user_id):
    """Unban user from commenting"""
    try:
        user = User.query.get_or_404(user_id)
        user.comment_banned_until = None
        db.session.commit()
        
        # Send notification
        create_notification(
            user_id=user_id,
            type='comment_unbanned',
            message='Bạn đã được phép bình luận trở lại.',
            title='✅ Đã được phép bình luận',
            related_type='user',
            emit_realtime=True
        )
        
        return jsonify({
            'message': 'Mở khóa bình luận thành công',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi mở khóa bình luận: {str(e)}'}), 500

# ============================================================================
# CONTACT/SUPPORT MANAGEMENT
# ============================================================================

@moderator_bp.route('/contacts', methods=['GET'])
@moderator_required
def get_contacts():
    """Get all contact/support requests"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status', '')
        category = request.args.get('category', '')
        priority = request.args.get('priority', '')
        assigned_to = request.args.get('assigned_to', type=int)
        
        query = Contact.query
        
        if status:
            query = query.filter_by(status=status)
        
        if category:
            query = query.filter_by(category=category)
        
        if priority:
            query = query.filter_by(priority=priority)
        
        if assigned_to:
            query = query.filter_by(assigned_to=assigned_to)
        
        query = query.order_by(desc(Contact.created_at))
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        contacts = []
        for contact in pagination.items:
            contact_dict = contact.to_dict(include_message=True)
            
            # Add user info if exists
            if contact.user_id:
                user = User.query.get(contact.user_id)
                contact_dict['user'] = {
                    'id': user.id,
                    'username': user.username,
                    'full_name': user.full_name,
                    'avatar_url': user.avatar_url
                } if user else None
            
            # Add assigned moderator info
            if contact.assigned_to:
                moderator = User.query.get(contact.assigned_to)
                contact_dict['assigned_moderator'] = {
                    'id': moderator.id,
                    'username': moderator.username,
                    'full_name': moderator.full_name
                } if moderator else None
            
            contacts.append(contact_dict)
        
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
        return jsonify({'error': f'Lỗi lấy danh sách liên hệ: {str(e)}'}), 500

@moderator_bp.route('/contacts/<int:contact_id>', methods=['GET'])
@moderator_required
def get_contact(contact_id):
    """Get a specific contact request"""
    try:
        contact = Contact.query.get_or_404(contact_id)
        contact_dict = contact.to_dict(include_message=True)
        
        if contact.user_id:
            user = User.query.get(contact.user_id)
            contact_dict['user'] = {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'avatar_url': user.avatar_url
            } if user else None
        
        return jsonify({'contact': contact_dict}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thông tin liên hệ: {str(e)}'}), 500

@moderator_bp.route('/contacts/<int:contact_id>/assign', methods=['POST'])
@moderator_required
def assign_contact(contact_id):
    """Assign a contact request to a moderator"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        contact = Contact.query.get_or_404(contact_id)
        contact.assigned_to = user_id_int
        contact.status = 'in_progress'
        db.session.commit()
        
        return jsonify({
            'message': 'Phân công xử lý thành công!',
            'contact': contact.to_dict(include_message=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi phân công: {str(e)}'}), 500

@moderator_bp.route('/contacts/<int:contact_id>/respond', methods=['POST'])
@moderator_required
def respond_to_contact(contact_id):
    """Respond to a contact request"""
    try:
        current_user_id = get_jwt_identity()
        user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        
        contact = Contact.query.get_or_404(contact_id)
        data = request.get_json()
        response = data.get('response', '')
        status = data.get('status', 'resolved')
        
        if not response:
            return jsonify({'error': 'Nội dung phản hồi không được để trống'}), 400
        
        contact.response = response
        contact.responded_by = user_id_int
        contact.responded_at = datetime.utcnow()
        contact.status = status
        
        if status == 'resolved':
            contact.resolved_at = datetime.utcnow()
        
        db.session.commit()
        
        # Send notification and message to user
        if contact.user_id:
            # Send notification
            try:
                create_notification(
                    user_id=contact.user_id,
                    type='contact_response',
                    message=f'Yêu cầu hỗ trợ của bạn đã được phản hồi: {contact.subject}',
                    title='Phản hồi yêu cầu hỗ trợ',
                    actor_id=user_id_int,
                    related_type='contact',
                    related_id=contact_id,
                    action_url=f'/contact/{contact_id}',
                    emit_realtime=True
                )
            except Exception as notif_error:
                print(f'[Moderator] Error creating notification: {str(notif_error)}')
            
            # Automatically send message to user
            try:
                moderator_user = User.query.get(user_id_int)
                message_content = f"Chào bạn,\n\nChúng tôi đã nhận được yêu cầu hỗ trợ của bạn về: {contact.subject}\n\nPhản hồi:\n{response}\n\nTrân trọng,\nĐội ngũ hỗ trợ"
                
                # Create chat message (bypass friend check for moderators)
                chat = Chat(
                    message=message_content,
                    message_type='text',
                    sender_id=user_id_int,
                    receiver_id=contact.user_id,
                    conversation_type='direct',
                    status='sent'
                )
                
                db.session.add(chat)
                db.session.commit()
                
                # Get sender and receiver info for Socket.IO
                sender = User.query.get(user_id_int)
                receiver = User.query.get(contact.user_id)
                
                chat_dict = chat.to_dict()
                chat_dict['sender'] = {
                    'id': sender.id,
                    'username': sender.username,
                    'full_name': sender.full_name or 'Đội ngũ hỗ trợ',
                    'avatar_url': sender.avatar_url
                } if sender else None
                
                # Prepare message data for Socket.IO
                message_data = {
                    'id': chat.id,
                    'message': message_content,
                    'message_type': 'text',
                    'file_url': None,
                    'file_type': None,
                    'sender': chat_dict['sender'],
                    'receiver_id': contact.user_id,
                    'sender_id': user_id_int,
                    'created_at': chat.created_at.isoformat() if chat.created_at else None,
                    'status': chat.status
                }
                
                # Emit real-time events via Socket.IO
                emit_to_user(contact.user_id, 'new_message', message_data)
                
                # Create notification for the message
                if receiver and sender:
                    try:
                        create_notification(
                            user_id=contact.user_id,
                            type='message',
                            message=f'{sender.full_name or sender.username or "Đội ngũ hỗ trợ"} đã gửi cho bạn một tin nhắn về yêu cầu hỗ trợ',
                            title='Tin nhắn mới',
                            actor_id=user_id_int,
                            related_type='chat',
                            related_id=chat.id,
                            action_url=f'/messages/{user_id_int}',
                            emit_realtime=True
                        )
                    except Exception as msg_notif_error:
                        print(f'[Moderator] Error creating message notification: {str(msg_notif_error)}')
                    
            except Exception as msg_error:
                # Log error but don't fail the response
                print(f'[Moderator] Error sending message to user: {str(msg_error)}')
                # Don't rollback - contact response is already committed
        
        return jsonify({
            'message': 'Phản hồi thành công!',
            'contact': contact.to_dict(include_message=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi phản hồi: {str(e)}'}), 500

@moderator_bp.route('/contacts/<int:contact_id>', methods=['DELETE'])
@moderator_required
def delete_contact(contact_id):
    """Delete a contact request"""
    try:
        contact = Contact.query.get_or_404(contact_id)
        db.session.delete(contact)
        db.session.commit()
        
        return jsonify({'message': 'Xóa yêu cầu liên hệ thành công!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa yêu cầu: {str(e)}'}), 500

# ============================================================================
# STATISTICS
# ============================================================================

@moderator_bp.route('/stats', methods=['GET'])
@moderator_required
def get_moderator_stats():
    """Get moderator dashboard statistics"""
    try:
        # Total counts
        total_posts = Post.query.count()
        total_comments = Comment.query.count()
        total_contacts = Contact.query.count()
        total_banned_keywords = BannedKeyword.query.filter_by(is_active=True).count()
        
        # Pending items
        pending_posts = Post.query.filter_by(status='pending').count()
        pending_comments = Comment.query.filter_by(status='pending').count()
        pending_contacts = Contact.query.filter_by(status='pending').count()
        
        # Today's counts
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        today_posts = Post.query.filter(Post.created_at >= today_start).count()
        today_comments = Comment.query.filter(Comment.created_at >= today_start).count()
        today_contacts = Contact.query.filter(Contact.created_at >= today_start).count()
        
        stats = {
            'totalPosts': total_posts,
            'totalComments': total_comments,
            'totalContacts': total_contacts,
            'totalBannedKeywords': total_banned_keywords,
            'pendingPosts': pending_posts,
            'pendingComments': pending_comments,
            'pendingContacts': pending_contacts,
            'todayPosts': today_posts,
            'todayComments': today_comments,
            'todayContacts': today_contacts
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thống kê: {str(e)}'}), 500

@moderator_bp.route('/warnings/users', methods=['GET'])
@moderator_required
def get_warning_users():
    """Get list of users with 3+ violations that need warning"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        
        # Query users with violation_count >= 3
        query = User.query.filter(User.violation_count >= 3)
        
        # Filter by search term (username, email, full_name)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term)
                )
            )
        
        # Order by violation count descending
        query = query.order_by(User.violation_count.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        users = []
        for user in pagination.items:
            user_dict = user.to_dict(include_sensitive=True)
            user_dict['violation_count'] = user.violation_count or 0
            users.append(user_dict)
        
        return jsonify({
            'users': users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách cảnh báo: {str(e)}'}), 500

