from datetime import datetime
from . import db


class BookingParticipant(db.Model):
    """Model to store individual participant information for each booking"""
    __tablename__ = 'booking_participants'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Participant information
    full_name = db.Column(db.String(255), nullable=False)
    gender = db.Column(db.Enum('male', 'female', 'other'), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    id_number = db.Column(db.String(50), nullable=True)  # CMND/CCCD
    passport_number = db.Column(db.String(50), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    address = db.Column(db.Text, nullable=True)
    
    # Participant type and special requirements
    participant_type = db.Column(db.Enum('adult', 'child', 'infant'), default='adult')
    special_requirements = db.Column(db.Text, nullable=True)  # Dietary restrictions, medical conditions, etc.
    
    # Emergency contact
    emergency_contact_name = db.Column(db.String(255), nullable=True)
    emergency_contact_phone = db.Column(db.String(50), nullable=True)
    emergency_contact_relationship = db.Column(db.String(100), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = db.relationship('Booking', backref=db.backref('participants_detail', lazy='select', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'full_name': self.full_name,
            'gender': self.gender,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'id_number': self.id_number,
            'passport_number': self.passport_number,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'participant_type': self.participant_type,
            'special_requirements': self.special_requirements,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'emergency_contact_relationship': self.emergency_contact_relationship,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<BookingParticipant {self.id} {self.full_name} booking={self.booking_id}>'
