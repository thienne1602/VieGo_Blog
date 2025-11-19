"""
Social Routes for VieGo Blog
Handles bookmarks, likes, follows, and social interactions
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from models import db
from models.user import User
from models.post import Post
from models.friendship import FriendRequest
from routes.notifications import create_notification

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
            
            # Create notification for post author (if not self-like)
            if post.user_id != user_id:
                from routes.notifications import create_notification
                create_notification(
                    user_id=post.user_id,
                    type='like',
                    message=f'{user.full_name or user.username} đã thích bài viết của bạn',
                    title='Có người thích bài viết',
                    actor_id=user_id,
                    related_type='post',
                    related_id=post_id,
                    action_url=f'/posts/{post.slug or post_id}',
                    emit_realtime=True
                )
            
            # Emit socket event for real-time update
            from utils.socket_utils import emit_to_user
            emit_to_user(post.user_id, 'post_liked', {
                'post_id': post_id,
                'post_slug': post.slug,
                'likes_count': post.likes_count,
                'user_id': user_id,
                'username': user.username,
                'full_name': user.full_name
            })
            
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
            
            # Emit socket event for real-time update
            from utils.socket_utils import emit_to_user
            emit_to_user(post.user_id, 'post_unliked', {
                'post_id': post_id,
                'post_slug': post.slug,
                'likes_count': post.likes_count,
                'user_id': user_id
            })
        
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


# ====================
# FRIEND REQUESTS
# ====================

@social_bp.route('/friends/request/<int:target_user_id>', methods=['POST'])
@jwt_required()
def send_friend_request(target_user_id):
    """Send a friend request to another user"""
    import traceback
    try:
        user_id = get_jwt_identity()
        # Convert to int if it's a string (JWT identity might be stored as string)
        if isinstance(user_id, str) and user_id.isdigit():
            user_id = int(user_id)
        print(f'[Friend Request] User {user_id} sending friend request to {target_user_id}')
        
        # Can't send request to yourself
        if user_id == target_user_id:
            print(f'[Friend Request] Error: User {user_id} tried to send request to themselves')
            return jsonify({'error': 'Không thể gửi lời mời kết bạn cho chính mình'}), 400
        
        requester = User.query.get(user_id)
        receiver = User.query.get(target_user_id)
        
        if not requester:
            print(f'[Friend Request] Error: Requester {user_id} not found')
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        if not receiver:
            print(f'[Friend Request] Error: Receiver {target_user_id} not found')
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Refresh both users to get latest data from database
        db.session.refresh(requester)
        db.session.refresh(receiver)
        
        print(f'[Friend Request] Requester: {requester.username}, Receiver: {receiver.username}')
        
        # Check if already friends (bidirectional check)
        if requester.is_friend_with(target_user_id):
            print(f'[Friend Request] Users {user_id} and {target_user_id} are already friends')
            return jsonify({'error': 'Đã là bạn bè'}), 400
        
        # Check if request already exists
        existing_request = FriendRequest.query.filter(
            ((FriendRequest.requester_id == user_id) & (FriendRequest.receiver_id == target_user_id)) |
            ((FriendRequest.requester_id == target_user_id) & (FriendRequest.receiver_id == user_id))
        ).filter(FriendRequest.status == 'pending').first()
        
        if existing_request:
            if existing_request.requester_id == user_id:
                print(f'[Friend Request] Request already sent from {user_id} to {target_user_id}')
                return jsonify({'error': 'Đã gửi lời mời kết bạn trước đó'}), 400
            else:
                print(f'[Friend Request] Request already received from {target_user_id} to {user_id}')
                return jsonify({'error': 'Người này đã gửi lời mời kết bạn cho bạn. Vui lòng chấp nhận hoặc từ chối.'}), 400
        
        # Create friend request
        print(f'[Friend Request] Creating new friend request from {user_id} to {target_user_id}')
        try:
            friend_request = FriendRequest(
                requester_id=user_id,
                receiver_id=target_user_id,
                status='pending'
            )
            db.session.add(friend_request)
            db.session.commit()
            print(f'[Friend Request] Friend request created with ID: {friend_request.id}')
        except IntegrityError as e:
            db.session.rollback()
            # Check if it's a duplicate key error
            if 'unique_friend_request' in str(e.orig) or 'Duplicate entry' in str(e.orig):
                print(f'[Friend Request] Duplicate request detected (IntegrityError)')
                # Re-check existing request
                existing_request = FriendRequest.query.filter(
                    ((FriendRequest.requester_id == user_id) & (FriendRequest.receiver_id == target_user_id)) |
                    ((FriendRequest.requester_id == target_user_id) & (FriendRequest.receiver_id == user_id))
                ).filter(FriendRequest.status == 'pending').first()
                
                if existing_request:
                    if existing_request.requester_id == user_id:
                        return jsonify({'error': 'Đã gửi lời mời kết bạn trước đó'}), 400
                    else:
                        return jsonify({'error': 'Người này đã gửi lời mời kết bạn cho bạn. Vui lòng chấp nhận hoặc từ chối.'}), 400
                else:
                    return jsonify({'error': 'Đã gửi lời mời kết bạn trước đó'}), 400
            else:
                raise
        
        # Create notification for receiver
        print(f'[Friend Request] Creating notification for user {target_user_id}')
        try:
            notification = create_notification(
                user_id=target_user_id,
                type='friend_request',
                message=f'{requester.full_name or requester.username} đã gửi cho bạn lời mời kết bạn',
                title='Lời mời kết bạn mới',
                actor_id=user_id,
                related_type='friend_request',
                related_id=friend_request.id,
                action_url=f'/profile/user?id={user_id}',
                metadata={'request_id': friend_request.id},
                emit_realtime=True
            )
            
            if notification:
                print(f'[Friend Request] Notification created successfully: ID {notification.id}')
            else:
                print(f'[Friend Request] WARNING: Failed to create notification for friend request {friend_request.id}')
        except Exception as notif_error:
            print(f'[Friend Request] ERROR creating notification: {str(notif_error)}')
            print(traceback.format_exc())
            # Don't fail the request if notification fails
        
        print(f'[Friend Request] Successfully sent friend request from {user_id} to {target_user_id}')
        return jsonify({
            'success': True,
            'message': 'Đã gửi lời mời kết bạn',
            'friend_request': friend_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        error_msg = str(e)
        print(f'[Friend Request] ERROR: {error_msg}')
        print(traceback.format_exc())
        return jsonify({'error': f'Lỗi gửi lời mời kết bạn: {error_msg}'}), 500


@social_bp.route('/friends/accept/<int:request_id>', methods=['POST'])
@jwt_required()
def accept_friend_request(request_id):
    """Accept a friend request"""
    import traceback
    try:
        user_id = get_jwt_identity()
        # Convert to int if it's a string (JWT identity might be stored as string)
        if isinstance(user_id, str) and user_id.isdigit():
            user_id = int(user_id)
        print(f'[Accept Friend Request] User {user_id} trying to accept request {request_id}')
        
        friend_request = FriendRequest.query.get(request_id)
        
        if not friend_request:
            print(f'[Accept Friend Request] ERROR: Request {request_id} not found')
            return jsonify({'error': 'Không tìm thấy lời mời kết bạn'}), 404
        
        print(f'[Accept Friend Request] Request found: requester_id={friend_request.requester_id}, receiver_id={friend_request.receiver_id}, status={friend_request.status}')
        print(f'[Accept Friend Request] Current user_id={user_id} (type: {type(user_id).__name__}), receiver_id={friend_request.receiver_id} (type: {type(friend_request.receiver_id).__name__}), match={friend_request.receiver_id == user_id}')
        
        # Check if current user is the receiver
        if friend_request.receiver_id != user_id:
            print(f'[Accept Friend Request] ERROR: Permission denied - user {user_id} is not receiver {friend_request.receiver_id}')
            return jsonify({
                'error': 'Không có quyền chấp nhận lời mời này',
                'debug': {
                    'user_id': user_id,
                    'receiver_id': friend_request.receiver_id,
                    'requester_id': friend_request.requester_id
                }
            }), 403
        
        if friend_request.status != 'pending':
            print(f'[Accept Friend Request] ERROR: Request {request_id} status is {friend_request.status}, not pending')
            return jsonify({'error': 'Lời mời kết bạn đã được xử lý'}), 400
        
        # Accept the request
        print(f'[Accept Friend Request] Accepting request {request_id}')
        friend_request.accept()
        
        # Add each other as friends
        requester = User.query.get(friend_request.requester_id)
        receiver = User.query.get(friend_request.receiver_id)
        
        if not requester:
            print(f'[Accept Friend Request] WARNING: Requester {friend_request.requester_id} not found')
        if not receiver:
            print(f'[Accept Friend Request] WARNING: Receiver {friend_request.receiver_id} not found')
        
        if requester and receiver:
            print(f'[Accept Friend Request] Adding friendship: {requester.username} <-> {receiver.username}')
            # Add friendship both ways - ensure data consistency
            requester.add_friend(friend_request.receiver_id)
            receiver.add_friend(friend_request.requester_id)
            
            # Verify both users have each other in their friends list
            requester_friends = requester.get_friends()
            receiver_friends = receiver.get_friends()
            
            if friend_request.receiver_id not in requester_friends:
                print(f'[Accept Friend Request] WARNING: Receiver {friend_request.receiver_id} not in requester friends list, re-adding...')
                requester.add_friend(friend_request.receiver_id)
            
            if friend_request.requester_id not in receiver_friends:
                print(f'[Accept Friend Request] WARNING: Requester {friend_request.requester_id} not in receiver friends list, re-adding...')
                receiver.add_friend(friend_request.requester_id)
            
            db.session.commit()
            
            # Double-check after commit
            db.session.refresh(requester)
            db.session.refresh(receiver)
            final_requester_friends = requester.get_friends()
            final_receiver_friends = receiver.get_friends()
            print(f'[Accept Friend Request] Final verification - Requester friends: {final_requester_friends}, Receiver friends: {final_receiver_friends}')
            print(f'[Accept Friend Request] Friendship added successfully')
        
        # Create notification for requester
        try:
            notification = create_notification(
                user_id=friend_request.requester_id,
                type='friend_request_accepted',
                message=f'{receiver.full_name or receiver.username} đã chấp nhận lời mời kết bạn của bạn',
                title='Lời mời kết bạn được chấp nhận',
                actor_id=user_id,
                related_type='user',
                related_id=user_id,
                action_url=f'/profile/user?id={user_id}',
                emit_realtime=True
            )
            if notification:
                print(f'[Accept Friend Request] Notification created: ID {notification.id}')
            else:
                print(f'[Accept Friend Request] WARNING: Failed to create notification')
        except Exception as notif_error:
            print(f'[Accept Friend Request] ERROR creating notification: {str(notif_error)}')
            print(traceback.format_exc())
            # Don't fail if notification fails
        
        print(f'[Accept Friend Request] Successfully accepted request {request_id}')
        return jsonify({
            'success': True,
            'message': 'Đã chấp nhận lời mời kết bạn',
            'friend_request': friend_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        error_msg = str(e)
        print(f'[Accept Friend Request] ERROR: {error_msg}')
        print(traceback.format_exc())
        return jsonify({'error': f'Lỗi chấp nhận lời mời kết bạn: {error_msg}'}), 500


@social_bp.route('/friends/accept-by-user/<int:target_user_id>', methods=['POST'])
@jwt_required()
def accept_friend_request_by_user(target_user_id):
    """Accept a friend request by target user ID (safer - finds the request automatically)"""
    import traceback
    try:
        user_id = get_jwt_identity()
        # Convert to int if it's a string (JWT identity might be stored as string)
        if isinstance(user_id, str) and user_id.isdigit():
            user_id = int(user_id)
        print(f'[Accept Friend Request By User] User {user_id} trying to accept request from {target_user_id}')
        
        # Find the pending request where target_user_id is the requester and current user is the receiver
        friend_request = FriendRequest.query.filter(
            FriendRequest.requester_id == target_user_id,
            FriendRequest.receiver_id == user_id,
            FriendRequest.status == 'pending'
        ).first()
        
        if not friend_request:
            print(f'[Accept Friend Request By User] ERROR: No pending request found from {target_user_id} to {user_id}')
            # Check if already friends
            user = User.query.get(user_id)
            if user and user.is_friend_with(target_user_id):
                return jsonify({'error': 'Đã là bạn bè'}), 400
            # Check if request was sent in opposite direction
            opposite_request = FriendRequest.query.filter(
                FriendRequest.requester_id == user_id,
                FriendRequest.receiver_id == target_user_id,
                FriendRequest.status == 'pending'
            ).first()
            if opposite_request:
                return jsonify({'error': 'Bạn đã gửi lời mời kết bạn cho người này. Vui lòng đợi họ chấp nhận.'}), 400
            return jsonify({'error': 'Không tìm thấy lời mời kết bạn'}), 404
        
        print(f'[Accept Friend Request By User] Request found: ID={friend_request.id}, requester_id={friend_request.requester_id}, receiver_id={friend_request.receiver_id}')
        
        # Accept the request
        print(f'[Accept Friend Request By User] Accepting request {friend_request.id}')
        friend_request.accept()
        
        # Add each other as friends
        requester = User.query.get(friend_request.requester_id)
        receiver = User.query.get(friend_request.receiver_id)
        
        if not requester:
            print(f'[Accept Friend Request By User] WARNING: Requester {friend_request.requester_id} not found')
        if not receiver:
            print(f'[Accept Friend Request By User] WARNING: Receiver {friend_request.receiver_id} not found')
        
        if requester and receiver:
            print(f'[Accept Friend Request By User] Adding friendship: {requester.username} <-> {receiver.username}')
            # Add friendship both ways - ensure data consistency
            requester.add_friend(friend_request.receiver_id)
            receiver.add_friend(friend_request.requester_id)
            
            # Verify both users have each other in their friends list
            requester_friends = requester.get_friends()
            receiver_friends = receiver.get_friends()
            
            if friend_request.receiver_id not in requester_friends:
                print(f'[Accept Friend Request By User] WARNING: Receiver {friend_request.receiver_id} not in requester friends list, re-adding...')
                requester.add_friend(friend_request.receiver_id)
            
            if friend_request.requester_id not in receiver_friends:
                print(f'[Accept Friend Request By User] WARNING: Requester {friend_request.requester_id} not in receiver friends list, re-adding...')
                receiver.add_friend(friend_request.requester_id)
            
            db.session.commit()
            
            # Double-check after commit
            db.session.refresh(requester)
            db.session.refresh(receiver)
            final_requester_friends = requester.get_friends()
            final_receiver_friends = receiver.get_friends()
            print(f'[Accept Friend Request By User] Final verification - Requester friends: {final_requester_friends}, Receiver friends: {final_receiver_friends}')
            print(f'[Accept Friend Request By User] Friendship added successfully')
        
        # Create notification for requester
        try:
            notification = create_notification(
                user_id=friend_request.requester_id,
                type='friend_request_accepted',
                message=f'{receiver.full_name or receiver.username} đã chấp nhận lời mời kết bạn của bạn',
                title='Lời mời kết bạn được chấp nhận',
                actor_id=user_id,
                related_type='user',
                related_id=user_id,
                action_url=f'/profile/user?id={user_id}',
                emit_realtime=True
            )
            if notification:
                print(f'[Accept Friend Request By User] Notification created: ID {notification.id}')
            else:
                print(f'[Accept Friend Request By User] WARNING: Failed to create notification')
        except Exception as notif_error:
            print(f'[Accept Friend Request By User] ERROR creating notification: {str(notif_error)}')
            print(traceback.format_exc())
            # Don't fail if notification fails
        
        print(f'[Accept Friend Request By User] Successfully accepted request {friend_request.id}')
        return jsonify({
            'success': True,
            'message': 'Đã chấp nhận lời mời kết bạn',
            'friend_request': friend_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        error_msg = str(e)
        print(f'[Accept Friend Request By User] ERROR: {error_msg}')
        print(traceback.format_exc())
        return jsonify({'error': f'Lỗi chấp nhận lời mời kết bạn: {error_msg}'}), 500


@social_bp.route('/friends/reject/<int:request_id>', methods=['POST'])
@jwt_required()
def reject_friend_request(request_id):
    """Reject a friend request"""
    try:
        user_id = get_jwt_identity()
        # Convert to int if it's a string (JWT identity might be stored as string)
        if isinstance(user_id, str) and user_id.isdigit():
            user_id = int(user_id)
        
        friend_request = FriendRequest.query.get(request_id)
        
        if not friend_request:
            return jsonify({'error': 'Không tìm thấy lời mời kết bạn'}), 404
        
        # Check if current user is the receiver
        if friend_request.receiver_id != user_id:
            return jsonify({'error': 'Không có quyền từ chối lời mời này'}), 403
        
        if friend_request.status != 'pending':
            return jsonify({'error': 'Lời mời kết bạn đã được xử lý'}), 400
        
        # Reject the request
        friend_request.reject()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Đã từ chối lời mời kết bạn',
            'friend_request': friend_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi từ chối lời mời kết bạn: {str(e)}'}), 500


@social_bp.route('/friends/cancel/<int:request_id>', methods=['POST'])
@jwt_required()
def cancel_friend_request(request_id):
    """Cancel a sent friend request"""
    try:
        user_id = get_jwt_identity()
        # Convert to int if it's a string (JWT identity might be stored as string)
        if isinstance(user_id, str) and user_id.isdigit():
            user_id = int(user_id)
        
        friend_request = FriendRequest.query.get(request_id)
        
        if not friend_request:
            return jsonify({'error': 'Không tìm thấy lời mời kết bạn'}), 404
        
        # Check if current user is the requester
        if friend_request.requester_id != user_id:
            return jsonify({'error': 'Không có quyền hủy lời mời này'}), 403
        
        if friend_request.status != 'pending':
            return jsonify({'error': 'Lời mời kết bạn đã được xử lý'}), 400
        
        # Cancel the request
        friend_request.cancel()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Đã hủy lời mời kết bạn',
            'friend_request': friend_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi hủy lời mời kết bạn: {str(e)}'}), 500


@social_bp.route('/friends/requests', methods=['GET'])
@jwt_required()
def get_friend_requests():
    """Get friend requests (received and sent)"""
    try:
        user_id = get_jwt_identity()
        
        # Get received requests (pending)
        received_requests = FriendRequest.query.filter_by(
            receiver_id=user_id,
            status='pending'
        ).order_by(desc(FriendRequest.created_at)).all()
        
        # Get sent requests (pending)
        sent_requests = FriendRequest.query.filter_by(
            requester_id=user_id,
            status='pending'
        ).order_by(desc(FriendRequest.created_at)).all()
        
        return jsonify({
            'success': True,
            'received_requests': [r.to_dict(include_users=True) for r in received_requests],
            'sent_requests': [r.to_dict(include_users=True) for r in sent_requests],
            'received_count': len(received_requests),
            'sent_count': len(sent_requests)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách lời mời kết bạn: {str(e)}'}), 500


@social_bp.route('/friends/check/<int:target_user_id>', methods=['GET'])
@jwt_required()
def check_friendship(target_user_id):
    """Check friendship status with target user"""
    try:
        user_id = get_jwt_identity()
        
        # Convert to int if it's a string
        if isinstance(user_id, str) and user_id.isdigit():
            user_id = int(user_id)
        elif not isinstance(user_id, int):
            return jsonify({'error': 'ID người dùng không hợp lệ'}), 400
        
        # Can't check friendship with yourself
        if user_id == target_user_id:
            return jsonify({
                'is_friend': False,
                'request_status': None,
                'request_id': None,
                'is_self': True
            }), 200
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Refresh user to get latest friends list from database
        db.session.refresh(user)
        
        # Check if already friends
        is_friend = user.is_friend_with(target_user_id)
        
        # Check for pending request - prioritize received requests first
        # First check if user has received a request
        received_request = FriendRequest.query.filter(
            FriendRequest.requester_id == target_user_id,
            FriendRequest.receiver_id == user_id,
            FriendRequest.status == 'pending'
        ).first()
        
        # If no received request, check if user has sent a request
        sent_request = None
        if not received_request:
            sent_request = FriendRequest.query.filter(
                FriendRequest.requester_id == user_id,
                FriendRequest.receiver_id == target_user_id,
                FriendRequest.status == 'pending'
            ).first()
        
        pending_request = received_request or sent_request
        
        request_status = None
        request_id = None
        if pending_request:
            request_id = pending_request.id
            if pending_request.requester_id == user_id:
                request_status = 'sent'
                print(f'[Check Friendship] User {user_id} has sent request {request_id} to {target_user_id}')
            else:
                request_status = 'received'
                print(f'[Check Friendship] User {user_id} has received request {request_id} from {target_user_id}')
        else:
            print(f'[Check Friendship] No pending request between user {user_id} and {target_user_id}')
        
        print(f'[Check Friendship] Response: is_friend={is_friend}, request_status={request_status}, request_id={request_id}')
        
        return jsonify({
            'is_friend': is_friend,
            'request_status': request_status,
            'request_id': request_id
        }), 200
        
    except Exception as e:
        print(f'[Check Friendship] ERROR: {str(e)}')
        return jsonify({'error': f'Lỗi kiểm tra trạng thái kết bạn: {str(e)}'}), 500


@social_bp.route('/friends', methods=['GET'])
@jwt_required()
def get_friends():
    """Get list of friends"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        friend_ids = user.get_friends()
        
        if not friend_ids:
            return jsonify({
                'success': True,
                'friends': [],
                'total': 0
            }), 200
        
        # Get friend details
        friends = User.query.filter(User.id.in_(friend_ids)).all()
        
        friends_data = [{
            'id': u.id,
            'username': u.username,
            'full_name': u.full_name,
            'avatar_url': u.avatar_url,
            'bio': u.bio,
            'location': u.location,
            'is_verified': u.is_verified
        } for u in friends]
        
        return jsonify({
            'success': True,
            'friends': friends_data,
            'total': len(friends_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách bạn bè: {str(e)}'}), 500


@social_bp.route('/friends/remove/<int:friend_id>', methods=['POST'])
@jwt_required()
def remove_friend(friend_id):
    """Remove a friend and clean up any pending friend requests"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        friend = User.query.get(friend_id)
        
        if not user or not friend:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        if not user.is_friend_with(friend_id):
            return jsonify({'error': 'Không phải bạn bè'}), 400
        
        # Remove from each other's friend list - ensure both sides are updated
        user.remove_friend(friend_id)
        friend.remove_friend(user_id)
        
        # Verify removal
        user_friends = user.get_friends()
        friend_friends = friend.get_friends()
        
        if friend_id in user_friends:
            print(f'[Remove Friend] WARNING: Friend {friend_id} still in user {user_id} friends list, re-removing...')
            user.remove_friend(friend_id)
        
        if user_id in friend_friends:
            print(f'[Remove Friend] WARNING: User {user_id} still in friend {friend_id} friends list, re-removing...')
            friend.remove_friend(user_id)
        
        # Also delete any pending friend requests between these users
        # This allows them to send friend requests again after unfriending
        FriendRequest.query.filter(
            db.or_(
                db.and_(FriendRequest.requester_id == user_id, FriendRequest.receiver_id == friend_id),
                db.and_(FriendRequest.requester_id == friend_id, FriendRequest.receiver_id == user_id)
            ),
            FriendRequest.status == 'pending'
        ).delete()
        
        db.session.commit()
        
        # Double-check after commit
        db.session.refresh(user)
        db.session.refresh(friend)
        final_user_friends = user.get_friends()
        final_friend_friends = friend.get_friends()
        print(f'[Remove Friend] Final verification - User friends: {final_user_friends}, Friend friends: {final_friend_friends}')
        
        return jsonify({
            'success': True,
            'message': 'Đã xóa bạn bè'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa bạn bè: {str(e)}'}), 500

