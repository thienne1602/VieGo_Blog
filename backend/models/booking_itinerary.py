from datetime import datetime, date
from . import db
import json


class BookingItineraryDay(db.Model):
    """Model for actual booking itinerary days"""
    __tablename__ = 'booking_itinerary_days'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), 
                          nullable=False, index=True)
    template_day_id = db.Column(db.Integer, db.ForeignKey('tour_itinerary_days.id', ondelete='SET NULL'), 
                               nullable=True)
    
    # Day information
    day_number = db.Column(db.Integer, nullable=False)
    actual_date = db.Column(db.Date, nullable=False, index=True)
    day_title = db.Column(db.String(255), nullable=False)
    day_description = db.Column(db.Text, nullable=True)
    
    # Status tracking
    status = db.Column(db.Enum('not_started', 'in_progress', 'completed', 'cancelled', 'postponed'), 
                      default='not_started', index=True)
    
    # Actual details
    actual_breakfast = db.Column(db.Boolean, default=False)
    actual_lunch = db.Column(db.Boolean, default=False)
    actual_dinner = db.Column(db.Boolean, default=False)
    actual_accommodation = db.Column(db.String(255), nullable=True)
    actual_transportation = db.Column(db.String(255), nullable=True)
    
    # Progress
    progress_percentage = db.Column(db.Integer, default=0)
    completed_checkpoints = db.Column(db.Integer, default=0)
    total_checkpoints = db.Column(db.Integer, default=0)
    
    # Timing
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    
    # Notes
    guide_notes = db.Column(db.Text, nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = db.relationship('Booking', backref=db.backref('itinerary_days', lazy='select', 
                                                           order_by='BookingItineraryDay.day_number'))
    template_day = db.relationship('TourItineraryDay', backref='booking_instances', lazy='joined')
    checkins = db.relationship('CheckpointCheckin', backref='booking_day', lazy='select',
                              order_by='CheckpointCheckin.scheduled_time', cascade='all, delete-orphan')

    def to_dict(self, include_checkins=False):
        data = {
            'id': self.id,
            'booking_id': self.booking_id,
            'template_day_id': self.template_day_id,
            'day_number': self.day_number,
            'actual_date': self.actual_date.isoformat() if self.actual_date else None,
            'day_title': self.day_title,
            'day_description': self.day_description,
            'status': self.status,
            'actual_breakfast': self.actual_breakfast,
            'actual_lunch': self.actual_lunch,
            'actual_dinner': self.actual_dinner,
            'actual_accommodation': self.actual_accommodation,
            'actual_transportation': self.actual_transportation,
            'progress_percentage': self.progress_percentage,
            'completed_checkpoints': self.completed_checkpoints,
            'total_checkpoints': self.total_checkpoints,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'guide_notes': self.guide_notes,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_checkins:
            data['checkins'] = [checkin.to_dict() for checkin in self.checkins]
            
        return data

    def __repr__(self):
        return f'<BookingItineraryDay {self.id} booking={self.booking_id} day={self.day_number}>'


class CheckpointCheckin(db.Model):
    """Model for checkpoint check-ins with photos"""
    __tablename__ = 'checkpoint_checkins'

    id = db.Column(db.Integer, primary_key=True)
    booking_day_id = db.Column(db.Integer, db.ForeignKey('booking_itinerary_days.id', ondelete='CASCADE'), 
                              nullable=False, index=True)
    checkpoint_id = db.Column(db.Integer, db.ForeignKey('itinerary_checkpoints.id', ondelete='CASCADE'), 
                             nullable=False, index=True)
    
    # Check-in information
    status = db.Column(db.Enum('pending', 'checked_in', 'skipped', 'cancelled'), 
                      default='pending', index=True)
    
    # Timing
    scheduled_time = db.Column(db.DateTime, nullable=True)
    actual_checkin_time = db.Column(db.DateTime, nullable=True, index=True)
    actual_checkout_time = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    
    # Location verification
    checkin_latitude = db.Column(db.Numeric(10, 8), nullable=True)
    checkin_longitude = db.Column(db.Numeric(11, 8), nullable=True)
    distance_from_checkpoint = db.Column(db.Numeric(10, 2), nullable=True)
    
    # Photos and media
    photos = db.Column(db.Text, nullable=True)  # JSON array
    photo_count = db.Column(db.Integer, default=0)
    
    # Notes and feedback
    guide_notes = db.Column(db.Text, nullable=True)
    participants_feedback = db.Column(db.Text, nullable=True)
    weather_condition = db.Column(db.String(100), nullable=True)
    
    # Issues and resolutions
    had_issues = db.Column(db.Boolean, default=False)
    issue_description = db.Column(db.Text, nullable=True)
    issue_resolution = db.Column(db.Text, nullable=True)
    
    # Person who checked in
    checked_in_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), 
                             nullable=True, index=True)
    
    # Visibility
    is_visible_to_participants = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    checkpoint = db.relationship('ItineraryCheckpoint', backref='checkins', lazy='joined')
    tour_guide = db.relationship('User', foreign_keys=[checked_in_by], backref='checkins_made', lazy='joined')

    def set_photos(self, photos_list):
        """Set checkpoint photos"""
        self.photos = json.dumps(photos_list)
        self.photo_count = len(photos_list)
    
    def get_photos(self):
        """Get checkpoint photos as list"""
        if self.photos:
            try:
                return json.loads(self.photos)
            except:
                return []
        return []
    
    def add_photo(self, photo_url):
        """Add a single photo to the list"""
        photos = self.get_photos()
        photos.append(photo_url)
        self.set_photos(photos)

    def to_dict(self, include_checkpoint=False, include_guide=False):
        data = {
            'id': self.id,
            'booking_day_id': self.booking_day_id,
            'checkpoint_id': self.checkpoint_id,
            'status': self.status,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'actual_checkin_time': self.actual_checkin_time.isoformat() if self.actual_checkin_time else None,
            'actual_checkout_time': self.actual_checkout_time.isoformat() if self.actual_checkout_time else None,
            'duration_minutes': self.duration_minutes,
            'checkin_latitude': float(self.checkin_latitude) if self.checkin_latitude else None,
            'checkin_longitude': float(self.checkin_longitude) if self.checkin_longitude else None,
            'distance_from_checkpoint': float(self.distance_from_checkpoint) if self.distance_from_checkpoint else None,
            'photos': self.get_photos(),
            'photo_count': self.photo_count,
            'guide_notes': self.guide_notes,
            'participants_feedback': self.participants_feedback,
            'weather_condition': self.weather_condition,
            'had_issues': self.had_issues,
            'issue_description': self.issue_description,
            'issue_resolution': self.issue_resolution,
            'checked_in_by': self.checked_in_by,
            'is_visible_to_participants': self.is_visible_to_participants,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_checkpoint and self.checkpoint:
            data['checkpoint'] = self.checkpoint.to_dict()
        
        if include_guide and self.tour_guide:
            data['tour_guide'] = {
                'id': self.tour_guide.id,
                'username': self.tour_guide.username,
                'full_name': self.tour_guide.full_name,
                'avatar_url': self.tour_guide.avatar_url
            }
            
        return data

    def __repr__(self):
        return f'<CheckpointCheckin {self.id} checkpoint={self.checkpoint_id} status={self.status}>'
