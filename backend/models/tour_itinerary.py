from datetime import datetime
from . import db
import json


class TourItineraryTemplate(db.Model):
    """Model for tour itinerary templates"""
    __tablename__ = 'tour_itinerary_templates'

    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id', ondelete='CASCADE'), nullable=False, index=True)
    template_name = db.Column(db.String(255), nullable=False)
    
    # Template details
    total_days = db.Column(db.Integer, nullable=False)
    total_nights = db.Column(db.Integer, default=0)
    description = db.Column(db.Text, nullable=True)
    
    # Status
    is_active = db.Column(db.Boolean, default=True, index=True)
    version = db.Column(db.Integer, default=1)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Relationships
    tour = db.relationship('Tour', backref=db.backref('itinerary_templates', lazy='select'))
    days = db.relationship('TourItineraryDay', backref='template', lazy='select', 
                          order_by='TourItineraryDay.day_number', cascade='all, delete-orphan')
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_templates', lazy='joined')

    def to_dict(self, include_days=False):
        data = {
            'id': self.id,
            'tour_id': self.tour_id,
            'template_name': self.template_name,
            'total_days': self.total_days,
            'total_nights': self.total_nights,
            'description': self.description,
            'is_active': self.is_active,
            'version': self.version,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_days:
            data['days'] = [day.to_dict(include_checkpoints=True) for day in self.days]
            
        return data

    def __repr__(self):
        return f'<TourItineraryTemplate {self.id} tour={self.tour_id} name={self.template_name}>'


class TourItineraryDay(db.Model):
    """Model for daily itinerary details in template"""
    __tablename__ = 'tour_itinerary_days'

    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('tour_itinerary_templates.id', ondelete='CASCADE'), 
                           nullable=False, index=True)
    
    # Day information
    day_number = db.Column(db.Integer, nullable=False, index=True)
    day_title = db.Column(db.String(255), nullable=False)
    day_description = db.Column(db.Text, nullable=True)
    
    # Meals included
    breakfast = db.Column(db.Boolean, default=False)
    lunch = db.Column(db.Boolean, default=False)
    dinner = db.Column(db.Boolean, default=False)
    
    # Accommodation
    accommodation = db.Column(db.String(255), nullable=True)
    accommodation_type = db.Column(db.Enum('hotel', 'homestay', 'resort', 'camping', 'none'), default='hotel')
    
    # Transportation
    transportation = db.Column(db.String(255), nullable=True)
    
    # Timing
    estimated_duration_hours = db.Column(db.Numeric(5, 2), default=0.00)
    
    # Additional info
    notes = db.Column(db.Text, nullable=True)
    special_requirements = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    checkpoints = db.relationship('ItineraryCheckpoint', backref='itinerary_day', lazy='select',
                                 order_by='ItineraryCheckpoint.checkpoint_order', cascade='all, delete-orphan')

    def to_dict(self, include_checkpoints=False):
        data = {
            'id': self.id,
            'template_id': self.template_id,
            'day_number': self.day_number,
            'day_title': self.day_title,
            'day_description': self.day_description,
            'breakfast': self.breakfast,
            'lunch': self.lunch,
            'dinner': self.dinner,
            'accommodation': self.accommodation,
            'accommodation_type': self.accommodation_type,
            'transportation': self.transportation,
            'estimated_duration_hours': float(self.estimated_duration_hours) if self.estimated_duration_hours else 0.0,
            'notes': self.notes,
            'special_requirements': self.special_requirements,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_checkpoints:
            data['checkpoints'] = [cp.to_dict() for cp in self.checkpoints]
            
        return data

    def __repr__(self):
        return f'<TourItineraryDay {self.id} template={self.template_id} day={self.day_number}>'


class ItineraryCheckpoint(db.Model):
    """Model for checkpoints within each day"""
    __tablename__ = 'itinerary_checkpoints'

    id = db.Column(db.Integer, primary_key=True)
    itinerary_day_id = db.Column(db.Integer, db.ForeignKey('tour_itinerary_days.id', ondelete='CASCADE'), 
                                 nullable=False, index=True)
    
    # Checkpoint information
    checkpoint_order = db.Column(db.Integer, nullable=False, index=True)
    checkpoint_name = db.Column(db.String(255), nullable=False)
    checkpoint_type = db.Column(db.Enum('attraction', 'restaurant', 'hotel', 'activity', 'transport', 
                                       'rest', 'photo_spot', 'shopping', 'other'), 
                               default='attraction', index=True)
    
    # Description
    description = db.Column(db.Text, nullable=True)
    
    # Location
    location_name = db.Column(db.String(255), nullable=True)
    location_address = db.Column(db.String(500), nullable=True)
    latitude = db.Column(db.Numeric(10, 8), nullable=True)
    longitude = db.Column(db.Numeric(11, 8), nullable=True)
    
    # Timing
    scheduled_time = db.Column(db.Time, nullable=True)
    estimated_duration_minutes = db.Column(db.Integer, default=30)
    
    # Media and content
    images = db.Column(db.Text, nullable=True)  # JSON array
    tips = db.Column(db.Text, nullable=True)
    warnings = db.Column(db.Text, nullable=True)
    
    # Requirements
    is_mandatory = db.Column(db.Boolean, default=True)
    requires_photo = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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

    def to_dict(self):
        return {
            'id': self.id,
            'itinerary_day_id': self.itinerary_day_id,
            'checkpoint_order': self.checkpoint_order,
            'checkpoint_name': self.checkpoint_name,
            'checkpoint_type': self.checkpoint_type,
            'description': self.description,
            'location_name': self.location_name,
            'location_address': self.location_address,
            'latitude': float(self.latitude) if self.latitude else None,
            'longitude': float(self.longitude) if self.longitude else None,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'estimated_duration_minutes': self.estimated_duration_minutes,
            'images': self.get_images(),
            'tips': self.tips,
            'warnings': self.warnings,
            'is_mandatory': self.is_mandatory,
            'requires_photo': self.requires_photo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<ItineraryCheckpoint {self.id} day={self.itinerary_day_id} order={self.checkpoint_order}>'
