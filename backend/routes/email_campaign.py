"""
Email Campaign Routes for Admin Dashboard
Quản lý chiến dịch email khuyến mãi theo nhóm người dùng
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy import func, desc, and_, or_
from collections import defaultdict
import json
import threading

from models import db, User, UserBehavior, UserInterestProfile, PromotionalCampaign, EmailLog, Tour

email_campaign_bp = Blueprint('email_campaign', __name__, url_prefix='/api/admin/email-campaigns')

# Admin authorization decorator
def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            user_id_int = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
            user = User.query.get(user_id_int)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user.role not in ['admin', 'moderator']:
                return jsonify({'error': 'Admin access required'}), 403
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': f'Authorization error: {str(e)}'}), 500
    return decorated_function


# ============================================================================
# CAMPAIGN MANAGEMENT
# ============================================================================

@email_campaign_bp.route('/campaigns', methods=['GET'])
@admin_required
def get_campaigns():
    """Lấy danh sách chiến dịch email"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        
        query = PromotionalCampaign.query
        
        if status:
            query = query.filter(PromotionalCampaign.status == status)
        
        query = query.order_by(desc(PromotionalCampaign.created_at))
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        campaigns = []
        for campaign in pagination.items:
            # Đếm số email đã gửi
            sent_count = EmailLog.query.filter_by(campaign_id=campaign.id).count()
            opened_count = EmailLog.query.filter_by(campaign_id=campaign.id, opened=True).count()
            clicked_count = EmailLog.query.filter_by(campaign_id=campaign.id, clicked=True).count()
            
            campaigns.append({
                'id': campaign.id,
                'name': campaign.name,
                'description': campaign.description,
                'campaignType': campaign.campaign_type,
                'status': campaign.status,
                'targetSegment': campaign.target_segment,
                'emailsSent': sent_count,
                'emailsOpened': opened_count,
                'emailsClicked': clicked_count,
                'openRate': round(opened_count / sent_count * 100, 2) if sent_count > 0 else 0,
                'clickRate': round(clicked_count / sent_count * 100, 2) if sent_count > 0 else 0,
                'scheduledAt': campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
                'sentAt': campaign.sent_at.isoformat() if campaign.sent_at else None,
                'createdAt': campaign.created_at.isoformat()
            })
        
        return jsonify({
            'campaigns': campaigns,
            'pagination': {
                'currentPage': page,
                'perPage': per_page,
                'totalPages': pagination.pages,
                'totalItems': pagination.total
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@email_campaign_bp.route('/campaigns', methods=['POST'])
@admin_required
def create_campaign():
    """Tạo chiến dịch email mới"""
    try:
        data = request.get_json()
        
        campaign = PromotionalCampaign(
            name=data.get('name'),
            description=data.get('description', ''),
            campaign_type=data.get('campaignType', 'weekly_personalized'),
            target_segment=data.get('targetSegment'),
            status='draft'
        )
        
        # Lưu criteria của target segment
        if data.get('targetCriteria'):
            campaign.set_metadata({'targetCriteria': data['targetCriteria']})
        
        # Lưu scheduled time nếu có
        if data.get('scheduledAt'):
            campaign.scheduled_at = datetime.fromisoformat(data['scheduledAt'])
        
        db.session.add(campaign)
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign created successfully',
            'campaign': {
                'id': campaign.id,
                'name': campaign.name,
                'status': campaign.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@email_campaign_bp.route('/campaigns/<int:campaign_id>', methods=['GET'])
@admin_required
def get_campaign_detail(campaign_id):
    """Lấy chi tiết chiến dịch"""
    try:
        campaign = PromotionalCampaign.query.get_or_404(campaign_id)
        
        # Thống kê email
        email_stats = db.session.query(
            func.count(EmailLog.id).label('total'),
            func.sum(func.cast(EmailLog.opened, db.Integer)).label('opened'),
            func.sum(func.cast(EmailLog.clicked, db.Integer)).label('clicked'),
            func.sum(func.cast(EmailLog.unsubscribed, db.Integer)).label('unsubscribed')
        ).filter(EmailLog.campaign_id == campaign_id).first()
        
        # Lấy sample email logs
        recent_logs = EmailLog.query.filter_by(campaign_id=campaign_id).order_by(
            desc(EmailLog.created_at)
        ).limit(10).all()
        
        return jsonify({
            'campaign': {
                'id': campaign.id,
                'name': campaign.name,
                'description': campaign.description,
                'campaignType': campaign.campaign_type,
                'targetSegment': campaign.target_segment,
                'status': campaign.status,
                'metadata': campaign.get_metadata() if hasattr(campaign, 'get_metadata') else {},
                'scheduledAt': campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
                'sentAt': campaign.sent_at.isoformat() if campaign.sent_at else None,
                'createdAt': campaign.created_at.isoformat()
            },
            'stats': {
                'totalEmails': email_stats.total or 0,
                'opened': email_stats.opened or 0,
                'clicked': email_stats.clicked or 0,
                'unsubscribed': email_stats.unsubscribed or 0,
                'openRate': round((email_stats.opened or 0) / email_stats.total * 100, 2) if email_stats.total else 0,
                'clickRate': round((email_stats.clicked or 0) / email_stats.total * 100, 2) if email_stats.total else 0
            },
            'recentLogs': [{
                'id': log.id,
                'email': log.email_address,
                'subject': log.subject,
                'opened': log.opened,
                'clicked': log.clicked,
                'sentAt': log.sent_at.isoformat() if log.sent_at else None
            } for log in recent_logs]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@email_campaign_bp.route('/campaigns/<int:campaign_id>', methods=['PUT'])
@admin_required
def update_campaign(campaign_id):
    """Cập nhật chiến dịch"""
    try:
        campaign = PromotionalCampaign.query.get_or_404(campaign_id)
        
        if campaign.status == 'sent':
            return jsonify({'error': 'Cannot update a sent campaign'}), 400
        
        data = request.get_json()
        
        if 'name' in data:
            campaign.name = data['name']
        if 'description' in data:
            campaign.description = data['description']
        if 'campaignType' in data:
            campaign.campaign_type = data['campaignType']
        if 'targetSegment' in data:
            campaign.target_segment = data['targetSegment']
        if 'scheduledAt' in data:
            campaign.scheduled_at = datetime.fromisoformat(data['scheduledAt']) if data['scheduledAt'] else None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@email_campaign_bp.route('/campaigns/<int:campaign_id>', methods=['DELETE'])
@admin_required
def delete_campaign(campaign_id):
    """Xóa chiến dịch"""
    try:
        campaign = PromotionalCampaign.query.get_or_404(campaign_id)
        
        # Xóa email logs liên quan
        EmailLog.query.filter_by(campaign_id=campaign_id).delete()
        
        db.session.delete(campaign)
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================================
# SEND CAMPAIGN EMAIL
# ============================================================================

@email_campaign_bp.route('/campaigns/<int:campaign_id>/send', methods=['POST'])
@admin_required
def send_campaign(campaign_id):
    """Gửi email campaign cho segment"""
    try:
        campaign = PromotionalCampaign.query.get_or_404(campaign_id)
        
        if campaign.status == 'sent':
            return jsonify({'error': 'Campaign already sent'}), 400
        
        data = request.get_json() or {}
        test_mode = data.get('testMode', False)
        test_email = data.get('testEmail')
        
        # Nếu là test mode, chỉ gửi đến 1 email
        if test_mode:
            if not test_email:
                return jsonify({'error': 'Test email required in test mode'}), 400
            
            # Gửi test email
            result = _send_test_email(campaign, test_email)
            return jsonify({
                'message': 'Test email sent',
                'result': result
            }), 200
        
        # Lấy danh sách users theo segment
        target_users = _get_segment_users(campaign.target_segment)
        
        if not target_users:
            return jsonify({'error': 'No users found in target segment'}), 400
        
        # Cập nhật status
        campaign.status = 'sending'
        db.session.commit()
        
        # Gửi email trong background thread
        def send_emails_async():
            from main import app
            with app.app_context():
                _send_campaign_emails(campaign.id, target_users)
        
        thread = threading.Thread(target=send_emails_async)
        thread.start()
        
        return jsonify({
            'message': 'Campaign send started',
            'targetUsers': len(target_users)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def _get_segment_users(segment_id):
    """Lấy danh sách users trong segment"""
    segment_criteria = {
        'high_engagement': {'engagement_level': ['high', 'very_high']},
        'adventure_lovers': {'adventure_score_min': 50},
        'cultural_enthusiasts': {'cultural_score_min': 50},
        'food_lovers': {'food_score_min': 50},
        'nature_explorers': {'nature_score_min': 50},
        'budget_travelers': {'price_sensitivity_min': 0.7},
        'premium_travelers': {'price_sensitivity_max': 0.3},
        'new_users': {'registered_within_days': 30},
        'inactive_users': {'inactive_days': 30},
        'high_spenders': {'total_spent_min': 10000000},
        'frequent_bookers': {'total_bookings_min': 3},
        'email_engaged': {'email_open_rate_min': 0.5},
        'all_users': {}  # Tất cả users
    }
    
    criteria = segment_criteria.get(segment_id, {})
    
    query = User.query.filter_by(is_active=True)
    
    # Chỉ lấy users có email verified và cho phép nhận newsletter
    query = query.filter(User.email_verified == True)
    
    needs_profile = any(k in criteria for k in [
        'engagement_level', 'adventure_score_min', 'cultural_score_min',
        'food_score_min', 'nature_score_min', 'price_sensitivity_min',
        'price_sensitivity_max', 'total_spent_min', 'total_bookings_min',
        'email_open_rate_min'
    ])
    
    if needs_profile:
        query = query.outerjoin(UserInterestProfile, User.id == UserInterestProfile.user_id)
    
    # Áp dụng filters
    if 'engagement_level' in criteria:
        query = query.filter(UserInterestProfile.engagement_level.in_(criteria['engagement_level']))
    
    if 'adventure_score_min' in criteria:
        query = query.filter(UserInterestProfile.adventure_score >= criteria['adventure_score_min'])
    
    if 'cultural_score_min' in criteria:
        query = query.filter(UserInterestProfile.cultural_score >= criteria['cultural_score_min'])
    
    if 'food_score_min' in criteria:
        query = query.filter(UserInterestProfile.food_score >= criteria['food_score_min'])
    
    if 'nature_score_min' in criteria:
        query = query.filter(UserInterestProfile.nature_score >= criteria['nature_score_min'])
    
    if 'price_sensitivity_min' in criteria:
        query = query.filter(UserInterestProfile.price_sensitivity >= criteria['price_sensitivity_min'])
    
    if 'price_sensitivity_max' in criteria:
        query = query.filter(UserInterestProfile.price_sensitivity <= criteria['price_sensitivity_max'])
    
    if 'registered_within_days' in criteria:
        cutoff = datetime.utcnow() - timedelta(days=criteria['registered_within_days'])
        query = query.filter(User.created_at >= cutoff)
    
    if 'inactive_days' in criteria:
        cutoff = datetime.utcnow() - timedelta(days=criteria['inactive_days'])
        active_user_ids = db.session.query(func.distinct(UserBehavior.user_id)).filter(
            UserBehavior.created_at >= cutoff
        ).subquery()
        query = query.filter(~User.id.in_(active_user_ids))
    
    if 'total_spent_min' in criteria:
        query = query.filter(UserInterestProfile.total_spent >= criteria['total_spent_min'])
    
    if 'total_bookings_min' in criteria:
        query = query.filter(UserInterestProfile.total_bookings >= criteria['total_bookings_min'])
    
    if 'email_open_rate_min' in criteria:
        query = query.filter(UserInterestProfile.email_open_rate >= criteria['email_open_rate_min'])
    
    return query.all()


def _send_test_email(campaign, test_email):
    """Gửi test email"""
    try:
        from flask_mail import Mail, Message
        from flask import current_app
        
        mail = Mail(current_app)
        
        msg = Message(
            subject=f"[TEST] {campaign.name}",
            recipients=[test_email],
            html=f"""
            <h2>Test Email - {campaign.name}</h2>
            <p>Đây là email test cho chiến dịch: {campaign.description}</p>
            <p>Campaign Type: {campaign.campaign_type}</p>
            <p>Target Segment: {campaign.target_segment}</p>
            """
        )
        
        mail.send(msg)
        return {'success': True, 'email': test_email}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def _send_campaign_emails(campaign_id, users):
    """Gửi email campaign cho danh sách users"""
    try:
        from flask_mail import Mail, Message
        from flask import current_app
        from utils.ai_analytics import get_analytics_service, init_analytics_service
        from utils.promotional_email import get_promotional_email_service, init_promotional_email_service
        
        campaign = PromotionalCampaign.query.get(campaign_id)
        if not campaign:
            return
        
        mail = Mail(current_app)
        
        analytics = get_analytics_service()
        if not analytics:
            analytics = init_analytics_service(db)
        
        email_service = get_promotional_email_service()
        if not email_service:
            email_service = init_promotional_email_service(db, mail)
        
        sent_count = 0
        error_count = 0
        
        for user in users:
            try:
                # Lấy tour recommendations cho user
                recommendations = analytics.get_personalized_recommendations(user.id, limit=5)
                
                # Build email content
                email_data = email_service.build_personalized_email(
                    user, 
                    recommendations,
                    campaign.campaign_type
                )
                
                # Tạo email log
                log = email_service.create_email_log(
                    campaign_id=campaign.id,
                    user_id=user.id,
                    email=user.email,
                    subject=email_data['subject'],
                    tour_ids=email_data['tour_ids']
                )
                
                # Gửi email
                msg = Message(
                    subject=email_data['subject'],
                    recipients=[user.email],
                    html=email_data['html'],
                    body=email_data['text']
                )
                
                mail.send(msg)
                
                # Cập nhật log
                log.sent_at = datetime.utcnow()
                log.status = 'sent'
                db.session.commit()
                
                sent_count += 1
                
            except Exception as e:
                error_count += 1
                print(f"Error sending email to {user.email}: {e}")
        
        # Cập nhật campaign status
        campaign.status = 'sent'
        campaign.sent_at = datetime.utcnow()
        db.session.commit()
        
        print(f"Campaign {campaign_id} completed: {sent_count} sent, {error_count} errors")
        
    except Exception as e:
        print(f"Error in _send_campaign_emails: {e}")
        campaign = PromotionalCampaign.query.get(campaign_id)
        if campaign:
            campaign.status = 'failed'
            db.session.commit()


# ============================================================================
# SEND EMAIL TO CUSTOM USER LIST
# ============================================================================

@email_campaign_bp.route('/send-to-users', methods=['POST'])
@admin_required
def send_email_to_users():
    """Gửi email đến danh sách users cụ thể"""
    try:
        data = request.get_json()
        
        user_ids = data.get('userIds', [])
        subject = data.get('subject')
        content = data.get('content')
        campaign_type = data.get('campaignType', 'custom')
        
        if not user_ids:
            return jsonify({'error': 'No users specified'}), 400
        
        if not subject or not content:
            return jsonify({'error': 'Subject and content required'}), 400
        
        # Tạo campaign
        campaign = PromotionalCampaign(
            name=f"Custom Email - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            description=f"Custom email to {len(user_ids)} users",
            campaign_type=campaign_type,
            target_segment='custom',
            status='sending'
        )
        db.session.add(campaign)
        db.session.commit()
        
        # Lấy users
        users = User.query.filter(User.id.in_(user_ids), User.is_active == True).all()
        
        # Gửi trong background
        def send_async():
            from main import app
            with app.app_context():
                _send_custom_emails(campaign.id, users, subject, content)
        
        thread = threading.Thread(target=send_async)
        thread.start()
        
        return jsonify({
            'message': 'Emails being sent',
            'campaignId': campaign.id,
            'targetUsers': len(users)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def _send_custom_emails(campaign_id, users, subject, content):
    """Gửi custom email"""
    try:
        from flask_mail import Mail, Message
        from flask import current_app
        
        campaign = PromotionalCampaign.query.get(campaign_id)
        mail = Mail(current_app)
        
        sent_count = 0
        
        for user in users:
            try:
                # Personalize content
                personalized_content = content.replace('{name}', user.full_name or user.username or 'bạn')
                personalized_subject = subject.replace('{name}', user.full_name or user.username or 'bạn')
                
                # Log
                log = EmailLog(
                    campaign_id=campaign_id,
                    user_id=user.id,
                    email_address=user.email,
                    subject=personalized_subject,
                    tracking_id=str(datetime.utcnow().timestamp())
                )
                db.session.add(log)
                
                # Send
                msg = Message(
                    subject=personalized_subject,
                    recipients=[user.email],
                    html=personalized_content
                )
                mail.send(msg)
                
                log.sent_at = datetime.utcnow()
                log.status = 'sent'
                db.session.commit()
                
                sent_count += 1
                
            except Exception as e:
                print(f"Error sending to {user.email}: {e}")
        
        campaign.status = 'sent'
        campaign.sent_at = datetime.utcnow()
        db.session.commit()
        
    except Exception as e:
        print(f"Error in _send_custom_emails: {e}")


# ============================================================================
# EMAIL TEMPLATES
# ============================================================================

@email_campaign_bp.route('/templates', methods=['GET'])
@admin_required
def get_email_templates():
    """Lấy danh sách email templates"""
    try:
        templates = [
            {
                'id': 'weekly_personalized',
                'name': 'Tour cá nhân hóa hàng tuần',
                'description': 'Gửi đề xuất tour dựa trên sở thích người dùng',
                'variables': ['{name}', '{tour_count}']
            },
            {
                'id': 'flash_sale',
                'name': 'Flash Sale',
                'description': 'Thông báo chương trình giảm giá flash',
                'variables': ['{name}', '{discount}', '{hours}']
            },
            {
                'id': 'new_tours',
                'name': 'Tour mới',
                'description': 'Giới thiệu các tour mới ra mắt',
                'variables': ['{name}', '{location}']
            },
            {
                'id': 're_engagement',
                'name': 'Thu hút người dùng quay lại',
                'description': 'Email cho người dùng không hoạt động',
                'variables': ['{name}', '{discount}']
            },
            {
                'id': 'seasonal_promotion',
                'name': 'Khuyến mãi theo mùa',
                'description': 'Email khuyến mãi theo mùa du lịch',
                'variables': ['{name}', '{season}', '{discount}']
            },
            {
                'id': 'birthday',
                'name': 'Chúc mừng sinh nhật',
                'description': 'Email chúc mừng sinh nhật với ưu đãi đặc biệt',
                'variables': ['{name}', '{discount}']
            }
        ]
        
        return jsonify({
            'templates': templates
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# EMAIL STATISTICS
# ============================================================================

@email_campaign_bp.route('/stats', methods=['GET'])
@admin_required
def get_email_stats():
    """Thống kê tổng quan email"""
    try:
        days = request.args.get('days', 30, type=int)
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Tổng số email đã gửi
        total_sent = EmailLog.query.filter(EmailLog.sent_at.isnot(None)).count()
        total_sent_period = EmailLog.query.filter(
            EmailLog.sent_at >= cutoff_date
        ).count()
        
        # Tỷ lệ mở
        total_opened = EmailLog.query.filter_by(opened=True).count()
        opened_period = EmailLog.query.filter(
            EmailLog.opened == True,
            EmailLog.sent_at >= cutoff_date
        ).count()
        
        # Tỷ lệ click
        total_clicked = EmailLog.query.filter_by(clicked=True).count()
        clicked_period = EmailLog.query.filter(
            EmailLog.clicked == True,
            EmailLog.sent_at >= cutoff_date
        ).count()
        
        # Tỷ lệ unsubscribe
        total_unsubscribed = EmailLog.query.filter_by(unsubscribed=True).count()
        
        # Số campaigns
        total_campaigns = PromotionalCampaign.query.count()
        active_campaigns = PromotionalCampaign.query.filter_by(status='active').count()
        
        # Trend theo ngày
        daily_stats = db.session.query(
            func.date(EmailLog.sent_at).label('date'),
            func.count(EmailLog.id).label('sent'),
            func.sum(func.cast(EmailLog.opened, db.Integer)).label('opened'),
            func.sum(func.cast(EmailLog.clicked, db.Integer)).label('clicked')
        ).filter(
            EmailLog.sent_at >= cutoff_date
        ).group_by(
            func.date(EmailLog.sent_at)
        ).order_by(
            func.date(EmailLog.sent_at)
        ).all()
        
        return jsonify({
            'overview': {
                'totalSent': total_sent,
                'totalOpened': total_opened,
                'totalClicked': total_clicked,
                'totalUnsubscribed': total_unsubscribed,
                'openRate': round(total_opened / total_sent * 100, 2) if total_sent > 0 else 0,
                'clickRate': round(total_clicked / total_sent * 100, 2) if total_sent > 0 else 0
            },
            'period': {
                'days': days,
                'sent': total_sent_period,
                'opened': opened_period,
                'clicked': clicked_period,
                'openRate': round(opened_period / total_sent_period * 100, 2) if total_sent_period > 0 else 0,
                'clickRate': round(clicked_period / total_sent_period * 100, 2) if total_sent_period > 0 else 0
            },
            'campaigns': {
                'total': total_campaigns,
                'active': active_campaigns
            },
            'dailyTrend': [
                {
                    'date': str(stat.date),
                    'sent': stat.sent,
                    'opened': stat.opened or 0,
                    'clicked': stat.clicked or 0
                }
                for stat in daily_stats
            ]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# EMAIL TRACKING
# ============================================================================

@email_campaign_bp.route('/track/open/<tracking_id>')
def track_email_open(tracking_id):
    """Track email được mở (pixel tracking)"""
    try:
        log = EmailLog.query.filter_by(tracking_id=tracking_id).first()
        if log and not log.opened:
            log.opened = True
            log.opened_at = datetime.utcnow()
            
            # Cập nhật user interest profile
            if log.user_id:
                profile = UserInterestProfile.query.filter_by(user_id=log.user_id).first()
                if profile:
                    # Tính lại email_open_rate
                    total_emails = EmailLog.query.filter_by(user_id=log.user_id).count()
                    opened_emails = EmailLog.query.filter_by(user_id=log.user_id, opened=True).count()
                    profile.email_open_rate = opened_emails / total_emails if total_emails > 0 else 0
                    profile.last_email_opened_at = datetime.utcnow()
            
            db.session.commit()
        
        # Trả về transparent 1x1 pixel
        from flask import Response
        pixel = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
        return Response(pixel, mimetype='image/gif')
    except Exception as e:
        from flask import Response
        pixel = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
        return Response(pixel, mimetype='image/gif')


@email_campaign_bp.route('/track/click/<tracking_id>')
def track_email_click(tracking_id):
    """Track link click trong email"""
    try:
        redirect_url = request.args.get('url', '/')
        
        log = EmailLog.query.filter_by(tracking_id=tracking_id).first()
        if log:
            log.clicked = True
            log.clicked_at = datetime.utcnow()
            
            # Cập nhật user interest profile
            if log.user_id:
                profile = UserInterestProfile.query.filter_by(user_id=log.user_id).first()
                if profile:
                    total_emails = EmailLog.query.filter_by(user_id=log.user_id).count()
                    clicked_emails = EmailLog.query.filter_by(user_id=log.user_id, clicked=True).count()
                    profile.email_click_rate = clicked_emails / total_emails if total_emails > 0 else 0
            
            db.session.commit()
        
        from flask import redirect
        return redirect(redirect_url)
    except Exception as e:
        from flask import redirect
        return redirect('/')
