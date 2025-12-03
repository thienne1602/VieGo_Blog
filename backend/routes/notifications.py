from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.notification import Notification
from models.user import User
from models import db
from utils.socket_utils import emit_to_user
from datetime import datetime, timedelta
import json

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for current user with filtering options"""
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            print('[Notifications] ERROR: current_user_id is None in get_notifications')
            return jsonify({'error': 'Không xác định được người dùng'}), 401
        
        # Ensure current_user_id is integer
        try:
            current_user_id = int(current_user_id)
        except (ValueError, TypeError):
            print(f'[Notifications] ERROR: current_user_id is not a valid integer: {current_user_id} (type: {type(current_user_id)})')
            return jsonify({'error': 'ID người dùng không hợp lệ'}), 400
        
        print(f'[Notifications] Fetching notifications for user_id={current_user_id}')
        
        # CRITICAL: Double-check user exists
        user = User.query.get(current_user_id)
        if not user:
            print(f'[Notifications] ERROR: User {current_user_id} not found in database')
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        notification_type = request.args.get('type', None)  # Filter by type: message, like, comment, etc.
        
        # Build query with error handling for table not existing
        # CRITICAL: Always filter by current_user_id to prevent data leakage
        try:
            query = Notification.query.filter_by(user_id=current_user_id)
            print(f'[Notifications] Query built for user_id={current_user_id}, unread_only={unread_only}, type={notification_type}')
            
            if unread_only:
                query = query.filter_by(is_read=False)
            
            # Filter by notification type if specified
            if notification_type:
                query = query.filter_by(type=notification_type)
            
            # Order by most recent first
            query = query.order_by(Notification.created_at.desc())
            
            # Paginate
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            print(f'[Notifications] Found {pagination.total} total notifications, {len(pagination.items)} on page {page}')
            
            # Convert notifications to dict with error handling
            notifications = []
            for notif in pagination.items:
                try:
                    notifications.append(notif.to_dict(include_actor=True))
                except Exception as notif_error:
                    print(f'Error converting notification {notif.id}: {str(notif_error)}')
                    # Add notification without actor if actor query fails
                    try:
                        notifications.append(notif.to_dict(include_actor=False))
                    except:
                        pass
            
            # Get unread count by category
            unread_stats = {}
            try:
                # Total unread
                total_unread = Notification.query.filter_by(
                    user_id=current_user_id,
                    is_read=False
                ).count()
                unread_stats['total'] = total_unread
                
                # Unread by type
                types = ['message', 'like', 'comment', 'follow', 'friend_request', 'booking']
                for ntype in types:
                    count = Notification.query.filter_by(
                        user_id=current_user_id,
                        is_read=False,
                        type=ntype
                    ).count()
                    unread_stats[ntype] = count
                
                print(f'[Notifications] Unread stats for user_id={current_user_id}: {unread_stats}')
            except Exception as count_error:
                print(f'[Notifications] Error getting unread stats: {str(count_error)}')
                unread_stats = {'total': 0}
            
            print(f'[Notifications] Returning {len(notifications)} notifications to user_id={current_user_id}')
            return jsonify({
                'notifications': notifications,
                'total': pagination.total,
                'page': page,
                'per_page': per_page,
                'pages': pagination.pages,
                'unread_count': unread_stats.get('total', 0),
                'unread_stats': unread_stats
            }), 200
        except Exception as db_error:
            # If table doesn't exist or other DB error, return empty result instead of 500
            import traceback
            error_msg = str(db_error)
            print(f'Database error in get_notifications: {error_msg}')
            print(traceback.format_exc())
            
            # Check if it's a table doesn't exist error
            if 'doesn\'t exist' in error_msg.lower() or 'table' in error_msg.lower():
                print('Warning: Notifications table may not exist. Returning empty result.')
            
            # Return empty result to prevent UI breaking
            return jsonify({
                'notifications': [],
                'total': 0,
                'page': page,
                'per_page': per_page,
                'pages': 0,
                'unread_count': 0,
                'unread_stats': {'total': 0},
                'warning': 'Không thể tải thông báo. Vui lòng thử lại sau.'
            }), 200
        
    except Exception as e:
        import traceback
        print(f'Error in get_notifications: {str(e)}')
        print(traceback.format_exc())
        return jsonify({'error': f'Lỗi lấy thông báo: {str(e)}'}), 500

@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications"""
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            print('Error: current_user_id is None in get_unread_count')
            return jsonify({'error': 'Không xác định được người dùng', 'unread_count': 0}), 401
        
        # Ensure current_user_id is integer
        try:
            current_user_id = int(current_user_id)
        except (ValueError, TypeError):
            print(f'Error: current_user_id is not a valid integer: {current_user_id} (type: {type(current_user_id)})')
            return jsonify({'unread_count': 0, 'error': 'ID người dùng không hợp lệ'}), 200
        
        try:
            count = Notification.query.filter_by(
                user_id=current_user_id,
                is_read=False
            ).count()
        except Exception as query_error:
            print(f'Error querying notifications for user {current_user_id}: {str(query_error)}')
            import traceback
            print(traceback.format_exc())
            # Return 0 instead of error to prevent UI issues
            return jsonify({'unread_count': 0}), 200
        
        return jsonify({'unread_count': count}), 200
        
    except Exception as e:
        import traceback
        print(f'Error in get_unread_count: {str(e)}')
        print(traceback.format_exc())
        # Return 0 instead of error to prevent UI issues
        return jsonify({'unread_count': 0, 'error': f'Lỗi lấy số lượng thông báo: {str(e)}'}), 200

@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    try:
        current_user_id = get_jwt_identity()
        # Convert to int if it's a string (JWT identity might be stored as string)
        if isinstance(current_user_id, str) and current_user_id.isdigit():
            current_user_id = int(current_user_id)
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Không tìm thấy thông báo'}), 404
        
        notification.mark_as_read()
        db.session.commit()
        
        return jsonify({'message': 'Đã đánh dấu đã đọc', 'notification': notification.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi đánh dấu đã đọc: {str(e)}'}), 500

@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read"""
    try:
        current_user_id = get_jwt_identity()
        # Convert to int if it's a string (JWT identity might be stored as string)
        if isinstance(current_user_id, str) and current_user_id.isdigit():
            current_user_id = int(current_user_id)
        
        Notification.query.filter_by(
            user_id=current_user_id,
            is_read=False
        ).update({'is_read': True, 'read_at': datetime.utcnow()})
        
        db.session.commit()
        
        return jsonify({'message': 'Đã đánh dấu tất cả là đã đọc'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi đánh dấu tất cả: {str(e)}'}), 500

@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        current_user_id = get_jwt_identity()
        # Convert to int if it's a string (JWT identity might be stored as string)
        if isinstance(current_user_id, str) and current_user_id.isdigit():
            current_user_id = int(current_user_id)
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Không tìm thấy thông báo'}), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({'message': 'Đã xóa thông báo'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa thông báo: {str(e)}'}), 500

@notifications_bp.route('/delete-all', methods=['DELETE'])
@jwt_required()
def delete_all_notifications():
    """Delete all notifications for current user"""
    try:
        current_user_id = get_jwt_identity()
        # Convert to int if it's a string
        if isinstance(current_user_id, str) and current_user_id.isdigit():
            current_user_id = int(current_user_id)
        
        # Delete all notifications
        deleted_count = Notification.query.filter_by(
            user_id=current_user_id
        ).delete()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Đã xóa tất cả thông báo',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa thông báo: {str(e)}'}), 500

@notifications_bp.route('/delete-read', methods=['DELETE'])
@jwt_required()
def delete_read_notifications():
    """Delete all read notifications for current user"""
    try:
        current_user_id = get_jwt_identity()
        # Convert to int if it's a string
        if isinstance(current_user_id, str) and current_user_id.isdigit():
            current_user_id = int(current_user_id)
        
        # Delete read notifications
        deleted_count = Notification.query.filter_by(
            user_id=current_user_id,
            is_read=True
        ).delete()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Đã xóa thông báo đã đọc',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa thông báo: {str(e)}'}), 500

@notifications_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_notification_stats():
    """Get notification statistics for current user"""
    try:
        current_user_id = get_jwt_identity()
        # Convert to int if it's a string
        if isinstance(current_user_id, str) and current_user_id.isdigit():
            current_user_id = int(current_user_id)
        
        # Get total count
        total = Notification.query.filter_by(user_id=current_user_id).count()
        
        # Get unread count
        unread = Notification.query.filter_by(
            user_id=current_user_id,
            is_read=False
        ).count()
        
        # Get counts by type
        types_count = {}
        types = ['message', 'like', 'comment', 'follow', 'friend_request', 'booking', 'system']
        for ntype in types:
            count = Notification.query.filter_by(
                user_id=current_user_id,
                type=ntype
            ).count()
            if count > 0:
                types_count[ntype] = count
        
        # Get recent activity (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent = Notification.query.filter(
            Notification.user_id == current_user_id,
            Notification.created_at >= week_ago
        ).count()
        
        return jsonify({
            'total': total,
            'unread': unread,
            'read': total - unread,
            'by_type': types_count,
            'last_7_days': recent
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thống kê: {str(e)}'}), 500

def create_notification(user_id, type, message, title=None, actor_id=None, 
                       related_type=None, related_id=None, action_url=None, metadata=None, emit_realtime=True):
    """Helper function to create a notification"""
    import traceback
    try:
        # Ensure user_id is integer for consistent database and socket operations
        try:
            user_id_int = int(user_id) if user_id is not None else None
            if user_id_int is None:
                print(f'[Notification] ERROR: Invalid user_id {user_id}')
                return None
        except (ValueError, TypeError) as e:
            print(f'[Notification] ERROR: Failed to convert user_id {user_id} to int: {str(e)}')
            return None
        
        print(f'[Notification] Creating notification: user_id={user_id_int}, type={type}, actor_id={actor_id}')
        
        # Check for duplicate unread notification if it's a friend request
        if type == 'friend_request' and actor_id:
            existing_notif = Notification.query.filter_by(
                user_id=user_id_int,
                type='friend_request',
                actor_id=actor_id,
                is_read=False
            ).first()
            
            if existing_notif:
                print(f'[Notification] Found existing unread friend request notification {existing_notif.id}, updating timestamp instead of creating new one')
                existing_notif.created_at = datetime.utcnow()
                existing_notif.is_seen = False # Reset seen status so it pops up again
                db.session.commit()
                
                # Re-emit socket event for the existing notification
                if emit_realtime:
                    try:
                        unread_count = Notification.query.filter_by(
                            user_id=user_id_int,
                            is_read=False
                        ).count()
                        
                        notification_data = existing_notif.to_dict(include_actor=True)
                        
                        emit_to_user(user_id_int, 'new_notification', {
                            'type': type,
                            'message': message,
                            'title': existing_notif.title,
                            'notification_id': existing_notif.id,
                            'unread_count': unread_count,
                            'action_url': action_url,
                            'created_at': existing_notif.created_at.isoformat(),
                            'notification': notification_data
                        })
                    except Exception as emit_error:
                        print(f'[Notification] WARNING: Failed to emit real-time notification update: {str(emit_error)}')
                
                return existing_notif

        # Try to create notification with extra_data, but handle if column doesn't exist
        try:
            notification = Notification(
                user_id=user_id_int,
                type=type,
                message=message,
                title=title or message[:100],  # Use first 100 chars as title if not provided
                actor_id=actor_id,
                related_type=related_type,
                related_id=related_id,
                action_url=action_url,
                extra_data=json.dumps(metadata) if metadata else None
            )
        except Exception as e:
            # If extra_data column doesn't exist, create without it
            print(f'[Notification] Warning: extra_data column may not exist, creating without it: {str(e)}')
            notification = Notification(
                user_id=user_id_int,
                type=type,
                message=message,
                title=title or message[:100],
                actor_id=actor_id,
                related_type=related_type,
                related_id=related_id,
                action_url=action_url
            )
        
        db.session.add(notification)
        try:
            db.session.commit()
        except Exception as db_error:
            # If commit fails due to extra_data, try to add it manually via SQL
            if 'extra_data' in str(db_error).lower():
                print(f'[Notification] Attempting to add extra_data column and retry...')
                try:
                    from sqlalchemy import text
                    db.session.execute(text("""
                        ALTER TABLE notifications 
                        ADD COLUMN extra_data TEXT AFTER action_url
                    """))
                    db.session.commit()
                    # Retry with extra_data
                    if metadata:
                        notification.extra_data = json.dumps(metadata)
                    db.session.commit()
                except Exception as alter_error:
                    # If alter also fails, just commit without extra_data
                    db.session.rollback()
                    notification.extra_data = None
                    db.session.commit()
            else:
                raise
        print(f'[Notification] Notification created successfully: ID {notification.id} for user {user_id_int}')
        
        # Emit real-time notification via Socket.IO if requested
        if emit_realtime:
            try:
                unread_count = Notification.query.filter_by(
                    user_id=user_id_int,
                    is_read=False
                ).count()
                
                print(f'[Notification] Emitting real-time notification to user {user_id_int}, unread_count={unread_count}')
                
                # Convert notification to dict for socket emission
                notification_data = notification.to_dict(include_actor=True)
                
                emit_to_user(user_id_int, 'new_notification', {
                    'type': type,
                    'message': message,
                    'title': notification.title,
                    'notification_id': notification.id,
                    'unread_count': unread_count,
                    'action_url': action_url,
                    'created_at': notification.created_at.isoformat() if notification.created_at else None,
                    'notification': notification_data  # Include full notification data
                })
                print(f'[Notification] Real-time notification emitted successfully')
            except Exception as emit_error:
                print(f'[Notification] WARNING: Failed to emit real-time notification: {str(emit_error)}')
                # Don't fail if emit fails, notification is already saved
        
        return notification
    except Exception as e:
        db.session.rollback()
        error_msg = str(e)
        print(f'[Notification] ERROR creating notification: {error_msg}')
        print(traceback.format_exc())
        return None

