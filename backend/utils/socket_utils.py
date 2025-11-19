"""
Socket.IO utility functions for emitting events from routes
"""
from flask_socketio import SocketIO

# Global socketio instance - will be set by main.py
_socketio_instance: SocketIO = None

def init_socket_utils(socketio: SocketIO):
    """Initialize socket utilities with Socket.IO instance"""
    global _socketio_instance
    _socketio_instance = socketio

def emit_to_user(user_id: int, event: str, data: dict):
    """Emit an event to a specific user's room ONLY (not broadcast)"""
    if _socketio_instance:
        # Ensure user_id is integer for consistent room naming
        try:
            user_id_int = int(user_id) if user_id is not None else None
            if user_id_int is None:
                print(f'[Socket.IO] ERROR: Invalid user_id {user_id} for event {event}')
                return
            room = f'user_{user_id_int}'
            
            # IMPORTANT: Only emit to the specific room, NOT broadcast
            # This ensures only users in that room receive the event
            print(f'[Socket.IO] Emitting {event} to room {room} ONLY (user_id={user_id_int})')
            print(f'[Socket.IO] Data keys: {list(data.keys()) if isinstance(data, dict) else "not a dict"}')
            
            # Check if we're in a socket context (has request.sid) or HTTP context
            # When emitting from HTTP routes, we can't use include_self=False
            # because flask.request.sid doesn't exist in HTTP context
            try:
                from flask import request
                # Try to access request.sid to check if we're in socket context
                has_sid = hasattr(request, 'sid') and request.sid is not None
            except (RuntimeError, AttributeError):
                # Not in request context or no sid attribute
                has_sid = False
            
            # Use room parameter to ensure it only goes to that specific room
            # When in HTTP context (no sid), we can't use include_self=False
            # So we just emit to the room - the client should filter if needed
            if has_sid:
                _socketio_instance.emit(event, data, room=room, include_self=False)
            else:
                # HTTP context - emit to room without include_self
                _socketio_instance.emit(event, data, room=room)
            
            print(f'[Socket.IO] Successfully emitted {event} to room {room} (user_id={user_id_int})')
        except (ValueError, TypeError) as e:
            print(f'[Socket.IO] ERROR: Failed to convert user_id {user_id} to int: {str(e)}')
        except Exception as emit_error:
            print(f'[Socket.IO] ERROR: Failed to emit {event} to user {user_id}: {str(emit_error)}')
            import traceback
            print(traceback.format_exc())
    else:
        print(f'[Socket.IO] WARNING: Socket.IO instance not initialized, cannot emit {event} to user {user_id}')

def emit_to_room(room: str, event: str, data: dict, include_self: bool = False):
    """Emit an event to a specific room"""
    if _socketio_instance:
        _socketio_instance.emit(event, data, room=room, include_self=include_self)

def get_socketio():
    """Get the Socket.IO instance"""
    return _socketio_instance

