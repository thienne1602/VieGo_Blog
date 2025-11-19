from datetime import datetime
from . import db

class FriendRequest(db.Model):
    __tablename__ = 'friend_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    status = db.Column(db.Enum('pending', 'accepted', 'rejected', 'cancelled'), default='pending', index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    responded_at = db.Column(db.DateTime)
    
    # Relationships
    requester = db.relationship('User', foreign_keys=[requester_id], backref='sent_friend_requests')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_friend_requests')
    
    # Unique constraint: one pending request per pair
    __table_args__ = (
        db.UniqueConstraint('requester_id', 'receiver_id', name='unique_friend_request'),
    )
    
    def to_dict(self, include_users=False):
        """Convert friend request to dictionary"""
        data = {
            'id': self.id,
            'requester_id': self.requester_id,
            'receiver_id': self.receiver_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
        }
        
        if include_users:
            data['requester'] = {
                'id': self.requester.id,
                'username': self.requester.username,
                'full_name': self.requester.full_name,
                'avatar_url': self.requester.avatar_url
            } if self.requester else None
            
            data['receiver'] = {
                'id': self.receiver.id,
                'username': self.receiver.username,
                'full_name': self.receiver.full_name,
                'avatar_url': self.receiver.avatar_url
            } if self.receiver else None
        
        return data
    
    def accept(self):
        """Accept friend request"""
        self.status = 'accepted'
        self.responded_at = datetime.utcnow()
    
    def reject(self):
        """Reject friend request"""
        self.status = 'rejected'
        self.responded_at = datetime.utcnow()
    
    def cancel(self):
        """Cancel friend request"""
        self.status = 'cancelled'
        self.responded_at = datetime.utcnow()

