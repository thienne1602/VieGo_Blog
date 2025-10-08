"""
Script to seed test data for Admin Dashboard testing
Tạo dữ liệu test cho việc kiểm tra các chức năng CRUD của Admin Dashboard
Run from root: python -m database.seed_admin_test_data
Or cd backend && python ../database/seed_admin_test_data.py
"""

from datetime import datetime, timedelta
import random
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from models import db
from models.user import User
from models.post import Post
from models.comment import Comment
from models.report import Report
from main import app

def seed_test_data():
    """Seed test data for admin dashboard testing"""
    
    with app.app_context():
        print("🌱 Seeding test data...")
        
        # Create test users
        print("\n👤 Creating test users...")
        test_users = []
        
        # Admin user
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(username='admin', email='admin@viegoblog.com', password='admin123')
            admin.full_name = 'Admin User'
            admin.role = 'admin'
            admin.is_active = True
            admin.email_verified = True
            db.session.add(admin)
            test_users.append(admin)
            print("  ✅ Created admin user")
        else:
            test_users.append(admin)
            print("  ℹ️  Admin user already exists")
        
        # Moderator user
        moderator = User.query.filter_by(username='moderator').first()
        if not moderator:
            moderator = User(username='moderator', email='moderator@viegoblog.com', password='mod123')
            moderator.full_name = 'Moderator User'
            moderator.role = 'moderator'
            moderator.is_active = True
            moderator.email_verified = True
            db.session.add(moderator)
            test_users.append(moderator)
            print("  ✅ Created moderator user")
        else:
            test_users.append(moderator)
            print("  ℹ️  Moderator user already exists")
        
        # Regular users
        for i in range(1, 11):
            username = f'testuser{i}'
            user = User.query.filter_by(username=username).first()
            if not user:
                user = User(username=username, email=f'user{i}@test.com', password='user123')
                user.full_name = f'Test User {i}'
                user.role = 'user'
                user.is_active = True
                user.email_verified = i % 3 == 0  # Every 3rd user is verified
                user.bio = f'I am test user number {i}'
                user.location = 'Vietnam'
                user.points = random.randint(0, 1000)
                user.level = random.randint(1, 10)
                db.session.add(user)
                test_users.append(user)
        
        db.session.commit()
        print(f"  ✅ Created {len(test_users)} users")
        
        # Create test posts
        print("\n📝 Creating test posts...")
        categories = ['travel', 'food', 'culture', 'nature', 'city', 'adventure']
        statuses = ['draft', 'published', 'published', 'published']  # More published than draft
        
        test_posts = []
        for i in range(1, 21):
            title = f'Test Post {i} - {random.choice(["Amazing Vietnam", "Food Journey", "Culture Discovery", "Travel Tips"])}'
            slug = f'test-post-{i}'
            
            post = Post.query.filter_by(slug=slug).first()
            if not post:
                author = random.choice(test_users[:5])  # First 5 users as authors
                status = random.choice(statuses)
                
                post = Post(
                    title=title,
                    slug=slug,
                    content=f'This is the content of test post {i}. It contains information about traveling in Vietnam.',
                    excerpt=f'Excerpt for test post {i}',
                    author_id=author.id,
                    status=status,
                    category=random.choice(categories),
                    featured=i % 5 == 0,  # Every 5th post is featured
                    views_count=random.randint(0, 1000),
                    likes_count=random.randint(0, 100),
                    comments_count=0,  # Will be updated when comments are added
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
                )
                
                if status == 'published':
                    post.published_at = post.created_at
                
                db.session.add(post)
                test_posts.append(post)
        
        db.session.commit()
        print(f"  ✅ Created {len(test_posts)} posts")
        
        # Get all posts for comments
        all_posts = Post.query.all()
        
        # Create test comments
        print("\n💬 Creating test comments...")
        comment_contents = [
            "Great post! Thanks for sharing.",
            "This is very informative.",
            "I love this content!",
            "Can you share more details?",
            "Amazing photos!",
            "I've been there, it's beautiful!",
            "Thanks for the tips.",
            "Very helpful information.",
        ]
        
        test_comments = []
        for i in range(1, 31):
            post = random.choice(all_posts)
            author = random.choice(test_users)
            
            comment = Comment(
                content=random.choice(comment_contents),
                author_id=author.id,
                post_id=post.id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 20))
            )
            db.session.add(comment)
            test_comments.append(comment)
            
            # Update post comments count
            post.comments_count += 1
        
        db.session.commit()
        print(f"  ✅ Created {len(test_comments)} comments")
        
        # Create test reports
        print("\n🚨 Creating test reports...")
        report_types = ['post', 'comment', 'user']
        reasons = ['spam', 'harassment', 'inappropriate_content', 'hate_speech']
        priorities = ['low', 'medium', 'high', 'urgent']
        statuses = ['pending', 'reviewing', 'resolved', 'dismissed']
        
        test_reports = []
        for i in range(1, 16):
            reporter = random.choice(test_users)
            report_type = random.choice(report_types)
            
            # Get target based on type
            if report_type == 'post':
                target_id = random.choice(all_posts).id
            elif report_type == 'comment':
                target_id = random.choice(test_comments).id if test_comments else 1
            else:  # user
                target_id = random.choice(test_users).id
            
            status = random.choice(statuses)
            
            report = Report(
                reporter_id=reporter.id,
                report_type=report_type,
                target_id=target_id,
                reason=random.choice(reasons),
                description=f'This is a test report #{i}. The content violates community guidelines.',
                status=status,
                priority=random.choice(priorities),
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 15))
            )
            
            # If resolved or dismissed, add resolver info
            if status in ['resolved', 'dismissed']:
                report.resolved_by = admin.id
                report.resolved_at = datetime.utcnow() - timedelta(days=random.randint(0, 5))
                report.resolution_notes = f'Report #{i} has been handled by admin.'
                if status == 'resolved':
                    report.action_taken = random.choice(['content_removed', 'user_warned', 'none'])
            
            db.session.add(report)
            test_reports.append(report)
        
        db.session.commit()
        print(f"  ✅ Created {len(test_reports)} reports")
        
        # Print summary
        print("\n" + "="*50)
        print("✅ Test data seeded successfully!")
        print("="*50)
        print(f"\n📊 Summary:")
        print(f"  👤 Users: {User.query.count()}")
        print(f"  📝 Posts: {Post.query.count()}")
        print(f"  💬 Comments: {Comment.query.count()}")
        print(f"  🚨 Reports: {Report.query.count()}")
        print(f"\n🔑 Login Credentials:")
        print(f"  Admin: admin / admin123")
        print(f"  Moderator: moderator / mod123")
        print(f"  Users: testuser1-10 / user123")
        print("\n🌐 Access Admin Dashboard:")
        print("  http://localhost:3001/dashboard/admin")
        print("="*50)

if __name__ == '__main__':
    seed_test_data()
