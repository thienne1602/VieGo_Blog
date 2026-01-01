"""
Analytics Routes
API endpoints cho phân tích dữ liệu AI và quản lý email khuyến mãi
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, Response, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps

analytics_bp = Blueprint('analytics', __name__)


def admin_required(fn):
    """Decorator yêu cầu quyền admin"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        from models.user import User
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role not in ['admin', 'moderator']:
            return jsonify({'error': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper


# ==================== BEHAVIOR TRACKING ====================

@analytics_bp.route('/track', methods=['POST'])
@jwt_required(optional=True)
def track_behavior():
    """
    Ghi nhận hành vi người dùng
    ---
    POST /api/analytics/track
    Body: {
        action_type: string,
        target_id: int (optional),
        target_type: string (optional),
        metadata: object (optional),
        session_id: string (optional),
        duration_seconds: int (optional)
    }
    """
    from models import db
    from utils.ai_analytics import get_analytics_service, init_analytics_service
    
    data = request.get_json()
    
    if not data or 'action_type' not in data:
        return jsonify({'error': 'action_type is required'}), 400
    
    user_id = get_jwt_identity()
    if not user_id:
        # Cho phép tracking anonymous nhưng không lưu
        return jsonify({'success': True, 'tracked': False}), 200
    
    analytics = get_analytics_service()
    if not analytics:
        analytics = init_analytics_service(db)
    
    success = analytics.track_behavior(
        user_id=user_id,
        action_type=data['action_type'],
        target_id=data.get('target_id'),
        target_type=data.get('target_type'),
        metadata=data.get('metadata'),
        session_id=data.get('session_id'),
        device_type=data.get('device_type', 'desktop'),
        duration_seconds=data.get('duration_seconds', 0),
        request=request
    )
    
    return jsonify({'success': success, 'tracked': True}), 200


@analytics_bp.route('/track/tour-view/<int:tour_id>', methods=['POST'])
@jwt_required(optional=True)
def track_tour_view(tour_id):
    """Tracking nhanh xem tour"""
    from models import db
    from utils.ai_analytics import get_analytics_service, init_analytics_service
    
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'success': True, 'tracked': False}), 200
    
    analytics = get_analytics_service()
    if not analytics:
        analytics = init_analytics_service(db)
    
    data = request.get_json() or {}
    
    success = analytics.track_behavior(
        user_id=user_id,
        action_type='view_tour',
        target_id=tour_id,
        target_type='tour',
        session_id=data.get('session_id'),
        duration_seconds=data.get('duration_seconds', 0),
        request=request
    )
    
    return jsonify({'success': success}), 200


# ==================== USER RECOMMENDATIONS ====================

@analytics_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    """
    Lấy tour được đề xuất cá nhân hóa
    ---
    GET /api/analytics/recommendations?limit=10&only_discounted=false
    """
    from models import db
    from utils.ai_analytics import get_analytics_service, init_analytics_service
    
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 10, type=int)
    only_discounted = request.args.get('only_discounted', 'false').lower() == 'true'
    
    analytics = get_analytics_service()
    if not analytics:
        analytics = init_analytics_service(db)
    
    recommendations = analytics.get_personalized_recommendations(
        user_id=user_id,
        limit=limit,
        only_discounted=only_discounted
    )
    
    return jsonify({
        'success': True,
        'recommendations': recommendations,
        'count': len(recommendations)
    }), 200


@analytics_bp.route('/my-profile', methods=['GET'])
@jwt_required()
def get_my_interest_profile():
    """Lấy profile sở thích của user hiện tại"""
    from models.user_behavior import UserInterestProfile
    
    user_id = get_jwt_identity()
    profile = UserInterestProfile.query.filter_by(user_id=user_id).first()
    
    if not profile:
        return jsonify({
            'success': True,
            'profile': None,
            'message': 'Profile not analyzed yet'
        }), 200
    
    return jsonify({
        'success': True,
        'profile': profile.to_dict()
    }), 200


@analytics_bp.route('/analyze-me', methods=['POST'])
@jwt_required()
def analyze_my_interests():
    """Phân tích lại sở thích của user hiện tại"""
    from models import db
    from utils.ai_analytics import get_analytics_service, init_analytics_service
    
    user_id = get_jwt_identity()
    days = request.args.get('days', 90, type=int)
    
    analytics = get_analytics_service()
    if not analytics:
        analytics = init_analytics_service(db)
    
    profile = analytics.analyze_user_interests(user_id, days=days)
    
    return jsonify({
        'success': True,
        'profile': profile
    }), 200


# ==================== TRENDING & INSIGHTS ====================

@analytics_bp.route('/trending', methods=['GET'])
def get_trending_tours():
    """Lấy tour đang trending"""
    from models import db
    from utils.ai_analytics import get_analytics_service, init_analytics_service
    
    days = request.args.get('days', 7, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    analytics = get_analytics_service()
    if not analytics:
        analytics = init_analytics_service(db)
    
    trending = analytics.get_trending_tours(days=days, limit=limit)
    
    return jsonify({
        'success': True,
        'trending': trending,
        'period_days': days
    }), 200


@analytics_bp.route('/category-trends', methods=['GET'])
def get_category_trends():
    """Lấy xu hướng theo danh mục"""
    from models import db
    from utils.ai_analytics import get_analytics_service, init_analytics_service
    
    days = request.args.get('days', 30, type=int)
    
    analytics = get_analytics_service()
    if not analytics:
        analytics = init_analytics_service(db)
    
    trends = analytics.get_category_trends(days=days)
    
    return jsonify({
        'success': True,
        'trends': trends
    }), 200


# ==================== ADMIN: ANALYTICS MANAGEMENT ====================

@analytics_bp.route('/admin/segments', methods=['GET'])
@admin_required
def get_user_segments():
    """[Admin] Lấy phân loại người dùng theo segments"""
    from models import db
    from utils.ai_analytics import get_analytics_service, init_analytics_service
    
    analytics = get_analytics_service()
    if not analytics:
        analytics = init_analytics_service(db)
    
    segments = analytics.get_user_segments()
    
    return jsonify({
        'success': True,
        'segments': segments
    }), 200


@analytics_bp.route('/admin/analyze-all', methods=['POST'])
@admin_required
def batch_analyze_users():
    """[Admin] Phân tích hàng loạt tất cả người dùng"""
    from models import db
    from utils.ai_analytics import get_analytics_service, init_analytics_service
    
    analytics = get_analytics_service()
    if not analytics:
        analytics = init_analytics_service(db)
    
    result = analytics.batch_analyze_all_users()
    
    return jsonify({
        'success': True,
        'result': result
    }), 200


@analytics_bp.route('/admin/user/<int:user_id>/profile', methods=['GET'])
@admin_required
def get_user_profile(user_id):
    """[Admin] Xem profile sở thích của một user"""
    from models.user_behavior import UserInterestProfile
    
    profile = UserInterestProfile.query.filter_by(user_id=user_id).first()
    
    return jsonify({
        'success': True,
        'profile': profile.to_dict() if profile else None
    }), 200


@analytics_bp.route('/admin/user/<int:user_id>/behaviors', methods=['GET'])
@admin_required
def get_user_behaviors(user_id):
    """[Admin] Xem lịch sử hành vi của user"""
    from models.user_behavior import UserBehavior
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    days = request.args.get('days', 30, type=int)
    
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    query = UserBehavior.query.filter(
        UserBehavior.user_id == user_id,
        UserBehavior.created_at >= cutoff
    ).order_by(UserBehavior.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'success': True,
        'behaviors': [b.to_dict() for b in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


# ==================== ADMIN: CAMPAIGN MANAGEMENT ====================

@analytics_bp.route('/admin/campaigns', methods=['GET'])
@admin_required
def list_campaigns():
    """[Admin] Liệt kê tất cả campaigns"""
    from models.user_behavior import PromotionalCampaign
    
    status = request.args.get('status')
    campaign_type = request.args.get('type')
    
    query = PromotionalCampaign.query
    
    if status:
        query = query.filter_by(status=status)
    if campaign_type:
        query = query.filter_by(campaign_type=campaign_type)
    
    campaigns = query.order_by(PromotionalCampaign.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'campaigns': [c.to_dict() for c in campaigns]
    }), 200


@analytics_bp.route('/admin/campaigns', methods=['POST'])
@admin_required
def create_campaign():
    """[Admin] Tạo campaign mới"""
    from models import db
    from models.user_behavior import PromotionalCampaign
    from flask_jwt_extended import get_jwt_identity
    
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Campaign name is required'}), 400
    
    campaign = PromotionalCampaign(
        name=data['name'],
        description=data.get('description'),
        campaign_type=data.get('campaign_type', 'weekly_personalized'),
        email_subject_template=data.get('email_subject_template'),
        email_body_template=data.get('email_body_template'),
        schedule_type=data.get('schedule_type', 'weekly'),
        schedule_day=data.get('schedule_day'),
        status=data.get('status', 'draft'),
        created_by=get_jwt_identity()
    )
    
    if data.get('target_segments'):
        campaign.set_target_segments(data['target_segments'])
    if data.get('target_categories'):
        campaign.set_target_categories(data['target_categories'])
    if data.get('min_engagement_level'):
        campaign.min_engagement_level = data['min_engagement_level']
    
    # Parse schedule time
    if data.get('schedule_time'):
        from datetime import time
        parts = data['schedule_time'].split(':')
        campaign.schedule_time = time(int(parts[0]), int(parts[1]))
    
    db.session.add(campaign)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'campaign': campaign.to_dict()
    }), 201


@analytics_bp.route('/admin/campaigns/<int:campaign_id>', methods=['GET'])
@admin_required
def get_campaign(campaign_id):
    """[Admin] Xem chi tiết campaign"""
    from models.user_behavior import PromotionalCampaign
    
    campaign = PromotionalCampaign.query.get_or_404(campaign_id)
    
    return jsonify({
        'success': True,
        'campaign': campaign.to_dict()
    }), 200


@analytics_bp.route('/admin/campaigns/<int:campaign_id>', methods=['PUT'])
@admin_required
def update_campaign(campaign_id):
    """[Admin] Cập nhật campaign"""
    from models import db
    from models.user_behavior import PromotionalCampaign
    
    campaign = PromotionalCampaign.query.get_or_404(campaign_id)
    data = request.get_json()
    
    if 'name' in data:
        campaign.name = data['name']
    if 'description' in data:
        campaign.description = data['description']
    if 'campaign_type' in data:
        campaign.campaign_type = data['campaign_type']
    if 'email_subject_template' in data:
        campaign.email_subject_template = data['email_subject_template']
    if 'email_body_template' in data:
        campaign.email_body_template = data['email_body_template']
    if 'schedule_type' in data:
        campaign.schedule_type = data['schedule_type']
    if 'schedule_day' in data:
        campaign.schedule_day = data['schedule_day']
    if 'status' in data:
        campaign.status = data['status']
    if 'target_segments' in data:
        campaign.set_target_segments(data['target_segments'])
    if 'target_categories' in data:
        campaign.set_target_categories(data['target_categories'])
    if 'min_engagement_level' in data:
        campaign.min_engagement_level = data['min_engagement_level']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'campaign': campaign.to_dict()
    }), 200


@analytics_bp.route('/admin/campaigns/<int:campaign_id>', methods=['DELETE'])
@admin_required
def delete_campaign(campaign_id):
    """[Admin] Xóa campaign"""
    from models import db
    from models.user_behavior import PromotionalCampaign
    
    campaign = PromotionalCampaign.query.get_or_404(campaign_id)
    db.session.delete(campaign)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Campaign deleted'
    }), 200


@analytics_bp.route('/admin/campaigns/<int:campaign_id>/run', methods=['POST'])
@admin_required
def run_campaign_now(campaign_id):
    """[Admin] Chạy campaign ngay"""
    from utils.email_scheduler import get_email_scheduler
    
    scheduler = get_email_scheduler()
    if scheduler:
        result = scheduler.run_campaign_now(campaign_id)
        return jsonify(result), 200 if result['success'] else 400
    
    # Fallback: chạy trực tiếp không qua scheduler
    from models import db
    from models.user_behavior import PromotionalCampaign
    from utils.promotional_email import get_promotional_email_service, init_promotional_email_service
    
    campaign = PromotionalCampaign.query.get_or_404(campaign_id)
    email_service = get_promotional_email_service()
    if not email_service:
        email_service = init_promotional_email_service(db)
    
    result = email_service.send_batch_promotional_emails(
        campaign_id=campaign_id,
        campaign_type=campaign.campaign_type
    )
    
    return jsonify({
        'success': True,
        'result': result
    }), 200


@analytics_bp.route('/admin/campaigns/<int:campaign_id>/stats', methods=['GET'])
@admin_required
def get_campaign_stats(campaign_id):
    """[Admin] Xem thống kê campaign"""
    from models.user_behavior import PromotionalCampaign, EmailLog
    
    campaign = PromotionalCampaign.query.get_or_404(campaign_id)
    
    # Email stats by status
    status_stats = db.session.query(
        EmailLog.status,
        db.func.count(EmailLog.id)
    ).filter(
        EmailLog.campaign_id == campaign_id
    ).group_by(EmailLog.status).all()
    
    # Daily sent stats (last 30 days)
    from datetime import timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    daily_stats = db.session.query(
        db.func.date(EmailLog.sent_at),
        db.func.count(EmailLog.id)
    ).filter(
        EmailLog.campaign_id == campaign_id,
        EmailLog.sent_at >= thirty_days_ago
    ).group_by(db.func.date(EmailLog.sent_at)).all()
    
    return jsonify({
        'success': True,
        'campaign': campaign.to_dict(),
        'status_breakdown': {s: c for s, c in status_stats},
        'daily_stats': [{'date': str(d), 'count': c} for d, c in daily_stats]
    }), 200


# ==================== EMAIL LOG & TRACKING ====================

@analytics_bp.route('/admin/email-logs', methods=['GET'])
@admin_required
def list_email_logs():
    """[Admin] Liệt kê email logs"""
    from models.user_behavior import EmailLog
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    campaign_id = request.args.get('campaign_id', type=int)
    status = request.args.get('status')
    
    query = EmailLog.query
    
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    if status:
        query = query.filter_by(status=status)
    
    pagination = query.order_by(EmailLog.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'success': True,
        'logs': [log.to_dict() for log in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


# Email tracking endpoints (public - no auth required)
@analytics_bp.route('/email/track/open/<tracking_id>', methods=['GET'])
def track_email_open(tracking_id):
    """Tracking pixel - ghi nhận email được mở"""
    from models import db
    from utils.promotional_email import get_promotional_email_service, init_promotional_email_service
    
    email_service = get_promotional_email_service()
    if not email_service:
        email_service = init_promotional_email_service(db)
    
    email_service.track_email_open(tracking_id)
    
    # Return 1x1 transparent GIF
    gif = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
    return Response(gif, mimetype='image/gif')


@analytics_bp.route('/email/track/click/<tracking_id>', methods=['GET'])
def track_email_click(tracking_id):
    """Tracking click từ email"""
    from models import db
    from utils.promotional_email import get_promotional_email_service, init_promotional_email_service
    
    tour_id = request.args.get('tour_id', type=int)
    redirect_url = request.args.get('url', '/')
    
    email_service = get_promotional_email_service()
    if not email_service:
        email_service = init_promotional_email_service(db)
    
    email_service.track_email_click(tracking_id, tour_id)
    
    return redirect(redirect_url)


# ==================== SCHEDULER STATUS ====================

@analytics_bp.route('/admin/scheduler/status', methods=['GET'])
@admin_required
def get_scheduler_status():
    """[Admin] Xem trạng thái scheduler"""
    from utils.email_scheduler import get_email_scheduler
    
    scheduler = get_email_scheduler()
    if scheduler:
        return jsonify({
            'success': True,
            'status': scheduler.get_scheduler_status()
        }), 200
    
    return jsonify({
        'success': True,
        'status': {'running': False, 'message': 'Scheduler not initialized'}
    }), 200


@analytics_bp.route('/admin/scheduler/start', methods=['POST'])
@admin_required
def start_scheduler():
    """[Admin] Bắt đầu scheduler"""
    from utils.email_scheduler import start_email_scheduler
    
    start_email_scheduler()
    
    return jsonify({
        'success': True,
        'message': 'Scheduler started'
    }), 200


@analytics_bp.route('/admin/scheduler/stop', methods=['POST'])
@admin_required
def stop_scheduler():
    """[Admin] Dừng scheduler"""
    from utils.email_scheduler import stop_email_scheduler
    
    stop_email_scheduler()
    
    return jsonify({
        'success': True,
        'message': 'Scheduler stopped'
    }), 200


# ==================== TEST ENDPOINTS ====================

@analytics_bp.route('/admin/test/send-email/<int:user_id>', methods=['POST'])
@admin_required
def test_send_email(user_id):
    """[Admin] Test gửi email cho một user"""
    from models import db
    from models.user import User
    from utils.ai_analytics import get_analytics_service, init_analytics_service
    from utils.promotional_email import get_promotional_email_service, init_promotional_email_service
    
    user = User.query.get_or_404(user_id)
    
    analytics = get_analytics_service()
    if not analytics:
        analytics = init_analytics_service(db)
    
    email_service = get_promotional_email_service()
    if not email_service:
        email_service = init_promotional_email_service(db)
    
    # Lấy recommendations
    recommendations = analytics.get_personalized_recommendations(user_id=user_id, limit=5)
    
    if not recommendations:
        return jsonify({
            'success': False,
            'error': 'No recommendations available for this user'
        }), 400
    
    # Gửi email test
    result = email_service.send_promotional_email(
        user=user,
        recommendations=recommendations,
        campaign_type='weekly_personalized'
    )
    
    return jsonify({
        'success': result['success'],
        'result': result,
        'recommendations_count': len(recommendations)
    }), 200 if result['success'] else 400
