"""
Quick Setup Script for Chat & Friend Testing
Creates test users and verifies system is ready for testing
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import db
from models.user import User
from models.chat import Chat
from models.friendship import FriendRequest
from flask import Flask
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def create_app():
    """Create Flask app for database operations"""
    app = Flask(__name__)
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"mysql://{os.getenv('DB_USER', 'root')}:"
        f"{os.getenv('DB_PASSWORD', '')}@"
        f"{os.getenv('DB_HOST', 'localhost')}:"
        f"{os.getenv('DB_PORT', '3306')}/"
        f"{os.getenv('DB_NAME', 'viego_blog')}"
        f"?charset=utf8mb4"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    return app


def create_test_users(app):
    """Create test users for chat and friend testing"""
    with app.app_context():
        print("\n" + "="*80)
        print("🚀 CREATING TEST USERS")
        print("="*80 + "\n")
        
        test_users = [
            {
                'username': 'testuser1',
                'email': 'test1@example.com',
                'password': 'password123',
                'full_name': 'Test User 1',
                'role': 'user'
            },
            {
                'username': 'testuser2',
                'email': 'test2@example.com',
                'password': 'password123',
                'full_name': 'Test User 2',
                'role': 'user'
            },
            {
                'username': 'testuser3',
                'email': 'test3@example.com',
                'password': 'password123',
                'full_name': 'Test User 3',
                'role': 'user'
            }
        ]
        
        created_users = []
        
        for user_data in test_users:
            # Check if user already exists
            existing_user = User.query.filter_by(username=user_data['username']).first()
            
            if existing_user:
                print(f"✓ User '{user_data['username']}' already exists (ID: {existing_user.id})")
                created_users.append(existing_user)
            else:
                # Create new user
                user = User(
                    username=user_data['username'],
                    email=user_data['email'],
                    full_name=user_data['full_name'],
                    role=user_data['role'],
                    is_active=True,
                    is_verified=True
                )
                user.set_password(user_data['password'])
                
                db.session.add(user)
                db.session.commit()
                
                print(f"✓ Created user '{user.username}' (ID: {user.id})")
                created_users.append(user)
        
        print(f"\n✅ Total users: {len(created_users)}")
        
        return created_users


def cleanup_test_data(app):
    """Clean up old test data"""
    with app.app_context():
        print("\n" + "="*80)
        print("🧹 CLEANING UP OLD TEST DATA")
        print("="*80 + "\n")
        
        test_usernames = ['testuser1', 'testuser2', 'testuser3']
        test_users = User.query.filter(User.username.in_(test_usernames)).all()
        test_user_ids = [u.id for u in test_users]
        
        if not test_user_ids:
            print("✓ No test users found, nothing to clean")
            return
        
        # Delete friend requests
        friend_requests = FriendRequest.query.filter(
            (FriendRequest.requester_id.in_(test_user_ids)) |
            (FriendRequest.receiver_id.in_(test_user_ids))
        ).all()
        
        for fr in friend_requests:
            db.session.delete(fr)
        
        print(f"✓ Deleted {len(friend_requests)} friend requests")
        
        # Delete chat messages
        messages = Chat.query.filter(
            (Chat.sender_id.in_(test_user_ids)) |
            (Chat.receiver_id.in_(test_user_ids))
        ).all()
        
        for msg in messages:
            db.session.delete(msg)
        
        print(f"✓ Deleted {len(messages)} chat messages")
        
        # Reset friends lists
        for user in test_users:
            user.set_friends([])
        
        db.session.commit()
        print(f"✓ Reset friends lists for {len(test_users)} users")
        
        print("\n✅ Cleanup complete")


def verify_system_status(app):
    """Verify system is ready for testing"""
    with app.app_context():
        print("\n" + "="*80)
        print("🔍 VERIFYING SYSTEM STATUS")
        print("="*80 + "\n")
        
        # Check database connection
        try:
            db.session.execute('SELECT 1')
            print("✓ Database connection: OK")
        except Exception as e:
            print(f"✗ Database connection: FAILED - {e}")
            return False
        
        # Check if test users exist
        test_usernames = ['testuser1', 'testuser2', 'testuser3']
        test_users = User.query.filter(User.username.in_(test_usernames)).all()
        
        if len(test_users) == 3:
            print(f"✓ Test users: OK (3 users found)")
        else:
            print(f"✗ Test users: INCOMPLETE (only {len(test_users)} found)")
            return False
        
        # Check tables exist
        tables = ['users', 'chats', 'friend_requests', 'notifications']
        for table_name in tables:
            try:
                db.session.execute(f'SELECT 1 FROM {table_name} LIMIT 1')
                print(f"✓ Table '{table_name}': OK")
            except Exception as e:
                print(f"✗ Table '{table_name}': MISSING")
                return False
        
        # Print test user credentials
        print("\n" + "-"*80)
        print("📝 TEST USER CREDENTIALS")
        print("-"*80)
        for i, user in enumerate(test_users, 1):
            print(f"\nUser {i}:")
            print(f"  • Username: {user.username}")
            print(f"  • Email: {user.email}")
            print(f"  • Password: password123")
            print(f"  • ID: {user.id}")
            print(f"  • Active: {user.is_active}")
            print(f"  • Friends: {len(user.get_friends())}")
        
        print("\n✅ System is ready for testing!")
        return True


def print_usage_instructions():
    """Print usage instructions"""
    print("\n" + "="*80)
    print("📚 HOW TO USE")
    print("="*80 + "\n")
    
    print("1️⃣  Start the backend server:")
    print("   cd backend")
    print("   python main.py")
    print()
    
    print("2️⃣  Run unit tests:")
    print("   cd backend")
    print("   python -m pytest tests/test_chat_and_friends_complete.py -v")
    print()
    
    print("3️⃣  Run real-time chat test:")
    print("   cd backend")
    print("   python tests/test_realtime_chat.py")
    print()
    
    print("4️⃣  Test manually with Postman or frontend:")
    print("   • Login with test users")
    print("   • Send friend requests")
    print("   • Chat with friends")
    print()
    
    print("📖 For detailed documentation, see:")
    print("   backend/README_CHAT_AND_FRIENDS_TESTING.md")
    print()


def main():
    """Main function"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║              CHAT & FRIEND SYSTEM - QUICK SETUP SCRIPT                       ║
║                                                                              ║
║  This script will:                                                           ║
║    • Create test users for testing                                          ║
║    • Clean up old test data                                                 ║
║    • Verify system is ready                                                 ║
║    • Show usage instructions                                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    # Create app
    app = create_app()
    
    # Menu
    print("\nWhat would you like to do?")
    print("1. Create test users (or verify existing)")
    print("2. Clean up old test data")
    print("3. Verify system status")
    print("4. Full setup (clean + create + verify)")
    print("5. Exit")
    
    choice = input("\nEnter your choice (1-5): ").strip()
    
    if choice == '1':
        create_test_users(app)
        verify_system_status(app)
        print_usage_instructions()
    
    elif choice == '2':
        cleanup_test_data(app)
        print("\n✅ Cleanup complete. You may want to create test users again.")
    
    elif choice == '3':
        verify_system_status(app)
        print_usage_instructions()
    
    elif choice == '4':
        cleanup_test_data(app)
        create_test_users(app)
        if verify_system_status(app):
            print_usage_instructions()
    
    elif choice == '5':
        print("\n👋 Goodbye!")
    
    else:
        print("\n❌ Invalid choice. Exiting.")


if __name__ == '__main__':
    main()
