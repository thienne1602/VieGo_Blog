"""
Banned Keyword Model for VieGo Blog
Handles banned keywords that will trigger warnings and prevent content posting
"""

from datetime import datetime
from . import db

class BannedKeyword(db.Model):
    __tablename__ = 'banned_keywords'
    
    id = db.Column(db.Integer, primary_key=True)
    keyword = db.Column(db.String(255), nullable=False, unique=True, index=True)
    severity = db.Column(db.Enum('low', 'medium', 'high', 'critical'), default='medium')
    description = db.Column(db.Text)  # Reason why this keyword is banned
    
    # Created by moderator/admin
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Status
    is_active = db.Column(db.Boolean, default=True, index=True)
    
    def to_dict(self):
        """Convert banned keyword to dictionary"""
        return {
            'id': self.id,
            'keyword': self.keyword,
            'severity': self.severity,
            'description': self.description,
            'created_by': self.created_by,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<BannedKeyword {self.keyword}>'

