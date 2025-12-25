"""
Tour Member Location Model
Stores realtime location data for tour participants and guides
"""

from datetime import datetime, timedelta
from . import db
import json


class TourMemberLocation(db.Model):
    """
    Model to track realtime locations of tour members (participants and guides)
    Locations are stored and updated continuously during active tours
    """
    __tablename__ = 'tour_member_locations'

    id = db.Column(db.Integer, primary_key=True)
    
    # Tour/Booking reference
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Member identification
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)  # For registered users
    participant_id = db.Column(db.Integer, db.ForeignKey('booking_participants.id', ondelete='CASCADE'), nullable=True, index=True)  # For non-registered participants
    
    # Member type
    member_type = db.Column(db.Enum('tour_guide', 'participant', 'leader'), default='participant')
    member_name = db.Column(db.String(255), nullable=False)  # Display name
    
    # Location data
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    accuracy = db.Column(db.Float, nullable=True)  # GPS accuracy in meters
    altitude = db.Column(db.Float, nullable=True)  # Altitude in meters
    heading = db.Column(db.Float, nullable=True)  # Direction of movement in degrees (0-360)
    speed = db.Column(db.Float, nullable=True)  # Speed in m/s
    
    # Location metadata
    location_source = db.Column(db.Enum('gps', 'network', 'manual'), default='gps')
    battery_level = db.Column(db.Integer, nullable=True)  # Battery percentage (0-100)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)  # Whether tracking is active
    is_sos = db.Column(db.Boolean, default=False)  # Emergency SOS flag
    sos_message = db.Column(db.Text, nullable=True)  # SOS message if any
    
    # Timestamps
    location_timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # When location was captured on device
    server_timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # When received by server
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = db.relationship('Booking', backref=db.backref('member_locations', lazy='dynamic', cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('tour_locations', lazy='dynamic'))
    participant = db.relationship('BookingParticipant', backref=db.backref('locations', lazy='dynamic'))

    # Indexes for efficient querying
    __table_args__ = (
        db.Index('idx_booking_active', 'booking_id', 'is_active'),
        db.Index('idx_user_booking', 'user_id', 'booking_id'),
        db.Index('idx_location_time', 'booking_id', 'location_timestamp'),
    )

    def to_dict(self, include_user=False):
        data = {
            'id': self.id,
            'booking_id': self.booking_id,
            'user_id': self.user_id,
            'participant_id': self.participant_id,
            'member_type': self.member_type,
            'member_name': self.member_name,
            'location': {
                'latitude': self.latitude,
                'longitude': self.longitude,
                'accuracy': self.accuracy,
                'altitude': self.altitude,
                'heading': self.heading,
                'speed': self.speed
            },
            'location_source': self.location_source,
            'battery_level': self.battery_level,
            'is_active': self.is_active,
            'is_sos': self.is_sos,
            'sos_message': self.sos_message,
            'location_timestamp': self.location_timestamp.isoformat() if self.location_timestamp else None,
            'server_timestamp': self.server_timestamp.isoformat() if self.server_timestamp else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_user and self.user:
            data['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'full_name': self.user.full_name,
                'avatar_url': self.user.avatar_url
            }
        
        return data

    def update_location(self, latitude, longitude, **kwargs):
        """Update location with new coordinates"""
        self.latitude = latitude
        self.longitude = longitude
        self.location_timestamp = kwargs.get('location_timestamp', datetime.utcnow())
        self.server_timestamp = datetime.utcnow()
        
        # Optional fields
        if 'accuracy' in kwargs:
            self.accuracy = kwargs['accuracy']
        if 'altitude' in kwargs:
            self.altitude = kwargs['altitude']
        if 'heading' in kwargs:
            self.heading = kwargs['heading']
        if 'speed' in kwargs:
            self.speed = kwargs['speed']
        if 'battery_level' in kwargs:
            self.battery_level = kwargs['battery_level']
        if 'location_source' in kwargs:
            self.location_source = kwargs['location_source']

    def trigger_sos(self, message=None):
        """Trigger SOS alert"""
        self.is_sos = True
        self.sos_message = message
        self.server_timestamp = datetime.utcnow()

    def clear_sos(self):
        """Clear SOS alert"""
        self.is_sos = False
        self.sos_message = None

    def is_stale(self, minutes=10):
        """Check if location data is stale (not updated recently)"""
        if not self.location_timestamp:
            return True
        threshold = datetime.utcnow() - timedelta(minutes=minutes)
        return self.location_timestamp < threshold

    def __repr__(self):
        return f'<TourMemberLocation {self.id} {self.member_name} booking={self.booking_id}>'


class TourLocationHistory(db.Model):
    """
    Stores historical location data for route tracking and analysis
    """
    __tablename__ = 'tour_location_history'

    id = db.Column(db.Integer, primary_key=True)
    
    # Reference to current location record
    member_location_id = db.Column(db.Integer, db.ForeignKey('tour_member_locations.id', ondelete='CASCADE'), nullable=False, index=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Member identification (denormalized for faster queries)
    user_id = db.Column(db.Integer, nullable=True)
    participant_id = db.Column(db.Integer, nullable=True)
    member_type = db.Column(db.String(20), nullable=False)
    
    # Location data
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    accuracy = db.Column(db.Float, nullable=True)
    altitude = db.Column(db.Float, nullable=True)
    heading = db.Column(db.Float, nullable=True)
    speed = db.Column(db.Float, nullable=True)
    
    # Timestamp
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    member_location = db.relationship('TourMemberLocation', backref=db.backref('history', lazy='dynamic', cascade='all, delete-orphan'))

    # Indexes
    __table_args__ = (
        db.Index('idx_history_booking_time', 'booking_id', 'recorded_at'),
        db.Index('idx_history_member_time', 'member_location_id', 'recorded_at'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'member_location_id': self.member_location_id,
            'booking_id': self.booking_id,
            'user_id': self.user_id,
            'participant_id': self.participant_id,
            'member_type': self.member_type,
            'location': {
                'latitude': self.latitude,
                'longitude': self.longitude,
                'accuracy': self.accuracy,
                'altitude': self.altitude,
                'heading': self.heading,
                'speed': self.speed
            },
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None
        }

    def __repr__(self):
        return f'<TourLocationHistory {self.id} member={self.member_location_id}>'


class TourGeofence(db.Model):
    """
    Defines geofence areas for tours - alerts when members leave designated areas
    """
    __tablename__ = 'tour_geofences'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Geofence details
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Center point
    center_latitude = db.Column(db.Float, nullable=False)
    center_longitude = db.Column(db.Float, nullable=False)
    
    # Radius in meters
    radius = db.Column(db.Float, nullable=False, default=500)  # Default 500m
    
    # Type of geofence
    fence_type = db.Column(db.Enum('checkpoint', 'safety_zone', 'restricted', 'meeting_point'), default='safety_zone')
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    alert_on_exit = db.Column(db.Boolean, default=True)  # Alert when member leaves
    alert_on_enter = db.Column(db.Boolean, default=False)  # Alert when member enters
    
    # Timestamps
    start_time = db.Column(db.DateTime, nullable=True)  # When geofence becomes active
    end_time = db.Column(db.DateTime, nullable=True)  # When geofence expires
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Relationships
    booking = db.relationship('Booking', backref=db.backref('geofences', lazy='dynamic', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'name': self.name,
            'description': self.description,
            'center': {
                'latitude': self.center_latitude,
                'longitude': self.center_longitude
            },
            'radius': self.radius,
            'fence_type': self.fence_type,
            'is_active': self.is_active,
            'alert_on_exit': self.alert_on_exit,
            'alert_on_enter': self.alert_on_enter,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def is_point_inside(self, latitude, longitude):
        """Check if a point is inside this geofence using Haversine formula"""
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371000  # Earth radius in meters
        
        lat1, lon1 = radians(self.center_latitude), radians(self.center_longitude)
        lat2, lon2 = radians(latitude), radians(longitude)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        distance = R * c
        
        return distance <= self.radius

    def __repr__(self):
        return f'<TourGeofence {self.id} {self.name} booking={self.booking_id}>'
