from datetime import datetime
from . import db
import json


class TourProgress(db.Model):
    """Model to track tour progress and checkpoints"""
    __tablename__ = 'tour_progress'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Checkpoint information
    checkpoint_name = db.Column(db.String(255), nullable=False)
    checkpoint_description = db.Column(db.Text, nullable=True)
    checkpoint_order = db.Column(db.Integer, nullable=False)  # Order in the itinerary
    
    # Location data
    location_name = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # Progress status
    status = db.Column(db.Enum('pending', 'in_progress', 'completed', 'skipped'), default='pending')
    
    # Images and media
    images = db.Column(db.Text, nullable=True)  # JSON array of image URLs
    
    # Notes and updates
    notes = db.Column(db.Text, nullable=True)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)  # Tour guide who updated
    
    # Timestamps
    scheduled_time = db.Column(db.DateTime, nullable=True)  # Planned arrival time
    arrival_time = db.Column(db.DateTime, nullable=True)  # Actual arrival time
    departure_time = db.Column(db.DateTime, nullable=True)  # Actual departure time
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = db.relationship('Booking', backref=db.backref('progress_checkpoints', lazy='select', order_by='TourProgress.checkpoint_order'))
    updater = db.relationship('User', foreign_keys=[updated_by], backref='tour_updates', lazy='joined')

    def set_images(self, images_list):
        """Set checkpoint images"""
        self.images = json.dumps(images_list)
    
    def get_images(self):
        """Get checkpoint images as list"""
        if self.images:
            try:
                return json.loads(self.images)
            except:
                return []
        return []

    def to_dict(self, include_updater=False):
        data = {
            'id': self.id,
            'booking_id': self.booking_id,
            'checkpoint_name': self.checkpoint_name,
            'checkpoint_description': self.checkpoint_description,
            'checkpoint_order': self.checkpoint_order,
            'location_name': self.location_name,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'status': self.status,
            'images': self.get_images(),
            'notes': self.notes,
            'updated_by': self.updated_by,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'arrival_time': self.arrival_time.isoformat() if self.arrival_time else None,
            'departure_time': self.departure_time.isoformat() if self.departure_time else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_updater and self.updater:
            data['updater'] = {
                'id': self.updater.id,
                'username': self.updater.username,
                'full_name': self.updater.full_name
            }
            
        return data

    def __repr__(self):
        return f'<TourProgress {self.id} booking={self.booking_id} checkpoint={self.checkpoint_name}>'
