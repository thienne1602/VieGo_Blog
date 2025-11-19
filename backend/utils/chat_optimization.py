"""
Performance optimization and error handling for chat system
"""
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
import time
from collections import defaultdict
from datetime import datetime, timedelta


# Rate limiting storage
rate_limit_store = defaultdict(list)


def rate_limit(max_requests=10, window=60):
    """
    Rate limiting decorator for API endpoints
    max_requests: Maximum number of requests allowed
    window: Time window in seconds
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                if not user_id:
                    return f(*args, **kwargs)
                
                # Create key for this endpoint and user
                key = f"{f.__name__}:{user_id}"
                now = time.time()
                
                # Remove old entries outside the window
                rate_limit_store[key] = [
                    timestamp for timestamp in rate_limit_store[key]
                    if now - timestamp < window
                ]
                
                # Check if limit exceeded
                if len(rate_limit_store[key]) >= max_requests:
                    return jsonify({
                        'error': 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
                        'retry_after': window
                    }), 429
                
                # Add current timestamp
                rate_limit_store[key].append(now)
                
                return f(*args, **kwargs)
            except Exception as e:
                print(f"Rate limit error: {str(e)}")
                # On error, allow the request
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def handle_db_error(f):
    """
    Decorator to handle database errors gracefully
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from models import db
        try:
            result = f(*args, **kwargs)
            return result
        except Exception as e:
            db.session.rollback()
            error_msg = str(e)
            print(f"Database error in {f.__name__}: {error_msg}")
            
            # Check for specific errors
            if 'duplicate' in error_msg.lower() or 'unique' in error_msg.lower():
                return jsonify({'error': 'Dữ liệu đã tồn tại'}), 409
            elif 'foreign key' in error_msg.lower():
                return jsonify({'error': 'Tham chiếu không hợp lệ'}), 400
            elif 'doesn\'t exist' in error_msg.lower() or 'no such table' in error_msg.lower():
                return jsonify({'error': 'Bảng dữ liệu không tồn tại'}), 500
            else:
                return jsonify({'error': f'Lỗi database: {error_msg}'}), 500
    
    return decorated_function


class MessageQueue:
    """
    Queue for offline messages
    Stores messages when user is offline and delivers when they come online
    """
    def __init__(self):
        self.queues = defaultdict(list)  # {user_id: [messages]}
        self.max_queue_size = 100
    
    def add_message(self, user_id, message_data):
        """Add message to queue for offline user"""
        queue = self.queues[user_id]
        
        # Limit queue size
        if len(queue) >= self.max_queue_size:
            # Remove oldest message
            queue.pop(0)
        
        queue.append({
            'data': message_data,
            'timestamp': datetime.utcnow(),
            'attempts': 0
        })
        
        print(f"[MessageQueue] Added message to queue for user {user_id}, queue size: {len(queue)}")
    
    def get_queued_messages(self, user_id):
        """Get all queued messages for user and clear queue"""
        messages = self.queues.pop(user_id, [])
        print(f"[MessageQueue] Retrieved {len(messages)} queued messages for user {user_id}")
        return messages
    
    def has_messages(self, user_id):
        """Check if user has queued messages"""
        return user_id in self.queues and len(self.queues[user_id]) > 0


# Global message queue instance
message_queue = MessageQueue()


class ConnectionManager:
    """
    Manage Socket.IO connections with reconnection handling
    """
    def __init__(self):
        self.connections = {}  # {user_id: {socket_id, last_heartbeat, reconnect_count}}
        self.heartbeat_timeout = 30  # seconds
    
    def add_connection(self, user_id, socket_id):
        """Register new connection"""
        self.connections[user_id] = {
            'socket_id': socket_id,
            'last_heartbeat': datetime.utcnow(),
            'reconnect_count': 0,
            'connected_at': datetime.utcnow()
        }
        print(f"[ConnectionManager] User {user_id} connected with socket {socket_id}")
    
    def remove_connection(self, user_id):
        """Remove connection"""
        if user_id in self.connections:
            info = self.connections.pop(user_id)
            duration = (datetime.utcnow() - info['connected_at']).total_seconds()
            print(f"[ConnectionManager] User {user_id} disconnected after {duration:.1f}s")
    
    def heartbeat(self, user_id):
        """Update last heartbeat timestamp"""
        if user_id in self.connections:
            self.connections[user_id]['last_heartbeat'] = datetime.utcnow()
    
    def is_connected(self, user_id):
        """Check if user is connected"""
        if user_id not in self.connections:
            return False
        
        # Check if heartbeat is recent
        last_heartbeat = self.connections[user_id]['last_heartbeat']
        elapsed = (datetime.utcnow() - last_heartbeat).total_seconds()
        
        if elapsed > self.heartbeat_timeout:
            # Connection timed out
            self.remove_connection(user_id)
            return False
        
        return True
    
    def get_connection_stats(self):
        """Get connection statistics"""
        total = len(self.connections)
        active = sum(1 for uid in self.connections if self.is_connected(uid))
        
        return {
            'total_connections': total,
            'active_connections': active,
            'stale_connections': total - active
        }
    
    def cleanup_stale_connections(self):
        """Remove stale connections"""
        now = datetime.utcnow()
        stale_users = []
        
        for user_id, info in self.connections.items():
            elapsed = (now - info['last_heartbeat']).total_seconds()
            if elapsed > self.heartbeat_timeout:
                stale_users.append(user_id)
        
        for user_id in stale_users:
            self.remove_connection(user_id)
        
        if stale_users:
            print(f"[ConnectionManager] Cleaned up {len(stale_users)} stale connections")


# Global connection manager
connection_manager = ConnectionManager()


def retry_on_failure(max_retries=3, delay=1):
    """
    Retry decorator for functions that might fail
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return f(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    print(f"[Retry] Attempt {attempt + 1}/{max_retries} failed for {f.__name__}: {str(e)}")
                    
                    if attempt < max_retries - 1:
                        time.sleep(delay * (attempt + 1))  # Exponential backoff
            
            # All retries failed
            print(f"[Retry] All {max_retries} attempts failed for {f.__name__}")
            raise last_exception
        
        return decorated_function
    return decorator


class PerformanceMonitor:
    """
    Monitor performance metrics for chat system
    """
    def __init__(self):
        self.metrics = {
            'messages_sent': 0,
            'messages_delivered': 0,
            'messages_read': 0,
            'notifications_sent': 0,
            'connections': 0,
            'disconnections': 0,
            'errors': 0
        }
        self.start_time = datetime.utcnow()
    
    def increment(self, metric_name):
        """Increment a metric counter"""
        if metric_name in self.metrics:
            self.metrics[metric_name] += 1
    
    def get_stats(self):
        """Get current statistics"""
        uptime = (datetime.utcnow() - self.start_time).total_seconds()
        
        return {
            **self.metrics,
            'uptime_seconds': uptime,
            'messages_per_minute': (self.metrics['messages_sent'] / uptime * 60) if uptime > 0 else 0
        }
    
    def reset(self):
        """Reset all metrics"""
        for key in self.metrics:
            self.metrics[key] = 0
        self.start_time = datetime.utcnow()


# Global performance monitor
performance_monitor = PerformanceMonitor()


def validate_message_content(message, message_type='text', max_length=5000):
    """
    Validate message content before saving
    """
    if not message:
        return False, 'Tin nhắn không được để trống'
    
    if len(message) > max_length:
        return False, f'Tin nhắn quá dài (tối đa {max_length} ký tự)'
    
    # Validate by type
    if message_type == 'text':
        # Check for excessive whitespace
        if message.isspace():
            return False, 'Tin nhắn không hợp lệ'
    
    # Add more validation rules as needed
    # - Check for spam patterns
    # - Check for prohibited words
    # - Validate URLs if present
    
    return True, None


def sanitize_html(text):
    """
    Sanitize HTML content to prevent XSS
    """
    import html
    return html.escape(text)


# Background task to clean up old data
def cleanup_old_data():
    """
    Clean up old messages and notifications
    Run this periodically (e.g., daily via cron job)
    """
    from models import db
    from models.chat import Chat
    from models.notification import Notification
    from datetime import datetime, timedelta
    
    try:
        # Delete messages older than 6 months
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        deleted_messages = Chat.query.filter(
            Chat.created_at < six_months_ago,
            Chat.status == 'deleted'
        ).delete()
        
        # Delete read notifications older than 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        deleted_notifications = Notification.query.filter(
            Notification.created_at < thirty_days_ago,
            Notification.is_read == True
        ).delete()
        
        db.session.commit()
        
        print(f"[Cleanup] Deleted {deleted_messages} old messages and {deleted_notifications} old notifications")
        
        return {
            'deleted_messages': deleted_messages,
            'deleted_notifications': deleted_notifications,
            'success': True
        }
    except Exception as e:
        db.session.rollback()
        print(f"[Cleanup] Error: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


if __name__ == '__main__':
    # Test cleanup
    print("Running cleanup test...")
    result = cleanup_old_data()
    print(f"Result: {result}")
