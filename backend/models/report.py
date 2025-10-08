"""
Report Model for VieGo Blog
Handles user reports for inappropriate content, spam, harassment, etc.
"""

from datetime import datetime
import json

# Import db from models package
from . import db

class Report(db.Model):
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Reporter information
    reporter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # What is being reported
    report_type = db.Column(db.Enum('post', 'comment', 'user', 'other'), nullable=False)
    target_id = db.Column(db.Integer, nullable=False, index=True)  # ID of the reported item
    
    # Report details
    reason = db.Column(db.Enum(
        'spam',
        'harassment',
        'hate_speech',
        'inappropriate_content',
        'violence',
        'copyright',
        'misinformation',
        'other'
    ), nullable=False)
    description = db.Column(db.Text)
    
    # Status tracking
    status = db.Column(db.Enum('pending', 'reviewing', 'resolved', 'dismissed'), default='pending', index=True)
    priority = db.Column(db.Enum('low', 'medium', 'high', 'urgent'), default='medium')
    
    # Resolution
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolution_notes = db.Column(db.Text)
    action_taken = db.Column(db.Enum(
        'none',
        'content_removed',
        'user_warned',
        'user_banned',
        'edited',
        'other'
    ), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    def __init__(self, reporter_id, report_type, target_id, reason, description=None):
        self.reporter_id = reporter_id
        self.report_type = report_type
        self.target_id = target_id
        self.reason = reason
        self.description = description
    
    def to_dict(self):
        """Convert report to dictionary"""
        return {
            'id': self.id,
            'reporterId': self.reporter_id,
            'reportType': self.report_type,
            'targetId': self.target_id,
            'reason': self.reason,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'resolvedBy': self.resolved_by,
            'resolutionNotes': self.resolution_notes,
            'actionTaken': self.action_taken,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'resolvedAt': self.resolved_at.isoformat() if self.resolved_at else None
        }
    
    def resolve(self, admin_id, action_taken, notes=None):
        """Resolve a report"""
        self.status = 'resolved'
        self.resolved_by = admin_id
        self.action_taken = action_taken
        self.resolution_notes = notes
        self.resolved_at = datetime.utcnow()
    
    def dismiss(self, admin_id, notes=None):
        """Dismiss a report as invalid"""
        self.status = 'dismissed'
        self.resolved_by = admin_id
        self.resolution_notes = notes
        self.resolved_at = datetime.utcnow()


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Who performed the action
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    
    # Action details
    action_type = db.Column(db.Enum(
        'user_register',
        'user_login',
        'user_logout',
        'user_update',
        'user_delete',
        'user_ban',
        'user_unban',
        'post_create',
        'post_update',
        'post_delete',
        'post_publish',
        'comment_create',
        'comment_update',
        'comment_delete',
        'report_create',
        'report_resolve',
        'admin_action',
        'system_event',
        'other'
    ), nullable=False, index=True)
    
    action_description = db.Column(db.String(255))
    
    # Additional context
    target_type = db.Column(db.String(50))  # user, post, comment, etc.
    target_id = db.Column(db.Integer, index=True)
    
    # Metadata (JSON)
    meta_data = db.Column(db.Text)  # JSON string for additional data
    
    # IP and user agent for security tracking
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.String(255))
    
    # Severity for filtering important events
    severity = db.Column(db.Enum('info', 'warning', 'error', 'critical'), default='info', index=True)
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def __init__(self, action_type, action_description, user_id=None, target_type=None, target_id=None):
        self.action_type = action_type
        self.action_description = action_description
        self.user_id = user_id
        self.target_type = target_type
        self.target_id = target_id
    
    def set_metadata(self, metadata_dict):
        """Set metadata as JSON string"""
        self.meta_data = json.dumps(metadata_dict)
    
    def get_metadata(self):
        """Get metadata as dictionary"""
        if self.meta_data:
            return json.loads(self.meta_data)
        return {}
    
    def to_dict(self):
        """Convert activity log to dictionary"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'actionType': self.action_type,
            'actionDescription': self.action_description,
            'targetType': self.target_type,
            'targetId': self.target_id,
            'metadata': self.get_metadata(),
            'ipAddress': self.ip_address,
            'userAgent': self.user_agent,
            'severity': self.severity,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def log_action(action_type, description, user_id=None, target_type=None, target_id=None, 
                   metadata=None, severity='info', ip_address=None, user_agent=None):
        """Helper method to create and save an activity log"""
        log = ActivityLog(
            action_type=action_type,
            action_description=description,
            user_id=user_id,
            target_type=target_type,
            target_id=target_id
        )
        
        if metadata:
            log.set_metadata(metadata)
        
        log.severity = severity
        log.ip_address = ip_address
        log.user_agent = user_agent
        
        db.session.add(log)
        db.session.commit()
        
        return log
