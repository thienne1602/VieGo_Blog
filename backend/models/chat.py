from datetime import datetime
from . import db

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