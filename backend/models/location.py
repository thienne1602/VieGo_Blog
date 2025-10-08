from datetime import datetime

# Import db from models package
from . import db

class Location(db.Model):
    __tablename__ = 'locations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text)
    
    # Geographic data
    latitude = db.Column(db.Float, nullable=False, index=True)
    longitude = db.Column(db.Float, nullable=False, index=True)
    address = db.Column(db.String(500))
    city = db.Column(db.String(100))
    province = db.Column(db.String(100))
    country = db.Column(db.String(100), default='Vietnam')
    
    # Classification
    category = db.Column(db.Enum('restaurant', 'attraction', 'hotel', 'transport', 'shopping', 'entertainment'), nullable=False)
    subcategory = db.Column(db.String(100))
    
    # Ratings and reviews
    rating = db.Column(db.Float, default=0.0)
    reviews_count = db.Column(db.Integer, default=0)
    
    # Practical information
    phone = db.Column(db.String(20))
    website = db.Column(db.String(255))
    email = db.Column(db.String(120))
    opening_hours = db.Column(db.Text)  # JSON format
    price_range = db.Column(db.Enum('budget', 'mid-range', 'luxury'), default='budget')
    
    # Media
    images = db.Column(db.Text)  # JSON array of image URLs
    featured_image = db.Column(db.String(255))
    
    # Metadata
    tags = db.Column(db.Text)  # JSON array
    amenities = db.Column(db.Text)  # JSON array
    languages_spoken = db.Column(db.Text)  # JSON array
    
    # Administrative
    verified = db.Column(db.Boolean, default=False)
    status = db.Column(db.Enum('active', 'inactive', 'pending'), default='active')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Stats - not in schema yet, can be added later
    # views_count = db.Column(db.Integer, default=0)
    
    def __init__(self, name, latitude, longitude, category):
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.category = category
    
    def set_tags(self, tags_list):
        """Set location tags"""
        import json
        self.tags = json.dumps(tags_list)
    
    def get_tags(self):
        """Get location tags as list"""
        import json
        if self.tags:
            return json.loads(self.tags)
        return []
    
    def set_amenities(self, amenities_list):
        """Set location amenities"""
        import json
        self.amenities = json.dumps(amenities_list)
    
    def get_amenities(self):
        """Get location amenities as list"""
        import json
        if self.amenities:
            return json.loads(self.amenities)
        return []
    
    def set_gallery_images(self, images_list):
        """Set gallery images"""
        import json
        self.images = json.dumps(images_list)
    
    def get_gallery_images(self):
        """Get gallery images as list"""
        import json
        if self.images:
            return json.loads(self.images)
        return []
    
    def set_social_links(self, links_dict):
        """Set social media links"""
        import json
        self.languages_spoken = json.dumps(links_dict)  # Reusing field
    
    def increment_views(self):
        """Increment view count - disabled until views_count added to schema"""
        pass  # self.views_count = (self.views_count or 0) + 1
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'coordinates': {
                'lat': self.latitude,
                'lng': self.longitude
            },
            'address': self.address,
            'city': self.city,
            'province': self.province,
            'country': self.country,
            'category': self.category,
            'subcategory': self.subcategory,
            'rating': self.rating,
            'reviews_count': self.reviews_count,
            'contact': {
                'phone': self.phone,
                'website': self.website,
                'email': self.email
            },
            'price_range': self.price_range,
            'featured_image': self.featured_image,
            'verified': self.verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Location {self.name}>'