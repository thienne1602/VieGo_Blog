from datetime import datetime
from . import db


class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    date = db.Column(db.String(50), nullable=False)
    participants = db.Column(db.Integer, nullable=False, default=1)
    
    # Participant breakdown
    adults = db.Column(db.Integer, default=0)
    children = db.Column(db.Integer, default=0)
    infants = db.Column(db.Integer, default=0)
    
    # Customer information
    full_name = db.Column(db.String(255))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    address = db.Column(db.Text)
    
    # Pricing details
    base_price = db.Column(db.Float, default=0.0)  # Original price before discount
    adult_price = db.Column(db.Float, default=0.0)
    child_price = db.Column(db.Float, default=0.0)
    infant_price = db.Column(db.Float, default=0.0)
    discount_code = db.Column(db.String(50))
    discount_amount = db.Column(db.Float, default=0.0)
    total_price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='VND')
    
    # Payment information
    payment_method = db.Column(db.Enum('office', 'bank_transfer', 'online'), default='office')
    payment_status = db.Column(db.Enum('unpaid', 'partial', 'paid'), default='unpaid')
    
    status = db.Column(db.Enum('pending', 'confirmed', 'cancelled'), default='pending')
    notes = db.Column(db.Text)
    
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
            'adults': self.adults or 0,
            'children': self.children or 0,
            'infants': self.infants or 0,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'base_price': self.base_price or 0.0,
            'adult_price': self.adult_price or 0.0,
            'child_price': self.child_price or 0.0,
            'infant_price': self.infant_price or 0.0,
            'discount_code': self.discount_code,
            'discount_amount': self.discount_amount or 0.0,
            'total_price': self.total_price,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Booking {self.id} tour={self.tour_id} user={self.user_id}>'
