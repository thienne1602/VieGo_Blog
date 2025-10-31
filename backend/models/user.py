from datetime import datetime
import bcrypt
import json

# Import db from models package
from . import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile information
    full_name = db.Column(db.String(255))
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(255))
    cover_image_url = db.Column(db.String(255))
    
    # Role and permissions
    role = db.Column(db.Enum('user', 'moderator', 'admin', 'seller', 'editor'), default='user')
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    email_verified = db.Column(db.Boolean, default=False)
    
    # Gamification
    points = db.Column(db.Integer, default=0, nullable=False, server_default='0')
    level = db.Column(db.Integer, default=1, nullable=False, server_default='1')
    badges = db.Column(db.Text)  # JSON string of earned badges
    
    # Location and preferences
    location = db.Column(db.String(255))
    language = db.Column(db.String(10), default='vi')
    timezone = db.Column(db.String(50), default='Asia/Ho_Chi_Minh')
    
    # Social media links
    social_links = db.Column(db.Text)  # JSON string
    
    # Social features
    bookmarks = db.Column(db.Text)  # JSON array of bookmarked post IDs
    liked_posts = db.Column(db.Text)  # JSON array of liked post IDs
    following = db.Column(db.Text)  # JSON array of user IDs being followed
    followers = db.Column(db.Text)  # JSON array of follower user IDs
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using lazy='select' to avoid circular import issues
    posts = db.relationship('Post', backref='author', lazy='select', cascade='all, delete-orphan')
    # Explicitly bind comments relationship to Comment.author_id to avoid ambiguity
    comments = db.relationship(
        'Comment',
        backref='author',
        lazy='select',
        cascade='all, delete-orphan',
        foreign_keys='Comment.author_id'
    )
    nfts = db.relationship('NFT', backref='owner', lazy='select', cascade='all, delete-orphan')
    tours = db.relationship('Tour', backref='seller', lazy='select', cascade='all, delete-orphan')
    # preferences = db.relationship('UserPreferences', backref='user', uselist=False, cascade='all, delete-orphan')  # UserPreferences model chưa có
    
    # Chat relationships
    sent_messages = db.relationship('Chat', foreign_keys='Chat.sender_id', backref='sender', lazy='select')
    received_messages = db.relationship('Chat', foreign_keys='Chat.receiver_id', backref='receiver', lazy='select')
    
    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.set_password(password)
        # Initialize points and level explicitly to avoid None values
        self.points = 0
        self.level = 1
    
    def set_password(self, password):
        """Hash and set user password using bcrypt"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Check if provided password matches hash using bcrypt"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def add_points(self, points):
        """Add points and update level"""
        # Handle None values by initializing to 0
        if self.points is None:
            self.points = 0
        if self.level is None:
            self.level = 1
            
        self.points += points
        # Level up every 1000 points
        new_level = (self.points // 1000) + 1
        if new_level > self.level:
            self.level = new_level
            return True  # Level up occurred
        return False
    
    def add_badge(self, badge_name):
        """Add a new badge to user's collection"""
        badges = self.get_badges()
        if badge_name not in badges:
            badges.append(badge_name)
            self.badges = json.dumps(badges)
            return True
        return False
    
    def get_badges(self):
        """Get user's badges as list"""
        if self.badges:
            return json.loads(self.badges)
        return []
    
    def set_social_links(self, links_dict):
        """Set social media links"""
        self.social_links = json.dumps(links_dict)
    
    def get_social_links(self):
        """Get social media links as dict"""
        if self.social_links:
            return json.loads(self.social_links)
        return {}
    
    # ==================== 
    # Bookmarks Methods
    # ====================
    
    def get_bookmarks(self):
        """Get user's bookmarked post IDs"""
        if self.bookmarks:
            return json.loads(self.bookmarks)
        return []
    
    def set_bookmarks(self, bookmark_ids):
        """Set bookmarked post IDs"""
        self.bookmarks = json.dumps(bookmark_ids)
    
    def add_bookmark(self, post_id):
        """Add a post to bookmarks"""
        bookmarks = self.get_bookmarks()
        if post_id not in bookmarks:
            bookmarks.append(post_id)
            self.set_bookmarks(bookmarks)
            return True
        return False
    
    def remove_bookmark(self, post_id):
        """Remove a post from bookmarks"""
        bookmarks = self.get_bookmarks()
        if post_id in bookmarks:
            bookmarks.remove(post_id)
            self.set_bookmarks(bookmarks)
            return True
        return False
    
    # ==================== 
    # Likes Methods
    # ====================
    
    def get_liked_posts(self):
        """Get user's liked post IDs"""
        if self.liked_posts:
            return json.loads(self.liked_posts)
        return []
    
    def set_liked_posts(self, post_ids):
        """Set liked post IDs"""
        self.liked_posts = json.dumps(post_ids)
    
    def like_post(self, post_id):
        """Like a post"""
        liked = self.get_liked_posts()
        if post_id not in liked:
            liked.append(post_id)
            self.set_liked_posts(liked)
            return True
        return False
    
    def unlike_post(self, post_id):
        """Unlike a post"""
        liked = self.get_liked_posts()
        if post_id in liked:
            liked.remove(post_id)
            self.set_liked_posts(liked)
            return True
        return False
    
    # ==================== 
    # Follow/Following Methods
    # ====================
    
    def get_following(self):
        """Get list of user IDs this user is following"""
        if self.following:
            return json.loads(self.following)
        return []
    
    def set_following(self, user_ids):
        """Set following user IDs"""
        self.following = json.dumps(user_ids)
    
    def get_followers(self):
        """Get list of user IDs following this user"""
        if self.followers:
            return json.loads(self.followers)
        return []
    
    def set_followers(self, user_ids):
        """Set follower user IDs"""
        self.followers = json.dumps(user_ids)
    
    def follow(self, user_id):
        """Follow another user"""
        following = self.get_following()
        if user_id not in following:
            following.append(user_id)
            self.set_following(following)
            return True
        return False
    
    def unfollow(self, user_id):
        """Unfollow a user"""
        following = self.get_following()
        if user_id in following:
            following.remove(user_id)
            self.set_following(following)
            return True
        return False
    
    def get_stats(self):
        """Get user statistics"""
        return {
            'posts_count': 0,  # self.posts.count(),
            'comments_count': 0,  # self.comments.count(), 
            'nfts_count': 0,  # self.nfts.count(),
            'points': self.points,
            'level': self.level,
            'badges_count': len(self.get_badges())
        }
    
    def can_edit_post(self, post):
        """Check if user can edit a specific post"""
        return (self.id == post.author_id or 
                self.role in ['admin', 'moderator'])
    
    def can_moderate(self):
        """Check if user has moderation privileges"""
        return self.role in ['admin', 'moderator']
    
    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'admin'
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary"""
        data = {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'cover_image_url': self.cover_image_url,
            'role': self.role,
            'points': self.points,
            'level': self.level,
            'badges': self.get_badges(),
            'location': self.location,
            'language': self.language,
            'timezone': self.timezone,
            'social_links': self.get_social_links(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'stats': self.get_stats()
        }
        
        if include_sensitive:
            data.update({
                'email': self.email,
                'is_active': self.is_active,
                'is_verified': self.is_verified,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            })
        
        return data
    
    def to_dict_public(self):
        """Public version of to_dict (no sensitive info)"""
        return self.to_dict(include_sensitive=False)
    
    def __repr__(self):
        return f'<User {self.username}>'