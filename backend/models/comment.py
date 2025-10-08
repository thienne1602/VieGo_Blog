from datetime import datetime
import json
from . import db

class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    
    # Threading support for nested comments
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'), index=True)
    level = db.Column(db.Integer, default=0)  # Nesting level
    
    # Engagement
    likes_count = db.Column(db.Integer, default=0)
    replies_count = db.Column(db.Integer, default=0)
    
    # Moderation
    status = db.Column(db.Enum('active', 'hidden', 'deleted', 'pending'), default='active')
    flagged = db.Column(db.Boolean, default=False)
    flag_reason = db.Column(db.String(255))
    
    # Language and translation
    language = db.Column(db.String(10), default='vi')
    translated_content = db.Column(db.Text)  # Auto-translated content
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False, index=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Self-referential relationship for replies
    parent = db.relationship('Comment', remote_side=[id], backref='replies')
    
    def get_thread_path(self):
        """Get the full path of comment thread"""
        path = []
        current = self
        while current.parent:
            path.append(current.parent.id)
            current = current.parent
        return list(reversed(path))
    
    def can_reply(self, max_depth=3):
        """Check if comment can have replies based on nesting level"""
        return self.level < max_depth
    
    def add_reply(self, content, author_id):
        """Add a reply to this comment"""
        if not self.can_reply():
            return None
        
        reply = Comment(
            content=content,
            author_id=author_id,
            post_id=self.post_id,
            parent_id=self.id,
            level=self.level + 1
        )
        
        # Update replies count
        self.replies_count += 1
        
        return reply
    
    def to_dict(self, include_replies=True):
        """Convert comment to dictionary"""
        data = {
            'id': self.id,
            'content': self.content,
            'parent_id': self.parent_id,
            'level': self.level,
            'likes_count': self.likes_count,
            'replies_count': self.replies_count,
            'status': self.status,
            'language': self.language,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'post_id': self.post_id,
            'author_id': self.author_id
        }
        
        if include_replies and self.replies:
            data['replies'] = [reply.to_dict(include_replies=False) for reply in self.replies]
        
        return data
    
    def __repr__(self):
        return f'<Comment {self.id} by User {self.author_id}>'


class Chat(db.Model):
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)
    
    # Message types
    message_type = db.Column(db.Enum('text', 'image', 'file', 'location', 'system'), default='text')
    file_url = db.Column(db.String(255))  # For file/image messages
    file_type = db.Column(db.String(50))   # MIME type
    
    # Chat room/conversation
    room_id = db.Column(db.String(100), index=True)  # For group chats
    conversation_type = db.Column(db.Enum('direct', 'group', 'public'), default='direct')
    
    # Message status
    status = db.Column(db.Enum('sent', 'delivered', 'read', 'deleted'), default='sent')
    
    # Language and translation
    language = db.Column(db.String(10), default='vi')
    translated_message = db.Column(db.Text)
    auto_translated = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    read_at = db.Column(db.DateTime)
    
    # Foreign Keys
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)  # For direct messages
    
    def mark_as_read(self):
        """Mark message as read"""
        self.status = 'read'
        self.read_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert chat message to dictionary"""
        return {
            'id': self.id,
            'message': self.message,
            'message_type': self.message_type,
            'file_url': self.file_url,
            'file_type': self.file_type,
            'room_id': self.room_id,
            'conversation_type': self.conversation_type,
            'status': self.status,
            'language': self.language,
            'translated_message': self.translated_message,
            'auto_translated': self.auto_translated,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id
        }
    
    def __repr__(self):
        return f'<Chat {self.id} from User {self.sender_id}>'


class UserPreferences(db.Model):
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Travel preferences
    travel_interests = db.Column(db.Text)  # JSON array
    budget_range = db.Column(db.Enum('budget', 'mid-range', 'luxury'), default='mid-range')
    travel_style = db.Column(db.Enum('backpacker', 'family', 'luxury', 'business', 'adventure'), default='backpacker')
    
    # Food preferences
    dietary_restrictions = db.Column(db.Text)  # JSON array
    cuisine_preferences = db.Column(db.Text)  # JSON array
    spice_tolerance = db.Column(db.Enum('none', 'mild', 'medium', 'hot'), default='medium')
    
    # Activity preferences
    preferred_activities = db.Column(db.Text)  # JSON array
    fitness_level = db.Column(db.Enum('low', 'moderate', 'high'), default='moderate')
    group_size_preference = db.Column(db.Enum('solo', 'couple', 'small_group', 'large_group'), default='small_group')
    
    # Location preferences
    preferred_regions = db.Column(db.Text)  # JSON array
    climate_preference = db.Column(db.Enum('tropical', 'temperate', 'cold', 'any'), default='tropical')
    
    # Notification settings
    email_notifications = db.Column(db.Boolean, default=True)
    push_notifications = db.Column(db.Boolean, default=True)
    newsletter_subscription = db.Column(db.Boolean, default=True)
    
    # AI personalization
    ai_recommendations = db.Column(db.Boolean, default=True)
    personalization_data = db.Column(db.Text)  # JSON for ML features
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_travel_interests(self, interests_list):
        """Set travel interests"""
        self.travel_interests = json.dumps(interests_list)
    
    def get_travel_interests(self):
        """Get travel interests as list"""
        if self.travel_interests:
            return json.loads(self.travel_interests)
        return []
    
    def set_cuisine_preferences(self, cuisines_list):
        """Set cuisine preferences"""
        self.cuisine_preferences = json.dumps(cuisines_list)
    
    def get_cuisine_preferences(self):
        """Get cuisine preferences as list"""
        if self.cuisine_preferences:
            return json.loads(self.cuisine_preferences)
        return []
    
    def to_dict(self):
        """Convert preferences to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'travel_interests': self.get_travel_interests(),
            'budget_range': self.budget_range,
            'travel_style': self.travel_style,
            'dietary_restrictions': json.loads(self.dietary_restrictions) if self.dietary_restrictions else [],
            'cuisine_preferences': self.get_cuisine_preferences(),
            'spice_tolerance': self.spice_tolerance,
            'preferred_activities': json.loads(self.preferred_activities) if self.preferred_activities else [],
            'fitness_level': self.fitness_level,
            'group_size_preference': self.group_size_preference,
            'preferred_regions': json.loads(self.preferred_regions) if self.preferred_regions else [],
            'climate_preference': self.climate_preference,
            'notifications': {
                'email': self.email_notifications,
                'push': self.push_notifications,
                'newsletter': self.newsletter_subscription
            },
            'ai_recommendations': self.ai_recommendations,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<UserPreferences for User {self.user_id}>'