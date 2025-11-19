from datetime import datetime, timedelta
from . import db

class Story(db.Model):
    __tablename__ = 'stories'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text)
    media_url = db.Column(db.String(500))
    media_type = db.Column(db.Enum('image', 'video'), default='image')
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24))
    is_archived = db.Column(db.Boolean, default=False)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('stories', lazy='dynamic'))
    
    def __init__(self, user_id, content=None, media_url=None, media_type='image'):
        self.user_id = user_id
        self.content = content
        self.media_url = media_url
        self.media_type = media_type
        self.expires_at = datetime.utcnow() + timedelta(hours=24)
        self.is_archived = False
    
    def to_dict(self):
        """Convert story to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content': self.content,
            'media_url': self.media_url,
            'media_type': self.media_type,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_expired': self.expires_at < datetime.utcnow() if self.expires_at else True,
            'is_archived': self.is_archived
        }
    
    def is_active(self):
        """Check if story is still active (not expired and not archived)"""
        return self.expires_at > datetime.utcnow() and not self.is_archived
    
    def archive(self):
        """Archive the story"""
        self.is_archived = True
    
    def __repr__(self):
        return f'<Story {self.id} by User {self.user_id}>'
