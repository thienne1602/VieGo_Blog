"""
Admin Routes for VieGo Blog
Handles all administrative operations including user management, content moderation, 
analytics, reports, and system settings.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy import func, desc, and_, or_
import json

from models import db
from models.user import User
from models.post import Post
from models.comment import Comment
from models.report import Report, ActivityLog

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Admin authorization decorator
def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            print(f"[ADMIN CHECK] User ID from token: {current_user_id} (type: {type(current_user_id)})")
            
            # Convert string to int since identity is now stored as string
            user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
            user = User.query.get(user_id_int)
            
            if not user:
                print(f"[ADMIN CHECK] ❌ User not found with ID: {user_id_int}")
                return jsonify({'error': 'User not found'}), 404
            
            print(f"[ADMIN CHECK] User found: {user.username}, Role: {user.role}")
            
            if user.role not in ['admin', 'moderator']:
                print(f"[ADMIN CHECK] ❌ Access denied - Role: {user.role}")
                return jsonify({'error': 'Admin access required', 'current_role': user.role}), 403
            
            print(f"[ADMIN CHECK] ✅ Access granted for {user.username}")
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"[ADMIN CHECK] ❌ Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Authorization error: {str(e)}'}), 500
            
    return decorated_function

# ============================================================================
# DASHBOARD OVERVIEW & STATISTICS
# ============================================================================

@admin_bp.route('/stats/overview', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Get dashboard overview statistics"""
    try:
        # Total counts
        total_users = User.query.count()
        total_posts = Post.query.count()
        total_comments = Comment.query.count()
        
        # Today's new items
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        today_new_users = User.query.filter(User.created_at >= today_start).count()
        today_new_posts = Post.query.filter(Post.created_at >= today_start).count()
        today_new_comments = Comment.query.filter(Comment.created_at >= today_start).count()
        
        # Calculate total views
        total_views = db.session.query(func.sum(Post.views_count)).scalar() or 0
        today_views = db.session.query(func.sum(Post.views_count)).filter(
            Post.created_at >= today_start
        ).scalar() or 0
        
        # Pending reports
        pending_reports = Report.query.filter_by(status='pending').count()
        
        # Active users (users who logged in or posted in last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        active_users = User.query.filter(
            or_(
                User.created_at >= week_ago,
                User.updated_at >= week_ago
            )
        ).count()
        
        stats = {
            'totalUsers': total_users,
            'totalPosts': total_posts,
            'totalComments': total_comments,
            'todayNewUsers': today_new_users,
            'todayNewPosts': today_new_posts,
            'todayNewComments': today_new_comments,
            'totalViews': int(total_views),
            'todayViews': int(today_views),
            'pendingReports': pending_reports,
            'activeUsers': active_users,
            'systemStatus': 99.8  # Placeholder for system health
        }
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/activity/recent', methods=['GET'])
@admin_required
def get_recent_activity():
    """Get recent system activity"""
    try:
        limit = request.args.get('limit', 20, type=int)
        
        activities = []
        
        # Recent users
        recent_users = User.query.order_by(desc(User.created_at)).limit(5).all()
        for user in recent_users:
            activities.append({
                'type': 'user_registered',
                'action': 'New user registered',
                'user': user.username,
                'userId': user.id,
                'time': user.created_at.isoformat(),
                'category': 'success'
            })
        
        # Recent posts
        recent_posts = Post.query.order_by(desc(Post.created_at)).limit(5).all()
        for post in recent_posts:
            activities.append({
                'type': 'post_created',
                'action': 'New post created',
                'user': f'Post #{post.id}',
                'postId': post.id,
                'time': post.created_at.isoformat(),
                'category': 'info'
            })
        
        # Recent comments
        recent_comments = Comment.query.order_by(desc(Comment.created_at)).limit(5).all()
        for comment in recent_comments:
            activities.append({
                'type': 'comment_created',
                'action': 'New comment',
                'user': f'Comment on Post #{comment.post_id}',
                'commentId': comment.id,
                'time': comment.created_at.isoformat(),
                'category': 'info'
            })
        
        # Sort by time and limit
        activities.sort(key=lambda x: x['time'], reverse=True)
        activities = activities[:limit]
        
        return jsonify(activities), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# USER MANAGEMENT
# ============================================================================

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        role = request.args.get('role', '')
        status = request.args.get('status', '')
        
        # Build query
        query = User.query
        
        # Search filter
        if search:
            query = query.filter(
                or_(
                    User.username.like(f'%{search}%'),
                    User.email.like(f'%{search}%'),
                    User.full_name.like(f'%{search}%')
                )
            )
        
        # Role filter
        if role:
            query = query.filter(User.role == role)
        
        # Status filter
        if status:
            is_active = status == 'active'
            query = query.filter(User.is_active == is_active)
        
        # Order by creation date
        query = query.order_by(desc(User.created_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        users = []
        for user in pagination.items:
            # Count user's posts
            post_count = Post.query.filter_by(author_id=user.id).count()
            
            users.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'fullName': user.full_name,
                'role': user.role,
                'isActive': user.is_active,
                'emailVerified': user.email_verified,
                'avatarUrl': user.avatar_url,
                'bio': user.bio,
                'location': user.location,
                'points': user.points,
                'level': user.level,
                'postsCount': post_count,
                'createdAt': user.created_at.isoformat(),
                'updatedAt': user.updated_at.isoformat() if user.updated_at else None
            })
        
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
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user_detail(user_id):
    """Get detailed information about a specific user"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Get user's posts
        posts = Post.query.filter_by(author_id=user.id).order_by(desc(Post.created_at)).limit(10).all()
        post_list = [{
            'id': p.id,
            'title': p.title,
            'slug': p.slug,
            'status': p.status,
            'viewsCount': p.views_count,
            'createdAt': p.created_at.isoformat()
        } for p in posts]
        
        # Get user's comments
        comments = Comment.query.filter_by(author_id=user.id).order_by(desc(Comment.created_at)).limit(10).all()
        comment_list = [{
            'id': c.id,
            'content': c.content[:100],
            'postId': c.post_id,
            'createdAt': c.created_at.isoformat()
        } for c in comments]
        
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'fullName': user.full_name,
            'role': user.role,
            'isActive': user.is_active,
            'emailVerified': user.email_verified,
            'avatarUrl': user.avatar_url,
            'bio': user.bio,
            'location': user.location,
            'points': user.points,
            'level': user.level,
            'badges': user.get_badges(),
            'socialLinks': user.get_social_links(),
            'createdAt': user.created_at.isoformat(),
            'updatedAt': user.updated_at.isoformat() if user.updated_at else None,
            'recentPosts': post_list,
            'recentComments': comment_list,
            'stats': {
                'totalPosts': len(post_list),
                'totalComments': len(comment_list)
            }
        }
        
        return jsonify(user_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user information"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        # Update allowed fields
        if 'fullName' in data:
            user.full_name = data['fullName']
        if 'email' in data:
            user.email = data['email']
        if 'role' in data:
            user.role = data['role']
        if 'isActive' in data:
            user.is_active = data['isActive']
        if 'emailVerified' in data:
            user.email_verified = data['emailVerified']
        if 'bio' in data:
            user.bio = data['bio']
        if 'location' in data:
            user.location = data['location']
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'isActive': user.is_active
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Prevent deleting yourself
        if current_user_id == user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        user = User.query.get_or_404(user_id)
        
        # Soft delete - just deactivate
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/ban', methods=['POST'])
@admin_required
def ban_user(user_id):
    """Ban a user"""
    try:
        user = User.query.get_or_404(user_id)
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'User banned successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/unban', methods=['POST'])
@admin_required
def unban_user(user_id):
    """Unban a user"""
    try:
        user = User.query.get_or_404(user_id)
        user.is_active = True
        db.session.commit()
        
        return jsonify({'message': 'User unbanned successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============================================================================
# CONTENT MANAGEMENT
# ============================================================================

@admin_bp.route('/posts', methods=['GET'])
@admin_required
def get_posts():
    """Get all posts with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        category = request.args.get('category', '')
        
        # Build query
        query = Post.query
        
        # Search filter
        if search:
            query = query.filter(
                or_(
                    Post.title.like(f'%{search}%'),
                    Post.content.like(f'%{search}%')
                )
            )
        
        # Status filter
        if status:
            query = query.filter(Post.status == status)
        
        # Category filter
        if category:
            query = query.filter(Post.category == category)
        
        # Order by creation date
        query = query.order_by(desc(Post.created_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        posts = []
        for post in pagination.items:
            # Get author info
            author = User.query.get(post.author_id)
            
            posts.append({
                'id': post.id,
                'title': post.title,
                'slug': post.slug,
                'excerpt': post.excerpt,
                'status': post.status,
                'category': post.category,
                'contentType': post.content_type,
                'featuredImage': post.featured_image,
                'viewsCount': post.views_count,
                'likesCount': post.likes_count,
                'commentsCount': post.comments_count,
                'featured': post.featured,
                'author': {
                    'id': author.id,
                    'username': author.username,
                    'fullName': author.full_name,
                    'avatarUrl': author.avatar_url
                } if author else None,
                'createdAt': post.created_at.isoformat(),
                'publishedAt': post.published_at.isoformat() if post.published_at else None
            })
        
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
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/posts/<int:post_id>', methods=['PUT'])
@admin_required
def update_post(post_id):
    """Update post information"""
    try:
        post = Post.query.get_or_404(post_id)
        data = request.get_json()
        
        # Update allowed fields
        if 'status' in data:
            post.status = data['status']
            if data['status'] == 'published' and not post.published_at:
                post.published_at = datetime.utcnow()
        if 'featured' in data:
            post.featured = data['featured']
        if 'category' in data:
            post.category = data['category']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Post updated successfully',
            'post': {
                'id': post.id,
                'title': post.title,
                'status': post.status,
                'featured': post.featured
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@admin_required
def delete_post(post_id):
    """Delete a post"""
    try:
        post = Post.query.get_or_404(post_id)
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Post deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============================================================================
# COMMENTS MANAGEMENT
# ============================================================================

@admin_bp.route('/comments', methods=['GET'])
@admin_required
def get_comments():
    """Get all comments with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        post_id = request.args.get('post_id', type=int)
        
        # Build query
        query = Comment.query
        
        # Filter by post
        if post_id:
            query = query.filter(Comment.post_id == post_id)
        
        # Order by creation date
        query = query.order_by(desc(Comment.created_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        comments = []
        for comment in pagination.items:
            # Get author and post info
            author = User.query.get(comment.author_id)
            post = Post.query.get(comment.post_id)
            
            comments.append({
                'id': comment.id,
                'content': comment.content,
                'author': {
                    'id': author.id,
                    'username': author.username,
                    'avatarUrl': author.avatar_url
                } if author else None,
                'post': {
                    'id': post.id,
                    'title': post.title
                } if post else None,
                'createdAt': comment.created_at.isoformat()
            })
        
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
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@admin_required
def delete_comment(comment_id):
    """Delete a comment"""
    try:
        comment = Comment.query.get_or_404(comment_id)
        db.session.delete(comment)
        db.session.commit()
        
        return jsonify({'message': 'Comment deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ANALYTICS
# ============================================================================

@admin_bp.route('/analytics/overview', methods=['GET'])
@admin_required
def get_analytics_overview():
    """Get analytics overview with charts data"""
    try:
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # User growth
        user_growth = db.session.query(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('count')
        ).filter(User.created_at >= start_date).group_by(func.date(User.created_at)).all()
        
        # Post growth
        post_growth = db.session.query(
            func.date(Post.created_at).label('date'),
            func.count(Post.id).label('count')
        ).filter(Post.created_at >= start_date).group_by(func.date(Post.created_at)).all()
        
        # Top authors
        top_authors = db.session.query(
            User.id,
            User.username,
            User.full_name,
            func.count(Post.id).label('post_count')
        ).join(Post, Post.author_id == User.id).group_by(User.id).order_by(desc('post_count')).limit(10).all()
        
        # Top posts by views
        top_posts = Post.query.order_by(desc(Post.views_count)).limit(10).all()
        
        # Category distribution
        category_stats = db.session.query(
            Post.category,
            func.count(Post.id).label('count')
        ).group_by(Post.category).all()
        
        analytics = {
            'userGrowth': [{'date': str(row.date), 'count': row.count} for row in user_growth],
            'postGrowth': [{'date': str(row.date), 'count': row.count} for row in post_growth],
            'topAuthors': [{
                'id': row.id,
                'username': row.username,
                'fullName': row.full_name,
                'postCount': row.post_count
            } for row in top_authors],
            'topPosts': [{
                'id': p.id,
                'title': p.title,
                'viewsCount': p.views_count,
                'likesCount': p.likes_count
            } for p in top_posts],
            'categoryDistribution': [{'category': row.category, 'count': row.count} for row in category_stats]
        }
        
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# SYSTEM SETTINGS
# ============================================================================

@admin_bp.route('/settings', methods=['GET'])
@admin_required
def get_settings():
    """Get system settings"""
    try:
        # Placeholder for system settings
        settings = {
            'siteName': 'VieGo Blog',
            'siteDescription': 'Vietnamese Travel & Culture Blog Platform',
            'maintenanceMode': False,
            'registrationEnabled': True,
            'commentsEnabled': True,
            'emailNotifications': True,
            'maxUploadSize': 16777216,  # 16MB
            'allowedFileTypes': ['jpg', 'jpeg', 'png', 'gif', 'webp']
        }
        
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/settings', methods=['PUT'])
@admin_required
def update_settings():
    """Update system settings"""
    try:
        data = request.get_json()
        
        # In a real application, you would save these to a database
        # For now, we'll just return success
        
        return jsonify({
            'message': 'Settings updated successfully',
            'settings': data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@admin_bp.route('/search', methods=['GET'])
@admin_required
def global_search():
    """Global search across users, posts, and comments"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'error': 'Search query required'}), 400
        
        # Search users
        users = User.query.filter(
            or_(
                User.username.like(f'%{query}%'),
                User.email.like(f'%{query}%'),
                User.full_name.like(f'%{query}%')
            )
        ).limit(10).all()
        
        # Search posts
        posts = Post.query.filter(
            or_(
                Post.title.like(f'%{query}%'),
                Post.content.like(f'%{query}%')
            )
        ).limit(10).all()
        
        # Search comments
        comments = Comment.query.filter(
            Comment.content.like(f'%{query}%')
        ).limit(10).all()
        
        results = {
            'users': [{
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'type': 'user'
            } for u in users],
            'posts': [{
                'id': p.id,
                'title': p.title,
                'excerpt': p.excerpt[:100] if p.excerpt else '',
                'type': 'post'
            } for p in posts],
            'comments': [{
                'id': c.id,
                'content': c.content[:100],
                'postId': c.post_id,
                'type': 'comment'
            } for c in comments]
        }
        
        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# REPORTS MANAGEMENT
# ============================================================================

@admin_bp.route('/reports', methods=['GET'])
@admin_required
def get_reports():
    """Get all reports with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        report_type = request.args.get('report_type', '')
        priority = request.args.get('priority', '')
        
        # Build query
        query = Report.query
        
        # Status filter
        if status:
            query = query.filter(Report.status == status)
        
        # Type filter
        if report_type:
            query = query.filter(Report.report_type == report_type)
        
        # Priority filter
        if priority:
            query = query.filter(Report.priority == priority)
        
        # Order by priority and creation date
        query = query.order_by(
            desc(Report.priority == 'urgent'),
            desc(Report.priority == 'high'),
            desc(Report.created_at)
        )
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        reports = []
        for report in pagination.items:
            # Get reporter info
            reporter = User.query.get(report.reporter_id) if report.reporter_id else None
            
            # Get target info based on type
            target_info = None
            if report.report_type == 'post':
                post = Post.query.get(report.target_id)
                if post:
                    target_info = {
                        'type': 'post',
                        'id': post.id,
                        'title': post.title,
                        'slug': post.slug
                    }
            elif report.report_type == 'comment':
                comment = Comment.query.get(report.target_id)
                if comment:
                    target_info = {
                        'type': 'comment',
                        'id': comment.id,
                        'content': comment.content[:100],
                        'postId': comment.post_id
                    }
            elif report.report_type == 'user':
                user = User.query.get(report.target_id)
                if user:
                    target_info = {
                        'type': 'user',
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
            
            # Get resolver info
            resolver = None
            if report.resolved_by:
                resolver_user = User.query.get(report.resolved_by)
                if resolver_user:
                    resolver = {
                        'id': resolver_user.id,
                        'username': resolver_user.username
                    }
            
            reports.append({
                'id': report.id,
                'reporter': {
                    'id': reporter.id,
                    'username': reporter.username,
                    'email': reporter.email
                } if reporter else None,
                'reportType': report.report_type,
                'targetId': report.target_id,
                'targetInfo': target_info,
                'reason': report.reason,
                'description': report.description,
                'status': report.status,
                'priority': report.priority,
                'resolver': resolver,
                'resolutionNotes': report.resolution_notes,
                'actionTaken': report.action_taken,
                'createdAt': report.created_at.isoformat(),
                'resolvedAt': report.resolved_at.isoformat() if report.resolved_at else None
            })
        
        return jsonify({
            'reports': reports,
            'pagination': {
                'currentPage': page,
                'perPage': per_page,
                'totalPages': pagination.pages,
                'totalItems': pagination.total
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/reports/<int:report_id>', methods=['GET'])
@admin_required
def get_report_detail(report_id):
    """Get detailed information about a specific report"""
    try:
        report = Report.query.get_or_404(report_id)
        
        # Get reporter info
        reporter = User.query.get(report.reporter_id) if report.reporter_id else None
        
        # Get detailed target info
        target_detail = None
        if report.report_type == 'post':
            post = Post.query.get(report.target_id)
            if post:
                author = User.query.get(post.author_id)
                target_detail = {
                    'type': 'post',
                    'id': post.id,
                    'title': post.title,
                    'content': post.content,
                    'author': {
                        'id': author.id,
                        'username': author.username
                    } if author else None,
                    'status': post.status,
                    'viewsCount': post.views_count
                }
        elif report.report_type == 'comment':
            comment = Comment.query.get(report.target_id)
            if comment:
                author = User.query.get(comment.author_id)
                post = Post.query.get(comment.post_id)
                target_detail = {
                    'type': 'comment',
                    'id': comment.id,
                    'content': comment.content,
                    'author': {
                        'id': author.id,
                        'username': author.username
                    } if author else None,
                    'post': {
                        'id': post.id,
                        'title': post.title
                    } if post else None
                }
        elif report.report_type == 'user':
            user = User.query.get(report.target_id)
            if user:
                post_count = Post.query.filter_by(author_id=user.id).count()
                target_detail = {
                    'type': 'user',
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'fullName': user.full_name,
                    'role': user.role,
                    'isActive': user.is_active,
                    'postsCount': post_count
                }
        
        # Get resolver info
        resolver = None
        if report.resolved_by:
            resolver_user = User.query.get(report.resolved_by)
            if resolver_user:
                resolver = {
                    'id': resolver_user.id,
                    'username': resolver_user.username,
                    'fullName': resolver_user.full_name
                }
        
        report_data = {
            'id': report.id,
            'reporter': {
                'id': reporter.id,
                'username': reporter.username,
                'email': reporter.email,
                'fullName': reporter.full_name
            } if reporter else None,
            'reportType': report.report_type,
            'targetId': report.target_id,
            'targetDetail': target_detail,
            'reason': report.reason,
            'description': report.description,
            'status': report.status,
            'priority': report.priority,
            'resolver': resolver,
            'resolutionNotes': report.resolution_notes,
            'actionTaken': report.action_taken,
            'createdAt': report.created_at.isoformat(),
            'updatedAt': report.updated_at.isoformat() if report.updated_at else None,
            'resolvedAt': report.resolved_at.isoformat() if report.resolved_at else None
        }
        
        return jsonify(report_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/reports/<int:report_id>/resolve', methods=['POST'])
@admin_required
def resolve_report(report_id):
    """Resolve a report"""
    try:
        current_user_id = get_jwt_identity()
        report = Report.query.get_or_404(report_id)
        data = request.get_json()
        
        action_taken = data.get('actionTaken', 'none')
        notes = data.get('notes', '')
        
        report.resolve(current_user_id, action_taken, notes)
        db.session.commit()
        
        # Log the activity
        ActivityLog.log_action(
            action_type='report_resolve',
            description=f'Resolved report #{report_id}',
            user_id=current_user_id,
            target_type='report',
            target_id=report_id,
            metadata={'action_taken': action_taken},
            severity='info'
        )
        
        return jsonify({
            'message': 'Report resolved successfully',
            'report': report.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/reports/<int:report_id>/dismiss', methods=['POST'])
@admin_required
def dismiss_report(report_id):
    """Dismiss a report"""
    try:
        current_user_id = get_jwt_identity()
        report = Report.query.get_or_404(report_id)
        data = request.get_json()
        
        notes = data.get('notes', '')
        
        report.dismiss(current_user_id, notes)
        db.session.commit()
        
        # Log the activity
        ActivityLog.log_action(
            action_type='report_resolve',
            description=f'Dismissed report #{report_id}',
            user_id=current_user_id,
            target_type='report',
            target_id=report_id,
            severity='info'
        )
        
        return jsonify({
            'message': 'Report dismissed successfully',
            'report': report.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/reports/stats', methods=['GET'])
@admin_required
def get_reports_stats():
    """Get reports statistics"""
    try:
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        stats = {
            'totalReports': Report.query.count(),
            'pendingReports': Report.query.filter_by(status='pending').count(),
            'reviewingReports': Report.query.filter_by(status='reviewing').count(),
            'resolvedReports': Report.query.filter_by(status='resolved').count(),
            'dismissedReports': Report.query.filter_by(status='dismissed').count(),
            'todayReports': Report.query.filter(Report.created_at >= today_start).count(),
            'todayResolved': Report.query.filter(
                Report.resolved_at >= today_start,
                Report.status == 'resolved'
            ).count(),
            'urgentReports': Report.query.filter_by(priority='urgent', status='pending').count(),
            'highPriorityReports': Report.query.filter_by(priority='high', status='pending').count(),
            'spamReports': Report.query.filter_by(reason='spam', status='pending').count(),
            'harassmentReports': Report.query.filter_by(reason='harassment', status='pending').count(),
            'inappropriateContent': Report.query.filter_by(reason='inappropriate_content', status='pending').count()
        }
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ACTIVITY LOGS
# ============================================================================

@admin_bp.route('/activity-logs', methods=['GET'])
@admin_required
def get_activity_logs():
    """Get activity logs with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        action_type = request.args.get('action_type', '')
        severity = request.args.get('severity', '')
        user_id = request.args.get('user_id', type=int)
        
        # Build query
        query = ActivityLog.query
        
        # Filters
        if action_type:
            query = query.filter(ActivityLog.action_type == action_type)
        if severity:
            query = query.filter(ActivityLog.severity == severity)
        if user_id:
            query = query.filter(ActivityLog.user_id == user_id)
        
        # Order by creation date
        query = query.order_by(desc(ActivityLog.created_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        logs = []
        for log in pagination.items:
            # Get user info
            user = User.query.get(log.user_id) if log.user_id else None
            
            logs.append({
                'id': log.id,
                'user': {
                    'id': user.id,
                    'username': user.username
                } if user else None,
                'actionType': log.action_type,
                'actionDescription': log.action_description,
                'targetType': log.target_type,
                'targetId': log.target_id,
                'severity': log.severity,
                'ipAddress': log.ip_address,
                'createdAt': log.created_at.isoformat()
            })
        
        return jsonify({
            'logs': logs,
            'pagination': {
                'currentPage': page,
                'perPage': per_page,
                'totalPages': pagination.pages,
                'totalItems': pagination.total
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

