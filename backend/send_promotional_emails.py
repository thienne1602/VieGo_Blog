"""
Script gửi email khuyến mãi đến tất cả users
Phân tích dữ liệu AI và gửi email cá nhân hóa
"""
import os
import sys

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
import pymysql

pymysql.install_as_MySQLdb()

# Load environment
dotenv_path = os.path.join(backend_dir, '.env')
load_dotenv(dotenv_path)

def main():
    print("=" * 60)
    print("🚀 VieGo AI Analytics - Email Campaign")
    print("=" * 60)
    
    # Import main app
    from main import app, db
    from flask_mail import Mail
    
    mail = Mail()
    mail.init_app(app)
    
    # Check email configuration
    print(f"\n📧 Email Configuration:")
    print(f"   Server: {app.config['MAIL_SERVER']}")
    print(f"   Port: {app.config['MAIL_PORT']}")
    print(f"   Username: {app.config['MAIL_USERNAME']}")
    print(f"   Password: {'*' * len(app.config['MAIL_PASSWORD']) if app.config.get('MAIL_PASSWORD') else 'NOT SET'}")
    
    if not app.config.get('MAIL_USERNAME') or not app.config.get('MAIL_PASSWORD'):
        print("\n❌ Email chưa được cấu hình! Kiểm tra file .env")
        return
    
    with app.app_context():
        from models.user import User
        from models.tour import Tour
        from models.booking import Booking
        from models.user_behavior import UserBehavior, UserInterestProfile, PromotionalCampaign, EmailLog
        
        # Initialize services
        from utils.ai_analytics import init_analytics_service, get_analytics_service
        from utils.promotional_email import init_promotional_email_service, get_promotional_email_service
        
        analytics = get_analytics_service()
        if not analytics:
            analytics = init_analytics_service(db)
            
        email_service = get_promotional_email_service()
        if not email_service:
            email_service = init_promotional_email_service(db, mail)
        
        # Lấy danh sách users
        users = User.query.filter_by(is_active=True).all()
        print(f"\n👥 Tìm thấy {len(users)} users active")
        
        if not users:
            print("❌ Không có user nào!")
            return
        
        # Lấy danh sách tours có sẵn
        tours = Tour.query.filter_by(status='active').all()
        print(f"🏝️ Tìm thấy {len(tours)} tours active")
        
        if not tours:
            print("⚠️ Không có tour active, sử dụng tất cả tours...")
            tours = Tour.query.all()
            print(f"🏝️ Tìm thấy {len(tours)} tours tổng cộng")
        
        # Phân tích tất cả users
        print("\n🤖 Bắt đầu phân tích AI cho tất cả users...")
        for i, user in enumerate(users):
            try:
                analytics.analyze_user_interests(user.id, days=365)
                print(f"   ✓ Analyzed user {user.id}: {user.username}")
            except Exception as e:
                print(f"   ⚠️ Error analyzing user {user.id}: {e}")
        
        # Tạo campaign
        print("\n📢 Tạo campaign...")
        campaign = PromotionalCampaign(
            name=f'AI Personalized Campaign - Manual Run',
            description='Email khuyến mãi cá nhân hóa gửi đến tất cả users',
            campaign_type='weekly_personalized',
            status='active'
        )
        db.session.add(campaign)
        db.session.commit()
        print(f"   ✓ Campaign ID: {campaign.id}")
        
        # Gửi email đến từng user
        print("\n📨 Bắt đầu gửi email...")
        sent_count = 0
        failed_count = 0
        skipped_count = 0
        
        for user in users:
            try:
                # Lấy recommendations
                recommendations = analytics.get_personalized_recommendations(
                    user_id=user.id,
                    limit=5,
                    exclude_booked=True
                )
                
                # Nếu không có recommendations từ AI, lấy tours phổ biến
                if not recommendations:
                    print(f"   ⚠️ No AI recommendations for {user.email}, using popular tours...")
                    # Tạo recommendations từ tours có sẵn
                    recommendations = []
                    for tour in tours[:5]:
                        recommendations.append({
                            'id': tour.id,
                            'title': tour.title,
                            'description': tour.description[:200] + '...' if tour.description and len(tour.description) > 200 else (tour.description or ''),
                            'category': tour.category,
                            'price_per_person': tour.price_per_person,
                            'discounted_price': tour.get_discounted_price() if hasattr(tour, 'get_discounted_price') else tour.price_per_person,
                            'discount_percentage': tour.discount_percentage or 0,
                            'duration_days': tour.duration_days,
                            'featured_image': tour.featured_image,
                            'starting_location': tour.starting_location,
                            'rating': tour.rating or 0,
                            'reviews_count': tour.reviews_count or 0,
                            'match_score': None
                        })
                
                if not recommendations:
                    print(f"   ⚠️ Skipped {user.email}: No tours available")
                    skipped_count += 1
                    continue
                
                print(f"   📤 Sending to {user.email}...")
                
                # Gửi email
                result = email_service.send_promotional_email(
                    user=user,
                    recommendations=recommendations,
                    campaign_id=campaign.id,
                    campaign_type='weekly_personalized'
                )
                
                if result['success']:
                    sent_count += 1
                    print(f"   ✅ Sent to {user.email} ({len(recommendations)} tours)")
                else:
                    failed_count += 1
                    print(f"   ❌ Failed {user.email}: {result.get('error')}")
                    
            except Exception as e:
                failed_count += 1
                print(f"   ❌ Error sending to {user.email}: {e}")
                import traceback
                traceback.print_exc()
        
        # Cập nhật campaign stats
        campaign.total_sent = sent_count
        db.session.commit()
        
        # Kết quả
        print("\n" + "=" * 60)
        print("📊 KẾT QUẢ GỬI EMAIL")
        print("=" * 60)
        print(f"   ✅ Gửi thành công: {sent_count}")
        print(f"   ❌ Thất bại: {failed_count}")
        print(f"   ⏭️ Bỏ qua: {skipped_count}")
        print(f"   📧 Tổng: {len(users)}")
        print("=" * 60)


if __name__ == '__main__':
    main()
