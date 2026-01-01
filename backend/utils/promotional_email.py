"""
Promotional Email Service
Gửi email khuyến mãi cá nhân hóa dựa trên phân tích AI
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from flask import Flask, current_app, url_for, has_app_context
from flask_mail import Mail, Message
import json

from utils.ai_analytics import get_analytics_service


class PromotionalEmailService:
    """Service gửi email khuyến mãi"""
    
    # Email templates
    TEMPLATES = {
        'weekly_personalized': {
            'subject': '🎯 {user_name}, {count} tour được đề xuất riêng cho bạn tuần này!',
            'preview': 'Dựa trên sở thích của bạn, chúng tôi đã chọn ra những tour tuyệt vời nhất...'
        },
        'flash_sale': {
            'subject': '⚡ Flash Sale! Giảm đến {max_discount}% - Chỉ trong {hours} giờ!',
            'preview': 'Đừng bỏ lỡ cơ hội tiết kiệm lớn cho chuyến du lịch của bạn...'
        },
        'new_tours': {
            'subject': '🆕 Tour mới đã có! Khám phá ngay {location}',
            'preview': 'Chúng tôi vừa ra mắt những tour mới tuyệt vời...'
        },
        're_engagement': {
            'subject': '👋 {user_name}, chúng tôi nhớ bạn! Quay lại với ưu đãi đặc biệt',
            'preview': 'Đã lâu rồi bạn chưa ghé thăm VieGo. Hãy quay lại với ưu đãi...'
        }
    }
    
    def __init__(self, db, mail=None):
        self.db = db
        self.mail = mail
        self._frontend_url = None
    
    @property
    def frontend_url(self):
        if self._frontend_url is None:
            if has_app_context():
                self._frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
            else:
                self._frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        return self._frontend_url
    
    def generate_tracking_id(self) -> str:
        """Tạo tracking ID duy nhất cho email"""
        return str(uuid.uuid4())
    
    def create_email_log(self, campaign_id: int, user_id: int, email: str,
                         subject: str, tour_ids: List[int]) -> 'EmailLog':
        """Tạo log email"""
        from models.user_behavior import EmailLog
        
        log = EmailLog(
            campaign_id=campaign_id,
            user_id=user_id,
            email_address=email,
            subject=subject,
            tracking_id=self.generate_tracking_id()
        )
        log.set_recommended_tours(tour_ids)
        
        self.db.session.add(log)
        self.db.session.commit()
        return log
    
    def build_personalized_email(self, user, recommendations: List[Dict],
                                  campaign_type: str = 'weekly_personalized') -> Dict:
        """Tạo nội dung email cá nhân hóa"""
        
        user_name = user.full_name or user.username or 'bạn'
        
        # Build subject
        template = self.TEMPLATES.get(campaign_type, self.TEMPLATES['weekly_personalized'])
        
        subject = template['subject'].format(
            user_name=user_name,
            count=len(recommendations),
            max_discount=max([r.get('discount_percentage', 0) for r in recommendations]) if recommendations else 0,
            hours=24,
            location=recommendations[0].get('starting_location', 'Việt Nam') if recommendations else 'Việt Nam'
        )
        
        # Build HTML content
        html_content = self._build_email_html(user, recommendations, campaign_type)
        text_content = self._build_email_text(user, recommendations, campaign_type)
        
        return {
            'subject': subject,
            'html': html_content,
            'text': text_content,
            'tour_ids': [r['id'] for r in recommendations]
        }
    
    def _build_email_html(self, user, recommendations: List[Dict], campaign_type: str) -> str:
        """Tạo nội dung HTML cho email"""
        
        user_name = user.full_name or user.username or 'bạn'
        
        # Header message based on campaign type
        header_messages = {
            'weekly_personalized': f'Xin chào <strong>{user_name}</strong>! Dựa trên sở thích du lịch của bạn, chúng tôi đã chọn ra những tour tuyệt vời nhất dành riêng cho bạn tuần này.',
            'flash_sale': f'<strong>{user_name}</strong> ơi! Đừng bỏ lỡ cơ hội tiết kiệm lớn với Flash Sale độc quyền!',
            'new_tours': f'<strong>{user_name}</strong>, khám phá những tour mới nhất vừa được ra mắt!',
            're_engagement': f'<strong>{user_name}</strong>, chúng tôi nhớ bạn! Quay lại với những ưu đãi đặc biệt.'
        }
        
        header_msg = header_messages.get(campaign_type, header_messages['weekly_personalized'])
        
        # Tour cards HTML
        tour_cards = ''
        for tour in recommendations[:5]:  # Tối đa 5 tour
            discount_badge = ''
            if tour.get('discount_percentage', 0) > 0:
                discount_badge = f'''
                <span style="background: #e74c3c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                    -{tour['discount_percentage']}%
                </span>
                '''
            
            price_display = f"{tour.get('discounted_price', tour.get('price_per_person', 0)):,.0f} VND"
            original_price = ''
            if tour.get('discount_percentage', 0) > 0:
                original_price = f'<span style="text-decoration: line-through; color: #999; font-size: 14px;">{tour.get("price_per_person", 0):,.0f} VND</span>'
            
            match_badge = ''
            if tour.get('match_score'):
                match_badge = f'''
                <span style="background: #27ae60; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                    {tour['match_score']:.0f}% phù hợp
                </span>
                '''
            
            tour_url = f"{self.frontend_url}/tours/{tour['id']}"
            image_url = tour.get('featured_image', f"{self.frontend_url}/images/default-tour.jpg")
            
            tour_cards += f'''
            <div style="border: 1px solid #e0e0e0; border-radius: 12px; margin-bottom: 20px; overflow: hidden; background: white;">
                <img src="{image_url}" alt="{tour['title']}" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <h3 style="margin: 0; font-size: 18px; color: #333; flex: 1;">{tour['title']}</h3>
                        {discount_badge}
                    </div>
                    <p style="color: #666; font-size: 14px; margin: 8px 0; line-height: 1.5;">
                        {tour.get('description', '')[:150]}...
                    </p>
                    <div style="display: flex; gap: 10px; margin: 12px 0; flex-wrap: wrap;">
                        <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            📍 {tour.get('starting_location', 'Việt Nam')}
                        </span>
                        <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            🗓️ {tour.get('duration_days', 1)} ngày
                        </span>
                        <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            ⭐ {tour.get('rating', 0):.1f}
                        </span>
                        {match_badge}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
                        <div>
                            {original_price}
                            <div style="font-size: 20px; font-weight: bold; color: #e74c3c;">{price_display}</div>
                        </div>
                        <a href="{tour_url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Xem chi tiết →
                        </a>
                    </div>
                </div>
            </div>
            '''
        
        # Full HTML
        html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🌍 VieGo</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Khám phá Việt Nam theo cách của bạn</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px 20px;">
                    <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 24px;">
                        {header_msg}
                    </p>
                    
                    <h2 style="color: #333; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                        🎯 Tour được đề xuất cho bạn
                    </h2>
                    
                    {tour_cards}
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="{self.frontend_url}/tours" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                            Xem tất cả tour →
                        </a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #f8f9fa; padding: 24px 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                        Email này được gửi tự động dựa trên sở thích du lịch của bạn.
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        <a href="{self.frontend_url}/settings/notifications" style="color: #667eea;">Quản lý đăng ký</a> |
                        <a href="{self.frontend_url}/unsubscribe" style="color: #667eea;">Hủy đăng ký</a>
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                        © 2025 VieGo. Khám phá Việt Nam.
                    </p>
                </div>
            </div>
        </body>
        </html>
        '''
        
        return html
    
    def _build_email_text(self, user, recommendations: List[Dict], campaign_type: str) -> str:
        """Tạo nội dung text cho email"""
        
        user_name = user.full_name or user.username or 'bạn'
        
        text = f"""Xin chào {user_name}!

Dựa trên sở thích du lịch của bạn, chúng tôi đã chọn ra những tour tuyệt vời nhất dành riêng cho bạn tuần này.

=== TOUR ĐƯỢC ĐỀ XUẤT ===

"""
        for tour in recommendations[:5]:
            price = f"{tour.get('discounted_price', tour.get('price_per_person', 0)):,.0f} VND"
            discount = f" (Giảm {tour['discount_percentage']}%)" if tour.get('discount_percentage', 0) > 0 else ""
            
            text += f"""
📍 {tour['title']}
   Địa điểm: {tour.get('starting_location', 'Việt Nam')}
   Thời gian: {tour.get('duration_days', 1)} ngày
   Giá: {price}{discount}
   Xem chi tiết: {self.frontend_url}/tours/{tour['id']}

---
"""
        
        text += f"""

Xem tất cả tour tại: {self.frontend_url}/tours

---
Email này được gửi tự động dựa trên sở thích du lịch của bạn.
Hủy đăng ký: {self.frontend_url}/unsubscribe

© 2025 VieGo. Khám phá Việt Nam.
"""
        
        return text
    
    def send_promotional_email(self, user, recommendations: List[Dict],
                                campaign_id: int = None,
                                campaign_type: str = 'weekly_personalized') -> Dict:
        """Gửi email khuyến mãi cho một người dùng"""
        from models.user_behavior import EmailLog
        
        try:
            # Check if user allows email notifications
            from models.user_preferences import UserPreferences
            prefs = UserPreferences.query.filter_by(user_id=user.id).first()
            if prefs and not prefs.email_notifications:
                return {'success': False, 'error': 'User has disabled email notifications'}
            
            # Build email content
            email_data = self.build_personalized_email(user, recommendations, campaign_type)
            
            # Create email log
            log = self.create_email_log(
                campaign_id=campaign_id,
                user_id=user.id,
                email=user.email,
                subject=email_data['subject'],
                tour_ids=email_data['tour_ids']
            )
            
            # Get mail config
            if has_app_context():
                mail_username = current_app.config.get('MAIL_USERNAME', '')
                mail_password = (current_app.config.get('MAIL_PASSWORD', '') or '').strip().replace(' ', '')
                mail_sender = current_app.config.get('MAIL_DEFAULT_SENDER', mail_username)
                mail_server = current_app.config.get('MAIL_SERVER', os.getenv('MAIL_SERVER', 'smtp.gmail.com'))
                mail_port = int(current_app.config.get('MAIL_PORT', os.getenv('MAIL_PORT', '587')))
                mail_use_tls = bool(current_app.config.get('MAIL_USE_TLS', True))
            else:
                mail_username = os.getenv('MAIL_USERNAME', '')
                mail_password = (os.getenv('MAIL_PASSWORD', '') or '').strip().replace(' ', '')
                mail_sender = os.getenv('MAIL_DEFAULT_SENDER', mail_username)
                mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
                mail_port = int(os.getenv('MAIL_PORT', '587'))
                mail_use_tls = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
            
            if not mail_username or not mail_password:
                log.status = 'failed'
                log.error_message = 'Email not configured'
                self.db.session.commit()
                return {'success': False, 'error': 'Email not configured'}
            
            # Add tracking pixel to HTML
            tracking_pixel = f'<img src="{self.frontend_url}/api/email/track/open/{log.tracking_id}" width="1" height="1" style="display:none;">'
            html_with_tracking = email_data['html'].replace('</body>', f'{tracking_pixel}</body>')
            
            # Create message
            msg = Message(
                subject=email_data['subject'],
                recipients=[user.email],
                body=email_data['text'],
                html=html_with_tracking,
                sender=mail_sender
            )
            
            # Send email
            if self.mail and has_app_context():
                self.mail.send(msg)
            else:
                # Create temporary mail instance
                temp_app = Flask(__name__)
                temp_app.config['MAIL_SERVER'] = mail_server
                temp_app.config['MAIL_PORT'] = mail_port
                temp_app.config['MAIL_USE_TLS'] = mail_use_tls
                temp_app.config['MAIL_USE_SSL'] = False
                temp_app.config['MAIL_USERNAME'] = mail_username
                temp_app.config['MAIL_PASSWORD'] = mail_password
                temp_app.config['MAIL_DEFAULT_SENDER'] = mail_sender
                
                temp_mail = Mail()
                temp_mail.init_app(temp_app)
                with temp_app.app_context():
                    temp_mail.send(msg)
            
            # Update log
            log.status = 'sent'
            log.sent_at = datetime.utcnow()
            self.db.session.commit()
            
            return {
                'success': True,
                'tracking_id': log.tracking_id,
                'tours_recommended': len(recommendations)
            }
            
        except Exception as e:
            # Update log with error
            if 'log' in locals():
                log.status = 'failed'
                log.error_message = str(e)
                self.db.session.commit()
            
            if has_app_context():
                current_app.logger.error(f"Error sending promotional email to {user.email}: {e}")
            
            return {'success': False, 'error': str(e)}
    
    def send_batch_promotional_emails(self, campaign_id: int, user_ids: List[int] = None,
                                       campaign_type: str = 'weekly_personalized',
                                       only_discounted: bool = False) -> Dict:
        """Gửi email khuyến mãi hàng loạt"""
        from models.user import User
        from models.user_behavior import PromotionalCampaign
        
        analytics = get_analytics_service()
        
        # Get campaign
        campaign = PromotionalCampaign.query.get(campaign_id) if campaign_id else None
        
        # Get users
        if user_ids:
            users = User.query.filter(User.id.in_(user_ids), User.is_active == True).all()
        else:
            users = User.query.filter_by(is_active=True).all()
        
        results = {
            'total': len(users),
            'sent': 0,
            'failed': 0,
            'skipped': 0,
            'errors': []
        }
        
        for user in users:
            try:
                # Get personalized recommendations
                recommendations = analytics.get_personalized_recommendations(
                    user_id=user.id,
                    limit=5,
                    only_discounted=only_discounted
                )
                
                if not recommendations:
                    results['skipped'] += 1
                    continue
                
                # Send email
                result = self.send_promotional_email(
                    user=user,
                    recommendations=recommendations,
                    campaign_id=campaign_id,
                    campaign_type=campaign_type
                )
                
                if result['success']:
                    results['sent'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append({
                        'user_id': user.id,
                        'error': result.get('error')
                    })
                    
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'user_id': user.id,
                    'error': str(e)
                })
        
        # Update campaign stats
        if campaign:
            campaign.total_sent += results['sent']
            campaign.last_run_at = datetime.utcnow()
            self.db.session.commit()
        
        return results
    
    def track_email_open(self, tracking_id: str) -> bool:
        """Ghi nhận email được mở"""
        from models.user_behavior import EmailLog, UserInterestProfile
        
        log = EmailLog.query.filter_by(tracking_id=tracking_id).first()
        if not log:
            return False
        
        if log.status not in ['opened', 'clicked']:
            log.status = 'opened'
            log.opened_at = datetime.utcnow()
            
            # Update campaign stats
            if log.campaign:
                log.campaign.total_opened += 1
            
            # Update user profile email engagement
            profile = UserInterestProfile.query.filter_by(user_id=log.user_id).first()
            if profile:
                # Update email open rate
                total_emails = EmailLog.query.filter_by(user_id=log.user_id).count()
                opened_emails = EmailLog.query.filter(
                    EmailLog.user_id == log.user_id,
                    EmailLog.status.in_(['opened', 'clicked'])
                ).count()
                profile.email_open_rate = opened_emails / total_emails if total_emails > 0 else 0
                profile.last_email_opened_at = datetime.utcnow()
            
            # Track behavior
            analytics = get_analytics_service()
            if analytics:
                analytics.track_behavior(
                    user_id=log.user_id,
                    action_type='open_email',
                    target_id=log.campaign_id,
                    target_type='campaign',
                    metadata={'tracking_id': tracking_id}
                )
            
            self.db.session.commit()
        
        return True
    
    def track_email_click(self, tracking_id: str, tour_id: int = None) -> bool:
        """Ghi nhận click từ email"""
        from models.user_behavior import EmailLog, UserInterestProfile
        
        log = EmailLog.query.filter_by(tracking_id=tracking_id).first()
        if not log:
            return False
        
        log.status = 'clicked'
        log.clicked_at = datetime.utcnow()
        
        # Update campaign stats
        if log.campaign:
            log.campaign.total_clicked += 1
        
        # Update user profile
        profile = UserInterestProfile.query.filter_by(user_id=log.user_id).first()
        if profile:
            total_emails = EmailLog.query.filter_by(user_id=log.user_id).count()
            clicked_emails = EmailLog.query.filter(
                EmailLog.user_id == log.user_id,
                EmailLog.status == 'clicked'
            ).count()
            profile.email_click_rate = clicked_emails / total_emails if total_emails > 0 else 0
        
        # Track behavior
        analytics = get_analytics_service()
        if analytics:
            analytics.track_behavior(
                user_id=log.user_id,
                action_type='click_email_link',
                target_id=tour_id or log.campaign_id,
                target_type='tour' if tour_id else 'campaign',
                metadata={'tracking_id': tracking_id, 'tour_id': tour_id}
            )
        
        self.db.session.commit()
        return True


# Singleton
_email_service = None

def get_promotional_email_service(db=None, mail=None):
    """Lấy instance của PromotionalEmailService"""
    global _email_service
    if _email_service is None and db is not None:
        _email_service = PromotionalEmailService(db, mail)
    return _email_service

def init_promotional_email_service(db, mail=None):
    """Khởi tạo promotional email service"""
    global _email_service
    _email_service = PromotionalEmailService(db, mail)
    return _email_service
