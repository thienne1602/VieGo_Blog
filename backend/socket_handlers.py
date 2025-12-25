from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token
from models.user import User
from models.chat import Chat, db
from models.notification import Notification
from routes.notifications import create_notification
import json
from datetime import datetime

# Track online users: {user_id: {'socket_id': sid, 'last_seen': datetime}}
online_users = {}

# Track typing status: {conversation_key: {user_id: timestamp}}
typing_status = {}

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
                    
                    # Track online status
                    online_users[user_id] = {
                        'socket_id': socket_id,
                        'last_seen': datetime.utcnow(),
                        'username': user.username
                    }
                    
                    # Get user's friends to notify them about online status
                    friend_ids = user.get_friends()  # Returns list of friend IDs
                    
                    emit('connected', {
                        'message': f'Chào mừng {user.username}!',
                        'user_id': user_id,
                        'room': room,
                        'online_users': list(online_users.keys())
                    })
                    
                    # Notify friends that this user is online
                    for friend_id in friend_ids:
                        socketio.emit('user_online', {
                            'user_id': user_id,
                            'username': user.username
                        }, room=f'user_{friend_id}')
                    
                    print(f'[Socket.IO] User {user.username} (ID: {user_id}) connected and joined room {room}, socket_id={socket_id}')
                    print(f'[Socket.IO] IMPORTANT: This socket should ONLY receive notifications for user_id={user_id}')
                    print(f'[Socket.IO] Room {room} should ONLY contain sockets for user_id={user_id}')
                    print(f'[Socket.IO] User {user_id} is now ONLINE, notified {len(friend_ids)} friends')
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
        from flask import request
        socket_id = request.sid
        
        # Find and remove user from online_users
        disconnected_user_id = None
        disconnected_username = None
        
        for user_id, info in list(online_users.items()):
            if info['socket_id'] == socket_id:
                disconnected_user_id = user_id
                disconnected_username = info.get('username', 'Unknown')
                del online_users[user_id]
                break
        
        if disconnected_user_id:
            print(f'[Socket.IO] User {disconnected_username} (ID: {disconnected_user_id}) disconnected, socket_id={socket_id}')
            
            # Get user's friends to notify them about offline status
            try:
                user = User.query.get(disconnected_user_id)
                if user:
                    friend_ids = user.get_friends()  # Returns list of friend IDs
                    
                    # Notify friends that this user is offline
                    for friend_id in friend_ids:
                        socketio.emit('user_offline', {
                            'user_id': disconnected_user_id,
                            'username': disconnected_username,
                            'last_seen': datetime.utcnow().isoformat()
                        }, room=f'user_{friend_id}')
                    
                    print(f'[Socket.IO] User {disconnected_user_id} is now OFFLINE, notified {len(friend_ids)} friends')
            except Exception as e:
                print(f'[Socket.IO] Error notifying friends of disconnect: {str(e)}')
        else:
            print(f'[Socket.IO] Anonymous user disconnected, socket_id={socket_id}')
    
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
            'message': 'Vui lòng sử dụng API để gửi tin nhắn. Socket handler này đã bị vô hiệu hóa để tránh trùng lặp tin nhắn.',
            'code': 'USE_API'
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
    
    @socketio.on('message_delivered')
    def on_message_delivered(data):
        """Handle message delivery confirmation"""
        try:
            message_id = data.get('message_id')
            receiver_id = data.get('receiver_id')
            
            if message_id and receiver_id:
                # Update message status in database
                message = Chat.query.get(message_id)
                if message and message.receiver_id == receiver_id:
                    message.status = 'delivered'
                    db.session.commit()
                    
                    # Notify sender that message was delivered
                    socketio.emit('message_status_updated', {
                        'message_id': message_id,
                        'status': 'delivered',
                        'timestamp': datetime.utcnow().isoformat()
                    }, room=f'user_{message.sender_id}')
                    
                    print(f'[Socket.IO] Message {message_id} delivered to user {receiver_id}')
        except Exception as e:
            print(f'[Socket.IO] Error in message delivery confirmation: {str(e)}')
    
    @socketio.on('message_read')
    def on_message_read(data):
        """Handle message read confirmation"""
        try:
            message_id = data.get('message_id')
            reader_id = data.get('reader_id')
            
            if message_id and reader_id:
                # Update message status in database
                message = Chat.query.get(message_id)
                if message and message.receiver_id == reader_id:
                    message.status = 'read'
                    message.read_at = datetime.utcnow()
                    db.session.commit()
                    
                    # Notify sender that message was read
                    socketio.emit('message_status_updated', {
                        'message_id': message_id,
                        'status': 'read',
                        'read_at': message.read_at.isoformat(),
                        'timestamp': datetime.utcnow().isoformat()
                    }, room=f'user_{message.sender_id}')
                    
                    print(f'[Socket.IO] Message {message_id} read by user {reader_id}')
        except Exception as e:
            print(f'[Socket.IO] Error in message read confirmation: {str(e)}')
    
    @socketio.on('get_online_status')
    def on_get_online_status(data):
        """Check online status of specific users"""
        try:
            user_ids = data.get('user_ids', [])
            
            online_status = {}
            for uid in user_ids:
                online_status[uid] = {
                    'is_online': uid in online_users,
                    'last_seen': online_users[uid]['last_seen'].isoformat() if uid in online_users else None
                }
            
            emit('online_status_response', {
                'users': online_status
            })
        except Exception as e:
            print(f'[Socket.IO] Error getting online status: {str(e)}')
            emit('error', {'message': f'Lỗi lấy trạng thái online: {str(e)}'})
    
    @socketio.on('typing_message')
    def on_typing_message(data):
        """Handle typing indicator in direct messages"""
        try:
            sender_id = data.get('sender_id')
            receiver_id = data.get('receiver_id')
            is_typing = data.get('is_typing', False)
            
            if sender_id and receiver_id:
                # Create conversation key for tracking
                conv_key = f"{min(sender_id, receiver_id)}_{max(sender_id, receiver_id)}"
                
                if is_typing:
                    # User started typing
                    if conv_key not in typing_status:
                        typing_status[conv_key] = {}
                    typing_status[conv_key][sender_id] = datetime.utcnow()
                else:
                    # User stopped typing
                    if conv_key in typing_status and sender_id in typing_status[conv_key]:
                        del typing_status[conv_key][sender_id]
                        if not typing_status[conv_key]:  # Remove empty dict
                            del typing_status[conv_key]
                
                # Get sender info
                sender = User.query.get(sender_id)
                sender_name = sender.full_name or sender.username if sender else 'Unknown'
                
                # Send typing indicator to receiver
                socketio.emit('user_typing', {
                    'sender_id': sender_id,
                    'sender_name': sender_name,
                    'is_typing': is_typing,
                    'conversation_id': conv_key,
                    'timestamp': datetime.utcnow().isoformat()
                }, room=f'user_{receiver_id}')
                
                print(f'[Socket.IO] Typing indicator: user {sender_id} {"started" if is_typing else "stopped"} typing to {receiver_id}')
                
        except Exception as e:
            print(f'[Socket.IO] Error in typing indicator: {str(e)}')
            emit('error', {'message': f'Lỗi typing indicator: {str(e)}'})
    
    @socketio.on('friend_request_sent')
    def on_friend_request_sent(data):
        """Handle friend request notification (backup for API notification)"""
        try:
            receiver_id = data.get('receiver_id')
            requester_id = data.get('requester_id')
            request_id = data.get('request_id')
            
            if receiver_id and requester_id:
                requester = User.query.get(requester_id)
                
                # Notify receiver about new friend request
                socketio.emit('friend_request_received', {
                    'request_id': request_id,
                    'requester': {
                        'id': requester.id,
                        'username': requester.username,
                        'full_name': requester.full_name,
                        'avatar_url': requester.avatar_url
                    } if requester else None,
                    'timestamp': datetime.utcnow().isoformat()
                }, room=f'user_{receiver_id}')
                
                print(f'[Socket.IO] Friend request notification sent to user {receiver_id} from {requester_id}')
        except Exception as e:
            print(f'[Socket.IO] Error in friend request notification: {str(e)}')
    
    @socketio.on('join_direct_conversation')
    def on_join_direct_conversation(data):
        """Join a direct conversation room for real-time updates"""
        try:
            user_id = data.get('user_id')
            other_user_id = data.get('other_user_id')
            
            if user_id and other_user_id:
                # Create conversation room ID
                conv_room = f"conversation_{min(user_id, other_user_id)}_{max(user_id, other_user_id)}"
                join_room(conv_room)
                
                emit('conversation_room_joined', {
                    'room': conv_room,
                    'user_id': user_id,
                    'other_user_id': other_user_id
                })
                
                print(f'[Socket.IO] User {user_id} joined conversation room {conv_room}')
        except Exception as e:
            print(f'[Socket.IO] Error joining conversation: {str(e)}')
            emit('error', {'message': f'Lỗi tham gia cuộc trò chuyện: {str(e)}'})
    
    @socketio.on('leave_direct_conversation')
    def on_leave_direct_conversation(data):
        """Leave a direct conversation room"""
        try:
            user_id = data.get('user_id')
            other_user_id = data.get('other_user_id')
            
            if user_id and other_user_id:
                # Create conversation room ID
                conv_room = f"conversation_{min(user_id, other_user_id)}_{max(user_id, other_user_id)}"
                leave_room(conv_room)
                
                emit('conversation_room_left', {
                    'room': conv_room,
                    'user_id': user_id
                })
                
                print(f'[Socket.IO] User {user_id} left conversation room {conv_room}')
        except Exception as e:
            print(f'[Socket.IO] Error leaving conversation: {str(e)}')
    
    # =====================================================
    # TOUR LOCATION TRACKING - Realtime member tracking
    # =====================================================
    
    @socketio.on('join_tour_tracking')
    def on_join_tour_tracking(data):
        """Join a tour tracking room for realtime location updates"""
        try:
            booking_id = data.get('booking_id')
            user_id = data.get('user_id')
            member_type = data.get('member_type', 'participant')  # tour_guide, participant, leader
            
            if booking_id and user_id:
                # Create tour tracking room
                room = f'tour_tracking_{booking_id}'
                join_room(room)
                
                # Get user info
                user = User.query.get(user_id)
                member_name = user.full_name or user.username if user else f'Member {user_id}'
                
                # Notify others in the tour that a new member joined tracking
                socketio.emit('member_joined_tracking', {
                    'booking_id': booking_id,
                    'user_id': user_id,
                    'member_name': member_name,
                    'member_type': member_type,
                    'timestamp': datetime.utcnow().isoformat()
                }, room=room, include_self=False)
                
                emit('tour_tracking_joined', {
                    'room': room,
                    'booking_id': booking_id,
                    'message': f'Đã tham gia theo dõi vị trí tour #{booking_id}'
                })
                
                print(f'[Socket.IO] User {user_id} joined tour tracking room {room}')
        except Exception as e:
            print(f'[Socket.IO] Error joining tour tracking: {str(e)}')
            emit('error', {'message': f'Lỗi tham gia theo dõi tour: {str(e)}'})
    
    @socketio.on('leave_tour_tracking')
    def on_leave_tour_tracking(data):
        """Leave tour tracking room"""
        try:
            booking_id = data.get('booking_id')
            user_id = data.get('user_id')
            
            if booking_id and user_id:
                room = f'tour_tracking_{booking_id}'
                leave_room(room)
                
                # Get user info
                user = User.query.get(user_id)
                member_name = user.full_name or user.username if user else f'Member {user_id}'
                
                # Notify others
                socketio.emit('member_left_tracking', {
                    'booking_id': booking_id,
                    'user_id': user_id,
                    'member_name': member_name,
                    'timestamp': datetime.utcnow().isoformat()
                }, room=room)
                
                emit('tour_tracking_left', {
                    'booking_id': booking_id,
                    'message': 'Đã rời khỏi theo dõi vị trí tour'
                })
                
                print(f'[Socket.IO] User {user_id} left tour tracking room {room}')
        except Exception as e:
            print(f'[Socket.IO] Error leaving tour tracking: {str(e)}')
    
    @socketio.on('update_member_location')
    def on_update_member_location(data):
        """
        Update member location in realtime
        This is the main handler for continuous location updates
        """
        try:
            from models.tour_member_location import TourMemberLocation, TourLocationHistory, TourGeofence
            from models.booking import Booking
            
            booking_id = data.get('booking_id')
            user_id = data.get('user_id')
            participant_id = data.get('participant_id')
            latitude = data.get('latitude')
            longitude = data.get('longitude')
            
            if not booking_id or (latitude is None or longitude is None):
                emit('error', {'message': 'Thiếu thông tin vị trí hoặc booking_id'})
                return
            
            # Verify booking exists
            booking = Booking.query.get(booking_id)
            if not booking:
                emit('error', {'message': 'Không tìm thấy booking'})
                return
            
            # Find or create member location record
            member_location = None
            if user_id:
                member_location = TourMemberLocation.query.filter_by(
                    booking_id=booking_id,
                    user_id=user_id,
                    is_active=True
                ).first()
            elif participant_id:
                member_location = TourMemberLocation.query.filter_by(
                    booking_id=booking_id,
                    participant_id=participant_id,
                    is_active=True
                ).first()
            
            if not member_location:
                # Create new location record
                user = User.query.get(user_id) if user_id else None
                member_name = data.get('member_name')
                if not member_name and user:
                    member_name = user.full_name or user.username
                elif not member_name:
                    member_name = f'Thành viên {participant_id or user_id}'
                
                member_location = TourMemberLocation(
                    booking_id=booking_id,
                    user_id=user_id,
                    participant_id=participant_id,
                    member_type=data.get('member_type', 'participant'),
                    member_name=member_name,
                    latitude=latitude,
                    longitude=longitude
                )
                db.session.add(member_location)
            else:
                # Update existing location
                member_location.update_location(
                    latitude=latitude,
                    longitude=longitude,
                    accuracy=data.get('accuracy'),
                    altitude=data.get('altitude'),
                    heading=data.get('heading'),
                    speed=data.get('speed'),
                    battery_level=data.get('battery_level'),
                    location_source=data.get('location_source', 'gps')
                )
            
            db.session.commit()
            
            # Save to history (every 30 seconds or significant movement)
            should_save_history = True
            last_history = TourLocationHistory.query.filter_by(
                member_location_id=member_location.id
            ).order_by(TourLocationHistory.recorded_at.desc()).first()
            
            if last_history:
                # Check if 30 seconds have passed or significant movement
                from datetime import timedelta
                time_diff = datetime.utcnow() - last_history.recorded_at
                if time_diff < timedelta(seconds=30):
                    # Check distance moved (simple approximation)
                    lat_diff = abs(latitude - last_history.latitude)
                    lng_diff = abs(longitude - last_history.longitude)
                    # Skip if minimal movement (roughly < 10m)
                    if lat_diff < 0.0001 and lng_diff < 0.0001:
                        should_save_history = False
            
            if should_save_history:
                history = TourLocationHistory(
                    member_location_id=member_location.id,
                    booking_id=booking_id,
                    user_id=user_id,
                    participant_id=participant_id,
                    member_type=member_location.member_type,
                    latitude=latitude,
                    longitude=longitude,
                    accuracy=data.get('accuracy'),
                    altitude=data.get('altitude'),
                    heading=data.get('heading'),
                    speed=data.get('speed')
                )
                db.session.add(history)
                db.session.commit()
            
            # Broadcast location update to tour tracking room
            room = f'tour_tracking_{booking_id}'
            location_data = member_location.to_dict()
            
            socketio.emit('member_location_updated', {
                'booking_id': booking_id,
                'member': location_data,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room)
            
            # Check geofences
            active_geofences = TourGeofence.query.filter_by(
                booking_id=booking_id,
                is_active=True
            ).all()
            
            for fence in active_geofences:
                is_inside = fence.is_point_inside(latitude, longitude)
                
                # Check for geofence violations
                if fence.alert_on_exit and not is_inside:
                    # Member is outside safety zone
                    socketio.emit('geofence_alert', {
                        'booking_id': booking_id,
                        'alert_type': 'geofence_exit',
                        'severity': 'warning',
                        'member': location_data,
                        'geofence': fence.to_dict(),
                        'message': f'{member_location.member_name} đã rời khỏi khu vực {fence.name}',
                        'timestamp': datetime.utcnow().isoformat()
                    }, room=room)
                
                elif fence.alert_on_enter and is_inside:
                    # Member entered restricted zone
                    socketio.emit('geofence_alert', {
                        'booking_id': booking_id,
                        'alert_type': 'geofence_enter',
                        'severity': 'info',
                        'member': location_data,
                        'geofence': fence.to_dict(),
                        'message': f'{member_location.member_name} đã đến {fence.name}',
                        'timestamp': datetime.utcnow().isoformat()
                    }, room=room)
            
            print(f'[Socket.IO] Location updated for member {member_location.member_name} in booking {booking_id}')
            
        except Exception as e:
            db.session.rollback()
            print(f'[Socket.IO] Error updating member location: {str(e)}')
            import traceback
            print(traceback.format_exc())
            emit('error', {'message': f'Lỗi cập nhật vị trí: {str(e)}'})
    
    @socketio.on('trigger_sos')
    def on_trigger_sos(data):
        """Trigger SOS emergency alert"""
        try:
            from models.tour_member_location import TourMemberLocation
            
            booking_id = data.get('booking_id')
            user_id = data.get('user_id')
            message = data.get('message', 'Cần hỗ trợ khẩn cấp!')
            latitude = data.get('latitude')
            longitude = data.get('longitude')
            
            if not booking_id or not user_id:
                emit('error', {'message': 'Thiếu thông tin booking_id hoặc user_id'})
                return
            
            # Find member location
            member_location = TourMemberLocation.query.filter_by(
                booking_id=booking_id,
                user_id=user_id,
                is_active=True
            ).first()
            
            if member_location:
                member_location.trigger_sos(message)
                if latitude and longitude:
                    member_location.latitude = latitude
                    member_location.longitude = longitude
                db.session.commit()
            
            # Get user info
            user = User.query.get(user_id)
            member_name = user.full_name or user.username if user else f'Thành viên {user_id}'
            
            # Broadcast SOS to entire tour
            room = f'tour_tracking_{booking_id}'
            
            sos_data = {
                'booking_id': booking_id,
                'alert_type': 'sos',
                'severity': 'critical',
                'user_id': user_id,
                'member_name': member_name,
                'message': message,
                'location': {
                    'latitude': latitude or (member_location.latitude if member_location else None),
                    'longitude': longitude or (member_location.longitude if member_location else None)
                },
                'timestamp': datetime.utcnow().isoformat()
            }
            
            socketio.emit('sos_alert', sos_data, room=room)
            
            # Also notify tour guide specifically if they have a user room
            from models.tour_assignment import TourAssignment
            assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
            if assignment and assignment.tour_guide_id:
                socketio.emit('sos_alert', sos_data, room=f'user_{assignment.tour_guide_id}')
            
            emit('sos_triggered', {
                'message': 'Đã gửi tín hiệu SOS đến hướng dẫn viên và các thành viên trong tour',
                'timestamp': datetime.utcnow().isoformat()
            })
            
            print(f'[Socket.IO] SOS triggered by user {user_id} in booking {booking_id}')
            
        except Exception as e:
            db.session.rollback()
            print(f'[Socket.IO] Error triggering SOS: {str(e)}')
            emit('error', {'message': f'Lỗi gửi SOS: {str(e)}'})
    
    @socketio.on('clear_sos')
    def on_clear_sos(data):
        """Clear SOS alert (typically by tour guide)"""
        try:
            from models.tour_member_location import TourMemberLocation
            
            booking_id = data.get('booking_id')
            target_user_id = data.get('target_user_id')  # The user whose SOS to clear
            cleared_by = data.get('cleared_by')  # Who is clearing (tour guide)
            
            if not booking_id or not target_user_id:
                emit('error', {'message': 'Thiếu thông tin'})
                return
            
            # Find and clear SOS
            member_location = TourMemberLocation.query.filter_by(
                booking_id=booking_id,
                user_id=target_user_id,
                is_sos=True
            ).first()
            
            if member_location:
                member_location.clear_sos()
                db.session.commit()
            
            # Notify all members
            room = f'tour_tracking_{booking_id}'
            
            clearer = User.query.get(cleared_by) if cleared_by else None
            clearer_name = clearer.full_name or clearer.username if clearer else 'Hướng dẫn viên'
            
            socketio.emit('sos_cleared', {
                'booking_id': booking_id,
                'target_user_id': target_user_id,
                'cleared_by': cleared_by,
                'cleared_by_name': clearer_name,
                'message': f'SOS đã được xử lý bởi {clearer_name}',
                'timestamp': datetime.utcnow().isoformat()
            }, room=room)
            
            print(f'[Socket.IO] SOS cleared for user {target_user_id} in booking {booking_id}')
            
        except Exception as e:
            db.session.rollback()
            print(f'[Socket.IO] Error clearing SOS: {str(e)}')
            emit('error', {'message': f'Lỗi xóa SOS: {str(e)}'})
    
    @socketio.on('request_all_locations')
    def on_request_all_locations(data):
        """Request current locations of all tour members"""
        try:
            from models.tour_member_location import TourMemberLocation
            
            booking_id = data.get('booking_id')
            
            if not booking_id:
                emit('error', {'message': 'Thiếu booking_id'})
                return
            
            # Get all active member locations
            locations = TourMemberLocation.query.filter_by(
                booking_id=booking_id,
                is_active=True
            ).all()
            
            members_data = [loc.to_dict(include_user=True) for loc in locations]
            
            emit('all_locations_response', {
                'booking_id': booking_id,
                'members': members_data,
                'count': len(members_data),
                'timestamp': datetime.utcnow().isoformat()
            })
            
            print(f'[Socket.IO] Sent {len(members_data)} member locations for booking {booking_id}')
            
        except Exception as e:
            print(f'[Socket.IO] Error getting all locations: {str(e)}')
            emit('error', {'message': f'Lỗi lấy vị trí: {str(e)}'})
    
    @socketio.on('ping_member')
    def on_ping_member(data):
        """Ping a specific member to request their location update"""
        try:
            booking_id = data.get('booking_id')
            target_user_id = data.get('target_user_id')
            requester_id = data.get('requester_id')
            
            if not booking_id or not target_user_id:
                emit('error', {'message': 'Thiếu thông tin'})
                return
            
            requester = User.query.get(requester_id) if requester_id else None
            requester_name = requester.full_name or requester.username if requester else 'Hướng dẫn viên'
            
            # Send ping to target member's personal room
            socketio.emit('location_ping', {
                'booking_id': booking_id,
                'requester_id': requester_id,
                'requester_name': requester_name,
                'message': f'{requester_name} yêu cầu cập nhật vị trí của bạn',
                'timestamp': datetime.utcnow().isoformat()
            }, room=f'user_{target_user_id}')
            
            emit('ping_sent', {
                'target_user_id': target_user_id,
                'message': 'Đã gửi yêu cầu cập nhật vị trí'
            })
            
            print(f'[Socket.IO] Location ping sent to user {target_user_id} from {requester_id}')
            
        except Exception as e:
            print(f'[Socket.IO] Error pinging member: {str(e)}')
            emit('error', {'message': f'Lỗi ping: {str(e)}'})
    
    return socketio