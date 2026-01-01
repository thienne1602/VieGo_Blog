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
    
    # Moderation - Match database ENUM values
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'spam'), default='approved')
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
    # Newer code uses `author_id`, some older DBs still have `user_id` column.
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    # Legacy compatibility: map old `user_id` column if present in DB so inserts include it
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    
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
            # Legacy aliases for compatibility
            'like_count': self.likes_count,
            'reply_count': self.replies_count,
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