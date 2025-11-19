from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.chat import Chat
from models.user import User
from models import db
from models.notification import Notification
from models.group_chat import GroupChat, GroupMember
from routes.notifications import create_notification
from utils.socket_utils import emit_to_user
from datetime import datetime
from werkzeug.utils import secure_filename
import json
import os
import uuid

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@chat_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get all conversations for current user (only with friends)"""
    try:
        current_user_id = get_jwt_identity()
        # Convert to int if it's a string (JWT identity might be stored as string)
        if isinstance(current_user_id, str) and current_user_id.isdigit():
            current_user_id = int(current_user_id)
        elif not isinstance(current_user_id, int):
            print(f'[Chat] ERROR: Invalid user_id type: {type(current_user_id)}, value: {current_user_id}')
            return jsonify({'error': 'ID người dùng không hợp lệ'}), 400
        
        # CRITICAL: Validate user_id is not None
        if current_user_id is None:
            print(f'[Chat] ERROR: current_user_id is None')
            return jsonify({'error': 'Không xác định được người dùng'}), 401
        
        print(f'[Chat] Getting conversations for user_id={current_user_id} (type: {type(current_user_id)})')
        
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            print(f'[Chat] ERROR: User {current_user_id} not found in database')
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Track conversations we've already added (by other_user_id)
        conversation_dict = {}
        
        # Refresh user to get latest friends list
        db.session.refresh(current_user)
        
        # Get all unique conversations from chat messages (direct messages)
        # IMPORTANT: Filter by current_user_id to ensure only this user's conversations
        conversations_query = db.session.query(
            db.func.least(Chat.sender_id, Chat.receiver_id).label('user1'),
            db.func.greatest(Chat.sender_id, Chat.receiver_id).label('user2')
        ).filter(
            db.or_(
                Chat.sender_id == current_user_id,
                Chat.receiver_id == current_user_id
            )
        ).filter(
            Chat.conversation_type == 'direct'
        ).distinct()
        
        print(f'[Chat] Conversations query filter: sender_id={current_user_id} OR receiver_id={current_user_id}')
        
        # Process conversations from chat messages
        for user1, user2 in conversations_query.all():
            try:
                # Determine the other user
                other_user_id = user2 if user1 == current_user_id else user1
                
                # Check if users are friends - only show conversations with friends
                # Wrap in try-catch to handle any errors in is_friend_with
                try:
                    if not current_user.is_friend_with(other_user_id):
                        continue
                except Exception as friend_check_error:
                    current_app.logger.error(f"Error checking friendship: {str(friend_check_error)}")
                    continue
                
                # Get last message
                last_message = Chat.query.filter(
                    db.or_(
                        db.and_(Chat.sender_id == user1, Chat.receiver_id == user2),
                        db.and_(Chat.sender_id == user2, Chat.receiver_id == user1)
                    ),
                    Chat.conversation_type == 'direct'
                ).order_by(Chat.created_at.desc()).first()
                
                # Get unread count
                unread_count = Chat.query.filter(
                    Chat.sender_id == other_user_id,
                    Chat.receiver_id == current_user_id,
                    Chat.status != 'read',
                    Chat.conversation_type == 'direct'
                ).count()
                
                # Get other user info
                other_user = User.query.get(other_user_id)
                
                if other_user:
                    # Ensure both IDs are integers for comparison
                    user1_int = int(user1) if user1 else 0
                    user2_int = int(user2) if user2 else 0
                    conversation_id = f"{min(user1_int, user2_int)}_{max(user1_int, user2_int)}"
                    conversation_data = {
                        'id': conversation_id,
                        'other_user': {
                            'id': other_user.id,
                            'username': other_user.username,
                            'full_name': other_user.full_name,
                            'avatar_url': other_user.avatar_url
                        },
                        'unread_count': unread_count,
                    }
                    
                    if last_message:
                        conversation_data['last_message'] = {
                            'id': last_message.id,
                            'message': last_message.message,
                            'sender_id': last_message.sender_id,
                            'created_at': last_message.created_at.isoformat() if last_message.created_at else None,
                            'status': last_message.status
                        }
                        conversation_data['updated_at'] = last_message.created_at.isoformat() if last_message.created_at else None
                    else:
                        conversation_data['updated_at'] = None
                    
                    conversation_dict[other_user_id] = conversation_data
            except Exception as conv_error:
                current_app.logger.error(f"Error processing conversation: {str(conv_error)}")
                continue
        
        # Also include conversations from notifications (message type) for friends
        # This ensures users who sent notifications but haven't chatted yet are shown
        message_notifications = Notification.query.filter(
            Notification.user_id == current_user_id,
            Notification.type == 'message',
            Notification.actor_id.isnot(None)
        ).order_by(Notification.created_at.desc()).all()
        
        for notification in message_notifications:
            other_user_id = notification.actor_id
            
            # Only add if users are friends and not already in conversation_dict
            if other_user_id and other_user_id not in conversation_dict:
                try:
                    # Check if users are friends - wrap in try-catch
                    if not current_user.is_friend_with(other_user_id):
                        continue
                except Exception as friend_check_error:
                    current_app.logger.error(f"Error checking friendship from notification: {str(friend_check_error)}")
                    continue
                other_user = User.query.get(other_user_id)
                if other_user:
                    # Ensure both IDs are integers for comparison
                    current_id_int = int(current_user_id) if current_user_id else 0
                    other_id_int = int(other_user_id) if other_user_id else 0
                    conversation_id = f"{min(current_id_int, other_id_int)}_{max(current_id_int, other_id_int)}"
                    conversation_data = {
                        'id': conversation_id,
                        'other_user': {
                            'id': other_user.id,
                            'username': other_user.username,
                            'full_name': other_user.full_name,
                            'avatar_url': other_user.avatar_url
                        },
                        'unread_count': 0,  # No messages yet, so no unread
                        'updated_at': notification.created_at.isoformat() if notification.created_at else None
                    }
                    conversation_dict[other_user_id] = conversation_data
        
        # Convert dict to list
        conversations = list(conversation_dict.values())
        
        # Add group chats
        groups = db.session.query(GroupChat).join(
            GroupMember
        ).filter(
            GroupMember.user_id == current_user_id
        ).order_by(GroupChat.updated_at.desc()).all()
        
        for group in groups:
            # Get last message
            last_message = Chat.query.filter(
                Chat.room_id == group.room_id,
                Chat.conversation_type == 'group'
            ).order_by(Chat.created_at.desc()).first()
            
            # Get unread count
            unread_count = Chat.query.filter(
                Chat.room_id == group.room_id,
                Chat.conversation_type == 'group',
                Chat.sender_id != current_user_id,
                Chat.status != 'read'
            ).count()
            
            group_conversation = {
                'id': f"group_{group.room_id}",
                'type': 'group',
                'group': {
                    'id': group.id,
                    'room_id': group.room_id,
                    'name': group.name,
                    'description': group.description,
                    'avatar_url': group.avatar_url,
                    'created_by': group.created_by
                },
                'unread_count': unread_count,
            }
            
            if last_message:
                sender = User.query.get(last_message.sender_id)
                group_conversation['last_message'] = {
                    'id': last_message.id,
                    'message': last_message.message,
                    'sender_id': last_message.sender_id,
                    'sender': {
                        'id': sender.id,
                        'username': sender.username,
                        'full_name': sender.full_name,
                        'avatar_url': sender.avatar_url
                    } if sender else None,
                    'created_at': last_message.created_at.isoformat() if last_message.created_at else None,
                    'status': last_message.status
                }
                group_conversation['updated_at'] = last_message.created_at.isoformat() if last_message.created_at else None
            else:
                group_conversation['updated_at'] = group.updated_at.isoformat() if group.updated_at else None
            
            conversations.append(group_conversation)
        
        # Sort by updated_at descending
        conversations.sort(key=lambda x: x['updated_at'] or '', reverse=True)
        
        return jsonify({'conversations': conversations}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in get_conversations: {str(e)}", exc_info=True)
        return jsonify({'error': f'Lỗi lấy cuộc trò chuyện: {str(e)}'}), 500

@chat_bp.route('/messages/<int:other_user_id>', methods=['GET'])
@jwt_required()
def get_messages(other_user_id):
    """Get messages between current user and another user (only if friends)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Ensure current_user_id is integer
        if isinstance(current_user_id, str) and current_user_id.isdigit():
            current_user_id = int(current_user_id)
        elif not isinstance(current_user_id, int):
            print(f'[Chat] ERROR: Invalid user_id type: {type(current_user_id)}, value: {current_user_id}')
            return jsonify({'error': 'ID người dùng không hợp lệ'}), 400
        
        # CRITICAL: Validate user_id is not None
        if current_user_id is None:
            print(f'[Chat] ERROR: current_user_id is None')
            return jsonify({'error': 'Không xác định được người dùng'}), 401
        
        print(f'[Chat] Getting messages: current_user_id={current_user_id} (type: {type(current_user_id)}), other_user_id={other_user_id} (type: {type(other_user_id)})')
        
        # CRITICAL: Ensure we're not getting messages for ourselves
        if current_user_id == other_user_id:
            print(f'[Chat] ERROR: Attempted to get messages with self (user_id={current_user_id})')
            return jsonify({'error': 'Không thể lấy tin nhắn với chính mình'}), 400
        
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            print(f'[Chat] ERROR: User {current_user_id} not found in database')
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        # Refresh user to get latest friends list from database
        db.session.refresh(current_user)
        
        # Check if users are friends
        if not current_user.is_friend_with(other_user_id):
            return jsonify({'error': 'Bạn cần kết bạn với người này trước khi có thể xem tin nhắn'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Get messages between two users - IMPORTANT: Filter by both user IDs
        messages_query = Chat.query.filter(
            db.or_(
                db.and_(Chat.sender_id == current_user_id, Chat.receiver_id == other_user_id),
                db.and_(Chat.sender_id == other_user_id, Chat.receiver_id == current_user_id)
            ),
            Chat.conversation_type == 'direct'
        ).order_by(Chat.created_at.desc())
        
        print(f'[Chat] Query filter: sender_id={current_user_id} AND receiver_id={other_user_id} OR sender_id={other_user_id} AND receiver_id={current_user_id}')
        
        pagination = messages_query.paginate(page=page, per_page=per_page, error_out=False)
        
        messages = []
        for msg in pagination.items:
            sender = User.query.get(msg.sender_id)
            msg_dict = msg.to_dict()
            msg_dict['sender'] = {
                'id': sender.id,
                'username': sender.username,
                'full_name': sender.full_name,
                'avatar_url': sender.avatar_url
            } if sender else None
            messages.append(msg_dict)
        
        # Reverse to show oldest first
        messages.reverse()
        
        # Mark messages as read
        Chat.query.filter(
            Chat.sender_id == other_user_id,
            Chat.receiver_id == current_user_id,
            Chat.status != 'read'
        ).update({'status': 'read', 'read_at': datetime.utcnow()})
        db.session.commit()
        
        return jsonify({
            'messages': messages,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi lấy tin nhắn: {str(e)}'}), 500

@chat_bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message (text, image, audio, or location)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Handle both JSON and form-data
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json()
            receiver_id = data.get('receiver_id')
            message = data.get('message', '').strip()
            message_type = data.get('message_type', 'text')
            file_url = data.get('file_url')
            file_type = data.get('file_type')
            location_data = data.get('location')  # {lat, lng, address}
        else:
            # Form-data for file uploads
            receiver_id = request.form.get('receiver_id', type=int)
            message = request.form.get('message', '').strip()
            message_type = request.form.get('message_type', 'text')
            file_url = None
            file_type = None
            location_data = None
            
            # Handle file upload
            if 'file' in request.files:
                file = request.files['file']
                if file and file.filename:
                    import os
                    from werkzeug.utils import secure_filename
                    from flask import current_app
                    
                    upload_folder = current_app.config['UPLOAD_FOLDER']
                    if message_type == 'image':
                        folder = os.path.join(upload_folder, 'images')
                    elif message_type == 'audio':
                        folder = os.path.join(upload_folder, 'audio')
                    else:
                        folder = os.path.join(upload_folder, 'files')
                    
                    os.makedirs(folder, exist_ok=True)
                    
                    # Generate unique filename
                    filename = secure_filename(file.filename)
                    unique_filename = f"{current_user_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
                    file_path = os.path.join(folder, unique_filename)
                    file.save(file_path)
                    
                    file_url = f"/uploads/{os.path.basename(folder)}/{unique_filename}"
                    file_type = file.content_type
        
        if not receiver_id:
            return jsonify({'error': 'Thiếu receiver_id'}), 400
        
        # Validate message content based on type
        if message_type == 'text':
            if not message:
                return jsonify({'error': 'Tin nhắn không được để trống'}), 400
        elif message_type == 'image':
            if not file_url:
                return jsonify({'error': 'Thiếu ảnh'}), 400
            message = message or '[Ảnh]'
        elif message_type == 'audio':
            if not file_url:
                return jsonify({'error': 'Thiếu file ghi âm'}), 400
            message = message or '[Ghi âm]'
        elif message_type == 'location':
            if not location_data:
                return jsonify({'error': 'Thiếu thông tin vị trí'}), 400
            # Store location as JSON string
            import json
            message = json.dumps(location_data)
        
        # Validate receiver exists
        receiver = User.query.get(receiver_id)
        if not receiver:
            return jsonify({'error': 'Người nhận không tồn tại'}), 404
        
        # Check if users are friends
        sender = User.query.get(current_user_id)
        
        # Refresh sender to get latest friends list from database
        db.session.refresh(sender)
        
        if not sender.is_friend_with(receiver_id):
            return jsonify({'error': 'Bạn cần kết bạn với người này trước khi có thể nhắn tin'}), 403
        
        # Create chat message
        chat = Chat(
            message=message,
            message_type=message_type,
            sender_id=current_user_id,
            receiver_id=receiver_id,
            conversation_type='direct',
            status='sent',
            file_url=file_url,
            file_type=file_type
        )
        
        db.session.add(chat)
        db.session.commit()
        
        # Get sender and receiver info
        sender = User.query.get(current_user_id)
        receiver = User.query.get(receiver_id)
        
        chat_dict = chat.to_dict()
        chat_dict['sender'] = {
            'id': sender.id,
            'username': sender.username,
            'full_name': sender.full_name,
            'avatar_url': sender.avatar_url
        } if sender else None
        
        # Prepare message data for Socket.IO
        message_data = {
            'id': chat.id,
            'message': message,
            'message_type': message_type,
            'file_url': file_url,
            'file_type': file_type,
            'sender': chat_dict['sender'],
            'receiver_id': receiver_id,
            'sender_id': current_user_id,
            'created_at': chat.created_at.isoformat() if chat.created_at else None,
            'status': chat.status
        }
        
        # Emit real-time events via Socket.IO
        print(f'[Chat] Sending message via Socket.IO: sender={current_user_id}, receiver={receiver_id}')
        # Send to sender (confirmation)
        emit_to_user(current_user_id, 'message_sent', message_data)
        
        # Send to receiver (new message)
        emit_to_user(receiver_id, 'new_message', message_data)
        print(f'[Chat] Socket.IO events emitted successfully')
        
        # Create notification for receiver (it will automatically emit via Socket.IO)
        if receiver and sender:
            create_notification(
                user_id=receiver_id,
                type='message',
                message=f'{sender.full_name or sender.username} đã gửi cho bạn một tin nhắn',
                title='Tin nhắn mới',
                actor_id=current_user_id,
                related_type='chat',
                related_id=chat.id,
                action_url=f'/messages/{current_user_id}',
                emit_realtime=True
            )
        
        return jsonify({
            'message': 'Gửi tin nhắn thành công',
            'chat': chat_dict
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi gửi tin nhắn: {str(e)}'}), 500

@chat_bp.route('/messages/<int:message_id>/read', methods=['PUT'])
@jwt_required()
def mark_message_as_read(message_id):
    """Mark a message as read"""
    try:
        current_user_id = get_jwt_identity()
        
        message = Chat.query.filter_by(
            id=message_id,
            receiver_id=current_user_id
        ).first()
        
        if not message:
            return jsonify({'error': 'Không tìm thấy tin nhắn'}), 404
        
        message.mark_as_read()
        db.session.commit()
        
        return jsonify({'message': 'Đã đánh dấu đã đọc', 'chat': message.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi đánh dấu đã đọc: {str(e)}'}), 500

@chat_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_message_count():
    """Get count of unread messages"""
    try:
        current_user_id = get_jwt_identity()
        count = Chat.query.filter_by(
            receiver_id=current_user_id,
            status='sent'
        ).count()
        
        return jsonify({'unread_count': count}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy số lượng tin nhắn: {str(e)}'}), 500

@chat_bp.route('/conversations/<int:other_user_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(other_user_id):
    """Delete a conversation (all messages between current user and other user)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Convert to int if it's a string
        if isinstance(current_user_id, str) and current_user_id.isdigit():
            current_user_id = int(current_user_id)
        elif not isinstance(current_user_id, int):
            return jsonify({'error': 'ID người dùng không hợp lệ'}), 400
        
        # Can't delete conversation with yourself
        if current_user_id == other_user_id:
            return jsonify({'error': 'Không thể xóa cuộc trò chuyện với chính mình'}), 400
        
        # Verify other user exists
        other_user = User.query.get(other_user_id)
        if not other_user:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        
        # Get all messages between the two users
        messages = Chat.query.filter(
            db.or_(
                db.and_(Chat.sender_id == current_user_id, Chat.receiver_id == other_user_id),
                db.and_(Chat.sender_id == other_user_id, Chat.receiver_id == current_user_id)
            ),
            Chat.conversation_type == 'direct'
        ).all()
        
        # Delete all messages
        message_count = len(messages)
        for message in messages:
            db.session.delete(message)
        
        # Also delete related notifications
        notifications = Notification.query.filter(
            Notification.user_id == current_user_id,
            Notification.type == 'message',
            Notification.actor_id == other_user_id
        ).all()
        
        for notification in notifications:
            db.session.delete(notification)
        
        db.session.commit()
        
        print(f'[Chat] Deleted conversation between user {current_user_id} and {other_user_id}: {message_count} messages, {len(notifications)} notifications')
        
        return jsonify({
            'message': 'Xóa cuộc trò chuyện thành công',
            'deleted_messages': message_count,
            'deleted_notifications': len(notifications)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting conversation: {str(e)}", exc_info=True)
        return jsonify({'error': f'Lỗi xóa cuộc trò chuyện: {str(e)}'}), 500


# ==================== GROUP CHAT ENDPOINTS ====================

@chat_bp.route('/groups', methods=['POST'])
@jwt_required()
def create_group():
    """Create a new group chat"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        member_ids = data.get('member_ids', [])  # List of user IDs to add
        
        if not name:
            return jsonify({'error': 'Tên nhóm không được để trống'}), 400
        
        if not isinstance(member_ids, list) or len(member_ids) < 2:
            return jsonify({'error': 'Cần ít nhất 2 thành viên để tạo nhóm'}), 400
        
        # Check if all members exist and are friends with creator
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        
        db.session.refresh(current_user)
        
        # Verify all members are friends with creator
        for member_id in member_ids:
            if member_id == current_user_id:
                continue  # Skip self
            if not current_user.is_friend_with(member_id):
                return jsonify({'error': f'Bạn cần kết bạn với tất cả thành viên trước khi tạo nhóm'}), 403
        
        # Generate unique room_id
        room_id = f"group_{uuid.uuid4().hex[:16]}"
        
        # Create group
        group = GroupChat(
            room_id=room_id,
            name=name,
            description=description,
            created_by=current_user_id
        )
        db.session.add(group)
        db.session.flush()  # Get group.id
        
        # Add creator as admin
        creator_member = GroupMember(
            group_id=group.id,
            user_id=current_user_id,
            role='admin'
        )
        db.session.add(creator_member)
        
        # Add other members
        for member_id in member_ids:
            if member_id == current_user_id:
                continue
            member = GroupMember(
                group_id=group.id,
                user_id=member_id,
                role='member'
            )
            db.session.add(member)
        
        db.session.commit()
        
        # Create system message
        system_message = Chat(
            message=f"{current_user.full_name or current_user.username} đã tạo nhóm",
            message_type='system',
            sender_id=current_user_id,
            room_id=room_id,
            conversation_type='group',
            status='sent'
        )
        db.session.add(system_message)
        db.session.commit()
        
        # Send notifications to members
        for member_id in member_ids:
            if member_id != current_user_id:
                create_notification(
                    user_id=member_id,
                    type='message',
                    message=f'{current_user.full_name or current_user.username} đã thêm bạn vào nhóm "{name}"',
                    title='Đã thêm vào nhóm chat',
                    actor_id=current_user_id,
                    related_type='group_chat',
                    related_id=group.id,
                    action_url=f'/messages/group/{room_id}',
                    emit_realtime=True
                )
        
        return jsonify({
            'message': 'Tạo nhóm thành công',
            'group': group.to_dict(include_members=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating group: {str(e)}", exc_info=True)
        return jsonify({'error': f'Lỗi tạo nhóm: {str(e)}'}), 500


@chat_bp.route('/groups', methods=['GET'])
@jwt_required()
def get_user_groups():
    """Get all groups that current user is a member of"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get all groups where user is a member
        groups = db.session.query(GroupChat).join(
            GroupMember
        ).filter(
            GroupMember.user_id == current_user_id
        ).order_by(GroupChat.updated_at.desc()).all()
        
        groups_list = []
        for group in groups:
            # Get last message
            last_message = Chat.query.filter(
                Chat.room_id == group.room_id,
                Chat.conversation_type == 'group'
            ).order_by(Chat.created_at.desc()).first()
            
            # Get unread count (messages not read by current user)
            unread_count = Chat.query.filter(
                Chat.room_id == group.room_id,
                Chat.conversation_type == 'group',
                Chat.sender_id != current_user_id,
                Chat.status != 'read'
            ).count()
            
            group_dict = group.to_dict()
            group_dict['unread_count'] = unread_count
            
            if last_message:
                sender = User.query.get(last_message.sender_id)
                group_dict['last_message'] = {
                    'id': last_message.id,
                    'message': last_message.message,
                    'sender_id': last_message.sender_id,
                    'sender': {
                        'id': sender.id,
                        'username': sender.username,
                        'full_name': sender.full_name,
                        'avatar_url': sender.avatar_url
                    } if sender else None,
                    'created_at': last_message.created_at.isoformat() if last_message.created_at else None,
                    'status': last_message.status
                }
                group_dict['updated_at'] = last_message.created_at.isoformat() if last_message.created_at else None
            else:
                group_dict['updated_at'] = group.updated_at.isoformat() if group.updated_at else None
            
            groups_list.append(group_dict)
        
        return jsonify({'groups': groups_list}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting user groups: {str(e)}", exc_info=True)
        return jsonify({'error': f'Lỗi lấy danh sách nhóm: {str(e)}'}), 500


@chat_bp.route('/groups/<room_id>', methods=['GET'])
@jwt_required()
def get_group(room_id):
    """Get group information"""
    try:
        current_user_id = get_jwt_identity()
        
        group = GroupChat.query.filter_by(room_id=room_id).first()
        if not group:
            return jsonify({'error': 'Không tìm thấy nhóm'}), 404
        
        # Check if user is a member
        is_member = GroupMember.query.filter_by(
            group_id=group.id,
            user_id=current_user_id
        ).first()
        
        if not is_member:
            return jsonify({'error': 'Bạn không phải thành viên của nhóm này'}), 403
        
        return jsonify({'group': group.to_dict(include_members=True)}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thông tin nhóm: {str(e)}'}), 500


@chat_bp.route('/groups/<room_id>/messages', methods=['GET'])
@jwt_required()
def get_group_messages(room_id):
    """Get messages for a group"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if group exists
        group = GroupChat.query.filter_by(room_id=room_id).first()
        if not group:
            return jsonify({'error': 'Không tìm thấy nhóm'}), 404
        
        # Check if user is a member
        is_member = GroupMember.query.filter_by(
            group_id=group.id,
            user_id=current_user_id
        ).first()
        
        if not is_member:
            return jsonify({'error': 'Bạn không phải thành viên của nhóm này'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Get messages for this group
        messages_query = Chat.query.filter(
            Chat.room_id == room_id,
            Chat.conversation_type == 'group'
        ).order_by(Chat.created_at.desc())
        
        pagination = messages_query.paginate(page=page, per_page=per_page, error_out=False)
        
        messages = []
        for msg in pagination.items:
            sender = User.query.get(msg.sender_id)
            msg_dict = msg.to_dict()
            msg_dict['sender'] = {
                'id': sender.id,
                'username': sender.username,
                'full_name': sender.full_name,
                'avatar_url': sender.avatar_url
            } if sender else None
            messages.append(msg_dict)
        
        # Reverse to show oldest first
        messages.reverse()
        
        # Mark messages as read (for this user)
        Chat.query.filter(
            Chat.room_id == room_id,
            Chat.conversation_type == 'group',
            Chat.sender_id != current_user_id,
            Chat.status != 'read'
        ).update({'status': 'read', 'read_at': datetime.utcnow()})
        db.session.commit()
        
        return jsonify({
            'messages': messages,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error getting group messages: {str(e)}", exc_info=True)
        return jsonify({'error': f'Lỗi lấy tin nhắn: {str(e)}'}), 500


@chat_bp.route('/groups/<room_id>/messages', methods=['POST'])
@jwt_required()
def send_group_message(room_id):
    """Send a message to a group"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if group exists
        group = GroupChat.query.filter_by(room_id=room_id).first()
        if not group:
            return jsonify({'error': 'Không tìm thấy nhóm'}), 404
        
        # Check if user is a member
        is_member = GroupMember.query.filter_by(
            group_id=group.id,
            user_id=current_user_id
        ).first()
        
        if not is_member:
            return jsonify({'error': 'Bạn không phải thành viên của nhóm này'}), 403
        
        # Handle both JSON and form-data
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json()
            message = data.get('message', '').strip()
            message_type = data.get('message_type', 'text')
            file_url = data.get('file_url')
            file_type = data.get('file_type')
            location_data = data.get('location')
        else:
            # Form-data for file uploads
            message = request.form.get('message', '').strip()
            message_type = request.form.get('message_type', 'text')
            file_url = None
            file_type = None
            location_data = None
            
            # Handle file upload
            if 'file' in request.files:
                file = request.files['file']
                if file and file.filename:
                    upload_folder = current_app.config['UPLOAD_FOLDER']
                    if message_type == 'image':
                        folder = os.path.join(upload_folder, 'images')
                    elif message_type == 'audio':
                        folder = os.path.join(upload_folder, 'audio')
                    else:
                        folder = os.path.join(upload_folder, 'files')
                    
                    os.makedirs(folder, exist_ok=True)
                    
                    filename = secure_filename(file.filename)
                    unique_filename = f"{current_user_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
                    file_path = os.path.join(folder, unique_filename)
                    file.save(file_path)
                    
                    file_url = f"/uploads/{os.path.basename(folder)}/{unique_filename}"
                    file_type = file.content_type
        
        # Validate message content
        if message_type == 'text':
            if not message:
                return jsonify({'error': 'Tin nhắn không được để trống'}), 400
        elif message_type == 'image':
            if not file_url:
                return jsonify({'error': 'Thiếu ảnh'}), 400
            message = message or '[Ảnh]'
        elif message_type == 'audio':
            if not file_url:
                return jsonify({'error': 'Thiếu file ghi âm'}), 400
            message = message or '[Ghi âm]'
        elif message_type == 'location':
            if not location_data:
                return jsonify({'error': 'Thiếu thông tin vị trí'}), 400
            message = json.dumps(location_data)
        
        # Create chat message
        chat = Chat(
            message=message,
            message_type=message_type,
            sender_id=current_user_id,
            room_id=room_id,
            conversation_type='group',
            status='sent',
            file_url=file_url,
            file_type=file_type
        )
        
        db.session.add(chat)
        db.session.commit()
        
        # Get sender info
        sender = User.query.get(current_user_id)
        
        chat_dict = chat.to_dict()
        chat_dict['sender'] = {
            'id': sender.id,
            'username': sender.username,
            'full_name': sender.full_name,
            'avatar_url': sender.avatar_url
        } if sender else None
        
        # Prepare message data for Socket.IO
        message_data = {
            'id': chat.id,
            'message': message,
            'message_type': message_type,
            'file_url': file_url,
            'file_type': file_type,
            'sender': chat_dict['sender'],
            'room_id': room_id,
            'sender_id': current_user_id,
            'created_at': chat.created_at.isoformat() if chat.created_at else None,
            'status': chat.status
        }
        
        # Get all group members
        members = GroupMember.query.filter_by(group_id=group.id).all()
        
        # Emit to all group members (including sender for confirmation)
        for member in members:
            if member.user_id != current_user_id:
                # Send notification to other members
                create_notification(
                    user_id=member.user_id,
                    type='message',
                    message=f'{sender.full_name or sender.username}: {message[:50]}',
                    title=f'Tin nhắn từ {group.name}',
                    actor_id=current_user_id,
                    related_type='group_chat',
                    related_id=group.id,
                    action_url=f'/messages/group/{room_id}',
                    emit_realtime=True
                )
            
            # Emit real-time message
            emit_to_user(member.user_id, 'new_group_message', message_data)
        
        # Update group updated_at
        group.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Gửi tin nhắn thành công',
            'chat': chat_dict
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error sending group message: {str(e)}", exc_info=True)
        return jsonify({'error': f'Lỗi gửi tin nhắn: {str(e)}'}), 500


@chat_bp.route('/groups/<room_id>/members', methods=['GET'])
@jwt_required()
def get_group_members(room_id):
    """Get all members of a group"""
    try:
        current_user_id = get_jwt_identity()
        
        group = GroupChat.query.filter_by(room_id=room_id).first()
        if not group:
            return jsonify({'error': 'Không tìm thấy nhóm'}), 404
        
        # Check if user is a member
        is_member = GroupMember.query.filter_by(
            group_id=group.id,
            user_id=current_user_id
        ).first()
        
        if not is_member:
            return jsonify({'error': 'Bạn không phải thành viên của nhóm này'}), 403
        
        members = GroupMember.query.filter_by(group_id=group.id).all()
        members_list = [member.to_dict() for member in members]
        
        return jsonify({'members': members_list}), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách thành viên: {str(e)}'}), 500

