"""
Social Routes for VieGo Blog
Handles bookmarks, likes, follows, and social interactions
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc
from datetime import datetime

from models import db
from models.user import User
from models.post import Post

social_bp = Blueprint('social', __name__, url_prefix='/api/social')

# ====================
# BOOKMARKS
# ====================

@social_bp.route('/bookmarks', methods=['GET'])
@jwt_required()
def get_bookmarks():
    """Get user's bookmarked posts"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Get bookmarked post IDs from user
        bookmarked_ids = user.get_bookmarks()
        
        if not bookmarked_ids:
            return jsonify({
                'bookmarks': [],
                'total': 0
            }), 200
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 50)
        
        # Get bookmarked posts
        query = Post.query.filter(
            Post.id.in_(bookmarked_ids),
            Post.status == 'published'
        ).order_by(desc(Post.created_at))
        
        posts_pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Format response with author info
        posts_data = []
        for post in posts_pagination.items:
            post_dict = post.to_dict(include_content=False)
            
            # Include author info
            author = User.query.get(post.author_id)
            post_dict['author'] = {
                'id': author.id,
                'username': author.username,
                'full_name': author.full_name,
                'avatar_url': author.avatar_url
            } if author else None
            
            posts_data.append(post_dict)
        
        return jsonify({
            'bookmarks': posts_data,
            'pagination': {
                'page': posts_pagination.page,
                'pages': posts_pagination.pages,
                'per_page': posts_pagination.per_page,
                'total': posts_pagination.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy bookmarks: {str(e)}'}), 500


@social_bp.route('/bookmarks/<post_identifier>', methods=['POST'])
@jwt_required()
def add_bookmark(post_identifier):
    """Bookmark a post (by ID or slug)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Get post by ID or slug
        if post_identifier.isdigit():
            post = Post.query.get(int(post_identifier))
        else:
            post = Post.query.filter_by(slug=post_identifier).first()
        
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        post_id = post.id
        
        # Add bookmark
        bookmarks = user.get_bookmarks()
        if post_id not in bookmarks:
            bookmarks.append(post_id)
            user.set_bookmarks(bookmarks)
            db.session.commit()
            
            return jsonify({'message': 'Đã lưu bài viết'}), 200
        else:
            return jsonify({'message': 'Bài viết đã được lưu trước đó'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi lưu bài viết: {str(e)}'}), 500


@social_bp.route('/bookmarks/<post_identifier>', methods=['DELETE'])
@jwt_required()
def remove_bookmark(post_identifier):
    """Remove bookmark from a post (by ID or slug)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Get post by ID or slug
        if post_identifier.isdigit():
            post = Post.query.get(int(post_identifier))
        else:
            post = Post.query.filter_by(slug=post_identifier).first()
        
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        post_id = post.id
        
        # Remove bookmark
        bookmarks = user.get_bookmarks()
        if post_id in bookmarks:
            bookmarks.remove(post_id)
            user.set_bookmarks(bookmarks)
            db.session.commit()
        
        return jsonify({'message': 'Đã xóa bookmark'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa bookmark: {str(e)}'}), 500


@social_bp.route('/bookmarks/check/<post_identifier>', methods=['GET'])
@jwt_required()
def check_bookmark(post_identifier):
    """Check if a post is bookmarked by user (by ID or slug)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Get post by ID or slug
        if post_identifier.isdigit():
            post = Post.query.get(int(post_identifier))
        else:
            post = Post.query.filter_by(slug=post_identifier).first()
        
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        post_id = post.id
        
        bookmarks = user.get_bookmarks()
        is_bookmarked = post_id in bookmarks
        
        return jsonify({'is_bookmarked': is_bookmarked}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500


# ====================
# LIKES
# ====================

@social_bp.route('/likes/post/<post_identifier>', methods=['POST'])
@jwt_required()
def like_post(post_identifier):
    """Like a post (by ID or slug)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Get post by ID or slug
        if post_identifier.isdigit():
            post = Post.query.get(int(post_identifier))
        else:
            post = Post.query.filter_by(slug=post_identifier).first()
        
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        post_id = post.id
        
        # Add like
        liked_posts = user.get_liked_posts()
        if post_id not in liked_posts:
            liked_posts.append(post_id)
            user.set_liked_posts(liked_posts)
            
            # Increment post like count
            post.likes_count += 1
            
            db.session.commit()
            
            return jsonify({
                'message': 'Đã thích bài viết',
                'likes_count': post.likes_count
            }), 200
        else:
            return jsonify({
                'message': 'Đã thích bài viết này trước đó',
                'likes_count': post.likes_count
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500


@social_bp.route('/likes/post/<post_identifier>', methods=['DELETE'])
@jwt_required()
def unlike_post(post_identifier):
    """Unlike a post (by ID or slug)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Get post by ID or slug
        if post_identifier.isdigit():
            post = Post.query.get(int(post_identifier))
        else:
            post = Post.query.filter_by(slug=post_identifier).first()
        
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        post_id = post.id
        
        # Remove like
        liked_posts = user.get_liked_posts()
        if post_id in liked_posts:
            liked_posts.remove(post_id)
            user.set_liked_posts(liked_posts)
            
            # Decrement post like count
            if post.likes_count > 0:
                post.likes_count -= 1
            
            db.session.commit()
        
        return jsonify({
            'message': 'Đã bỏ thích bài viết',
            'likes_count': post.likes_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500


@social_bp.route('/likes/check/<post_identifier>', methods=['GET'])
@jwt_required()
def check_like(post_identifier):
    """Check if a post is liked by user (by ID or slug)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Get post by ID or slug
        if post_identifier.isdigit():
            post = Post.query.get(int(post_identifier))
        else:
            post = Post.query.filter_by(slug=post_identifier).first()
        
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        post_id = post.id
        liked_posts = user.get_liked_posts()
        is_liked = post_id in liked_posts
        
        return jsonify({'is_liked': is_liked}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500


@social_bp.route('/liked-posts', methods=['GET'])
@jwt_required()
def get_liked_posts():
    """Get user's liked posts"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Get liked post IDs from user
        liked_ids = user.get_liked_posts()
        
        if not liked_ids:
            return jsonify({
                'liked_posts': [],
                'total': 0
            }), 200
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 50)
        
        # Get liked posts
        query = Post.query.filter(
            Post.id.in_(liked_ids),
            Post.status == 'published'
        ).order_by(desc(Post.created_at))
        
        posts_pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Format response with author info
        posts_data = []
        for post in posts_pagination.items:
            post_dict = post.to_dict(include_content=False)
            
            # Include author info
            author = User.query.get(post.author_id)
            post_dict['author'] = {
                'id': author.id,
                'username': author.username,
                'full_name': author.full_name,
                'avatar_url': author.avatar_url
            } if author else None
            
            posts_data.append(post_dict)
        
        return jsonify({
            'liked_posts': posts_data,
            'pagination': {
                'page': posts_pagination.page,
                'pages': posts_pagination.pages,
                'per_page': posts_pagination.per_page,
                'total': posts_pagination.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy liked posts: {str(e)}'}), 500


# ====================
# FOLLOW/UNFOLLOW
# ====================

@social_bp.route('/follow/<int:target_user_id>', methods=['POST'])
@jwt_required()
def follow_user(target_user_id):
    """Follow another user"""
    try:
        user_id = get_jwt_identity()
        
        # Can't follow yourself
        if user_id == target_user_id:
            return jsonify({'error': 'Không thể follow chính mình'}), 400
        
        user = User.query.get(user_id)
        target_user = User.query.get(target_user_id)
        
        if not user or not target_user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Add to following list
        following = user.get_following()
        if target_user_id not in following:
            following.append(target_user_id)
            user.set_following(following)
            
            # Add to target's followers list
            followers = target_user.get_followers()
            if user_id not in followers:
                followers.append(user_id)
                target_user.set_followers(followers)
            
            db.session.commit()
            
            return jsonify({
                'message': f'Đã follow {target_user.username}',
                'following_count': len(following),
                'followers_count': len(followers)
            }), 200
        else:
            return jsonify({
                'message': 'Đã follow người dùng này trước đó',
                'following_count': len(following)
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi follow: {str(e)}'}), 500


@social_bp.route('/unfollow/<int:target_user_id>', methods=['POST'])
@jwt_required()
def unfollow_user(target_user_id):
    """Unfollow a user"""
    try:
        user_id = get_jwt_identity()
        
        user = User.query.get(user_id)
        target_user = User.query.get(target_user_id)
        
        if not user or not target_user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Remove from following list
        following = user.get_following()
        if target_user_id in following:
            following.remove(target_user_id)
            user.set_following(following)
            
            # Remove from target's followers list
            followers = target_user.get_followers()
            if user_id in followers:
                followers.remove(user_id)
                target_user.set_followers(followers)
            
            db.session.commit()
        
        return jsonify({
            'message': f'Đã unfollow {target_user.username}',
            'following_count': len(following)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi unfollow: {str(e)}'}), 500


@social_bp.route('/following', methods=['GET'])
@jwt_required()
def get_following():
    """Get list of users that current user is following"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        following_ids = user.get_following()
        
        if not following_ids:
            return jsonify({
                'following': [],
                'total': 0
            }), 200
        
        # Get user details
        following_users = User.query.filter(User.id.in_(following_ids)).all()
        
        following_data = [{
            'id': u.id,
            'username': u.username,
            'full_name': u.full_name,
            'avatar_url': u.avatar_url,
            'bio': u.bio,
            'posts_count': len(u.posts) if hasattr(u, 'posts') else 0
        } for u in following_users]
        
        return jsonify({
            'following': following_data,
            'total': len(following_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500


@social_bp.route('/followers', methods=['GET'])
@jwt_required()
def get_followers():
    """Get list of users following current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        follower_ids = user.get_followers()
        
        if not follower_ids:
            return jsonify({
                'followers': [],
                'total': 0
            }), 200
        
        # Get user details
        follower_users = User.query.filter(User.id.in_(follower_ids)).all()
        
        followers_data = [{
            'id': u.id,
            'username': u.username,
            'full_name': u.full_name,
            'avatar_url': u.avatar_url,
            'bio': u.bio,
            'posts_count': len(u.posts) if hasattr(u, 'posts') else 0
        } for u in follower_users]
        
        return jsonify({
            'followers': followers_data,
            'total': len(followers_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500


@social_bp.route('/check-follow/<int:target_user_id>', methods=['GET'])
@jwt_required()
def check_following(target_user_id):
    """Check if current user is following target user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        following = user.get_following()
        is_following = target_user_id in following
        
        return jsonify({'is_following': is_following}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500
