"""
Comments Routes for VieGo Blog
Handles comment CRUD, nested replies, likes, and moderation
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc
from datetime import datetime

from models import db
from models.user import User
from models.post import Post
from models.comment import Comment

comments_bp = Blueprint('comments', __name__, url_prefix='/api/comments')

@comments_bp.route('/', methods=['POST'])
@jwt_required()
def create_comment():
    """Create new comment or reply"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        content = data.get('content', '').strip()
        post_id = data.get('post_id')
        
        if not all([content, post_id]):
            return jsonify({'error': 'Thiếu nội dung hoặc post_id'}), 400
        
        # Verify post exists
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        # Check if this is a reply to another comment
        parent_id = data.get('parent_id')
        parent_comment = None
        level = 0
        
        if parent_id:
            parent_comment = Comment.query.get(parent_id)
            if not parent_comment:
                return jsonify({'error': 'Comment cha không tồn tại'}), 404
            
            # Check nesting level limit
            if not parent_comment.can_reply():
                return jsonify({'error': 'Không thể trả lời comment này (quá sâu)'}), 400
            
            level = parent_comment.level + 1
        
        # Create comment
        comment = Comment(
            content=content,
            author_id=user_id,
            post_id=post_id,
            parent_id=parent_id,
            level=level,
            language=data.get('language', 'vi')
        )
        
        db.session.add(comment)
        
        # Update parent comment reply count
        if parent_comment:
            parent_comment.replies_count += 1
        
        # Update post comment count
        post.comments_count += 1
        
        db.session.commit()
        
        # Award points for engagement
        user.add_points(10)
        db.session.commit()
        
        # Return comment with author info
        comment_dict = comment.to_dict(include_replies=False)
        comment_dict['author'] = {
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name,
            'avatar_url': user.avatar_url
        }
        
        return jsonify({
            'message': 'Tạo bình luận thành công!',
            'comment': comment_dict
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi tạo bình luận: {str(e)}'}), 500


@comments_bp.route('/post/<int:post_id>', methods=['GET'])
def get_post_comments(post_id):
    """Get all comments for a post (top-level only, replies loaded separately)"""
    try:
        # Verify post exists
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 50)
        
        # Get top-level comments only
        query = Comment.query.filter_by(
            post_id=post_id,
            parent_id=None,
            status='active'
        ).order_by(desc(Comment.created_at))
        
        comments_pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Format response with author info
        comments_data = []
        for comment in comments_pagination.items:
            comment_dict = comment.to_dict(include_replies=False)
            
            # Include author info
            author = User.query.get(comment.author_id)
            comment_dict['author'] = {
                'id': author.id,
                'username': author.username,
                'full_name': author.full_name,
                'avatar_url': author.avatar_url
            } if author else None
            
            comments_data.append(comment_dict)
        
        return jsonify({
            'comments': comments_data,
            'pagination': {
                'page': comments_pagination.page,
                'pages': comments_pagination.pages,
                'per_page': comments_pagination.per_page,
                'total': comments_pagination.total,
                'has_next': comments_pagination.has_next,
                'has_prev': comments_pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy bình luận: {str(e)}'}), 500


@comments_bp.route('/<int:comment_id>/replies', methods=['GET'])
def get_comment_replies(comment_id):
    """Get all replies to a specific comment"""
    try:
        # Verify parent comment exists
        parent_comment = Comment.query.get(comment_id)
        if not parent_comment:
            return jsonify({'error': 'Bình luận không tồn tại'}), 404
        
        # Get all direct replies
        replies = Comment.query.filter_by(
            parent_id=comment_id,
            status='active'
        ).order_by(Comment.created_at).all()
        
        # Format response with author info
        replies_data = []
        for reply in replies:
            reply_dict = reply.to_dict(include_replies=False)
            
            # Include author info
            author = User.query.get(reply.author_id)
            reply_dict['author'] = {
                'id': author.id,
                'username': author.username,
                'full_name': author.full_name,
                'avatar_url': author.avatar_url
            } if author else None
            
            replies_data.append(reply_dict)
        
        return jsonify({'replies': replies_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy replies: {str(e)}'}), 500


@comments_bp.route('/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(comment_id):
    """Update comment content"""
    try:
        user_id = get_jwt_identity()
        comment = Comment.query.get(comment_id)
        
        if not comment:
            return jsonify({'error': 'Bình luận không tồn tại'}), 404
        
        # Check permissions (only author can edit)
        if comment.author_id != user_id:
            return jsonify({'error': 'Không có quyền chỉnh sửa bình luận này'}), 403
        
        data = request.get_json()
        content = data.get('content', '').strip()
        
        if not content:
            return jsonify({'error': 'Nội dung không được để trống'}), 400
        
        comment.content = content
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật bình luận thành công!',
            'comment': comment.to_dict(include_replies=False)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cập nhật bình luận: {str(e)}'}), 500


@comments_bp.route('/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """Delete comment (soft delete - change status)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        comment = Comment.query.get(comment_id)
        
        if not comment:
            return jsonify({'error': 'Bình luận không tồn tại'}), 404
        
        # Check permissions (author or moderator/admin)
        if comment.author_id != user_id and not user.can_moderate():
            return jsonify({'error': 'Không có quyền xóa bình luận này'}), 403
        
        # Soft delete - change status instead of deleting
        comment.status = 'deleted'
        
        # Update post comment count
        post = Post.query.get(comment.post_id)
        if post and post.comments_count > 0:
            post.comments_count -= 1
        
        # Update parent reply count if this is a reply
        if comment.parent_id:
            parent = Comment.query.get(comment.parent_id)
            if parent and parent.replies_count > 0:
                parent.replies_count -= 1
        
        db.session.commit()
        
        return jsonify({'message': 'Xóa bình luận thành công!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa bình luận: {str(e)}'}), 500


@comments_bp.route('/<int:comment_id>/like', methods=['POST'])
@jwt_required()
def like_comment(comment_id):
    """Like a comment"""
    try:
        user_id = get_jwt_identity()
        comment = Comment.query.get(comment_id)
        
        if not comment:
            return jsonify({'error': 'Bình luận không tồn tại'}), 404
        
        # TODO: Implement proper like tracking with a likes table
        # For now, just increment the count
        comment.likes_count += 1
        db.session.commit()
        
        return jsonify({
            'message': 'Đã thích bình luận',
            'likes_count': comment.likes_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500


@comments_bp.route('/<int:comment_id>/unlike', methods=['POST'])
@jwt_required()
def unlike_comment(comment_id):
    """Unlike a comment"""
    try:
        user_id = get_jwt_identity()
        comment = Comment.query.get(comment_id)
        
        if not comment:
            return jsonify({'error': 'Bình luận không tồn tại'}), 404
        
        # Decrement like count
        if comment.likes_count > 0:
            comment.likes_count -= 1
            db.session.commit()
        
        return jsonify({
            'message': 'Đã bỏ thích bình luận',
            'likes_count': comment.likes_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500


@comments_bp.route('/<int:comment_id>/report', methods=['POST'])
@jwt_required()
def report_comment(comment_id):
    """Report a comment for moderation"""
    try:
        user_id = get_jwt_identity()
        comment = Comment.query.get(comment_id)
        
        if not comment:
            return jsonify({'error': 'Bình luận không tồn tại'}), 404
        
        data = request.get_json()
        reason = data.get('reason', '').strip()
        
        if not reason:
            return jsonify({'error': 'Vui lòng cung cấp lý do báo cáo'}), 400
        
        # Flag comment
        comment.flagged = True
        comment.flag_reason = reason
        comment.status = 'pending'  # Pending moderation
        
        db.session.commit()
        
        return jsonify({'message': 'Đã báo cáo bình luận. Cảm ơn bạn!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi báo cáo: {str(e)}'}), 500
