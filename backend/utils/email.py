"""
Email utility functions for sending notifications
"""
import os
from flask import Flask, current_app, has_app_context
from flask_mail import Mail, Message

mail = Mail()


def send_password_reset_email(recipient_email: str, username: str, new_password: str, full_name: str = None):
    """Send a password reset email (new password) using system email configuration."""
    try:
        # Prefer the running Flask app configuration (which already loads backend/.env)
        # so we send using the same credentials as other working emails.
        if has_app_context():
            mail_username = current_app.config.get('MAIL_USERNAME', '')
            mail_password = (current_app.config.get('MAIL_PASSWORD', '') or '').strip().replace(' ', '')
            mail_sender = current_app.config.get('MAIL_DEFAULT_SENDER', mail_username)
            mail_server = current_app.config.get('MAIL_SERVER', os.getenv('MAIL_SERVER', 'smtp.gmail.com'))
            mail_port = int(current_app.config.get('MAIL_PORT', os.getenv('MAIL_PORT', '587')))
            mail_use_tls = bool(current_app.config.get('MAIL_USE_TLS', os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'))
            mail_use_ssl = bool(current_app.config.get('MAIL_USE_SSL', os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'))
        else:
            mail_username = os.getenv('MAIL_USERNAME', '')
            mail_password = (os.getenv('MAIL_PASSWORD', '') or '').strip().replace(' ', '')
            mail_sender = os.getenv('MAIL_DEFAULT_SENDER', mail_username)
            mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
            mail_port = int(os.getenv('MAIL_PORT', '587'))
            mail_use_tls = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
            mail_use_ssl = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'

        if not mail_username or not mail_password:
            return False, 'email_not_configured'

        display_name = full_name or username or "bạn"
        subject = "VieGo - Mật khẩu mới của bạn"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset=\"UTF-8\">
        </head>
        <body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">
            <div style=\"max-width: 600px; margin: 0 auto; padding: 20px;\">
                <h2>Xin chào {display_name},</h2>
                <p>Bạn vừa yêu cầu đặt lại mật khẩu trên VieGo.</p>
                <p><strong>Tên đăng nhập:</strong> {username}</p>
                <p><strong>Mật khẩu mới:</strong> <span style=\"font-size: 18px;\">{new_password}</span></p>
                <p>Vui lòng đăng nhập bằng mật khẩu mới và đổi lại mật khẩu trong phần Cài đặt để an toàn hơn.</p>
                <hr />
                <p style=\"font-size: 12px; color: #666;\">Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        </body>
        </html>
        """

        text_body = f"""Xin chào {display_name},

Bạn vừa yêu cầu đặt lại mật khẩu trên VieGo.

Tên đăng nhập: {username}
Mật khẩu mới: {new_password}

Vui lòng đăng nhập bằng mật khẩu mới và đổi lại mật khẩu trong phần Cài đặt.
"""

        msg = Message(
            subject=subject,
            recipients=[recipient_email],
            body=text_body,
            html=html_body,
            sender=mail_sender,
        )

        # If we're in an app context, use the configured global Mail instance.
        # Otherwise, create a temporary Mail instance like other email utilities.
        if has_app_context():
            mail.send(msg)
        else:
            temp_app = Flask(__name__)
            temp_app.config['MAIL_SERVER'] = mail_server
            temp_app.config['MAIL_PORT'] = mail_port
            temp_app.config['MAIL_USE_TLS'] = mail_use_tls
            temp_app.config['MAIL_USE_SSL'] = mail_use_ssl
            temp_app.config['MAIL_USERNAME'] = mail_username
            temp_app.config['MAIL_PASSWORD'] = mail_password
            temp_app.config['MAIL_DEFAULT_SENDER'] = mail_sender

            temp_mail = Mail()
            temp_mail.init_app(temp_app)
            with temp_app.app_context():
                temp_mail.send(msg)
        return True, None
    except Exception as e:
        return False, str(e)

def init_email(app: Flask):
    """Initialize Flask-Mail with app configuration"""
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '587'))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', '')
    # Gmail App Passwords are often shown/entered with spaces; strip them for SMTP auth.
    app.config['MAIL_PASSWORD'] = (os.getenv('MAIL_PASSWORD', '') or '').strip().replace(' ', '')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', os.getenv('MAIL_USERNAME', ''))
    
    mail.init_app(app)
    
    # Print email configuration (without password)
    username = app.config.get('MAIL_USERNAME', '')
    if username:
        print(f"[EMAIL] Email configured: {username}")
        print(f"   Server: {app.config['MAIL_SERVER']}:{app.config['MAIL_PORT']}")
        print(f"   TLS: {app.config['MAIL_USE_TLS']}, SSL: {app.config['MAIL_USE_SSL']}")
    else:
        print("[WARNING] Email not configured (MAIL_USERNAME not set)")
    
    return mail


def send_booking_confirmation_email(booking, tour, recipient_email: str, seller=None):
    """
    Send booking confirmation email to customer
    
    Args:
        booking: Booking model instance
        tour: Tour model instance
        recipient_email: Customer email address
        seller: Seller User instance (optional, if provided uses seller's email config)
    """
    try:
        # Determine which email configuration to use
        # Priority: Always use seller email if available and properly configured
        use_seller_email = seller and seller.seller_email and seller.seller_email_password
        
        if use_seller_email:
            # Use seller's email configuration
            mail_username = seller.seller_email
            mail_password = (seller.get_seller_email_password() or '').strip().replace(' ', '')
            mail_sender = seller.seller_email
            # Assume Gmail SMTP for seller emails (can be customized later)
            mail_server = 'smtp.gmail.com'
            mail_port = 587
            mail_use_tls = True
            mail_use_ssl = False
            print(f"[OK] Using SELLER email: {mail_username} (email will be sent FROM seller to customer)")
            print(f"   Booking ID: {booking.id}, Customer: {recipient_email}")
        else:
            # Use default system email configuration
            mail_username = os.getenv('MAIL_USERNAME', '')
            mail_password = (os.getenv('MAIL_PASSWORD', '') or '').strip().replace(' ', '')
            mail_sender = os.getenv('MAIL_DEFAULT_SENDER', mail_username)
            mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
            mail_port = int(os.getenv('MAIL_PORT', '587'))
            mail_use_tls = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
            mail_use_ssl = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
            print(f"[EMAIL] Using system email: {mail_username}")
        
        # Check if email is configured
        if not mail_username or not mail_password:
            print(f"[WARNING] Email not configured (username: {bool(mail_username)}, password: {bool(mail_password)})")
            if use_seller_email:
                print(f"[WARNING] Seller email not configured properly, falling back to system email")
                # Fall back to system email
                use_seller_email = False  # Important: Reset flag when falling back
                mail_username = os.getenv('MAIL_USERNAME', '')
                mail_password = (os.getenv('MAIL_PASSWORD', '') or '').strip().replace(' ', '')
                mail_sender = os.getenv('MAIL_DEFAULT_SENDER', mail_username)
                mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
                mail_port = int(os.getenv('MAIL_PORT', '587'))
                mail_use_tls = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
                mail_use_ssl = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
                print(f"[EMAIL] Fallback: Using system email: {mail_username} (server: {mail_server}:{mail_port})")
            
            if not mail_username or not mail_password:
                error_msg = "No email configuration available"
                if not mail_username:
                    error_msg += " (MAIL_USERNAME not set)"
                if not mail_password:
                    error_msg += " (MAIL_PASSWORD not set)"
                print(f"[ERROR] Cannot send email: {error_msg}")
                return False
        
        # Create a temporary Mail instance with seller's credentials if needed
        temp_mail = None
        if use_seller_email:
            from flask import Flask
            temp_app = Flask(__name__)
            temp_app.config['MAIL_SERVER'] = mail_server
            temp_app.config['MAIL_PORT'] = mail_port
            temp_app.config['MAIL_USE_TLS'] = mail_use_tls
            temp_app.config['MAIL_USE_SSL'] = mail_use_ssl
            temp_app.config['MAIL_USERNAME'] = mail_username
            temp_app.config['MAIL_PASSWORD'] = mail_password
            temp_app.config['MAIL_DEFAULT_SENDER'] = mail_sender
            temp_mail = Mail()
            temp_mail.init_app(temp_app)
        
        subject = f"Xác nhận đặt chỗ tour: {tour.title}"
        
        # Format price
        total_price = booking.total_price or 0
        currency = booking.currency or 'VND'
        formatted_price = f"{int(total_price):,} {currency}"
        
        # Format date
        booking_date = booking.date
        
        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: white;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .info-box {{
                    background-color: #f0f0f0;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                }}
                .info-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #e0e0e0;
                }}
                .info-row:last-child {{
                    border-bottom: none;
                }}
                .price {{
                    font-size: 24px;
                    font-weight: bold;
                    color: #e74c3c;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background-color: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Đặt chỗ thành công!</h1>
                    <p>Tour của bạn đã được xác nhận</p>
                </div>
                <div class="content">
                    <h2>Xin chào {booking.full_name or 'Khách hàng'},</h2>
                    <p>Chúng tôi rất vui thông báo rằng đặt chỗ tour của bạn đã được xác nhận thành công!</p>
                    
                    <div class="info-box">
                        <h3>Thông tin đặt chỗ</h3>
                        <div class="info-row">
                            <span><strong>Tour:</strong></span>
                            <span>{tour.title}</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Ngày khởi hành:</strong></span>
                            <span>{booking_date}</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Số người:</strong></span>
                            <span>{booking.participants} người</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Người lớn:</strong></span>
                            <span>{booking.adults or 0}</span>
                        </div>"""
        if (booking.children or 0) > 0:
            html_body += f"""
                        <div class="info-row">
                            <span><strong>Trẻ em:</strong></span>
                            <span>{booking.children or 0}</span>
                        </div>"""
        if (booking.infants or 0) > 0:
            html_body += f"""
                        <div class="info-row">
                            <span><strong>Em bé:</strong></span>
                            <span>{booking.infants or 0}</span>
                        </div>"""
        
        # Format payment method
        payment_method_text = 'Tại văn phòng' if booking.payment_method == 'office' else 'Chuyển khoản ngân hàng' if booking.payment_method == 'bank_transfer' else (booking.payment_method or 'Chưa xác định')
        
        html_body += f"""
                        <div class="info-row">
                            <span><strong>Mã đặt chỗ:</strong></span>
                            <span><strong>#{booking.id}</strong></span>
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <h3>Thông tin thanh toán</h3>
                        <div class="info-row">
                            <span><strong>Tổng tiền:</strong></span>
                            <span class="price">{formatted_price}</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Phương thức thanh toán:</strong></span>
                            <span>{payment_method_text}</span>
                        </div>
                    </div>
                    
                    <p>Vui lòng giữ email này làm bằng chứng đặt chỗ của bạn.</p>
                    <p>Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc điện thoại.</p>"""
        
        # Add company information and bank account if seller has it
        if seller:
            company_info_html = ""
            if seller.company_name:
                company_info_html += f"""
                    <div class="info-box" style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>Thông tin công ty</h3>
                        <div class="info-row">
                            <span><strong>Tên công ty:</strong></span>
                            <span>{seller.company_name}</span>
                        </div>"""
                if seller.company_address:
                    company_info_html += f"""
                        <div class="info-row">
                            <span><strong>Địa chỉ:</strong></span>
                            <span>{seller.company_address}</span>
                        </div>"""
                if seller.company_phone:
                    company_info_html += f"""
                        <div class="info-row">
                            <span><strong>Điện thoại:</strong></span>
                            <span>{seller.company_phone}</span>
                        </div>"""
                if seller.company_email:
                    company_info_html += f"""
                        <div class="info-row">
                            <span><strong>Email:</strong></span>
                            <span>{seller.company_email}</span>
                        </div>"""
                if seller.company_tax_id:
                    company_info_html += f"""
                        <div class="info-row">
                            <span><strong>Mã số thuế:</strong></span>
                            <span>{seller.company_tax_id}</span>
                        </div>"""
                company_info_html += "</div>"
                
            # Add bank account information
            if seller.bank_account_number:
                bank_info_html = """
                    <div class="info-box" style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>Thông tin thanh toán</h3>"""
                if seller.bank_name:
                    bank_info_html += f"""
                        <div class="info-row">
                            <span><strong>Ngân hàng:</strong></span>
                            <span>{seller.bank_name}</span>
                        </div>"""
                bank_info_html += f"""
                        <div class="info-row">
                            <span><strong>Số tài khoản:</strong></span>
                            <span><strong style="color: #e74c3c;">{seller.bank_account_number}</strong></span>
                        </div>"""
                if seller.bank_account_holder:
                    bank_info_html += f"""
                        <div class="info-row">
                            <span><strong>Chủ tài khoản:</strong></span>
                            <span>{seller.bank_account_holder}</span>
                        </div>"""
                bank_info_html += "</div>"
            else:
                bank_info_html = ""
            
            html_body += company_info_html + bank_info_html
        
        html_body += f"""
                    <p>Trân trọng,<br>{seller.company_name if seller and seller.company_name else 'Đội ngũ VieGo Tour'}</p>
                </div>
                <div class="footer">
                    <p>© 2024 VieGo Tour. Tất cả quyền được bảo lưu.</p>
                    <p>Email này được gửi tự động, vui lòng không trả lời email này.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_body = f"""
Xin chào {booking.full_name or 'Khách hàng'},

Chúng tôi rất vui thông báo rằng đặt chỗ tour của bạn đã được xác nhận thành công!

THÔNG TIN ĐẶT CHỖ:
- Tour: {tour.title}
- Ngày khởi hành: {booking_date}
- Số người: {booking.participants} người
- Người lớn: {booking.adults or 0}
- Trẻ em: {booking.children or 0}
- Em bé: {booking.infants or 0}
- Mã đặt chỗ: #{booking.id}

THÔNG TIN THANH TOÁN:
- Tổng tiền: {formatted_price}
- Phương thức thanh toán: {payment_method_text}

Vui lòng giữ email này làm bằng chứng đặt chỗ của bạn."""
        
        # Add company information to plain text version
        if seller:
            if seller.company_name:
                text_body += f"\n\nTHÔNG TIN CÔNG TY:\n- Tên công ty: {seller.company_name}"
                if seller.company_address:
                    text_body += f"\n- Địa chỉ: {seller.company_address}"
                if seller.company_phone:
                    text_body += f"\n- Điện thoại: {seller.company_phone}"
                if seller.company_email:
                    text_body += f"\n- Email: {seller.company_email}"
                if seller.company_tax_id:
                    text_body += f"\n- Mã số thuế: {seller.company_tax_id}"
            
            if seller.bank_account_number:
                text_body += f"\n\nTHÔNG TIN TÀI KHOẢN NGÂN HÀNG:"
                if seller.bank_name:
                    text_body += f"\n- Ngân hàng: {seller.bank_name}"
                text_body += f"\n- Số tài khoản: {seller.bank_account_number}"
                if seller.bank_account_holder:
                    text_body += f"\n- Chủ tài khoản: {seller.bank_account_holder}"
        
        text_body += f"\n\nTrân trọng,\n{seller.company_name if seller and seller.company_name else 'Đội ngũ VieGo Tour'}\n        """
        
        msg = Message(
            subject=subject,
            recipients=[recipient_email],
            html=html_body,
            body=text_body,
            sender=mail_sender
        )
        
        # Use the appropriate mail instance
        print(f"[SEND] Attempting to send email to {recipient_email}...")
        print(f"   From: {mail_sender}")
        print(f"   Server: {mail_server}:{mail_port}")
        print(f"   TLS: {mail_use_tls}, SSL: {mail_use_ssl}")
        
        if use_seller_email:
            # Create Flask app context for seller email
            with temp_app.app_context():
                temp_mail.send(msg)
            print(f"[OK] Email sent successfully FROM SELLER ({mail_username}) TO customer ({recipient_email})")
        else:
            # When called from Flask route, we're already in app context
            # The mail instance was initialized with the main app in init_email()
            mail.send(msg)
            print(f"[OK] Email sent successfully FROM SYSTEM ({mail_username}) TO customer ({recipient_email})")
        return True
    except Exception as e:
        error_str = str(e)
        print(f"[ERROR] Error sending email to {recipient_email}: {error_str}")
        import traceback
        traceback_str = traceback.format_exc()
        print(f"   Traceback: {traceback_str}")
        
        # Provide more specific error messages
        if "authentication failed" in error_str.lower() or "535" in error_str:
            print(f"[WARNING] Gmail authentication failed. You may need to:")
            print(f"   1. Enable 2-step verification")
            print(f"   2. Generate an App Password from https://myaccount.google.com/apppasswords")
            print(f"   3. Use the App Password instead of your regular password")
        elif "connection" in error_str.lower() or "timed out" in error_str.lower():
            print(f"[WARNING] Connection error. Check your internet connection and SMTP server settings.")
        elif "ssl" in error_str.lower() or "tls" in error_str.lower():
            print(f"[WARNING] SSL/TLS error. Check MAIL_USE_TLS and MAIL_USE_SSL settings.")
        
        return False


def send_payment_reminder_email(booking, tour, recipient_email: str, seller=None, days_until_tour=7):
    """
    Send payment reminder email to customer (7 days before tour start)
    
    Args:
        booking: Booking model instance
        tour: Tour model instance
        recipient_email: Customer email address
        seller: Seller User instance (optional, if provided uses seller's email config)
        days_until_tour: Number of days until tour start (default: 7)
    """
    try:
        # Determine which email configuration to use
        use_seller_email = seller and seller.seller_email and seller.seller_email_password
        
        if use_seller_email:
            mail_username = seller.seller_email
            mail_password = seller.get_seller_email_password()
            mail_sender = seller.seller_email
            mail_server = 'smtp.gmail.com'
            mail_port = 587
            mail_use_tls = True
            mail_use_ssl = False
        else:
            mail_username = os.getenv('MAIL_USERNAME', '')
            mail_password = os.getenv('MAIL_PASSWORD', '')
            mail_sender = os.getenv('MAIL_DEFAULT_SENDER', mail_username)
            mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
            mail_port = int(os.getenv('MAIL_PORT', '587'))
            mail_use_tls = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
            mail_use_ssl = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
        
        # Check if email is configured
        if not mail_username or not mail_password:
            if use_seller_email:
                use_seller_email = False
                mail_username = os.getenv('MAIL_USERNAME', '')
                mail_password = os.getenv('MAIL_PASSWORD', '')
                mail_sender = os.getenv('MAIL_DEFAULT_SENDER', mail_username)
                mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
                mail_port = int(os.getenv('MAIL_PORT', '587'))
                mail_use_tls = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
                mail_use_ssl = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
            
            if not mail_username or not mail_password:
                print(f"[ERROR] Cannot send payment reminder email: Email not configured")
                return False
        
        # Create temporary Mail instance if using seller email
        temp_mail = None
        if use_seller_email:
            from flask import Flask
            temp_app = Flask(__name__)
            temp_app.config['MAIL_SERVER'] = mail_server
            temp_app.config['MAIL_PORT'] = mail_port
            temp_app.config['MAIL_USE_TLS'] = mail_use_tls
            temp_app.config['MAIL_USE_SSL'] = mail_use_ssl
            temp_app.config['MAIL_USERNAME'] = mail_username
            temp_app.config['MAIL_PASSWORD'] = mail_password
            temp_app.config['MAIL_DEFAULT_SENDER'] = mail_sender
            temp_mail = Mail()
            temp_mail.init_app(temp_app)
        
        subject = f"[TIME] Nhac nho thanh toan - Tour {tour.title} se bat dau sau {days_until_tour} ngay"
        
        # Format price
        total_price = booking.total_price or 0
        currency = booking.currency or 'VND'
        formatted_price = f"{int(total_price):,} {currency}"
        
        # Format date
        booking_date = booking.date
        
        # Payment status text
        if booking.payment_status == 'paid':
            payment_status_text = '[OK] Da thanh toan'
        elif booking.payment_status == 'partial':
            payment_status_text = '[WARNING] Da thanh toan mot phan'
        else:
            payment_status_text = '[ERROR] Chua thanh toan'
        
        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }}
                .header {{
                    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: white;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .info-box {{
                    background-color: #fff3cd;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                    border-left: 4px solid #f39c12;
                }}
                .info-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #e0e0e0;
                }}
                .info-row:last-child {{
                    border-bottom: none;
                }}
                .price {{
                    font-size: 24px;
                    font-weight: bold;
                    color: #e74c3c;
                }}
                .urgent {{
                    background-color: #fee;
                    border: 2px solid #e74c3c;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Nhắc nhở thanh toán</h1>
                    <p>Tour của bạn sẽ bắt đầu sau {days_until_tour} ngày</p>
                </div>
                <div class="content">
                    <h2>Xin chào {booking.full_name or 'Khách hàng'},</h2>
                    <p>Tour <strong>{tour.title}</strong> của bạn sẽ bắt đầu vào ngày <strong>{booking_date}</strong> (còn {days_until_tour} ngày).</p>
                    
                    <div class="urgent">
                        <p><strong>⚠️ Vui lòng hoàn thành thanh toán trước {days_until_tour} ngày để đảm bảo giữ chỗ của bạn.</strong></p>
                    </div>
                    
                    <div class="info-box">
                        <h3>Thông tin đặt chỗ</h3>
                        <div class="info-row">
                            <span><strong>Tour:</strong></span>
                            <span>{tour.title}</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Ngày khởi hành:</strong></span>
                            <span>{booking_date}</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Số người:</strong></span>
                            <span>{booking.participants} người</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Mã đặt chỗ:</strong></span>
                            <span><strong>#{booking.id}</strong></span>
                        </div>
                        <div class="info-row">
                            <span><strong>Tổng tiền cần thanh toán:</strong></span>
                            <span class="price">{formatted_price}</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Trạng thái thanh toán:</strong></span>
                            <span>{payment_status_text}</span>
                        </div>
                    </div>"""
        
        # Add bank account information if available
        if seller and seller.bank_account_number:
            html_body += f"""
                    <div class="info-box" style="background-color: #e8f4f8;">
                        <h3>Thông tin chuyển khoản</h3>"""
            if seller.bank_name:
                html_body += f"""
                        <div class="info-row">
                            <span><strong>Ngân hàng:</strong></span>
                            <span>{seller.bank_name}</span>
                        </div>"""
            html_body += f"""
                        <div class="info-row">
                            <span><strong>Số tài khoản:</strong></span>
                            <span><strong style="color: #e74c3c; font-size: 18px;">{seller.bank_account_number}</strong></span>
                        </div>"""
            if seller.bank_account_holder:
                html_body += f"""
                        <div class="info-row">
                            <span><strong>Chủ tài khoản:</strong></span>
                            <span>{seller.bank_account_holder}</span>
                        </div>"""
            html_body += "</div>"
        
        # Add company contact info
        if seller and seller.company_name:
            html_body += f"""
                    <div class="info-box" style="background-color: #f0f0f0;">
                        <h3>Liên hệ</h3>
                        <p><strong>{seller.company_name}</strong></p>"""
            if seller.company_phone:
                html_body += f"<p>Điện thoại: {seller.company_phone}</p>"
            if seller.company_email:
                html_body += f"<p>Email: {seller.company_email}</p>"
            if seller.company_address:
                html_body += f"<p>Địa chỉ: {seller.company_address}</p>"
            html_body += "</div>"
        
        html_body += f"""
                    <p>Vui lòng thực hiện thanh toán đúng hạn để đảm bảo vị trí của bạn trong tour.</p>
                    <p>Nếu bạn đã thanh toán, vui lòng bỏ qua email này.</p>
                    
                    <p>Trân trọng,<br>{seller.company_name if seller and seller.company_name else 'Đội ngũ VieGo Tour'}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_body = f"""
Xin chào {booking.full_name or 'Khách hàng'},

Tour {tour.title} của bạn sẽ bắt đầu vào ngày {booking_date} (còn {days_until_tour} ngày).

⚠️ VUI LÒNG HOÀN THÀNH THANH TOÁN TRƯỚC {days_until_tour} NGÀY ĐỂ ĐẢM BẢO GIỮ CHỖ CỦA BẠN.

THÔNG TIN ĐẶT CHỖ:
- Tour: {tour.title}
- Ngày khởi hành: {booking_date}
- Số người: {booking.participants} người
- Mã đặt chỗ: #{booking.id}
- Tổng tiền cần thanh toán: {formatted_price}
- Trạng thái thanh toán: {payment_status_text}
"""
        
        # Add bank account info to plain text
        if seller and seller.bank_account_number:
            text_body += f"\nTHÔNG TIN CHUYỂN KHOẢN:"
            if seller.bank_name:
                text_body += f"\n- Ngân hàng: {seller.bank_name}"
            text_body += f"\n- Số tài khoản: {seller.bank_account_number}"
            if seller.bank_account_holder:
                text_body += f"\n- Chủ tài khoản: {seller.bank_account_holder}"
        
        # Add company contact info
        if seller and seller.company_name:
            text_body += f"\n\nLIÊN HỆ:\n- {seller.company_name}"
            if seller.company_phone:
                text_body += f"\n- Điện thoại: {seller.company_phone}"
            if seller.company_email:
                text_body += f"\n- Email: {seller.company_email}"
        
        text_body += f"\n\nVui lòng thực hiện thanh toán đúng hạn để đảm bảo vị trí của bạn trong tour.\nNếu bạn đã thanh toán, vui lòng bỏ qua email này.\n\nTrân trọng,\n{seller.company_name if seller and seller.company_name else 'Đội ngũ VieGo Tour'}\n        """
        
        msg = Message(
            subject=subject,
            recipients=[recipient_email],
            html=html_body,
            body=text_body,
            sender=mail_sender
        )
        
        print(f"[SEND] Attempting to send payment reminder email to {recipient_email}...")
        
        if use_seller_email:
            with temp_app.app_context():
                temp_mail.send(msg)
            print(f"[OK] Payment reminder email sent successfully FROM SELLER ({mail_username}) TO customer ({recipient_email})")
        else:
            mail.send(msg)
            print(f"[OK] Payment reminder email sent successfully FROM SYSTEM ({mail_username}) TO customer ({recipient_email})")
        return True
    except Exception as e:
        error_str = str(e)
        print(f"[ERROR] Error sending payment reminder email to {recipient_email}: {error_str}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return False


def send_tour_assignment_email(booking, tour, tour_guide, customer_email: str, seller=None):
    """
    Send tour assignment notification email to customer with tour guide information
    
    Args:
        booking: Booking model instance
        tour: Tour model instance
        tour_guide: Tour guide User instance
        customer_email: Customer email address
        seller: Seller User instance (optional)
    """
    try:
        # Determine which email configuration to use
        use_seller_email = seller and seller.seller_email and seller.seller_email_password
        
        if use_seller_email:
            mail_username = seller.seller_email
            mail_password = seller.get_seller_email_password()
            mail_sender = seller.seller_email
            mail_server = 'smtp.gmail.com'
            mail_port = 587
            mail_use_tls = True
            mail_use_ssl = False
            print(f"[OK] Using SELLER email for tour assignment: {mail_username}")
        else:
            mail_username = os.getenv('MAIL_USERNAME', '')
            mail_password = os.getenv('MAIL_PASSWORD', '')
            mail_sender = os.getenv('MAIL_DEFAULT_SENDER', mail_username)
            mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
            mail_port = int(os.getenv('MAIL_PORT', '587'))
            mail_use_tls = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
            mail_use_ssl = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
            print(f"[EMAIL] Using system email for tour assignment: {mail_username}")
        
        if not mail_username or not mail_password:
            print(f"[WARNING] Email not configured")
            return False
        
        # Create temporary Mail instance if using seller email
        temp_mail = None
        temp_app = None
        if use_seller_email:
            from flask import Flask
            temp_app = Flask(__name__)
            temp_app.config['MAIL_SERVER'] = mail_server
            temp_app.config['MAIL_PORT'] = mail_port
            temp_app.config['MAIL_USE_TLS'] = mail_use_tls
            temp_app.config['MAIL_USE_SSL'] = mail_use_ssl
            temp_app.config['MAIL_USERNAME'] = mail_username
            temp_app.config['MAIL_PASSWORD'] = mail_password
            temp_app.config['MAIL_DEFAULT_SENDER'] = mail_sender
            temp_mail = Mail()
            temp_mail.init_app(temp_app)
        
        subject = f"Thông tin hướng dẫn viên cho tour: {tour.title}"
        
        # Get participants list
        from models.booking_participant import BookingParticipant
        participants = BookingParticipant.query.filter_by(booking_id=booking.id).all()
        
        participants_html = ""
        if participants:
            participants_html = """
                    <div class="info-box">
                        <h3>📋 Danh sách người tham gia</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="background-color: #f0f0f0;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">STT</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Họ tên</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Loại</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Điện thoại</th>
                            </tr>"""
            
            for idx, p in enumerate(participants, 1):
                participant_type_text = 'Người lớn' if p.participant_type == 'adult' else 'Trẻ em' if p.participant_type == 'child' else 'Em bé'
                participants_html += f"""
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">{idx}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">{p.full_name}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">{participant_type_text}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">{p.phone or '-'}</td>
                            </tr>"""
            
            participants_html += """
                        </table>
                    </div>"""
        
        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: white;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .info-box {{
                    background-color: #f0f0f0;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                }}
                .info-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #e0e0e0;
                }}
                .info-row:last-child {{
                    border-bottom: none;
                }}
                .guide-info {{
                    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>👨‍✈️ Thông tin hướng dẫn viên</h1>
                    <p>Tour của bạn đã được phân công hướng dẫn viên</p>
                </div>
                <div class="content">
                    <h2>Xin chào {booking.full_name or 'Khách hàng'},</h2>
                    <p>Chúng tôi vui mừng thông báo rằng tour của bạn đã được phân công hướng dẫn viên chuyên nghiệp!</p>
                    
                    <div class="guide-info">
                        <h3 style="margin-top: 0;">🌟 Thông tin hướng dẫn viên</h3>"""
        
        # Add avatar if available
        if hasattr(tour_guide, 'avatar_url') and tour_guide.avatar_url:
            html_body += f"""
                        <div style="text-align: center; margin-bottom: 15px;">
                            <img src="{tour_guide.avatar_url}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid white; object-fit: cover;" />
                        </div>"""
        
        html_body += f"""
                        <p style="margin: 10px 0;"><strong>Họ tên:</strong> {tour_guide.full_name or tour_guide.username}</p>
                        <p style="margin: 10px 0;"><strong>Email:</strong> {tour_guide.email}</p>"""
        
        # Add phone if available (check booking or user)
        phone_number = None
        if hasattr(tour_guide, 'phone') and tour_guide.phone:
            phone_number = tour_guide.phone
        elif hasattr(booking, 'phone') and booking.phone:
            # Fallback to booking phone if available
            pass
        
        if phone_number:
            html_body += f"""
                        <p style="margin: 10px 0;"><strong>Điện thoại:</strong> {phone_number}</p>"""
        
        # Add location if available
        if hasattr(tour_guide, 'location') and tour_guide.location:
            html_body += f"""
                        <p style="margin: 10px 0;"><strong>Địa điểm:</strong> {tour_guide.location}</p>"""
        
        # Add bio if available
        if hasattr(tour_guide, 'bio') and tour_guide.bio:
            html_body += f"""
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3);">
                            <p style="margin: 5px 0;"><strong>Giới thiệu:</strong></p>
                            <p style="margin: 5px 0; font-style: italic;">{tour_guide.bio}</p>
                        </div>"""
        
        html_body += f"""
                    </div>
                    
                    <div class="info-box">
                        <h3>Thông tin tour</h3>
                        <div class="info-row">
                            <span><strong>Tour:</strong></span>
                            <span>{tour.title}</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Ngày khởi hành:</strong></span>
                            <span>{booking.date}</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Số người:</strong></span>
                            <span>{booking.participants} người</span>
                        </div>
                        <div class="info-row">
                            <span><strong>Mã đặt chỗ:</strong></span>
                            <span><strong>#{booking.id}</strong></span>
                        </div>
                    </div>
                    
                    {participants_html}
                    
                    <p>Hướng dẫn viên sẽ liên hệ với bạn trước ngày khởi hành để trao đổi chi tiết lịch trình.</p>
                    
                    <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi hoặc trực tiếp với hướng dẫn viên.</p>
                    
                    <p>Chúc bạn có một chuyến đi thú vị!</p>
                </div>
                <div class="footer">
                    <p>Email này được gửi tự động từ hệ thống VieGo Travel</p>
                    <p>© 2025 VieGo Travel. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        text_body = f"""
Thông tin hướng dẫn viên cho tour: {tour.title}

Xin chào {booking.full_name or 'Khách hàng'},

Tour của bạn đã được phân công hướng dẫn viên:

Hướng dẫn viên: {tour_guide.full_name or tour_guide.username}
Email: {tour_guide.email}
"""
        
        # Add phone if available
        phone_number = None
        if hasattr(tour_guide, 'phone') and tour_guide.phone:
            phone_number = tour_guide.phone
            text_body += f"Điện thoại: {phone_number}\n"
        
        # Add location if available
        if hasattr(tour_guide, 'location') and tour_guide.location:
            text_body += f"Địa điểm: {tour_guide.location}\n"
        
        # Add bio if available
        if hasattr(tour_guide, 'bio') and tour_guide.bio:
            text_body += f"\nGiới thiệu:\n{tour_guide.bio}\n"
        
        text_body += f"""
Thông tin tour:
- Tour: {tour.title}
- Ngày khởi hành: {booking.date}
- Số người: {booking.participants}
- Mã đặt chỗ: #{booking.id}

Hướng dẫn viên sẽ liên hệ với bạn trước ngày khởi hành.

Chúc bạn có một chuyến đi thú vị!

---
VieGo Travel
        """
        
        # Create message
        msg = Message(
            subject=subject,
            sender=mail_sender,
            recipients=[customer_email],
            body=text_body,
            html=html_body
        )
        
        # Send email
        if use_seller_email:
            with temp_app.app_context():
                temp_mail.send(msg)
            print(f"[OK] Tour assignment email sent successfully FROM SELLER ({mail_username}) TO customer ({customer_email})")
        else:
            mail.send(msg)
            print(f"[OK] Tour assignment email sent successfully FROM SYSTEM ({mail_username}) TO customer ({customer_email})")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Error sending tour assignment email to {customer_email}: {str(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return False

def send_participant_account_created_email(
    recipient_email: str,
    username: str,
    password: str,
    full_name: str | None = None,
    seller=None,
):
    """Send account credentials to a booking participant.

    Priority:
      1) Seller/company email (seller.seller_email + seller.seller_email_password) if provided.
      2) System email configuration (MAIL_USERNAME/MAIL_PASSWORD).

    Returns (ok: bool, error: str|None) and never raises.
    """
    try:
        use_seller_email = bool(
            seller
            and getattr(seller, 'seller_email', None)
            and getattr(seller, 'seller_email_password', None)
        )

        if use_seller_email:
            mail_username = seller.seller_email
            mail_password = seller.get_seller_email_password()
            mail_sender = seller.seller_email
            mail_server = 'smtp.gmail.com'
            mail_port = 587
            mail_use_tls = True
            mail_use_ssl = False
        else:
            # Prefer the running Flask app configuration (launcher/.env), fallback to env.
            if has_app_context():
                mail_username = current_app.config.get('MAIL_USERNAME', '')
                mail_password = current_app.config.get('MAIL_PASSWORD', '')
                mail_sender = current_app.config.get('MAIL_DEFAULT_SENDER', mail_username)
                mail_server = current_app.config.get('MAIL_SERVER', os.getenv('MAIL_SERVER', 'smtp.gmail.com'))
                mail_port = int(current_app.config.get('MAIL_PORT', os.getenv('MAIL_PORT', '587')))
                mail_use_tls = bool(current_app.config.get('MAIL_USE_TLS', os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'))
                mail_use_ssl = bool(current_app.config.get('MAIL_USE_SSL', os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'))
            else:
                mail_username = os.getenv('MAIL_USERNAME', '')
                mail_password = os.getenv('MAIL_PASSWORD', '')
                mail_sender = os.getenv('MAIL_DEFAULT_SENDER', mail_username)
                mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
                mail_port = int(os.getenv('MAIL_PORT', '587'))
                mail_use_tls = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
                mail_use_ssl = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'

        if not mail_username or not mail_password:
            if use_seller_email:
                print('[WARNING] Seller email not configured for participant account email (seller_email/seller_email_password missing)')
                return False, 'seller_email/seller_email_password missing'
            print('[WARNING] Email not configured for participant account email (MAIL_USERNAME/MAIL_PASSWORD missing)')
            return False, 'MAIL_USERNAME/MAIL_PASSWORD missing'

        display_name = (full_name or '').strip() or 'bạn'
        subject = 'Tài khoản VieGo đã được tạo cho bạn'

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset=\"UTF-8\">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }}
                .header {{ background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: white; padding: 20px; border-radius: 0 0 10px 10px; }}
                .box {{ background: #f0f0f0; padding: 12px; border-radius: 6px; margin: 15px 0; }}
                .mono {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; }}
            </style>
        </head>
        <body>
            <div class=\"container\">
                <div class=\"header\">
                    <h2>Chào {display_name}!</h2>
                    <p>Tài khoản VieGo của bạn đã được tạo tự động</p>
                </div>
                <div class=\"content\">
                    <p>Bạn vừa được thêm là người tham gia trong một tour. Hệ thống đã tạo tài khoản để bạn có thể đăng nhập theo dõi hành trình và nhận thông báo.</p>
                    <div class=\"box\">
                        <p><strong>Thông tin đăng nhập</strong></p>
                        <p>Username/Email: <span class=\"mono\">{username}</span> (hoặc <span class=\"mono\">{recipient_email}</span>)</p>
                        <p>Mật khẩu: <span class=\"mono\">{password}</span></p>
                    </div>
                    <p>Vì lý do bảo mật, bạn nên đổi mật khẩu sau khi đăng nhập.</p>
                    <p>Trân trọng,<br/>VieGo</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""Chào {display_name},

Tài khoản VieGo của bạn đã được tạo tự động.

Thông tin đăng nhập:
- Username/Email: {username} (hoặc {recipient_email})
- Mật khẩu: {password}

Vì lý do bảo mật, bạn nên đổi mật khẩu sau khi đăng nhập.

VieGo
"""

        msg = Message(
            subject=subject,
            sender=mail_sender,
            recipients=[recipient_email],
            body=text_body,
            html=html_body,
        )

        if use_seller_email:
            temp_app = Flask(__name__)
            temp_app.config['MAIL_SERVER'] = mail_server
            temp_app.config['MAIL_PORT'] = mail_port
            temp_app.config['MAIL_USE_TLS'] = mail_use_tls
            temp_app.config['MAIL_USE_SSL'] = mail_use_ssl
            temp_app.config['MAIL_USERNAME'] = mail_username
            temp_app.config['MAIL_PASSWORD'] = mail_password
            temp_app.config['MAIL_DEFAULT_SENDER'] = mail_sender

            temp_mail = Mail()
            temp_mail.init_app(temp_app)

            with temp_app.app_context():
                temp_mail.send(msg)
            print(f"[OK] Participant account email sent FROM SELLER ({mail_username}) TO {recipient_email}")
        else:
            if has_app_context():
                mail.send(msg)
            else:
                temp_app = Flask(__name__)
                temp_app.config['MAIL_SERVER'] = mail_server
                temp_app.config['MAIL_PORT'] = mail_port
                temp_app.config['MAIL_USE_TLS'] = mail_use_tls
                temp_app.config['MAIL_USE_SSL'] = mail_use_ssl
                temp_app.config['MAIL_USERNAME'] = mail_username
                temp_app.config['MAIL_PASSWORD'] = mail_password
                temp_app.config['MAIL_DEFAULT_SENDER'] = mail_sender

                temp_mail = Mail()
                temp_mail.init_app(temp_app)

                with temp_app.app_context():
                    temp_mail.send(msg)
            print(f"[OK] Participant account email sent FROM SYSTEM ({mail_username}) TO {recipient_email}")

        return True, None

    except Exception as e:
        print(f"[ERROR] Error sending participant account email to {recipient_email}: {str(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return False, str(e)
