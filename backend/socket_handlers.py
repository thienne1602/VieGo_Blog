from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token
from models.user import User
from models.chat import Chat, db
import json

def register_socket_handlers(socketio):
    """Register Socket.IO event handlers"""
    
    @socketio.on('connect')
    def on_connect(auth):
        """Handle client connection"""
        try:
            # Verify JWT token
            if auth and 'token' in auth:
                token = auth['token']
                decoded = decode_token(token)
                user_id = decoded['sub']
                
                user = User.query.get(user_id)
                if user and user.is_active:
                    emit('connected', {
                        'message': f'Chào mừng {user.username}!',
                        'user_id': user_id
                    })
                    print(f'User {user.username} connected')
                else:
                    disconnect()
            else:
                # Allow anonymous connections for public features
                emit('connected', {'message': 'Kết nối thành công'})
                
        except Exception as e:
            print(f'Connection error: {str(e)}')
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
        """Handle real-time chat messages"""
        try:
            message = data.get('message', '').strip()
            room = data.get('room')
            sender_id = data.get('sender_id')
            receiver_id = data.get('receiver_id')
            message_type = data.get('message_type', 'text')
            
            if not message:
                emit('error', {'message': 'Tin nhắn trống'})
                return
            
            # Create chat message in database
            chat = Chat(
                message=message,
                message_type=message_type,
                sender_id=sender_id,
                receiver_id=receiver_id,
                room_id=room
            )
            
            db.session.add(chat)
            db.session.commit()
            
            # Get sender info
            sender = User.query.get(sender_id) if sender_id else None
            
            # Emit to room or direct message
            message_data = {
                'id': chat.id,
                'message': message,
                'message_type': message_type,
                'sender': {
                    'id': sender.id,
                    'username': sender.username,
                    'full_name': sender.full_name,
                    'avatar_url': sender.avatar_url
                } if sender else None,
                'timestamp': chat.created_at.isoformat(),
                'room': room
            }
            
            if room:
                emit('new_message', message_data, room=room)
            else:
                emit('new_message', message_data)
            
        except Exception as e:
            db.session.rollback()
            emit('error', {'message': f'Lỗi gửi tin nhắn: {str(e)}'})
    
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
    
    return socketio