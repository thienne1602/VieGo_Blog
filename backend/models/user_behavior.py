"""
User Behavior Tracking Model
Theo dõi hành vi người dùng để phân tích AI
"""
from datetime import datetime
import json
from . import db


class UserBehavior(db.Model):
    """Ghi nhận các hành vi của người dùng để phân tích"""
    __tablename__ = 'user_behaviors'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Loại hành vi
    action_type = db.Column(db.Enum(
        'view_tour',           # Xem tour
        'search_tour',         # Tìm kiếm tour
        'book_tour',           # Đặt tour
        'wishlist_tour',       # Thêm vào danh sách yêu thích
        'share_tour',          # Chia sẻ tour
        'review_tour',         # Đánh giá tour
        'view_category',       # Xem danh mục
        'view_location',       # Xem địa điểm
        'click_promotion',     # Click vào khuyến mãi
        'open_email',          # Mở email
        'click_email_link',    # Click link trong email
        'complete_booking',    # Hoàn thành booking
        'cancel_booking'       # Hủy booking
    ), nullable=False, index=True)
    
    # ID đối tượng liên quan (tour_id, location_id, etc.)
    target_id = db.Column(db.Integer, index=True)
    target_type = db.Column(db.String(50))  # 'tour', 'location', 'category', 'promotion'
    
    # Dữ liệu bổ sung
    extra_data = db.Column('metadata', db.Text)  # JSON: search_query, filters, duration, etc.
    
    # Thông tin phiên
    session_id = db.Column(db.String(100), index=True)
    device_type = db.Column(db.Enum('desktop', 'mobile', 'tablet'), default='desktop')
    browser = db.Column(db.String(50))
    ip_address = db.Column(db.String(50))
    referrer = db.Column(db.String(500))
    
    # Thời gian tương tác
    duration_seconds = db.Column(db.Integer, default=0)  # Thời gian xem
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('behaviors', lazy='dynamic'))
    
    def set_metadata(self, data):
        """Set metadata as JSON"""
        self.extra_data = json.dumps(data, ensure_ascii=False)
    
    def get_metadata(self):
        """Get metadata as dict"""
        if self.extra_data:
            return json.loads(self.extra_data)
        return {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action_type': self.action_type,
            'target_id': self.target_id,
            'target_type': self.target_type,
            'metadata': self.get_metadata(),
            'session_id': self.session_id,
            'device_type': self.device_type,
            'duration_seconds': self.duration_seconds,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UserInterestProfile(db.Model):
    """Hồ sơ sở thích người dùng được tính toán từ hành vi"""
    __tablename__ = 'user_interest_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True, index=True)
    
    # Điểm sở thích theo danh mục (0-100)
    adventure_score = db.Column(db.Float, default=0.0)
    cultural_score = db.Column(db.Float, default=0.0)
    food_score = db.Column(db.Float, default=0.0)
    nature_score = db.Column(db.Float, default=0.0)
    urban_score = db.Column(db.Float, default=0.0)
    spiritual_score = db.Column(db.Float, default=0.0)
    
    # Sở thích về giá
    preferred_price_min = db.Column(db.Float, default=0.0)
    preferred_price_max = db.Column(db.Float, default=10000000.0)
    price_sensitivity = db.Column(db.Float, default=0.5)  # 0-1: cao = nhạy cảm giá
    
    # Sở thích về thời gian
    preferred_duration_min = db.Column(db.Integer, default=1)
    preferred_duration_max = db.Column(db.Integer, default=7)
    
    # Sở thích về địa điểm (JSON array)
    preferred_locations = db.Column(db.Text)  # JSON array of location IDs
    preferred_provinces = db.Column(db.Text)  # JSON array of province names
    
    # Độ khó yêu thích
    preferred_difficulty = db.Column(db.Enum('easy', 'moderate', 'hard', 'any'), default='any')
    
    # Tags yêu thích (JSON array)
    favorite_tags = db.Column(db.Text)
    
    # Engagement metrics
    engagement_level = db.Column(db.Enum('low', 'medium', 'high', 'very_high'), default='medium')
    avg_session_duration = db.Column(db.Float, default=0.0)  # seconds
    total_views = db.Column(db.Integer, default=0)
    total_bookings = db.Column(db.Integer, default=0)
    total_spent = db.Column(db.Float, default=0.0)
    
    # Email engagement
    email_open_rate = db.Column(db.Float, default=0.0)  # 0-1
    email_click_rate = db.Column(db.Float, default=0.0)  # 0-1
    last_email_opened_at = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_analyzed_at = db.Column(db.DateTime)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('interest_profile', uselist=False))
    
    def set_preferred_locations(self, locations):
        self.preferred_locations = json.dumps(locations)
    
    def get_preferred_locations(self):
        if self.preferred_locations:
            return json.loads(self.preferred_locations)
        return []
    
    def set_preferred_provinces(self, provinces):
        self.preferred_provinces = json.dumps(provinces)
    
    def get_preferred_provinces(self):
        if self.preferred_provinces:
            return json.loads(self.preferred_provinces)
        return []
    
    def set_favorite_tags(self, tags):
        self.favorite_tags = json.dumps(tags)
    
    def get_favorite_tags(self):
        if self.favorite_tags:
            return json.loads(self.favorite_tags)
        return []
    
    def get_top_categories(self, limit=3):
        """Lấy top danh mục yêu thích"""
        categories = [
            ('adventure', self.adventure_score),
            ('cultural', self.cultural_score),
            ('food', self.food_score),
            ('nature', self.nature_score),
            ('urban', self.urban_score),
            ('spiritual', self.spiritual_score)
        ]
        sorted_categories = sorted(categories, key=lambda x: x[1], reverse=True)
        return [cat[0] for cat in sorted_categories[:limit] if cat[1] > 0]
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category_scores': {
                'adventure': self.adventure_score,
                'cultural': self.cultural_score,
                'food': self.food_score,
                'nature': self.nature_score,
                'urban': self.urban_score,
                'spiritual': self.spiritual_score
            },
            'top_categories': self.get_top_categories(),
            'price_range': {
                'min': self.preferred_price_min,
                'max': self.preferred_price_max,
                'sensitivity': self.price_sensitivity
            },
            'duration_range': {
                'min': self.preferred_duration_min,
                'max': self.preferred_duration_max
            },
            'preferred_locations': self.get_preferred_locations(),
            'preferred_provinces': self.get_preferred_provinces(),
            'preferred_difficulty': self.preferred_difficulty,
            'favorite_tags': self.get_favorite_tags(),
            'engagement': {
                'level': self.engagement_level,
                'avg_session_duration': self.avg_session_duration,
                'total_views': self.total_views,
                'total_bookings': self.total_bookings,
                'total_spent': self.total_spent
            },
            'email_engagement': {
                'open_rate': self.email_open_rate,
                'click_rate': self.email_click_rate
            },
            'last_analyzed_at': self.last_analyzed_at.isoformat() if self.last_analyzed_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class PromotionalCampaign(db.Model):
    """Chiến dịch email khuyến mãi"""
    __tablename__ = 'promotional_campaigns'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Thông tin chiến dịch
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    campaign_type = db.Column(db.Enum(
        'weekly_personalized',    # Email cá nhân hóa hàng tuần
        'flash_sale',             # Flash sale
        'seasonal',               # Theo mùa
        'holiday',                # Ngày lễ
        'new_tours',              # Tour mới
        'abandoned_cart',         # Giỏ hàng bỏ quên
        're_engagement',          # Tái kích hoạt người dùng
        'custom'                  # Tùy chỉnh
    ), default='weekly_personalized')
    
    # Target segment
    target_segment = db.Column(db.String(100))  # ID của segment mục tiêu
    
    # Nội dung email mẫu
    email_subject_template = db.Column(db.String(255))
    email_body_template = db.Column(db.Text)  # HTML template
    
    # Điều kiện gửi
    target_segments = db.Column(db.Text)  # JSON: user segments
    min_engagement_level = db.Column(db.Enum('low', 'medium', 'high', 'very_high'))
    target_categories = db.Column(db.Text)  # JSON: categories to promote
    
    # Extra data (JSON cho các thông tin bổ sung)
    extra_data = db.Column('metadata', db.Text)  # Map to 'metadata' column in DB
    
    # Lịch gửi
    schedule_type = db.Column(db.Enum('once', 'daily', 'weekly', 'monthly'), default='once')
    schedule_day = db.Column(db.Integer)  # 0=Monday, 6=Sunday
    schedule_time = db.Column(db.Time)    # Giờ gửi
    scheduled_at = db.Column(db.DateTime)  # Thời gian đã lên lịch
    next_run_at = db.Column(db.DateTime)
    last_run_at = db.Column(db.DateTime)
    sent_at = db.Column(db.DateTime)  # Thời gian đã gửi
    
    # Thống kê
    total_sent = db.Column(db.Integer, default=0)
    total_opened = db.Column(db.Integer, default=0)
    total_clicked = db.Column(db.Integer, default=0)
    total_conversions = db.Column(db.Integer, default=0)
    
    # Trạng thái
    status = db.Column(db.Enum('draft', 'active', 'paused', 'completed', 'sending', 'sent', 'failed'), default='draft')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_target_segments(self, segments):
        self.target_segments = json.dumps(segments)
    
    def get_target_segments(self):
        if self.target_segments:
            return json.loads(self.target_segments)
        return []
    
    def set_target_categories(self, categories):
        self.target_categories = json.dumps(categories)
    
    def get_target_categories(self):
        if self.target_categories:
            return json.loads(self.target_categories)
        return []
    
    def set_metadata(self, data):
        self.extra_data = json.dumps(data, ensure_ascii=False)
    
    def get_metadata(self):
        if self.extra_data:
            return json.loads(self.extra_data)
        return {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'campaign_type': self.campaign_type,
            'email_subject_template': self.email_subject_template,
            'schedule_type': self.schedule_type,
            'schedule_day': self.schedule_day,
            'schedule_time': self.schedule_time.isoformat() if self.schedule_time else None,
            'next_run_at': self.next_run_at.isoformat() if self.next_run_at else None,
            'last_run_at': self.last_run_at.isoformat() if self.last_run_at else None,
            'stats': {
                'total_sent': self.total_sent,
                'total_opened': self.total_opened,
                'total_clicked': self.total_clicked,
                'total_conversions': self.total_conversions,
                'open_rate': round(self.total_opened / self.total_sent * 100, 2) if self.total_sent > 0 else 0,
                'click_rate': round(self.total_clicked / self.total_sent * 100, 2) if self.total_sent > 0 else 0,
                'conversion_rate': round(self.total_conversions / self.total_sent * 100, 2) if self.total_sent > 0 else 0
            },
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class EmailLog(db.Model):
    """Nhật ký gửi email"""
    __tablename__ = 'email_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Liên kết
    campaign_id = db.Column(db.Integer, db.ForeignKey('promotional_campaigns.id'), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Thông tin email
    email_address = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(255))
    
    # Nội dung được cá nhân hóa
    recommended_tours = db.Column(db.Text)  # JSON array of tour IDs
    
    # Tracking
    tracking_id = db.Column(db.String(100), unique=True, index=True)
    status = db.Column(db.Enum('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'), default='pending')
    
    # Boolean tracking flags
    opened = db.Column(db.Boolean, default=False)
    clicked = db.Column(db.Boolean, default=False)
    unsubscribed = db.Column(db.Boolean, default=False)
    
    # Timestamps
    sent_at = db.Column(db.DateTime)
    opened_at = db.Column(db.DateTime)
    clicked_at = db.Column(db.DateTime)
    
    # Error info
    error_message = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    campaign = db.relationship('PromotionalCampaign', backref=db.backref('email_logs', lazy='dynamic'))
    user = db.relationship('User', backref=db.backref('email_logs', lazy='dynamic'))
    
    def set_recommended_tours(self, tour_ids):
        self.recommended_tours = json.dumps(tour_ids)
    
    def get_recommended_tours(self):
        if self.recommended_tours:
            return json.loads(self.recommended_tours)
        return []
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'user_id': self.user_id,
            'email_address': self.email_address,
            'subject': self.subject,
            'recommended_tours': self.get_recommended_tours(),
            'tracking_id': self.tracking_id,
            'status': self.status,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'opened_at': self.opened_at.isoformat() if self.opened_at else None,
            'clicked_at': self.clicked_at.isoformat() if self.clicked_at else None,
            'error_message': self.error_message
        }
