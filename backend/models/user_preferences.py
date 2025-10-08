from datetime import datetime
import json
from . import db

class UserPreferences(db.Model):
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Travel preferences
    travel_interests = db.Column(db.Text)  # JSON array
    budget_range = db.Column(db.Enum('budget', 'mid-range', 'luxury'), default='mid-range')
    travel_style = db.Column(db.Enum('backpacker', 'family', 'luxury', 'business', 'adventure'), default='backpacker')
    
    # Food preferences
    dietary_restrictions = db.Column(db.Text)  # JSON array
    cuisine_preferences = db.Column(db.Text)  # JSON array
    spice_tolerance = db.Column(db.Enum('none', 'mild', 'medium', 'hot'), default='medium')
    
    # Activity preferences
    preferred_activities = db.Column(db.Text)  # JSON array
    fitness_level = db.Column(db.Enum('low', 'moderate', 'high'), default='moderate')
    group_size_preference = db.Column(db.Enum('solo', 'couple', 'small_group', 'large_group'), default='small_group')
    
    # Location preferences
    preferred_regions = db.Column(db.Text)  # JSON array
    climate_preference = db.Column(db.Enum('tropical', 'temperate', 'cold', 'any'), default='tropical')
    
    # Notification settings
    email_notifications = db.Column(db.Boolean, default=True)
    push_notifications = db.Column(db.Boolean, default=True)
    newsletter_subscription = db.Column(db.Boolean, default=True)
    
    # AI personalization
    ai_recommendations = db.Column(db.Boolean, default=True)
    personalization_data = db.Column(db.Text)  # JSON for ML features
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_travel_interests(self, interests_list):
        """Set travel interests"""
        self.travel_interests = json.dumps(interests_list)
    
    def get_travel_interests(self):
        """Get travel interests as list"""
        if self.travel_interests:
            return json.loads(self.travel_interests)
        return []
    
    def set_cuisine_preferences(self, cuisines_list):
        """Set cuisine preferences"""
        self.cuisine_preferences = json.dumps(cuisines_list)
    
    def get_cuisine_preferences(self):
        """Get cuisine preferences as list"""
        if self.cuisine_preferences:
            return json.loads(self.cuisine_preferences)
        return []
    
    def to_dict(self):
        """Convert preferences to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'travel_interests': self.get_travel_interests(),
            'budget_range': self.budget_range,
            'travel_style': self.travel_style,
            'dietary_restrictions': json.loads(self.dietary_restrictions) if self.dietary_restrictions else [],
            'cuisine_preferences': self.get_cuisine_preferences(),
            'spice_tolerance': self.spice_tolerance,
            'preferred_activities': json.loads(self.preferred_activities) if self.preferred_activities else [],
            'fitness_level': self.fitness_level,
            'group_size_preference': self.group_size_preference,
            'preferred_regions': json.loads(self.preferred_regions) if self.preferred_regions else [],
            'climate_preference': self.climate_preference,
            'notifications': {
                'email': self.email_notifications,
                'push': self.push_notifications,
                'newsletter': self.newsletter_subscription
            },
            'ai_recommendations': self.ai_recommendations,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<UserPreferences for User {self.user_id}>'