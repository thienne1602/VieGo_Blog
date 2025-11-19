from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token
from models.user import User
from models.chat import Chat, db
from models.notification import Notification
from routes.notifications import create_notification
import json
from datetime import datetime

def register_socket_handlers(socketio):
    """Register Socket.IO event handlers"""
    
    @socketio.on('connect')
    def on_connect(auth):
        """Handle client connection"""
        from flask import request
        
        try:
            user_id = None
            socket_id = request.sid
            print(f'[Socket.IO] New connection attempt, socket_id={socket_id}')
            
            # Verify JWT token
            if auth and 'token' in auth:
                token = auth['token']
                decoded = decode_token(token)
                user_id_raw = decoded['sub']
                
                # Ensure user_id is integer for consistent room naming
                try:
                    user_id = int(user_id_raw) if user_id_raw is not None else None
                except (ValueError, TypeError):
                    print(f'[Socket.IO] ERROR: Invalid user_id from token: {user_id_raw}')
                    disconnect()
                    return
                
                if user_id is None:
                    print(f'[Socket.IO] ERROR: user_id is None after conversion')
                    disconnect()
                    return
                
                user = User.query.get(user_id)
                if user and user.is_active:
                    # IMPORTANT: Each user should ONLY join their own room
                    # Room name format: user_{user_id}
                    # This ensures notifications are sent only to the correct user
                    room = f'user_{user_id}'
                    
                    # Join user's personal room for notifications and direct messages
                    # Use consistent room naming: user_{user_id}
                    join_room(room)
                    
                    emit('connected', {
                        'message': f'Chào mừng {user.username}!',
                        'user_id': user_id,
                        'room': room
                    })
                    print(f'[Socket.IO] User {user.username} (ID: {user_id}) connected and joined room {room}, socket_id={socket_id}')
                    print(f'[Socket.IO] IMPORTANT: This socket should ONLY receive notifications for user_id={user_id}')
                    print(f'[Socket.IO] Room {room} should ONLY contain sockets for user_id={user_id}')
                else:
                    print(f'[Socket.IO] ERROR: User {user_id} not found or inactive')
                    disconnect()
            else:
                # Allow anonymous connections for public features (but they won't get notifications)
                print(f'[Socket.IO] Anonymous connection, socket_id={socket_id}')
                emit('connected', {'message': 'Kết nối thành công (không xác thực)'})
                
        except Exception as e:
            print(f'[Socket.IO] Connection error: {str(e)}')
            import traceback
            print(traceback.format_exc())
            disconnect()
    
    @socketio.on('disconnect')
    def on_disconnect():
        """Handle client disconnection"""
        print('User disconnected')
    
    @socketio.on('join_room')
    def on_join_room(data):
        """Join a chat room or collaboration session"""
        try:
            room = data.get('room')
            username = data.get('username', 'Anonymous')
            
            if room:
                join_room(room)
                emit('room_joined', {
                    'room': room,
                    'message': f'{username} đã tham gia phòng'
                }, room=room)
                
        except Exception as e:
            emit('error', {'message': f'Lỗi tham gia phòng: {str(e)}'})
    
    @socketio.on('leave_room')
    def on_leave_room(data):
        """Leave a chat room"""
        try:
            room = data.get('room')
            username = data.get('username', 'Anonymous')
            
            if room:
                leave_room(room)
                emit('room_left', {
                    'room': room,
                    'message': f'{username} đã rời khỏi phòng'
                }, room=room)
                
        except Exception as e:
            emit('error', {'message': f'Lỗi rời phòng: {str(e)}'})
    
    @socketio.on('send_message')
    def on_send_message(data):
        """
        DEPRECATED: This handler is disabled to prevent duplicate messages.
        Messages should be sent via API route /api/chat/messages which handles
        both database storage and Socket.IO emission.
        
        This handler is kept for backward compatibility but will not create messages.
        """
        print('[Socket.IO] WARNING: send_message event received but handler is disabled. Use API route /api/chat/messages instead.')
        emit('error', {
            'message': 'Vui lòng sử dụng API để gửi tin nhắn. Socket handler này đã bị vô hiệu hóa để tránh trùng lặp tin nhắn.'
        })
        return
        
        # OLD CODE - DISABLED TO PREVENT DUPLICATE MESSAGES
        # The API route /api/chat/messages already handles message creation and Socket.IO emission
    
    @socketio.on('typing')
    def on_typing(data):
        """Handle typing indicators"""
        try:
            room = data.get('room')
            user = data.get('user')
            is_typing = data.get('is_typing', False)
            
            if room and user:
                emit('user_typing', {
                    'user': user,
                    'is_typing': is_typing
                }, room=room, include_self=False)
                
        except Exception as e:
            emit('error', {'message': f'Lỗi typing indicator: {str(e)}'})
    
    @socketio.on('new_comment')
    def on_new_comment(data):
        """Handle real-time comment notifications"""
        try:
            post_id = data.get('post_id')
            comment_data = data.get('comment')
            
            if post_id and comment_data:
                # Emit to post room
                room = f'post_{post_id}'
                emit('comment_added', {
                    'post_id': post_id,
                    'comment': comment_data
                }, room=room)
                
        except Exception as e:
            emit('error', {'message': f'Lỗi comment real-time: {str(e)}'})
    
    @socketio.on('collaboration_edit')
    def on_collaboration_edit(data):
        """Handle real-time collaborative editing"""
        try:
            session_id = data.get('session_id')
            operation = data.get('operation')
            user_id = data.get('user_id')
            
            if session_id and operation:
                # Emit to collaboration session room
                room = f'collab_{session_id}'
                emit('edit_operation', {
                    'operation': operation,
                    'user_id': user_id,
                    'timestamp': data.get('timestamp')
                }, room=room, include_self=False)
                
        except Exception as e:
            emit('error', {'message': f'Lỗi collaboration: {str(e)}'})
    
    @socketio.on('location_update')
    def on_location_update(data):
        """Handle real-time location sharing for tours"""
        try:
            tour_id = data.get('tour_id')
            location = data.get('location')
            user_id = data.get('user_id')
            
            if tour_id and location:
                room = f'tour_{tour_id}'
                emit('location_shared', {
                    'tour_id': tour_id,
                    'location': location,
                    'user_id': user_id,
                    'timestamp': data.get('timestamp')
                }, room=room)
                
        except Exception as e:
            emit('error', {'message': f'Lỗi chia sẻ vị trí: {str(e)}'})
    
    @socketio.on('join_conversation')
    def on_join_conversation(data):
        """Join a direct message conversation"""
        try:
            user_id = data.get('user_id')
            other_user_id = data.get('other_user_id')
            
            if user_id and other_user_id:
                # Create a unique room for this conversation
                room = f'conversation_{min(user_id, other_user_id)}_{max(user_id, other_user_id)}'
                join_room(room)
                emit('conversation_joined', {'room': room})
                
        except Exception as e:
            emit('error', {'message': f'Lỗi tham gia cuộc trò chuyện: {str(e)}'})
    
    @socketio.on('typing_message')
    def on_typing_message(data):
        """Handle typing indicator in direct messages"""
        try:
            sender_id = data.get('sender_id')
            receiver_id = data.get('receiver_id')
            is_typing = data.get('is_typing', False)
            
            if sender_id and receiver_id:
                # Send typing indicator to receiver
                emit('user_typing', {
                    'sender_id': sender_id,
                    'is_typing': is_typing
                }, room=f'user_{receiver_id}')
                
        except Exception as e:
            emit('error', {'message': f'Lỗi typing indicator: {str(e)}'})
    
    return socketio