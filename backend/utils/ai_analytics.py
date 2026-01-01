"""
AI Analytics Service
Phân tích dữ liệu người dùng và đề xuất tour bằng AI
"""
from datetime import datetime, timedelta
from collections import defaultdict
import json
import math
from typing import List, Dict, Optional, Tuple
from sqlalchemy import func, desc, and_, or_
from flask import current_app


class AIAnalyticsService:
    """Service phân tích dữ liệu AI"""
    
    # Trọng số cho các loại hành vi
    ACTION_WEIGHTS = {
        'book_tour': 10.0,        # Đặt tour - quan trọng nhất
        'complete_booking': 15.0,  # Hoàn thành booking
        'review_tour': 8.0,       # Đánh giá tour
        'wishlist_tour': 5.0,     # Thêm vào wishlist
        'view_tour': 1.0,         # Xem tour
        'search_tour': 0.5,       # Tìm kiếm
        'share_tour': 3.0,        # Chia sẻ
        'click_promotion': 2.0,   # Click khuyến mãi
        'open_email': 1.5,        # Mở email
        'click_email_link': 3.0   # Click link email
    }
    
    # Decay factor cho thời gian (hành vi cũ có trọng số thấp hơn)
    TIME_DECAY_FACTOR = 0.95  # Giảm 5% mỗi tuần
    
    def __init__(self, db):
        self.db = db
    
    def track_behavior(self, user_id: int, action_type: str, target_id: int = None,
                       target_type: str = None, metadata: dict = None,
                       session_id: str = None, device_type: str = 'desktop',
                       duration_seconds: int = 0, request=None) -> bool:
        """Ghi nhận hành vi người dùng"""
        try:
            from models.user_behavior import UserBehavior
            
            behavior = UserBehavior(
                user_id=user_id,
                action_type=action_type,
                target_id=target_id,
                target_type=target_type,
                session_id=session_id,
                device_type=device_type,
                duration_seconds=duration_seconds
            )
            
            if metadata:
                behavior.set_metadata(metadata)
            
            # Lấy thông tin từ request nếu có
            if request:
                behavior.ip_address = request.remote_addr
                behavior.browser = request.user_agent.string[:50] if request.user_agent else None
                behavior.referrer = request.referrer[:500] if request.referrer else None
            
            self.db.session.add(behavior)
            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error tracking behavior: {e}")
            return False
    
    def analyze_user_interests(self, user_id: int, days: int = 90) -> Dict:
        """Phân tích sở thích người dùng từ hành vi"""
        from models.user_behavior import UserBehavior, UserInterestProfile
        from models.tour import Tour
        from models.booking import Booking
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Lấy tất cả hành vi trong khoảng thời gian
        behaviors = UserBehavior.query.filter(
            UserBehavior.user_id == user_id,
            UserBehavior.created_at >= cutoff_date
        ).all()
        
        # Khởi tạo điểm sở thích
        category_scores = defaultdict(float)
        viewed_tours = set()
        price_history = []
        duration_history = []
        location_counts = defaultdict(int)
        province_counts = defaultdict(int)
        tag_counts = defaultdict(int)
        
        total_duration = 0
        session_count = set()
        
        for behavior in behaviors:
            # Tính decay factor dựa trên thời gian
            weeks_ago = (datetime.utcnow() - behavior.created_at).days / 7
            time_weight = self.TIME_DECAY_FACTOR ** weeks_ago
            
            # Lấy trọng số của hành vi
            action_weight = self.ACTION_WEIGHTS.get(behavior.action_type, 1.0)
            final_weight = action_weight * time_weight
            
            # Nếu hành vi liên quan đến tour
            if behavior.target_type == 'tour' and behavior.target_id:
                tour = Tour.query.get(behavior.target_id)
                if tour:
                    # Cập nhật điểm danh mục
                    if tour.category:
                        category_scores[tour.category] += final_weight
                    
                    viewed_tours.add(tour.id)
                    
                    # Thu thập thông tin giá
                    if behavior.action_type in ['book_tour', 'complete_booking']:
                        price_history.append(tour.price_per_person)
                        duration_history.append(tour.duration_days)
                    
                    # Thu thập thông tin địa điểm
                    if tour.starting_location:
                        location_counts[tour.starting_location] += 1
                    
                    # Thu thập tags
                    for tag in tour.get_tags():
                        tag_counts[tag] += final_weight
            
            # Thống kê session
            if behavior.session_id:
                session_count.add(behavior.session_id)
            total_duration += behavior.duration_seconds or 0
            
            # Phân tích metadata (search queries, filters)
            metadata = behavior.get_metadata()
            if metadata:
                if 'category' in metadata:
                    category_scores[metadata['category']] += final_weight * 0.5
                if 'location' in metadata:
                    location_counts[metadata['location']] += 1
                if 'province' in metadata:
                    province_counts[metadata['province']] += 1
        
        # Lấy thông tin booking để phân tích sâu hơn
        bookings = Booking.query.filter(
            Booking.user_id == user_id,
            Booking.status != 'cancelled'
        ).all()
        
        total_spent = 0
        for booking in bookings:
            total_spent += booking.total_price or 0
            if booking.tour:
                price_history.append(booking.tour.price_per_person)
                duration_history.append(booking.tour.duration_days)
        
        # Chuẩn hóa điểm danh mục (0-100)
        max_score = max(category_scores.values()) if category_scores else 1
        normalized_scores = {
            cat: min(100, (score / max_score) * 100) if max_score > 0 else 0
            for cat, score in category_scores.items()
        }
        
        # Tính phạm vi giá yêu thích
        if price_history:
            preferred_price_min = max(0, sum(price_history) / len(price_history) * 0.5)
            preferred_price_max = sum(price_history) / len(price_history) * 1.5
        else:
            preferred_price_min = 0
            preferred_price_max = 10000000
        
        # Tính phạm vi thời gian yêu thích
        if duration_history:
            preferred_duration_min = max(1, int(sum(duration_history) / len(duration_history) * 0.5))
            preferred_duration_max = int(sum(duration_history) / len(duration_history) * 1.5)
        else:
            preferred_duration_min = 1
            preferred_duration_max = 7
        
        # Xác định mức độ engagement
        total_actions = len(behaviors)
        if total_actions > 100:
            engagement_level = 'very_high'
        elif total_actions > 50:
            engagement_level = 'high'
        elif total_actions > 20:
            engagement_level = 'medium'
        else:
            engagement_level = 'low'
        
        # Cập nhật hoặc tạo UserInterestProfile
        profile = UserInterestProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserInterestProfile(user_id=user_id)
            self.db.session.add(profile)
        
        # Cập nhật profile
        profile.adventure_score = normalized_scores.get('adventure', 0)
        profile.cultural_score = normalized_scores.get('cultural', 0)
        profile.food_score = normalized_scores.get('food', 0)
        profile.nature_score = normalized_scores.get('nature', 0)
        profile.urban_score = normalized_scores.get('urban', 0)
        profile.spiritual_score = normalized_scores.get('spiritual', 0)
        
        profile.preferred_price_min = preferred_price_min
        profile.preferred_price_max = preferred_price_max
        profile.preferred_duration_min = preferred_duration_min
        profile.preferred_duration_max = preferred_duration_max
        
        # Top locations và provinces
        top_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_provinces = sorted(province_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        profile.set_preferred_locations([loc[0] for loc in top_locations])
        profile.set_preferred_provinces([prov[0] for prov in top_provinces])
        
        # Top tags
        top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        profile.set_favorite_tags([tag[0] for tag in top_tags])
        
        profile.engagement_level = engagement_level
        profile.avg_session_duration = total_duration / len(session_count) if session_count else 0
        profile.total_views = len(viewed_tours)
        profile.total_bookings = len(bookings)
        profile.total_spent = total_spent
        profile.last_analyzed_at = datetime.utcnow()
        
        self.db.session.commit()
        
        return profile.to_dict()
    
    def get_personalized_recommendations(self, user_id: int, limit: int = 10,
                                          exclude_booked: bool = True,
                                          only_discounted: bool = False) -> List[Dict]:
        """Lấy danh sách tour được đề xuất cá nhân hóa"""
        from models.user_behavior import UserInterestProfile
        from models.tour import Tour
        from models.booking import Booking
        
        # Lấy profile người dùng
        profile = UserInterestProfile.query.filter_by(user_id=user_id).first()
        
        # Query tours
        query = Tour.query.filter(Tour.status == 'active')
        
        # Loại trừ tour đã đặt
        if exclude_booked:
            booked_tour_ids = [b.tour_id for b in Booking.query.filter_by(user_id=user_id).all()]
            if booked_tour_ids:
                query = query.filter(~Tour.id.in_(booked_tour_ids))
        
        # Chỉ lấy tour có giảm giá
        if only_discounted:
            query = query.filter(Tour.discount_percentage > 0)
        
        tours = query.all()
        
        if not profile:
            # Nếu chưa có profile, trả về tour phổ biến
            tours = sorted(tours, key=lambda t: (t.bookings_count or 0, t.views_count or 0), reverse=True)
            return [self._tour_to_recommendation(t) for t in tours[:limit]]
        
        # Tính điểm cho mỗi tour dựa trên profile
        scored_tours = []
        for tour in tours:
            score = self._calculate_tour_score(tour, profile)
            scored_tours.append((tour, score))
        
        # Sắp xếp theo điểm
        scored_tours.sort(key=lambda x: x[1], reverse=True)
        
        return [self._tour_to_recommendation(t[0], t[1]) for t in scored_tours[:limit]]
    
    def _calculate_tour_score(self, tour, profile) -> float:
        """Tính điểm phù hợp của tour với profile người dùng"""
        score = 0.0
        
        # Điểm danh mục (40%)
        category_score = getattr(profile, f'{tour.category}_score', 0) if tour.category else 0
        score += category_score * 0.4
        
        # Điểm giá (20%)
        if profile.preferred_price_min <= tour.price_per_person <= profile.preferred_price_max:
            price_score = 100
        else:
            # Tính khoảng cách từ phạm vi giá yêu thích
            mid_price = (profile.preferred_price_min + profile.preferred_price_max) / 2
            distance = abs(tour.price_per_person - mid_price) / mid_price
            price_score = max(0, 100 - distance * 50)
        score += price_score * 0.2
        
        # Điểm thời gian (15%)
        if profile.preferred_duration_min <= tour.duration_days <= profile.preferred_duration_max:
            duration_score = 100
        else:
            mid_duration = (profile.preferred_duration_min + profile.preferred_duration_max) / 2
            distance = abs(tour.duration_days - mid_duration) / mid_duration
            duration_score = max(0, 100 - distance * 30)
        score += duration_score * 0.15
        
        # Điểm địa điểm (10%)
        preferred_locations = profile.get_preferred_locations()
        if tour.starting_location in preferred_locations:
            score += 100 * 0.1
        
        # Điểm tags (10%)
        favorite_tags = set(profile.get_favorite_tags())
        tour_tags = set(tour.get_tags())
        if tour_tags and favorite_tags:
            tag_overlap = len(tour_tags & favorite_tags) / len(tour_tags)
            score += tag_overlap * 100 * 0.1
        
        # Bonus cho tour có giảm giá (5%)
        if tour.discount_percentage > 0:
            # Người có price sensitivity cao sẽ thích giảm giá hơn
            discount_bonus = tour.discount_percentage * profile.price_sensitivity
            score += min(discount_bonus, 50) * 0.1
        
        return score
    
    def _tour_to_recommendation(self, tour, score: float = None) -> Dict:
        """Chuyển tour thành recommendation dict"""
        return {
            'id': tour.id,
            'title': tour.title,
            'description': tour.description[:200] + '...' if len(tour.description) > 200 else tour.description,
            'category': tour.category,
            'price_per_person': tour.price_per_person,
            'discounted_price': tour.get_discounted_price(),
            'discount_percentage': tour.discount_percentage,
            'duration_days': tour.duration_days,
            'featured_image': tour.featured_image,
            'starting_location': tour.starting_location,
            'rating': tour.rating,
            'reviews_count': tour.reviews_count,
            'match_score': round(score, 2) if score else None
        }
    
    def get_trending_tours(self, days: int = 7, limit: int = 10) -> List[Dict]:
        """Lấy danh sách tour đang trending"""
        from models.user_behavior import UserBehavior
        from models.tour import Tour
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Đếm số hành vi cho mỗi tour
        tour_stats = self.db.session.query(
            UserBehavior.target_id,
            func.count(UserBehavior.id).label('view_count'),
            func.sum(
                self.db.session.query(func.literal(1))
                .filter(UserBehavior.action_type.in_(['book_tour', 'complete_booking']))
                .correlate(UserBehavior)
                .as_scalar()
            ).label('booking_count')
        ).filter(
            UserBehavior.target_type == 'tour',
            UserBehavior.created_at >= cutoff_date
        ).group_by(UserBehavior.target_id).all()
        
        # Tính trending score
        tour_scores = {}
        for stat in tour_stats:
            if stat.target_id:
                # Trending score = views + bookings * 10
                tour_scores[stat.target_id] = (stat.view_count or 0) + (stat.booking_count or 0) * 10
        
        # Lấy top tours
        top_tour_ids = sorted(tour_scores.keys(), key=lambda x: tour_scores[x], reverse=True)[:limit]
        
        tours = Tour.query.filter(Tour.id.in_(top_tour_ids), Tour.status == 'active').all()
        tour_dict = {t.id: t for t in tours}
        
        results = []
        for tour_id in top_tour_ids:
            if tour_id in tour_dict:
                tour = tour_dict[tour_id]
                rec = self._tour_to_recommendation(tour)
                rec['trending_score'] = tour_scores[tour_id]
                results.append(rec)
        
        return results
    
    def get_category_trends(self, days: int = 30) -> Dict:
        """Phân tích xu hướng theo danh mục"""
        from models.user_behavior import UserBehavior
        from models.tour import Tour
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Lấy tất cả hành vi trong khoảng thời gian
        behaviors = UserBehavior.query.filter(
            UserBehavior.target_type == 'tour',
            UserBehavior.created_at >= cutoff_date
        ).all()
        
        category_stats = defaultdict(lambda: {
            'views': 0,
            'bookings': 0,
            'total_engagement': 0
        })
        
        for behavior in behaviors:
            if behavior.target_id:
                tour = Tour.query.get(behavior.target_id)
                if tour and tour.category:
                    weight = self.ACTION_WEIGHTS.get(behavior.action_type, 1.0)
                    category_stats[tour.category]['total_engagement'] += weight
                    
                    if behavior.action_type == 'view_tour':
                        category_stats[tour.category]['views'] += 1
                    elif behavior.action_type in ['book_tour', 'complete_booking']:
                        category_stats[tour.category]['bookings'] += 1
        
        # Tính xu hướng và xếp hạng
        ranked_categories = sorted(
            category_stats.items(),
            key=lambda x: x[1]['total_engagement'],
            reverse=True
        )
        
        return {
            'period_days': days,
            'categories': [
                {
                    'category': cat,
                    'stats': stats,
                    'rank': idx + 1
                }
                for idx, (cat, stats) in enumerate(ranked_categories)
            ]
        }
    
    def get_user_segments(self) -> List[Dict]:
        """Phân loại người dùng thành các segments"""
        from models.user_behavior import UserInterestProfile
        from models.user import User
        
        segments = {
            'high_value': [],      # Chi tiêu cao
            'frequent_bookers': [], # Đặt tour thường xuyên
            'browsers': [],        # Xem nhiều, đặt ít
            'deal_seekers': [],    # Thích khuyến mãi
            'new_users': [],       # Người dùng mới
            'inactive': []         # Không hoạt động
        }
        
        profiles = UserInterestProfile.query.all()
        
        for profile in profiles:
            user = User.query.get(profile.user_id)
            if not user:
                continue
            
            user_data = {
                'user_id': profile.user_id,
                'email': user.email,
                'full_name': user.full_name,
                'engagement_level': profile.engagement_level,
                'total_spent': profile.total_spent,
                'total_bookings': profile.total_bookings,
                'top_categories': profile.get_top_categories()
            }
            
            # Phân loại
            if profile.total_spent > 50000000:  # > 50M VND
                segments['high_value'].append(user_data)
            
            if profile.total_bookings >= 5:
                segments['frequent_bookers'].append(user_data)
            elif profile.total_views > 50 and profile.total_bookings < 2:
                segments['browsers'].append(user_data)
            
            if profile.price_sensitivity > 0.7:
                segments['deal_seekers'].append(user_data)
            
            # Kiểm tra người dùng mới (tạo trong 30 ngày gần đây)
            if user.created_at and (datetime.utcnow() - user.created_at).days <= 30:
                segments['new_users'].append(user_data)
            
            # Kiểm tra không hoạt động (không có hành vi trong 60 ngày)
            if profile.last_analyzed_at:
                days_inactive = (datetime.utcnow() - profile.last_analyzed_at).days
                if days_inactive > 60:
                    segments['inactive'].append(user_data)
        
        return [
            {'segment': name, 'users': users, 'count': len(users)}
            for name, users in segments.items()
        ]
    
    def batch_analyze_all_users(self) -> Dict:
        """Phân tích hàng loạt tất cả người dùng"""
        from models.user import User
        
        users = User.query.filter_by(is_active=True).all()
        analyzed = 0
        errors = 0
        
        for user in users:
            try:
                self.analyze_user_interests(user.id)
                analyzed += 1
            except Exception as e:
                errors += 1
                current_app.logger.error(f"Error analyzing user {user.id}: {e}")
        
        return {
            'total_users': len(users),
            'analyzed': analyzed,
            'errors': errors,
            'timestamp': datetime.utcnow().isoformat()
        }


# Singleton instance
_analytics_service = None

def get_analytics_service(db=None):
    """Lấy instance của AIAnalyticsService"""
    global _analytics_service
    if _analytics_service is None and db is not None:
        _analytics_service = AIAnalyticsService(db)
    return _analytics_service

def init_analytics_service(db):
    """Khởi tạo analytics service"""
    global _analytics_service
    _analytics_service = AIAnalyticsService(db)
    return _analytics_service
