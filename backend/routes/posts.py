from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import or_, and_, desc
from datetime import datetime
import json

from models.user import User, db
from models.post import Post
from models.comment import Comment

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/', methods=['GET'])
def get_posts():
    """Get posts with filtering and pagination"""
    try:
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 50)
        category = request.args.get('category')
        tag = request.args.get('tag')
        search = request.args.get('search')
        language = request.args.get('language', 'vi')
        featured = request.args.get('featured', type=bool)
        author_id = request.args.get('author_id', type=int)  # Add author filter
        
        # Get current user if authenticated
        current_user_id = None
        try:
            from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            if isinstance(current_user_id, str):
                current_user_id = int(current_user_id)
        except Exception as e:
            print(f"[Posts] JWT verification error: {e}")
            pass
        
        print(f"[Posts] Fetching posts for user_id: {current_user_id}")
        
        # Base query - only published posts
        query = Post.query.filter_by(status='published')
        
        # Build visibility filter based on user authentication
        if current_user_id:
            # Logged in user can see:
            # 1. Public posts (or posts with no visibility set)
            # 2. Their own posts (any visibility)
            # 3. Friends posts where they are in allowed_viewers
            visibility_filter = or_(
                Post.visibility == 'public',
                Post.visibility.is_(None),
                Post.author_id == current_user_id,
                and_(
                    Post.visibility == 'friends',
                    or_(
                        Post.allowed_viewers.contains(f'[{current_user_id}]'),
                        Post.allowed_viewers.contains(f'[{current_user_id},'),
                        Post.allowed_viewers.contains(f', {current_user_id}]'),
                        Post.allowed_viewers.contains(f', {current_user_id},')
                    )
                )
            )
            query = query.filter(visibility_filter)
        else:
            # Anonymous users can only see public posts
            query = query.filter(
                or_(
                    Post.visibility == 'public',
                    Post.visibility.is_(None)
                )
            )
        
        # Apply filters
        if author_id:
            query = query.filter_by(author_id=author_id)
        
        if category:
            query = query.filter_by(category=category)
        
        if featured is not None:
            query = query.filter_by(featured=featured)
        
        if language:
            query = query.filter_by(language=language)
        
        if tag:
            query = query.filter(Post.tags.contains(f'"{tag}"'))
        
        if search:
            search_filter = or_(
                Post.title.contains(search),
                Post.content.contains(search),
                Post.excerpt.contains(search)
            )
            query = query.filter(search_filter)
        
        # Order by published date
        query = query.order_by(desc(Post.published_at))
        
        # Paginate
        posts_pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Get current user if authenticated
        current_user_id = None
        try:
            from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            if isinstance(current_user_id, str):
                current_user_id = int(current_user_id)
        except:
            pass
        
        # Format response
        posts_data = []
        for post in posts_pagination.items:
            post_dict = post.to_dict(include_content=False)
            
            # Include author ID for authorization checks
            post_dict['author_id'] = post.author_id
            
            # Include author info
            author = User.query.get(post.author_id)
            post_dict['author'] = {
                'id': author.id,
                'username': author.username,
                'full_name': author.full_name,
                'avatar_url': author.avatar_url
            } if author else None
            
            # Check if current user liked/bookmarked this post
            if current_user_id:
                current_user = User.query.get(current_user_id)
                if current_user:
                    # Check if post ID is in user's liked/bookmarked lists
                    liked_post_ids = current_user.get_liked_posts()
                    bookmarked_post_ids = current_user.get_bookmarks()
                    
                    post_dict['is_liked'] = post.id in liked_post_ids
                    post_dict['is_bookmarked'] = post.id in bookmarked_post_ids
            
            posts_data.append(post_dict)
        
        return jsonify({
            'posts': posts_data,
            'pagination': {
                'page': posts_pagination.page,
                'pages': posts_pagination.pages,
                'per_page': posts_pagination.per_page,
                'total': posts_pagination.total,
                'has_next': posts_pagination.has_next,
                'has_prev': posts_pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy bài viết: {str(e)}'}), 500

@posts_bp.route('/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """Get single post by ID"""
    try:
        post = Post.query.get_or_404(post_id)
        
        if post.status != 'published':
            return jsonify({'error': 'Bài viết không tồn tại hoặc chưa được xuất bản'}), 404
        
        # Increment view count
        post.increment_views()
        db.session.commit()
        
        # Get post data
        post_data = post.to_dict(include_content=True)
        
        # Include author info
        author = User.query.get(post.author_id)
        post_data['author'] = {
            'id': author.id,
            'username': author.username,
            'full_name': author.full_name,
            'avatar_url': author.avatar_url,
            'bio': author.bio,
            'level': author.level,
            'points': author.points
        } if author else None
        
        # Get collaborators info if collaborative
        if post.collaborative:
            collaborator_ids = post.get_collaborators()
            collaborators = User.query.filter(User.id.in_(collaborator_ids)).all()
            post_data['collaborators_info'] = [{
                'id': collab.id,
                'username': collab.username,
                'full_name': collab.full_name,
                'avatar_url': collab.avatar_url
            } for collab in collaborators]
        
        # Get comments (top level only, replies loaded separately)
        comments = Comment.query.filter_by(
            post_id=post_id, 
            parent_id=None,
            status='active'
        ).order_by(desc(Comment.created_at)).limit(20).all()
        
        comments_data = []
        for comment in comments:
            comment_dict = comment.to_dict(include_replies=False)
            # Include comment author
            comment_author = User.query.get(comment.author_id)
            comment_dict['author'] = {
                'id': comment_author.id,
                'username': comment_author.username,
                'full_name': comment_author.full_name,
                'avatar_url': comment_author.avatar_url
            } if comment_author else None
            comments_data.append(comment_dict)
        
        post_data['comments'] = comments_data
        
        return jsonify({'post': post_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy bài viết: {str(e)}'}), 500

@posts_bp.route('/', methods=['POST'])
@jwt_required()
def create_post():
    """Create new post"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Check if user can post
        if not user.can_post():
            if user.is_account_banned():
                return jsonify({
                    'error': 'Tài khoản của bạn đã bị khóa',
                    'ban_type': 'account',
                    'banned_until': user.account_banned_until.isoformat() if user.account_banned_until else None
                }), 403
            elif user.is_post_banned():
                return jsonify({
                    'error': 'Bạn đã bị cấm đăng bài',
                    'ban_type': 'post',
                    'banned_until': user.post_banned_until.isoformat() if user.post_banned_until else None
                }), 403
        
        data = request.get_json()
        
        # Validate required fields
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        
        if not all([title, content]):
            return jsonify({'error': 'Thiếu tiêu đề hoặc nội dung'}), 400
        
        # Check for banned keywords
        from models.banned_keyword import BannedKeyword
        text_to_check = f"{title} {content} {data.get('excerpt', '')}"
        banned_keywords = BannedKeyword.query.filter_by(is_active=True).all()
        found_keywords = []
        text_lower = text_to_check.lower()
        
        for keyword_obj in banned_keywords:
            keyword = keyword_obj.keyword.lower()
            if keyword in text_lower:
                found_keywords.append({
                    'keyword': keyword_obj.keyword,
                    'severity': keyword_obj.severity,
                    'description': keyword_obj.description
                })
        
        if found_keywords:
            # Increment violation count
            if user.violation_count is None:
                user.violation_count = 0
            user.violation_count += 1
            db.session.commit()
            
            # Send warning notification to user
            from routes.notifications import create_notification
            severity_levels = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
            max_severity = max([severity_levels.get(kw['severity'], 2) for kw in found_keywords])
            
            warning_message = f'Bài viết của bạn chứa từ khóa cấm và không thể đăng. '
            warning_message += f'Từ khóa vi phạm: {", ".join([kw["keyword"] for kw in found_keywords])}'
            warning_message += f'\n\nSố lần vi phạm: {user.violation_count}'
            if user.violation_count >= 3:
                warning_message += '\n⚠️ Bạn đã vi phạm quá nhiều lần. Tài khoản có thể bị khóa.'
            
            # Store banned keywords in metadata
            metadata = {
                'banned_keywords': found_keywords,
                'content_type': 'post',
                'severity': max_severity,
                'violation_count': user.violation_count
            }
            
            create_notification(
                user_id=user_id,
                type='violation_warning',
                message=warning_message,
                title='⚠️ Cảnh báo: Bài viết chứa từ khóa cấm',
                related_type='post',
                action_url=None,
                metadata=metadata,
                emit_realtime=True
            )
            
            return jsonify({
                'error': 'Bài viết chứa từ khóa cấm và không thể đăng',
                'banned_keywords': found_keywords,
                'message': warning_message,
                'violation_count': user.violation_count
            }), 400
        
        # Create new post
        post = Post(title=title, content=content, author_id=user_id)
        
        # Set optional fields
        optional_fields = [
            'excerpt', 'content_type', 'language', 'featured_image', 
            'video_url', 'video_embed', 'location_lat', 'location_lng',
            'location_name', 'location_address', 'category', 'difficulty_level',
            'meta_title', 'meta_description', 'meta_keywords', 'visibility'
        ]
        
        for field in optional_fields:
            if field in data:
                setattr(post, field, data[field])
        
        # Set tags if provided
        if 'tags' in data and isinstance(data['tags'], list):
            post.set_tags(data['tags'])
        
        # Set images if provided
        if 'images' in data and isinstance(data['images'], list):
            post.set_images(data['images'])
        
        # Set allowed viewers if provided (for friends visibility)
        if 'allowed_viewers' in data and isinstance(data['allowed_viewers'], list):
            post.set_allowed_viewers(data['allowed_viewers'])
        
        # Set story choices for interactive content
        if 'story_choices' in data and data['story_choices']:
            post.set_story_choices(data['story_choices'])
        
        # Calculate reading time
        post.calculate_reading_time()
        
        # Set status
        status = data.get('status', 'draft')
        if status in ['draft', 'published', 'pending']:
            post.status = status
            if status == 'published':
                post.publish()
        
        db.session.add(post)
        db.session.commit()
        
        # Award points for creating content
        user.add_points(100)
        db.session.commit()
        
        # Send success notification
        from routes.notifications import create_notification
        create_notification(
            user_id=user_id,
            type='post_created',
            message=f'Bài viết "{title[:50]}..." của bạn đã được đăng thành công!',
            title='✅ Đăng bài thành công',
            related_type='post',
            related_id=post.id,
            action_url=f'/posts/{post.slug}',
            emit_realtime=True
        )
        
        return jsonify({
            'message': 'Tạo bài viết thành công!',
            'post': post.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi tạo bài viết: {str(e)}'}), 500

@posts_bp.route('/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    """Update existing post"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        post = Post.query.get_or_404(post_id)
        
        # Check permissions
        if not post.can_edit_post(user) and not user.can_edit_post(post):
            return jsonify({'error': 'Không có quyền chỉnh sửa bài viết này'}), 403
        
        data = request.get_json()
        
        # Update fields
        updatable_fields = [
            'title', 'content', 'excerpt', 'content_type', 'language',
            'featured_image', 'video_url', 'video_embed', 'location_lat',
            'location_lng', 'location_name', 'location_address', 'category',
            'difficulty_level', 'meta_title', 'meta_description', 'meta_keywords'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(post, field, data[field])
        
        # Update tags
        if 'tags' in data and isinstance(data['tags'], list):
            post.set_tags(data['tags'])
        
        # Update images
        if 'images' in data and isinstance(data['images'], list):
            post.set_images(data['images'])
        
        # Update story choices
        if 'story_choices' in data:
            post.set_story_choices(data['story_choices'])
        
        # Update collaborators (only author can do this)
        if 'collaborators' in data and post.author_id == user_id:
            post.set_collaborators(data['collaborators'])
        
        # Update status (admins and moderators can change any status)
        if 'status' in data:
            new_status = data['status']
            if user.can_moderate() or (post.author_id == user_id and new_status != 'published'):
                post.status = new_status
                if new_status == 'published' and not post.published_at:
                    post.publish()
        
        # Recalculate reading time
        if 'content' in data:
            post.calculate_reading_time()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật bài viết thành công!',
            'post': post.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cập nhật bài viết: {str(e)}'}), 500

@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    """Delete post"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        post = Post.query.get_or_404(post_id)
        
        # Check permissions (author or admin/moderator)
        if post.author_id != user_id and not user.can_moderate():
            return jsonify({'error': 'Không có quyền xóa bài viết này'}), 403
        
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Xóa bài viết thành công!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa bài viết: {str(e)}'}), 500

@posts_bp.route('/<int:post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    """Like/unlike post"""
    try:
        user_id = get_jwt_identity()
        post = Post.query.get_or_404(post_id)
        
        # TODO: Implement likes tracking table for users
        # For now, just increment likes count
        post.increment_likes()
        db.session.commit()
        
        return jsonify({
            'message': 'Đã thích bài viết',
            'likes_count': post.likes_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500

@posts_bp.route('/<int:post_id>/share', methods=['POST'])
@jwt_required()
def share_post(post_id):
    """Share post (increment share count)"""
    try:
        post = Post.query.get_or_404(post_id)
        
        post.increment_shares()
        db.session.commit()
        
        return jsonify({
            'message': 'Đã chia sẻ bài viết',
            'shares_count': post.shares_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500

@posts_bp.route('/featured', methods=['GET'])
def get_featured_posts():
    """Get featured posts"""
    try:
        limit = request.args.get('limit', 6, type=int)
        
        posts = Post.query.filter_by(
            status='published',
            featured=True
        ).order_by(desc(Post.published_at)).limit(limit).all()
        
        posts_data = []
        for post in posts:
            post_dict = post.to_dict(include_content=False)
            # Include author info
            author = User.query.get(post.author_id)
            post_dict['author'] = {
                'username': author.username,
                'full_name': author.full_name,
                'avatar_url': author.avatar_url
            } if author else None
            posts_data.append(post_dict)
        
        return jsonify({'featured_posts': posts_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy bài viết nổi bật: {str(e)}'}), 500

@posts_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get available post categories"""
    categories = [
        {'value': 'travel', 'label': 'Du lịch'},
        {'value': 'food', 'label': 'Ẩm thực'},
        {'value': 'culture', 'label': 'Văn hóa'},
        {'value': 'adventure', 'label': 'Phiêu lưu'},
        {'value': 'budget', 'label': 'Du lịch bụi'},
        {'value': 'luxury', 'label': 'Cao cấp'}
    ]
    
    return jsonify({'categories': categories}), 200

@posts_bp.route('/tags/popular', methods=['GET'])
def get_popular_tags():
    """Get popular tags"""
    try:
        # This is a simplified version - in production you'd want proper tag counting
        posts_with_tags = Post.query.filter(
            Post.tags.isnot(None),
            Post.status == 'published'
        ).limit(100).all()
        
        tag_counts = {}
        for post in posts_with_tags:
            tags = post.get_tags()
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        # Sort by popularity
        popular_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:20]
        
        return jsonify({
            'popular_tags': [{'name': tag, 'count': count} for tag, count in popular_tags]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy tags phổ biến: {str(e)}'}), 500


# ============ SLUG-BASED ROUTES ============

@posts_bp.route('/<slug>', methods=['GET'])
def get_post_by_slug(slug):
    """Get post by slug"""
    try:
        # Get optional user_id from JWT if available
        user_id = None
        try:
            from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if isinstance(user_id, str):
                user_id = int(user_id)
        except:
            pass

        # Find post by slug
        post = Post.query.filter_by(slug=slug).first_or_404()
        
        # Increment views only if not author viewing own post
        if not user_id or user_id != post.author_id:
            post.views_count = (post.views_count or 0) + 1
            db.session.commit()
        
        # Get post data with author info
        post_data = post.to_dict()
        
        # Add author information
        if post.author:
            post_data['author'] = {
                'id': post.author.id,
                'username': post.author.username,
                'full_name': post.author.full_name,
                'avatar_url': post.author.avatar_url,
                'bio': post.author.bio
            }
        
        # Add engagement stats (use numeric columns to avoid missing relationships)
        try:
            post_data['likes_count'] = int(post.likes_count or 0)
        except Exception:
            post_data['likes_count'] = 0

        # Use stored comments_count if available, otherwise fallback to counting
        try:
            post_data['comments_count'] = int(post.comments_count or 0)
        except Exception:
            post_data['comments_count'] = Comment.query.filter_by(
                post_id=post.id,
                status='approved',
                parent_id=None
            ).count()
        
        # Check if current user liked/bookmarked
        if user_id:
            user = User.query.get(user_id)
            if user:
                # liked_posts is JSON array of IDs, not relationship
                liked_post_ids = user.get_liked_posts()
                bookmarked_post_ids = user.get_bookmarks()
                post_data['is_liked'] = post.id in liked_post_ids
                post_data['is_bookmarked'] = post.id in bookmarked_post_ids
        
        return jsonify({'post': post_data}), 200
        
    except Exception as e:
        import traceback
        print(f"[Posts] Error getting post by slug: {traceback.format_exc()}")
        return jsonify({'error': f'Lỗi lấy bài viết: {str(e)}'}), 500


@posts_bp.route('/<slug>', methods=['PUT'])
@jwt_required()
def update_post_by_slug(slug):
    """Update existing post by slug"""
    try:
        user_id = get_jwt_identity()
        # Convert to int if it's a string to match database ID type
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        user = User.query.get(user_id)
        post = Post.query.filter_by(slug=slug).first_or_404()
        
        # Check permissions (author only, or admin/moderator)
        if post.author_id != user_id and not user.can_moderate():
            return jsonify({'error': 'Không có quyền chỉnh sửa bài viết này'}), 403
        
        data = request.get_json()
        
        # Debug log
        print(f"[Posts Update] Slug: {slug}")
        print(f"[Posts Update] Received visibility: {data.get('visibility')}")
        print(f"[Posts Update] Received allowed_viewers: {data.get('allowed_viewers')}")
        
        # Update fields
        if 'title' in data:
            post.title = data['title']
            # Don't regenerate slug on edit to keep the same URL
            # post.slug remains unchanged
            
        if 'content' in data:
            post.content = data['content']
            post.calculate_reading_time()  # Recalculate reading time
            
        if 'excerpt' in data:
            post.excerpt = data['excerpt']
            
        if 'featured_image' in data:
            post.featured_image = data['featured_image']
            
        if 'category' in data:
            post.category = data['category']
            
        if 'tags' in data:
            # Handle tags as comma-separated string or array
            if isinstance(data['tags'], list):
                post.set_tags(data['tags'])
            else:
                # If empty string, set to None to avoid JSON error
                post.tags = data['tags'] if data['tags'] else None
        
        # Update images
        if 'images' in data:
            if isinstance(data['images'], list):
                post.set_images(data['images'])
            else:
                post.images = data['images'] if data['images'] else None
        
        # Update visibility - ALWAYS update if present in data
        if 'visibility' in data:
            new_visibility = data['visibility']
            if new_visibility in ['public', 'private', 'friends']:
                post.visibility = new_visibility
                print(f"[Posts Update] Set visibility to: {new_visibility}")
        
        # Update allowed viewers for friends visibility
        if 'allowed_viewers' in data:
            if isinstance(data['allowed_viewers'], list):
                post.set_allowed_viewers(data['allowed_viewers'])
                print(f"[Posts Update] Set allowed_viewers to: {data['allowed_viewers']}")
                
        if 'location_data' in data:
            post.location_data = json.dumps(data['location_data']) if isinstance(data['location_data'], dict) else data['location_data']
        
        # Update location fields
        if 'location_name' in data:
            post.location_name = data['location_name']
        if 'location_address' in data:
            post.location_address = data['location_address']
            
        if 'status' in data:
            new_status = data['status']
            if new_status in ['draft', 'published']:
                post.status = new_status
                if new_status == 'published' and not post.published_at:
                    post.publish()
        
        post.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log final state
        print(f"[Posts Update] SAVED - visibility: {post.visibility}, allowed_viewers: {post.allowed_viewers}")
        
        return jsonify({
            'message': 'Cập nhật bài viết thành công!',
            'post': post.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cập nhật bài viết: {str(e)}'}), 500


@posts_bp.route('/<slug>', methods=['DELETE'])
@jwt_required()
def delete_post_by_slug(slug):
    """Delete post by slug"""
    try:
        user_id = get_jwt_identity()
        # Convert to int if it's a string to match database ID type
        if isinstance(user_id, str):
            user_id = int(user_id)
            
        user = User.query.get(user_id)
        post = Post.query.filter_by(slug=slug).first_or_404()
        
        # Check permissions (author only, or admin/moderator)
        if post.author_id != user_id and not user.can_moderate():
            return jsonify({'error': 'Không có quyền xóa bài viết này'}), 403
        
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Xóa bài viết thành công!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa bài viết: {str(e)}'}), 500