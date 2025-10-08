from datetime import datetime
import json

# Import db from models package
from . import db

class Post(db.Model):
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False, index=True)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.Text)
    
    # Content metadata
    content_type = db.Column(db.Enum('blog', 'video', 'photo', 'tour_guide'), default='blog')
    language = db.Column(db.String(10), default='vi')
    reading_time = db.Column(db.Integer)  # estimated reading time in minutes
    
    # Media
    featured_image = db.Column(db.String(255))
    images = db.Column(db.Text)  # JSON array of image URLs
    video_url = db.Column(db.String(255))
    video_embed = db.Column(db.Text)  # YouTube embed code
    
    # Location data
    location_lat = db.Column(db.Float)
    location_lng = db.Column(db.Float)
    location_name = db.Column(db.String(255))
    location_address = db.Column(db.String(500))
    
    # Categorization
    category = db.Column(db.Enum('travel', 'food', 'culture', 'adventure', 'budget', 'luxury'), default='travel')
    tags = db.Column(db.Text)  # JSON array of tags
    difficulty_level = db.Column(db.Enum('easy', 'moderate', 'hard'), default='easy')
    
    # Engagement
    views_count = db.Column(db.Integer, default=0)
    likes_count = db.Column(db.Integer, default=0)
    shares_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    
    # Publishing
    status = db.Column(db.Enum('draft', 'published', 'archived', 'pending'), default='draft')
    published_at = db.Column(db.DateTime, index=True)
    featured = db.Column(db.Boolean, default=False)
    
    # SEO
    meta_title = db.Column(db.String(255))
    meta_description = db.Column(db.Text)
    meta_keywords = db.Column(db.Text)
    
    # Interactive storytelling
    is_interactive = db.Column(db.Boolean, default=False)
    story_choices = db.Column(db.Text)  # JSON for choose-your-adventure
    
    # Collaboration
    collaborative = db.Column(db.Boolean, default=False)
    collaborators = db.Column(db.Text)  # JSON array of user IDs
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Relationships
    # comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    
    def __init__(self, title, content, author_id):
        self.title = title
        self.content = content
        self.author_id = author_id
        self.slug = self.generate_slug(title)
    
    def generate_slug(self, title):
        """Generate URL-friendly slug from title"""
        import re
        slug = title.lower()
        # Remove Vietnamese accents and special characters
        slug = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', slug)
        slug = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', slug)
        slug = re.sub(r'[ìíịỉĩ]', 'i', slug)
        slug = re.sub(r'[òóọỏõôồốộổỗơờớợởỡ]', 'o', slug)
        slug = re.sub(r'[ùúụủũưừứựửữ]', 'u', slug)
        slug = re.sub(r'[ỳýỵỷỹ]', 'y', slug)
        slug = re.sub(r'[đ]', 'd', slug)
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')
        
        # Add timestamp to ensure uniqueness
        import time
        return f"{slug}-{int(time.time())}"
    
    def set_tags(self, tags_list):
        """Set post tags"""
        self.tags = json.dumps(tags_list)
    
    def get_tags(self):
        """Get post tags as list"""
        if self.tags:
            return json.loads(self.tags)
        return []
    
    def add_tag(self, tag):
        """Add a single tag"""
        tags = self.get_tags()
        if tag not in tags:
            tags.append(tag)
            self.set_tags(tags)
            return True
        return False
    
    def set_images(self, images_list):
        """Set post images"""
        self.images = json.dumps(images_list)
    
    def get_images(self):
        """Get post images as list"""
        if self.images:
            return json.loads(self.images)
        return []
    
    def set_story_choices(self, choices_dict):
        """Set interactive story choices"""
        self.story_choices = json.dumps(choices_dict)
        self.is_interactive = True
    
    def get_story_choices(self):
        """Get story choices as dict"""
        if self.story_choices:
            return json.loads(self.story_choices)
        return {}
    
    def set_collaborators(self, user_ids_list):
        """Set collaborators for the post"""
        self.collaborators = json.dumps(user_ids_list)
        self.collaborative = len(user_ids_list) > 0
    
    def get_collaborators(self):
        """Get collaborators as list"""
        if self.collaborators:
            return json.loads(self.collaborators)
        return []
    
    def add_collaborator(self, user_id):
        """Add a collaborator"""
        collaborators = self.get_collaborators()
        if user_id not in collaborators:
            collaborators.append(user_id)
            self.set_collaborators(collaborators)
            return True
        return False
    
    def increment_views(self):
        """Increment view count"""
        self.views_count += 1
    
    def increment_likes(self):
        """Increment likes count"""
        self.likes_count += 1
    
    def increment_shares(self):
        """Increment shares count"""
        self.shares_count += 1
    
    def publish(self):
        """Publish the post"""
        self.status = 'published'
        self.published_at = datetime.utcnow()
    
    def archive(self):
        """Archive the post"""
        self.status = 'archived'
    
    def calculate_reading_time(self):
        """Calculate estimated reading time based on content"""
        import re
        word_count = len(re.findall(r'\w+', self.content))
        # Average reading speed: 200 words per minute
        self.reading_time = max(1, round(word_count / 200))
    
    def get_engagement_score(self):
        """Calculate engagement score"""
        if self.views_count == 0:
            return 0
        
        engagement = (
            (self.likes_count * 3) +
            (self.comments_count * 5) +
            (self.shares_count * 10)
        ) / self.views_count
        
        return min(100, round(engagement * 100, 2))
    
    def is_featured_content(self):
        """Check if post should be featured"""
        return (self.featured or 
                self.get_engagement_score() > 50 or
                self.views_count > 1000)
    
    def to_dict(self, include_content=True):
        """Convert post to dictionary"""
        data = {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'excerpt': self.excerpt,
            'content_type': self.content_type,
            'language': self.language,
            'reading_time': self.reading_time,
            'featured_image': self.featured_image,
            'images': self.get_images(),
            'video_url': self.video_url,
            'location': {
                'lat': self.location_lat,
                'lng': self.location_lng,
                'name': self.location_name,
                'address': self.location_address
            } if self.location_lat and self.location_lng else None,
            'category': self.category,
            'tags': self.get_tags(),
            'difficulty_level': self.difficulty_level,
            'engagement': {
                'views': self.views_count,
                'likes': self.likes_count,
                'shares': self.shares_count,
                'comments': self.comments_count,
                'score': self.get_engagement_score()
            },
            'status': self.status,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'featured': self.featured,
            'is_interactive': self.is_interactive,
            'collaborative': self.collaborative,
            'collaborators': self.get_collaborators(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'author_id': self.author_id
        }
        
        if include_content:
            data['content'] = self.content
            if self.is_interactive:
                data['story_choices'] = self.get_story_choices()
        
        return data
    
    def __repr__(self):
        return f'<Post {self.title}>'