"""
Script to test email configuration
Run this to verify your email settings are correct before using the booking confirmation feature.
"""
import os
import sys

# Add backend to path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def test_email_config():
    """Test email configuration"""
    print("=" * 60)
    print("📧 TESTING EMAIL CONFIGURATION")
    print("=" * 60)
    print()
    
    # Check environment variables
    mail_username = os.getenv('MAIL_USERNAME', '')
    mail_password = os.getenv('MAIL_PASSWORD', '')
    mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    mail_port = os.getenv('MAIL_PORT', '587')
    mail_use_tls = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    mail_use_ssl = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
    
    print("📋 Configuration:")
    print(f"   MAIL_SERVER: {mail_server}")
    print(f"   MAIL_PORT: {mail_port}")
    print(f"   MAIL_USE_TLS: {mail_use_tls}")
    print(f"   MAIL_USE_SSL: {mail_use_ssl}")
    print(f"   MAIL_USERNAME: {mail_username if mail_username else '❌ NOT SET'}")
    print(f"   MAIL_PASSWORD: {'✅ SET' if mail_password else '❌ NOT SET'}")
    print()
    
    if not mail_username or not mail_password:
        print("❌ Email configuration is incomplete!")
        print()
        print("💡 To configure email:")
        print("   1. For Gmail:")
        print("      - Enable 2-step verification: https://myaccount.google.com/security")
        print("      - Generate App Password: https://myaccount.google.com/apppasswords")
        print("      - Use App Password (16 characters) as MAIL_PASSWORD")
        print()
        print("   2. Set environment variables in run_backend.bat:")
        print("      set MAIL_USERNAME=your-email@gmail.com")
        print("      set MAIL_PASSWORD=your-app-password")
        print()
        return False
    
    # Try to send a test email
    print("🧪 Testing email connection...")
    print()
    
    try:
        from flask import Flask
        from flask_mail import Mail, Message
        
        # Create test Flask app
        test_app = Flask(__name__)
        test_app.config['MAIL_SERVER'] = mail_server
        test_app.config['MAIL_PORT'] = int(mail_port)
        test_app.config['MAIL_USE_TLS'] = mail_use_tls
        test_app.config['MAIL_USE_SSL'] = mail_use_ssl
        test_app.config['MAIL_USERNAME'] = mail_username
        test_app.config['MAIL_PASSWORD'] = mail_password
        test_app.config['MAIL_DEFAULT_SENDER'] = mail_username
        
        mail = Mail()
        mail.init_app(test_app)
        
        # Ask for recipient email
        print("📧 Enter recipient email to send test email (or press Enter to skip):")
        recipient = input("   Email: ").strip()
        
        if recipient:
            with test_app.app_context():
                msg = Message(
                    subject="🧪 Test Email from VieGo Blog",
                    recipients=[recipient],
                    body=f"""
This is a test email from VieGo Blog email system.

If you receive this email, your email configuration is working correctly!

Configuration:
- Server: {mail_server}:{mail_port}
- From: {mail_username}
- TLS: {mail_use_tls}
- SSL: {mail_use_ssl}

✅ Email system is ready to send booking confirmations!
                    """.strip(),
                    sender=mail_username
                )
                
                print(f"\n📤 Sending test email to {recipient}...")
                mail.send(msg)
                print(f"✅ Test email sent successfully!")
                print(f"   Please check your inbox at {recipient}")
        else:
            print("\n⏭️  Skipping test email send")
        
        print()
        print("=" * 60)
        print("✅ Email configuration looks good!")
        print("=" * 60)
        return True
        
    except Exception as e:
        error_str = str(e)
        print()
        print("❌ Email test failed!")
        print(f"   Error: {error_str}")
        print()
        
        if "authentication failed" in error_str.lower() or "535" in error_str:
            print("⚠️  Gmail Authentication Failed!")
            print()
            print("💡 Solution:")
            print("   1. Gmail requires an App Password (not your regular password)")
            print("   2. Enable 2-step verification:")
            print("      https://myaccount.google.com/security")
            print("   3. Generate App Password:")
            print("      https://myaccount.google.com/apppasswords")
            print("   4. Use the 16-character App Password as MAIL_PASSWORD")
            print()
        elif "connection" in error_str.lower() or "timed out" in error_str.lower():
            print("⚠️  Connection Error!")
            print("   Check your internet connection and SMTP server settings.")
            print()
        elif "ssl" in error_str.lower() or "tls" in error_str.lower():
            print("⚠️  SSL/TLS Error!")
            print("   Check MAIL_USE_TLS and MAIL_USE_SSL settings.")
            print()
        else:
            print("⚠️  Unknown error. Check the error message above.")
            print()
        
        return False

if __name__ == '__main__':
    # Load environment variables from .env if exists
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
    
    # Also check run_backend.bat environment (Windows)
    # This script should be run with the same environment as the backend
    
    success = test_email_config()
    sys.exit(0 if success else 1)

