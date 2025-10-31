from datetime import datetime
from . import db


class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    date = db.Column(db.String(50), nullable=False)
    participants = db.Column(db.Integer, nullable=False, default=1)
    total_price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='VND')
    status = db.Column(db.Enum('pending', 'confirmed', 'cancelled'), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='bookings', lazy='joined')
    tour = db.relationship('Tour', backref='bookings', lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'tour_id': self.tour_id,
            'user_id': self.user_id,
            'date': self.date,
            'participants': self.participants,
            'total_price': self.total_price,
            'currency': self.currency,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Booking {self.id} tour={self.tour_id} user={self.user_id}>'
