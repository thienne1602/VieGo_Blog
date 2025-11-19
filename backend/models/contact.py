"""
Contact/Support Model for VieGo Blog
Handles user support requests and contact messages
"""

from datetime import datetime
from . import db

class Contact(db.Model):
    __tablename__ = 'contacts'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # User information
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)  # Nullable for anonymous users
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, index=True)
    phone = db.Column(db.String(50))
    
    # Contact details
    subject = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    category = db.Column(db.Enum(
        'technical',
        'account',
        'content',
        'payment',
        'general',
        'report',
        'suggestion',
        'other'
    ), default='general', index=True)
    
    # Status tracking
    status = db.Column(db.Enum('pending', 'in_progress', 'resolved', 'closed'), default='pending', index=True)
    priority = db.Column(db.Enum('low', 'medium', 'high', 'urgent'), default='medium', index=True)
    
    # Response handling
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Moderator/Admin handling this
    response = db.Column(db.Text)  # Response from moderator/admin
    responded_at = db.Column(db.DateTime)
    responded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Attachments (JSON array of file URLs)
    attachments = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    def set_attachments(self, attachments_list):
        """Set attachments as JSON"""
        import json
        self.attachments = json.dumps(attachments_list) if attachments_list else None
    
    def get_attachments(self):
        """Get attachments as list"""
        import json
        if self.attachments:
            return json.loads(self.attachments)
        return []
    
    def mark_as_resolved(self, responder_id, response_text=None):
        """Mark contact as resolved"""
        self.status = 'resolved'
        self.resolved_at = datetime.utcnow()
        self.responded_by = responder_id
        if response_text:
            self.response = response_text
        self.responded_at = datetime.utcnow()
    
    def to_dict(self, include_message=True):
        """Convert contact to dictionary"""
        import json
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'subject': self.subject,
            'category': self.category,
            'status': self.status,
            'priority': self.priority,
            'assigned_to': self.assigned_to,
            'attachments': self.get_attachments(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'responded_by': self.responded_by
        }
        
        if include_message:
            data['message'] = self.message
            data['response'] = self.response
        
        return data
    
    def __repr__(self):
        return f'<Contact {self.subject} from {self.email}>'

