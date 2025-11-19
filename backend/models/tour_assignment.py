from datetime import datetime
from . import db


class TourAssignment(db.Model):
    """Model to manage tour guide assignments to tours"""
    __tablename__ = 'tour_assignments'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    tour_guide_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    
    # Assignment details
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)  # Seller who made the assignment
    assignment_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Status
    status = db.Column(db.Enum('assigned', 'accepted', 'in_progress', 'completed', 'cancelled'), default='assigned')
    
    # Notes
    notes = db.Column(db.Text, nullable=True)
    guide_notes = db.Column(db.Text, nullable=True)  # Notes from tour guide
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = db.relationship('Booking', backref=db.backref('assignment', uselist=False, lazy='select'))
    tour_guide = db.relationship('User', foreign_keys=[tour_guide_id], backref='assigned_tours', lazy='joined')
    assigner = db.relationship('User', foreign_keys=[assigned_by], backref='tour_assignments_made', lazy='joined')

    def to_dict(self, include_booking=False, include_guide=True):
        data = {
            'id': self.id,
            'booking_id': self.booking_id,
            'tour_guide_id': self.tour_guide_id,
            'assigned_by': self.assigned_by,
            'assignment_date': self.assignment_date.isoformat() if self.assignment_date else None,
            'status': self.status,
            'notes': self.notes,
            'guide_notes': self.guide_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_guide and self.tour_guide:
            data['tour_guide'] = {
                'id': self.tour_guide.id,
                'username': self.tour_guide.username,
                'full_name': self.tour_guide.full_name,
                'email': self.tour_guide.email,
                'phone': getattr(self.tour_guide, 'phone', None),
                'avatar_url': self.tour_guide.avatar_url
            }
        
        if include_booking and self.booking:
            data['booking'] = self.booking.to_dict()
            
        return data

    def __repr__(self):
        return f'<TourAssignment {self.id} booking={self.booking_id} guide={self.tour_guide_id}>'
