from datetime import datetime
import json
from . import db

class Tour(db.Model):
    __tablename__ = 'tours'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    
    # Tour details
    duration_days = db.Column(db.Integer, nullable=False)
    max_participants = db.Column(db.Integer, default=10)
    min_participants = db.Column(db.Integer, default=2)
    difficulty_level = db.Column(db.Enum('easy', 'moderate', 'hard'), default='easy')
    
    # Location and itinerary
    starting_location = db.Column(db.String(255), nullable=False)
    ending_location = db.Column(db.String(255))
    itinerary = db.Column(db.Text)  # JSON detailed itinerary
    locations_covered = db.Column(db.Text)  # JSON array of location IDs
    
    # Pricing
    price_per_person = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='VND')
    discount_percentage = db.Column(db.Float, default=0.0)
    
    # Inclusions and exclusions
    inclusions = db.Column(db.Text)  # JSON array
    exclusions = db.Column(db.Text)  # JSON array
    
    # Media
    featured_image = db.Column(db.String(255))
    gallery_images = db.Column(db.Text)  # JSON array
    video_url = db.Column(db.String(255))
    
    # Availability and booking
    available_dates = db.Column(db.Text)  # JSON array of available dates
    booking_deadline_days = db.Column(db.Integer, default=3)
    cancellation_policy = db.Column(db.Text)
    
    # Categories and tags
    category = db.Column(db.Enum('adventure', 'cultural', 'food', 'nature', 'urban', 'spiritual'), nullable=False)
    tags = db.Column(db.Text)  # JSON array
    
    # Reviews and ratings
    rating = db.Column(db.Float, default=0.0)
    reviews_count = db.Column(db.Integer, default=0)
    
    # Stats
    views_count = db.Column(db.Integer, default=0)
    bookings_count = db.Column(db.Integer, default=0)
    
    # Publishing status
    status = db.Column(db.Enum('draft', 'published', 'archived'), default='draft')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    def __init__(self, title, description, seller_id):
        self.title = title
        self.description = description
        self.seller_id = seller_id
    
    def set_itinerary(self, itinerary_dict):
        """Set tour itinerary"""
        self.itinerary = json.dumps(itinerary_dict)
    
    def get_itinerary(self):
        """Get tour itinerary as dict"""
        if self.itinerary:
            return json.loads(self.itinerary)
        return {}
    
    def set_inclusions(self, inclusions_list):
        """Set tour inclusions"""
        self.inclusions = json.dumps(inclusions_list)
    
    def get_inclusions(self):
        """Get tour inclusions as list"""
        if self.inclusions:
            return json.loads(self.inclusions)
        return []
    
    def set_exclusions(self, exclusions_list):
        """Set tour exclusions"""
        self.exclusions = json.dumps(exclusions_list)
    
    def get_exclusions(self):
        """Get tour exclusions as list"""
        if self.exclusions:
            return json.loads(self.exclusions)
        return []
    
    def set_available_dates(self, dates_list):
        """Set available dates"""
        self.available_dates = json.dumps(dates_list)
    
    def get_available_dates(self):
        """Get available dates as list"""
        if self.available_dates:
            return json.loads(self.available_dates)
        return []
    
    def set_tags(self, tags_list):
        """Set tour tags"""
        self.tags = json.dumps(tags_list)
    
    def get_tags(self):
        """Get tour tags as list"""
        if self.tags:
            return json.loads(self.tags)
        return []
    
    def set_gallery_images(self, images_list):
        """Set gallery images"""
        self.gallery_images = json.dumps(images_list)
    
    def get_gallery_images(self):
        """Get gallery images as list"""
        if self.gallery_images:
            return json.loads(self.gallery_images)
        return []
    
    def set_locations_covered(self, locations_list):
        """Set locations covered"""
        self.locations_covered = json.dumps(locations_list)
    
    def get_locations_covered(self):
        """Get locations covered as list"""
        if self.locations_covered:
            return json.loads(self.locations_covered)
        return []
    
    def increment_views(self):
        """Increment view count"""
        self.views_count = (self.views_count or 0) + 1
    
    def increment_bookings(self):
        """Increment bookings count"""
        self.bookings_count = (self.bookings_count or 0) + 1
    
    def calculate_final_price(self, participants=1):
        """Calculate final price with discount"""
        price = self.price_per_person * participants
        if self.discount_percentage > 0:
            price = price * (1 - self.discount_percentage / 100)
        return price
    
    def to_dict(self, include_sensitive=False):
        """Convert tour to dictionary"""
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'duration_days': self.duration_days,
            'starting_location': self.starting_location,
            'ending_location': self.ending_location,
            'category': self.category,
            'difficulty_level': self.difficulty_level,
            'price_per_person': self.price_per_person,
            'currency': self.currency,
            'discount_percentage': self.discount_percentage,
            'max_participants': self.max_participants,
            'min_participants': self.min_participants,
            'rating': self.rating,
            'reviews_count': self.reviews_count,
            'views_count': self.views_count,
            'featured_image': self.featured_image,
            'video_url': self.video_url,
            'status': self.status,
            'tags': self.get_tags(),
            'gallery_images': self.get_gallery_images(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_sensitive:
            data.update({
                'itinerary': self.get_itinerary(),
                'inclusions': self.get_inclusions(),
                'exclusions': self.get_exclusions(),
                'available_dates': self.get_available_dates(),
                'locations_covered': self.get_locations_covered(),
                'booking_deadline_days': self.booking_deadline_days,
                'cancellation_policy': self.cancellation_policy,
                'bookings_count': self.bookings_count,
                'seller_id': self.seller_id
            })
        
        return data
    
    def __repr__(self):
        return f'<Tour {self.title}>'
    # Status and visibility
    status = db.Column(db.Enum('active', 'inactive', 'draft', 'suspended'), default='draft')
    featured = db.Column(db.Boolean, default=False)
    
    # Affiliate and commission
    affiliate_link = db.Column(db.String(500))
    commission_rate = db.Column(db.Float, default=0.1)  # 10% default commission
    
    # Requirements
    age_requirement = db.Column(db.String(50))  # e.g., "18+", "All ages"
    fitness_requirement = db.Column(db.Enum('low', 'moderate', 'high'), default='low')
    equipment_provided = db.Column(db.Text)  # JSON array
    equipment_required = db.Column(db.Text)  # JSON array
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    def get_itinerary(self):
        """Get itinerary as dict"""
        if self.itinerary:
            return json.loads(self.itinerary)
        return {}
    
    def set_itinerary(self, itinerary_dict):
        """Set tour itinerary"""
        self.itinerary = json.dumps(itinerary_dict)
    
    def get_inclusions(self):
        """Get inclusions as list"""
        if self.inclusions:
            return json.loads(self.inclusions)
        return []
    
    def get_exclusions(self):
        """Get exclusions as list"""
        if self.exclusions:
            return json.loads(self.exclusions)
        return []
    
    def get_available_dates(self):
        """Get available dates as list"""
        if self.available_dates:
            return json.loads(self.available_dates)
        return []
    
    def get_discounted_price(self):
        """Calculate discounted price"""
        if self.discount_percentage > 0:
            discount_amount = self.price_per_person * (self.discount_percentage / 100)
            return self.price_per_person - discount_amount
        return self.price_per_person
    
    def is_available_on_date(self, date_str):
        """Check if tour is available on specific date"""
        available_dates = self.get_available_dates()
        return date_str in available_dates
    
    def calculate_total_price(self, participants):
        """Calculate total price for given number of participants"""
        return self.get_discounted_price() * participants
    
    def to_dict(self, include_detailed=False):
        """Convert tour to dictionary"""
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'duration_days': self.duration_days,
            'max_participants': self.max_participants,
            'min_participants': self.min_participants,
            'difficulty_level': self.difficulty_level,
            'starting_location': self.starting_location,
            'ending_location': self.ending_location,
            'price_per_person': self.price_per_person,
            'discounted_price': self.get_discounted_price(),
            'currency': self.currency,
            'discount_percentage': self.discount_percentage,
            'featured_image': self.featured_image,
            'category': self.category,
            'tags': json.loads(self.tags) if self.tags else [],
            'rating': self.rating,
            'reviews_count': self.reviews_count,
            'status': self.status,
            'featured': self.featured,
            'age_requirement': self.age_requirement,
            'fitness_requirement': self.fitness_requirement,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'seller_id': self.seller_id
        }
        
        if include_detailed:
            data.update({
                'itinerary': self.get_itinerary(),
                'locations_covered': json.loads(self.locations_covered) if self.locations_covered else [],
                'inclusions': self.get_inclusions(),
                'exclusions': self.get_exclusions(),
                'gallery_images': json.loads(self.gallery_images) if self.gallery_images else [],
                'video_url': self.video_url,
                'available_dates': self.get_available_dates(),
                'booking_deadline_days': self.booking_deadline_days,
                'cancellation_policy': self.cancellation_policy,
                'equipment_provided': json.loads(self.equipment_provided) if self.equipment_provided else [],
                'equipment_required': json.loads(self.equipment_required) if self.equipment_required else [],
                'affiliate_link': self.affiliate_link
            })
        
        return data
    
    def __repr__(self):
        return f'<Tour {self.title}>'