from datetime import datetime
from . import db

class GroupChat(db.Model):
    """Model for group chat rooms"""
    __tablename__ = 'group_chats'
    
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    avatar_url = db.Column(db.String(255))
    
    # Admin/Creator
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    members = db.relationship('GroupMember', backref='group', lazy='select', cascade='all, delete-orphan')
    
    def to_dict(self, include_members=False):
        """Convert group chat to dictionary"""
        data = {
            'id': self.id,
            'room_id': self.room_id,
            'name': self.name,
            'description': self.description,
            'avatar_url': self.avatar_url,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_members:
            from .user import User
            data['members'] = []
            for member in self.members:
                user = User.query.get(member.user_id)
                if user:
                    data['members'].append({
                        'id': member.id,
                        'user_id': member.user_id,
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'full_name': user.full_name,
                            'avatar_url': user.avatar_url
                        },
                        'role': member.role,
                        'joined_at': member.joined_at.isoformat() if member.joined_at else None
                    })
        
        return data
    
    def __repr__(self):
        return f'<GroupChat {self.room_id}: {self.name}>'


class GroupMember(db.Model):
    """Model for group chat members"""
    __tablename__ = 'group_members'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group_chats.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Member role: admin, member
    role = db.Column(db.Enum('admin', 'member'), default='member')
    
    # Timestamps
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint: user can only be in a group once
    __table_args__ = (db.UniqueConstraint('group_id', 'user_id', name='unique_group_member'),)
    
    def to_dict(self):
        """Convert group member to dictionary"""
        from .user import User
        user = User.query.get(self.user_id)
        return {
            'id': self.id,
            'group_id': self.group_id,
            'user_id': self.user_id,
            'user': {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'avatar_url': user.avatar_url
            } if user else None,
            'role': self.role,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None
        }
    
    def __repr__(self):
        return f'<GroupMember group={self.group_id} user={self.user_id}>'

