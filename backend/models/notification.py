from datetime import datetime
from . import db

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Notification content
    type = db.Column(db.String(50), nullable=False, index=True)  # like, comment, follow, message, etc.
    title = db.Column(db.String(255))
    message = db.Column(db.Text, nullable=False)
    
    # Related entity
    related_type = db.Column(db.String(50))  # post, comment, user, chat, etc.
    related_id = db.Column(db.Integer)  # ID of the related entity
    
    # Actor (who triggered the notification)
    actor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Status
    is_read = db.Column(db.Boolean, default=False, index=True)
    is_seen = db.Column(db.Boolean, default=False)  # Seen but not necessarily read
    
    # Metadata
    # Note: extra_data may not exist in older database schemas
    # If it doesn't exist, we'll use metadata column instead
    extra_data = db.Column(db.Text)  # JSON string for additional data
    action_url = db.Column(db.String(500))  # URL to navigate when clicked
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    read_at = db.Column(db.DateTime)
    seen_at = db.Column(db.DateTime)
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()
    
    def mark_as_seen(self):
        """Mark notification as seen"""
        if not self.is_seen:
            self.is_seen = True
            self.seen_at = datetime.utcnow()
    
    def to_dict(self, include_actor=False):
        """Convert notification to dictionary"""
        import json
        # Parse extra_data safely
        metadata = None
        if self.extra_data:
            try:
                metadata = json.loads(self.extra_data)
            except (json.JSONDecodeError, TypeError):
                metadata = None
        
        result = {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'related_type': self.related_type,
            'related_id': self.related_id,
            'is_read': self.is_read,
            'is_seen': self.is_seen,
            'action_url': self.action_url,
            'metadata': metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
        }
        
        if include_actor and self.actor_id:
            from .user import User
            actor = User.query.get(self.actor_id)
            if actor:
                result['actor'] = {
                    'id': actor.id,
                    'username': actor.username,
                    'full_name': actor.full_name,
                    'avatar_url': actor.avatar_url,
                    'role': actor.role
                }
        
        return result
    
    def __repr__(self):
        return f'<Notification {self.id} for User {self.user_id}>'

