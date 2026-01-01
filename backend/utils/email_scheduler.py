"""
Email Scheduler
Lập lịch gửi email khuyến mãi tự động hàng tuần
"""
import os
import threading
import time
from datetime import datetime, timedelta
from typing import Callable, Optional
from flask import Flask, current_app
import schedule
import logging

logger = logging.getLogger(__name__)


class EmailScheduler:
    """Scheduler gửi email khuyến mãi định kỳ"""
    
    def __init__(self, app: Flask = None):
        self.app = app
        self._running = False
        self._thread = None
        self._jobs = {}
        
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Khởi tạo scheduler với Flask app"""
        self.app = app
        
        # Lấy cấu hình từ app config
        self.weekly_day = app.config.get('PROMO_EMAIL_WEEKLY_DAY', 'monday')  # Ngày gửi trong tuần
        self.weekly_time = app.config.get('PROMO_EMAIL_WEEKLY_TIME', '09:00')  # Giờ gửi
        self.batch_size = app.config.get('PROMO_EMAIL_BATCH_SIZE', 50)  # Số email mỗi batch
        self.batch_delay = app.config.get('PROMO_EMAIL_BATCH_DELAY', 5)  # Delay giữa các batch (seconds)
        
        # Đăng ký extension
        if not hasattr(app, 'extensions'):
            app.extensions = {}
        app.extensions['email_scheduler'] = self
    
    def start(self):
        """Bắt đầu scheduler"""
        if self._running:
            logger.warning("Scheduler already running")
            return
        
        self._running = True
        
        # Setup các job định kỳ
        self._setup_jobs()
        
        # Chạy scheduler trong thread riêng
        self._thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self._thread.start()
        
        logger.info(f"Email scheduler started. Weekly emails scheduled for {self.weekly_day} at {self.weekly_time}")
    
    def stop(self):
        """Dừng scheduler"""
        self._running = False
        schedule.clear()
        
        if self._thread:
            self._thread.join(timeout=5)
            self._thread = None
        
        logger.info("Email scheduler stopped")
    
    def _setup_jobs(self):
        """Thiết lập các job định kỳ"""
        # Clear existing jobs
        schedule.clear()
        
        # Job gửi email khuyến mãi hàng tuần
        day_method = getattr(schedule.every(), self.weekly_day)
        day_method.at(self.weekly_time).do(self._run_weekly_promotional_emails)
        
        # Job phân tích dữ liệu người dùng hàng ngày (chạy lúc 2:00 AM)
        schedule.every().day.at("02:00").do(self._run_daily_analysis)
        
        # Job kiểm tra và gửi email cho campaigns active
        schedule.every().hour.do(self._check_pending_campaigns)
        
        logger.info("Scheduled jobs setup completed")
    
    def _run_scheduler(self):
        """Loop chạy scheduler"""
        while self._running:
            try:
                schedule.run_pending()
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
            time.sleep(60)  # Check mỗi phút
    
    def _run_weekly_promotional_emails(self):
        """Gửi email khuyến mãi hàng tuần"""
        logger.info("Starting weekly promotional email job")
        
        if not self.app:
            logger.error("Flask app not initialized")
            return
        
        with self.app.app_context():
            try:
                from models import db
                from models.user import User
                from models.user_behavior import PromotionalCampaign, UserInterestProfile
                from models.user_preferences import UserPreferences
                from utils.ai_analytics import get_analytics_service
                from utils.promotional_email import get_promotional_email_service
                
                # Lấy hoặc tạo campaign weekly
                campaign = PromotionalCampaign.query.filter_by(
                    campaign_type='weekly_personalized',
                    status='active'
                ).first()
                
                if not campaign:
                    # Tạo campaign mặc định
                    campaign = PromotionalCampaign(
                        name=f'Weekly Personalized - {datetime.now().strftime("%Y-%m-%d")}',
                        description='Email khuyến mãi cá nhân hóa hàng tuần',
                        campaign_type='weekly_personalized',
                        email_subject_template='🎯 {user_name}, tour được đề xuất riêng cho bạn tuần này!',
                        schedule_type='weekly',
                        status='active'
                    )
                    db.session.add(campaign)
                    db.session.commit()
                
                # Lấy danh sách người dùng đủ điều kiện
                eligible_users = self._get_eligible_users_for_weekly_email()
                
                if not eligible_users:
                    logger.info("No eligible users for weekly email")
                    return
                
                logger.info(f"Found {len(eligible_users)} eligible users for weekly email")
                
                # Gửi email theo batch
                email_service = get_promotional_email_service()
                analytics = get_analytics_service()
                
                total_sent = 0
                total_failed = 0
                
                for i in range(0, len(eligible_users), self.batch_size):
                    batch = eligible_users[i:i + self.batch_size]
                    
                    for user in batch:
                        try:
                            # Lấy recommendations cá nhân hóa
                            recommendations = analytics.get_personalized_recommendations(
                                user_id=user.id,
                                limit=5,
                                only_discounted=False
                            )
                            
                            if recommendations:
                                result = email_service.send_promotional_email(
                                    user=user,
                                    recommendations=recommendations,
                                    campaign_id=campaign.id,
                                    campaign_type='weekly_personalized'
                                )
                                
                                if result['success']:
                                    total_sent += 1
                                else:
                                    total_failed += 1
                                    logger.warning(f"Failed to send email to {user.email}: {result.get('error')}")
                        except Exception as e:
                            total_failed += 1
                            logger.error(f"Error sending email to user {user.id}: {e}")
                    
                    # Delay giữa các batch để tránh spam
                    if i + self.batch_size < len(eligible_users):
                        time.sleep(self.batch_delay)
                
                # Cập nhật campaign stats
                campaign.total_sent += total_sent
                campaign.last_run_at = datetime.utcnow()
                
                # Tính next run
                next_run = datetime.utcnow() + timedelta(days=7)
                campaign.next_run_at = next_run
                
                db.session.commit()
                
                logger.info(f"Weekly email job completed. Sent: {total_sent}, Failed: {total_failed}")
                
            except Exception as e:
                logger.error(f"Error in weekly promotional email job: {e}")
    
    def _get_eligible_users_for_weekly_email(self):
        """Lấy danh sách người dùng đủ điều kiện nhận email hàng tuần"""
        from models.user import User
        from models.user_preferences import UserPreferences
        from models.user_behavior import UserInterestProfile, EmailLog
        from datetime import datetime, timedelta
        
        # Người dùng active
        users = User.query.filter_by(is_active=True).all()
        
        eligible = []
        for user in users:
            # Kiểm tra email preferences
            prefs = UserPreferences.query.filter_by(user_id=user.id).first()
            if prefs and not prefs.email_notifications:
                continue
            if prefs and not prefs.newsletter_subscription:
                continue
            
            # Kiểm tra đã gửi email trong 7 ngày chưa
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_email = EmailLog.query.filter(
                EmailLog.user_id == user.id,
                EmailLog.sent_at >= week_ago,
                EmailLog.status.in_(['sent', 'delivered', 'opened', 'clicked'])
            ).first()
            
            if recent_email:
                continue
            
            # Kiểm tra có profile và có hoạt động
            profile = UserInterestProfile.query.filter_by(user_id=user.id).first()
            if profile and profile.engagement_level in ['low']:
                # Người dùng low engagement - vẫn gửi nhưng ít hơn (chỉ 2 tuần/lần)
                two_weeks_ago = datetime.utcnow() - timedelta(days=14)
                recent_email_2w = EmailLog.query.filter(
                    EmailLog.user_id == user.id,
                    EmailLog.sent_at >= two_weeks_ago
                ).first()
                if recent_email_2w:
                    continue
            
            eligible.append(user)
        
        return eligible
    
    def _run_daily_analysis(self):
        """Phân tích dữ liệu người dùng hàng ngày"""
        logger.info("Starting daily user analysis job")
        
        if not self.app:
            return
        
        with self.app.app_context():
            try:
                from utils.ai_analytics import get_analytics_service
                
                analytics = get_analytics_service()
                result = analytics.batch_analyze_all_users()
                
                logger.info(f"Daily analysis completed: {result}")
                
            except Exception as e:
                logger.error(f"Error in daily analysis job: {e}")
    
    def _check_pending_campaigns(self):
        """Kiểm tra và chạy các campaigns đến hạn"""
        logger.info("Checking pending campaigns")
        
        if not self.app:
            return
        
        with self.app.app_context():
            try:
                from models import db
                from models.user_behavior import PromotionalCampaign
                
                now = datetime.utcnow()
                
                # Tìm campaigns đến hạn chạy
                pending_campaigns = PromotionalCampaign.query.filter(
                    PromotionalCampaign.status == 'active',
                    PromotionalCampaign.next_run_at <= now,
                    PromotionalCampaign.campaign_type != 'weekly_personalized'  # Weekly có job riêng
                ).all()
                
                for campaign in pending_campaigns:
                    logger.info(f"Running campaign: {campaign.name}")
                    self._run_campaign(campaign)
                    
            except Exception as e:
                logger.error(f"Error checking pending campaigns: {e}")
    
    def _run_campaign(self, campaign):
        """Chạy một campaign cụ thể"""
        from models import db
        from utils.promotional_email import get_promotional_email_service
        
        try:
            email_service = get_promotional_email_service()
            
            # Lấy target users dựa trên segments
            target_users = self._get_campaign_target_users(campaign)
            
            if target_users:
                result = email_service.send_batch_promotional_emails(
                    campaign_id=campaign.id,
                    user_ids=[u.id for u in target_users],
                    campaign_type=campaign.campaign_type,
                    only_discounted=(campaign.campaign_type == 'flash_sale')
                )
                
                logger.info(f"Campaign {campaign.name} completed: {result}")
            
            # Cập nhật next_run_at
            if campaign.schedule_type == 'daily':
                campaign.next_run_at = datetime.utcnow() + timedelta(days=1)
            elif campaign.schedule_type == 'weekly':
                campaign.next_run_at = datetime.utcnow() + timedelta(days=7)
            elif campaign.schedule_type == 'monthly':
                campaign.next_run_at = datetime.utcnow() + timedelta(days=30)
            else:
                campaign.status = 'completed'
            
            campaign.last_run_at = datetime.utcnow()
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error running campaign {campaign.id}: {e}")
    
    def _get_campaign_target_users(self, campaign):
        """Lấy danh sách người dùng target cho campaign"""
        from models.user import User
        from models.user_behavior import UserInterestProfile
        
        users = User.query.filter_by(is_active=True).all()
        
        # Filter theo segments
        segments = campaign.get_target_segments()
        if not segments:
            return users
        
        target_users = []
        for user in users:
            profile = UserInterestProfile.query.filter_by(user_id=user.id).first()
            
            # Check các điều kiện
            if 'high_value' in segments and profile and profile.total_spent < 50000000:
                continue
            if 'frequent_bookers' in segments and profile and profile.total_bookings < 5:
                continue
            if campaign.min_engagement_level:
                engagement_order = ['low', 'medium', 'high', 'very_high']
                if profile:
                    user_level = engagement_order.index(profile.engagement_level) if profile.engagement_level in engagement_order else 0
                    min_level = engagement_order.index(campaign.min_engagement_level) if campaign.min_engagement_level in engagement_order else 0
                    if user_level < min_level:
                        continue
            
            target_users.append(user)
        
        return target_users
    
    def run_campaign_now(self, campaign_id: int) -> dict:
        """Chạy một campaign ngay lập tức"""
        if not self.app:
            return {'success': False, 'error': 'App not initialized'}
        
        with self.app.app_context():
            from models.user_behavior import PromotionalCampaign
            
            campaign = PromotionalCampaign.query.get(campaign_id)
            if not campaign:
                return {'success': False, 'error': 'Campaign not found'}
            
            self._run_campaign(campaign)
            return {'success': True, 'message': f'Campaign {campaign.name} executed'}
    
    def get_scheduler_status(self) -> dict:
        """Lấy trạng thái scheduler"""
        jobs = []
        for job in schedule.get_jobs():
            jobs.append({
                'job': str(job),
                'next_run': str(job.next_run) if job.next_run else None
            })
        
        return {
            'running': self._running,
            'weekly_day': self.weekly_day,
            'weekly_time': self.weekly_time,
            'jobs': jobs
        }


# Global instance
_scheduler = None

def get_email_scheduler():
    """Lấy instance của EmailScheduler"""
    global _scheduler
    return _scheduler

def init_email_scheduler(app: Flask):
    """Khởi tạo email scheduler"""
    global _scheduler
    _scheduler = EmailScheduler(app)
    return _scheduler

def start_email_scheduler():
    """Bắt đầu email scheduler"""
    global _scheduler
    if _scheduler:
        _scheduler.start()

def stop_email_scheduler():
    """Dừng email scheduler"""
    global _scheduler
    if _scheduler:
        _scheduler.stop()
