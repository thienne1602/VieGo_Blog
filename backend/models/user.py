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
    role = db.Column(db.Enum('user', 'moderator', 'admin', 'seller', 'editor', 'tour_guide'), default='user')
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    email_verified = db.Column(db.Boolean, default=False)
    
    # Ban/restriction fields
    account_banned_until = db.Column(db.DateTime, nullable=True)  # Account ban expiry
    post_banned_until = db.Column(db.DateTime, nullable=True)  # Post ban expiry
    comment_banned_until = db.Column(db.DateTime, nullable=True)  # Comment ban expiry
    violation_count = db.Column(db.Integer, default=0, nullable=False, server_default='0')  # Number of violations
    
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
    
    # Seller email configuration (for sending booking confirmation emails)
    seller_email = db.Column(db.String(255))  # Email address for sending emails
    seller_email_password = db.Column(db.String(255))  # Encrypted password for seller email
    
    # Company information (for sellers - displayed in bookings)
    company_name = db.Column(db.String(255))  # Tên công ty
    company_address = db.Column(db.Text)  # Địa chỉ công ty
    company_phone = db.Column(db.String(50))  # Số điện thoại công ty
    company_tax_id = db.Column(db.String(50))  # Mã số thuế
    company_email = db.Column(db.String(255))  # Email công ty (để hiển thị trong booking)
    bank_account_number = db.Column(db.String(100))  # Số tài khoản ngân hàng
    bank_name = db.Column(db.String(255))  # Tên ngân hàng
    bank_account_holder = db.Column(db.String(255))  # Chủ tài khoản
    
    # Social features
    bookmarks = db.Column(db.Text)  # JSON array of bookmarked post IDs
    liked_posts = db.Column(db.Text)  # JSON array of liked post IDs
    following = db.Column(db.Text)  # JSON array of user IDs being followed
    followers = db.Column(db.Text)  # JSON array of follower user IDs
    friends = db.Column(db.Text)  # JSON array of friend user IDs
    
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
    
    def set_seller_email_password(self, password):
        """Set seller email password (stored as plaintext for SMTP authentication)
        
        Note: In production, consider encrypting this with a reversible encryption method
        since SMTP requires the original password for authentication.
        """
        if password:
            # Store plaintext password (required for SMTP authentication)
            # In production, use encryption like AES instead of plaintext
            self.seller_email_password = password
    
    def get_seller_email_password(self):
        """Get seller email password for SMTP authentication"""
        return self.seller_email_password
    
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
    
    # ==================== 
    # Friends Methods
    # ====================
    
    def get_friends(self):
        """Get list of friend user IDs"""
        if self.friends:
            return json.loads(self.friends)
        return []
    
    def set_friends(self, user_ids):
        """Set friend user IDs"""
        self.friends = json.dumps(user_ids)
    
    def add_friend(self, user_id):
        """Add a friend"""
        friends = self.get_friends()
        if user_id not in friends:
            friends.append(user_id)
            self.set_friends(friends)
            return True
        return False
    
    def remove_friend(self, user_id):
        """Remove a friend"""
        friends = self.get_friends()
        if user_id in friends:
            friends.remove(user_id)
            self.set_friends(friends)
            return True
        return False
    
    def is_friend_with(self, user_id, auto_fix_inconsistency=True):
        """Check if user is friend with another user (bidirectional check)
        
        Args:
            user_id: ID of the other user to check
            auto_fix_inconsistency: If True, automatically fix data inconsistency if found
        """
        # Check if this user has the other user in friends list
        friends = self.get_friends()
        has_friend = user_id in friends
        
        # Also check if the other user has this user in their friends list
        # This ensures bidirectional consistency
        try:
            other_user = User.query.get(user_id)
            if other_user:
                other_friends = other_user.get_friends()
                has_other = self.id in other_friends
                
                # If both sides have each other - confirmed friends
                if has_friend and has_other:
                    return True
                # If neither side has each other - not friends
                elif not has_friend and not has_other:
                    return False
                # Data inconsistency detected - one side has it but not the other
                else:
                    if auto_fix_inconsistency:
                        # Fix the inconsistency
                        if has_friend and not has_other:
                            # This user has other, but other doesn't have this user
                            other_user.add_friend(self.id)
                            db.session.commit()
                            print(f'[Friendship Fix] Fixed inconsistency: Added user {self.id} to user {user_id} friends list')
                        elif not has_friend and has_other:
                            # Other user has this user, but this user doesn't have other
                            self.add_friend(user_id)
                            db.session.commit()
                            print(f'[Friendship Fix] Fixed inconsistency: Added user {user_id} to user {self.id} friends list')
                        return True
                    else:
                        # Don't auto-fix, just return True if one side has it
                        # This allows caller to handle the inconsistency
                        return True
            else:
                # If other user doesn't exist, just check this side
                return has_friend
        except Exception as e:
            # If error occurs, fall back to one-way check
            print(f'[Friendship Check] Error in bidirectional check: {str(e)}')
            return has_friend
    
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
    
    def is_account_banned(self):
        """Check if account is currently banned"""
        if not self.account_banned_until:
            return False
        return datetime.utcnow() < self.account_banned_until
    
    def is_post_banned(self):
        """Check if user is banned from posting"""
        if not self.post_banned_until:
            return False
        return datetime.utcnow() < self.post_banned_until
    
    def is_comment_banned(self):
        """Check if user is banned from commenting"""
        if not self.comment_banned_until:
            return False
        return datetime.utcnow() < self.comment_banned_until
    
    def can_post(self):
        """Check if user can create posts"""
        return not self.is_post_banned() and self.is_active and not self.is_account_banned()
    
    def can_comment(self):
        """Check if user can create comments"""
        return not self.is_comment_banned() and self.is_active and not self.is_account_banned()
    
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
                'updated_at': self.updated_at.isoformat() if self.updated_at else None,
                'seller_email': self.seller_email,  # Only include email, not password
                'account_banned_until': self.account_banned_until.isoformat() if self.account_banned_until else None,
                'post_banned_until': self.post_banned_until.isoformat() if self.post_banned_until else None,
                'comment_banned_until': self.comment_banned_until.isoformat() if self.comment_banned_until else None,
                'is_account_banned': self.is_account_banned(),
                'is_post_banned': self.is_post_banned(),
                'is_comment_banned': self.is_comment_banned(),
                'can_post': self.can_post(),
                'can_comment': self.can_comment(),
                'violation_count': self.violation_count or 0
            })
        
        # Include company information for sellers (sensitive but needed for bookings)
        if self.role == 'seller' or include_sensitive:
            data.update({
                'company_name': self.company_name,
                'company_address': self.company_address,
                'company_phone': self.company_phone,
                'company_tax_id': self.company_tax_id,
                'company_email': self.company_email,
                'bank_account_number': self.bank_account_number,
                'bank_name': self.bank_name,
                'bank_account_holder': self.bank_account_holder
            })
        
        return data
    
    def to_dict_public(self):
        """Public version of to_dict (no sensitive info)"""
        return self.to_dict(include_sensitive=False)
    
    def __repr__(self):
        return f'<User {self.username}>'