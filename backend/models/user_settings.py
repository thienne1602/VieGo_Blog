from datetime import datetime

from . import db


class UserSettings(db.Model):
    __tablename__ = 'user_settings'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)

    # Privacy
    privacy_show_email = db.Column(db.Boolean, default=False, nullable=False, server_default='0')
    privacy_allow_messages = db.Column(db.Boolean, default=True, nullable=False, server_default='1')
    privacy_allow_friend_requests = db.Column(db.Boolean, default=True, nullable=False, server_default='1')

    # Web
    web_email_notifications = db.Column(db.Boolean, default=True, nullable=False, server_default='1')
    web_ui_theme = db.Column(db.Enum('system', 'light', 'dark'), default='system', nullable=False, server_default='system')

    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'privacy': {
                'show_email': bool(self.privacy_show_email),
                'allow_messages': bool(self.privacy_allow_messages),
                'allow_friend_requests': bool(self.privacy_allow_friend_requests),
            },
            'web': {
                'email_notifications': bool(self.web_email_notifications),
                'ui_theme': self.web_ui_theme or 'system',
            },
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
