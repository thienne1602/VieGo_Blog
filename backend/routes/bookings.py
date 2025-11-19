from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.user import User
from models.tour import Tour
from models.booking import Booking
from models.tour_assignment import TourAssignment
from datetime import datetime, timedelta
import re

# Try to import email utility
send_booking_confirmation_email = None
send_payment_reminder_email = None
EMAIL_AVAILABLE = False
try:
    from utils.email import send_booking_confirmation_email, send_payment_reminder_email
    EMAIL_AVAILABLE = True
except ImportError as e:
    EMAIL_AVAILABLE = False
    print(f"⚠️  Email utility not available: {str(e)}")
    import traceback
    print(f"   Full error: {traceback.format_exc()}")

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')


@bookings_bp.route('/mine', methods=['GET'])
@jwt_required()
def get_my_bookings():
    """Return bookings for tours owned by the authenticated seller, or all bookings for admin"""
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        # Convert to int if it's a string (JWT identity might be stored as string)
        current_user_id = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.role == 'admin':
            bookings = Booking.query.order_by(Booking.created_at.desc()).all()
        else:
            # Seller: bookings for tours where seller_id == current_user_id
            bookings = Booking.query.join(Tour).filter(Tour.seller_id == current_user_id).order_by(Booking.created_at.desc()).all()

        bookings_data = [b.to_dict() for b in bookings]
        # Enrich with basic user, tour, seller/company info, and assignment info
        for b in bookings_data:
            u = User.query.get(b['user_id'])
            t = Tour.query.get(b['tour_id'])
            b['user'] = {'id': u.id, 'username': u.username, 'full_name': u.full_name, 'avatar_url': u.avatar_url} if u else None
            b['tour'] = {'id': t.id, 'title': t.title, 'featured_image': t.featured_image} if t else None
            
            # Include seller/company information
            if t and t.seller_id:
                seller = User.query.get(t.seller_id)
                if seller:
                    b['seller'] = {
                        'id': seller.id,
                        'username': seller.username,
                        'full_name': seller.full_name,
                        'company_name': seller.company_name,
                        'company_address': seller.company_address,
                        'company_phone': seller.company_phone,
                        'company_email': seller.company_email,
                        'company_tax_id': seller.company_tax_id,
                        'bank_account_number': seller.bank_account_number,
                        'bank_name': seller.bank_name,
                        'bank_account_holder': seller.bank_account_holder
                    }
            
            # Include assignment information if exists
            assignment = TourAssignment.query.filter_by(booking_id=b['id']).first()
            if assignment:
                guide = User.query.get(assignment.tour_guide_id)
                b['assignment'] = {
                    'id': assignment.id,
                    'tour_guide_id': assignment.tour_guide_id,
                    'status': assignment.status,
                    'assignment_date': assignment.assignment_date.isoformat() if assignment.assignment_date else None,
                    'tour_guide': {
                        'id': guide.id if guide else None,
                        'username': guide.username if guide else None,
                        'full_name': guide.full_name if guide else None,
                        'email': guide.email if guide else None,
                    } if guide else None
                }
            else:
                b['assignment'] = None

        return jsonify({'bookings': bookings_data}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching bookings: {str(e)}'}), 500


@bookings_bp.route('/my-bookings', methods=['GET'])
@jwt_required()
def get_customer_bookings():
    """Return bookings made by the authenticated customer (user)"""
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        # Convert to int if it's a string (JWT identity might be stored as string)
        current_user_id = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        print(f"\n🔍 [DEBUG] Getting bookings for user: {user.username} (ID: {current_user_id}, Role: {user.role})")
        
        # Get bookings where user_id == current_user_id (customer's own bookings)
        bookings = Booking.query.filter_by(user_id=current_user_id).order_by(Booking.created_at.desc()).all()
        print(f"📦 [DEBUG] Found {len(bookings)} bookings for user {current_user_id}")
        
        # Also check all bookings to see if there's a mismatch
        all_bookings = Booking.query.all()
        print(f"📊 [DEBUG] Total bookings in database: {len(all_bookings)}")
        if len(all_bookings) > 0:
            print("🔍 [DEBUG] Sample bookings:")
            for b in all_bookings[:5]:
                print(f"   - Booking {b.id}: user_id={b.user_id}, status={b.status}")

        bookings_data = [b.to_dict() for b in bookings]
        print(f"🔍 [DEBUG] bookings_data after to_dict: {len(bookings_data)} items")
        if len(bookings_data) > 0:
            print(f"   First booking: {bookings_data[0]}")
        
        # Enrich with tour info and assignment info
        for b in bookings_data:
            # Map 'date' field to 'booking_date' for frontend compatibility
            if 'date' in b:
                b['booking_date'] = b['date']
            t = Tour.query.get(b['tour_id'])
            if t:
                b['tour'] = {
                    'id': t.id,
                    'title': t.title,
                    'featured_image': t.featured_image,
                    'starting_location': t.starting_location,
                    'duration_days': t.duration_days,
                    'price_per_person': t.price_per_person,
                    'itinerary': t.get_itinerary()  # Include itinerary
                }
                
                # Include seller/company information
                if t.seller_id:
                    seller = User.query.get(t.seller_id)
                    if seller:
                        b['seller'] = {
                            'id': seller.id,
                            'username': seller.username,
                            'full_name': seller.full_name,
                            'company_name': seller.company_name,
                            'company_phone': seller.company_phone,
                            'company_email': seller.company_email
                        }
            
            # Include assignment information if exists
            assignment = TourAssignment.query.filter_by(booking_id=b['id']).first()
            if assignment:
                guide = User.query.get(assignment.tour_guide_id)
                b['assignment'] = {
                    'id': assignment.id,
                    'tour_guide_id': assignment.tour_guide_id,
                    'status': assignment.status,
                    'assignment_date': assignment.assignment_date.isoformat() if assignment.assignment_date else None,
                    'tour_guide': {
                        'id': guide.id if guide else None,
                        'username': guide.username if guide else None,
                        'full_name': guide.full_name if guide else None,
                        'email': guide.email if guide else None,
                    } if guide else None
                }
            else:
                b['assignment'] = None

        print(f"📤 [DEBUG] Returning {len(bookings_data)} bookings to frontend")
        if len(bookings_data) > 0:
            print(f"   Sample booking to return: booking_id={bookings_data[0].get('id')}, has tour={('tour' in bookings_data[0])}")
        
        return jsonify({'bookings': bookings_data}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching bookings: {str(e)}'}), 500


@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    """Get single booking details - seller can view bookings for their tours, admin can view all"""
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        # Convert to int if it's a string (JWT identity might be stored as string)
        current_user_id = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        booking = Booking.query.get_or_404(booking_id)
        tour = Tour.query.get(booking.tour_id)
        
        if not tour:
            return jsonify({'error': 'Tour không tồn tại'}), 404
        
        # Permission: admin can view all, seller can view bookings for their tours, customers can view their own bookings, tour guides can view assigned bookings
        # Ensure both IDs are integers for proper comparison
        tour_seller_id = int(tour.seller_id) if tour.seller_id is not None else None
        booking_user_id = int(booking.user_id) if booking.user_id is not None else None
        
        # Check if user is the assigned tour guide
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        is_assigned_guide = assignment and int(assignment.tour_guide_id) == current_user_id
        
        print(f"[BOOKING DEBUG] User ID: {current_user_id} (type: {type(current_user_id)}), Role: {user.role}, Tour Seller ID: {tour_seller_id}, Booking User ID: {booking_user_id}, Is Assigned Guide: {is_assigned_guide}")
        
        # Allow access if: admin OR tour seller OR booking owner (customer) OR assigned tour guide
        if user.role != 'admin' and tour_seller_id != current_user_id and booking_user_id != current_user_id and not is_assigned_guide:
            print(f"[BOOKING DEBUG] Permission denied: User {current_user_id} (role: {user.role}) trying to access booking {booking_id} (owned by user {booking_user_id}, tour owned by {tour_seller_id})")
            return jsonify({'error': 'Bạn không có quyền xem booking này'}), 403
        
        booking_data = booking.to_dict()
        # Enrich with user and tour info
        u = User.query.get(booking.user_id)
        # Reuse tour variable that we already checked
        booking_data['user'] = {
            'id': u.id,
            'username': u.username,
            'full_name': u.full_name,
            'avatar_url': u.avatar_url,
            'email': u.email if user.role == 'admin' or tour.seller_id == current_user_id else None
        } if u else None
        booking_data['tour'] = {
            'id': tour.id,
            'title': tour.title,
            'featured_image': tour.featured_image,
            'price_per_person': tour.price_per_person,
            'currency': tour.currency,
            'starting_location': tour.starting_location,
            'duration_days': tour.duration_days,
            'itinerary': tour.get_itinerary()  # Include itinerary for journey page
        } if tour else None
        
        # Include seller/company information for bookings
        if tour and tour.seller_id:
            seller = User.query.get(tour.seller_id)
            if seller:
                booking_data['seller'] = {
                    'id': seller.id,
                    'username': seller.username,
                    'full_name': seller.full_name,
                    'company_name': seller.company_name,
                    'company_address': seller.company_address,
                    'company_phone': seller.company_phone,
                    'company_email': seller.company_email,
                    'company_tax_id': seller.company_tax_id,
                    'bank_account_number': seller.bank_account_number,
                    'bank_name': seller.bank_name,
                    'bank_account_holder': seller.bank_account_holder
                }
        
        # Include assignment information if exists
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        if assignment:
            guide = User.query.get(assignment.tour_guide_id)
            booking_data['assignment'] = {
                'id': assignment.id,
                'tour_guide_id': assignment.tour_guide_id,
                'status': assignment.status,
                'assignment_date': assignment.assignment_date.isoformat() if assignment.assignment_date else None,
                'tour_guide': {
                    'id': guide.id if guide else None,
                    'username': guide.username if guide else None,
                    'full_name': guide.full_name if guide else None,
                    'email': guide.email if guide else None,
                } if guide else None
            }
        else:
            booking_data['assignment'] = None
        
        return jsonify({'booking': booking_data}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching booking: {str(e)}'}), 500


@bookings_bp.route('/<int:booking_id>', methods=['PATCH'])
@jwt_required()
def update_booking_status(booking_id):
    """Allow seller (owner of tour) or admin to update booking status (confirm/cancel)"""
    global send_booking_confirmation_email, EMAIL_AVAILABLE
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        # Convert to int if it's a string (JWT identity might be stored as string)
        current_user_id = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        booking = Booking.query.get_or_404(booking_id)
        tour = Tour.query.get(booking.tour_id)
        
        if not tour:
            return jsonify({'error': 'Tour không tồn tại'}), 404

        # Permission: must be admin or the tour owner
        # Ensure both IDs are integers for proper comparison
        tour_seller_id = int(tour.seller_id) if tour.seller_id is not None else None
        print(f"[BOOKING UPDATE DEBUG] User ID: {current_user_id} (type: {type(current_user_id)}), Role: {user.role}, Tour Seller ID: {tour_seller_id} (type: {type(tour_seller_id)}), Booking ID: {booking_id}")
        if user.role != 'admin' and tour_seller_id != current_user_id:
            print(f"[BOOKING UPDATE DEBUG] Permission denied: User {current_user_id} (role: {user.role}) trying to update booking {booking_id} for tour owned by {tour_seller_id}")
            return jsonify({'error': 'Bạn không có quyền cập nhật booking này'}), 403

        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'error': 'Thiếu trường status'}), 400

        new_status = data['status']
        if new_status not in ['pending', 'confirmed', 'cancelled']:
            return jsonify({'error': 'Giá trị status không hợp lệ'}), 400

        booking.status = new_status
        booking.updated_at = datetime.utcnow()
        db.session.commit()

        # Send confirmation email if status changed to 'confirmed' and email is available
        email_sent = False
        email_sender = None
        email_error = None
        
        # Always try to send email if status is confirmed, even if EMAIL_AVAILABLE is False
        # This allows the function to return proper error messages
        if new_status == 'confirmed':
            if not booking.email:
                email_error = 'Khách hàng chưa cung cấp địa chỉ email'
                print(f"⚠️  Cannot send confirmation email: Customer email not available for booking {booking.id}")
            else:
                try:
                    tour = Tour.query.get(booking.tour_id)
                    if tour:
                        # Get seller information for email configuration
                        seller = None
                        if tour.seller_id:
                            seller = User.query.get(tour.seller_id)
                        
                        # Check if seller email is configured properly
                        if seller and seller.seller_email and not seller.seller_email_password:
                            print(f"⚠️  Seller email configured but password missing for seller {seller.id}")
                        
                        # ✅ Priority: Use seller email if available, otherwise check EMAIL_AVAILABLE
                        seller_email_available = seller and seller.seller_email and seller.seller_email_password
                        
                        # Get the email function - try to import if needed
                        email_func = send_booking_confirmation_email
                        if email_func is None:
                            # Try to import again in case it wasn't available at module load time
                            try:
                                from utils.email import send_booking_confirmation_email as imported_func
                                send_booking_confirmation_email = imported_func
                                email_func = imported_func
                                EMAIL_AVAILABLE = True
                            except ImportError as import_err:
                                error_msg = str(import_err)
                                # Check if it's a missing dependency
                                if 'flask_mail' in error_msg.lower() or 'ModuleNotFoundError' in str(type(import_err)):
                                    email_error = 'Thiếu module Flask-Mail. Vui lòng chạy: pip install Flask-Mail'
                                    print(f"⚠️  Cannot import send_booking_confirmation_email: Missing Flask-Mail dependency")
                                    print(f"   Solution: pip install Flask-Mail")
                                else:
                                    email_error = f'Không thể tải module gửi email: {error_msg}'
                                    print(f"⚠️  Cannot import send_booking_confirmation_email: {error_msg}")
                                import traceback
                                print(f"   Full traceback: {traceback.format_exc()}")
                                email_func = None
                        
                        if not seller_email_available and not EMAIL_AVAILABLE:
                            email_error = 'Hệ thống email chưa được cấu hình. Vui lòng cấu hình email seller trong phần Hồ Sơ.'
                            print(f"⚠️  Cannot send confirmation email: Neither seller email nor system email is configured")
                        elif email_func is not None:
                            email_sent = email_func(booking, tour, booking.email, seller=seller)
                            if email_sent:
                                # Determine which email was used
                                if seller and seller.seller_email and seller.seller_email_password:
                                    email_sender = seller.seller_email
                                else:
                                    import os
                                    email_sender = os.getenv('MAIL_USERNAME', 'system email')
                                print(f"✅ Confirmation email sent to {booking.email} from {email_sender}")
                            else:
                                # Check backend logs for detailed error message
                                # Common issues: Gmail requires App Password, SMTP connection failed, etc.
                                email_error = 'Không thể gửi email xác nhận. Vui lòng kiểm tra cấu hình email trong phần Hồ Sơ hoặc xem log backend để biết chi tiết lỗi.'
                                print(f"⚠️  Failed to send confirmation email to {booking.email}")
                                print(f"   💡 TIP: Kiểm tra log backend phía trên để xem thông báo lỗi chi tiết")
                                print(f"   💡 Gmail yêu cầu App Password (không phải mật khẩu thường):")
                                print(f"      1. Bật 2-step verification: https://myaccount.google.com/security")
                                print(f"      2. Tạo App Password: https://myaccount.google.com/apppasswords")
                                print(f"      3. Dùng App Password trong cấu hình email")
                    else:
                        email_error = 'Không tìm thấy thông tin tour'
                        print(f"⚠️  Cannot send confirmation email: Tour not found for booking {booking.id}")
                except Exception as e:
                    # Don't fail the request if email fails
                    email_error = f'Lỗi khi gửi email: {str(e)}'
                    print(f"⚠️  Error sending confirmation email: {str(e)}")
                    import traceback
                    print(f"   Traceback: {traceback.format_exc()}")

        response_data = {
            'message': 'Booking cập nhật thành công', 
            'booking': booking.to_dict(),
            'success': True
        }
        
        # ✅ ALWAYS include email info if booking was confirmed - even if email wasn't sent
        if new_status == 'confirmed':
            response_data['email_sent'] = email_sent
            response_data['email_attempted'] = True  # Indicate we tried to send email
            
            if email_sent and email_sender:
                response_data['email_sender'] = email_sender
                response_data['email_message'] = f'✅ Email xác nhận đã được gửi đến {booking.email} từ {email_sender}'
            elif email_error:
                # Provide specific error message
                response_data['email_message'] = f'⚠️ {email_error}'
                response_data['email_error'] = email_error
            elif not booking.email:
                response_data['email_message'] = '⚠️ Khách hàng chưa cung cấp địa chỉ email'
                response_data['email_error'] = 'Khách hàng chưa cung cấp địa chỉ email'
            else:
                # Generic error message
                response_data['email_message'] = f'⚠️ Không thể gửi email xác nhận đến {booking.email}. Vui lòng kiểm tra cấu hình email trong phần Hồ Sơ.'
                response_data['email_error'] = 'Không thể gửi email xác nhận'
        
        return jsonify(response_data), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating booking: {str(e)}'}), 500


def parse_date_string(date_str):
    """Parse date string in various formats (YYYY-MM-DD, DD/MM/YYYY, etc.)"""
    try:
        # Try ISO format first
        if re.match(r'^\d{4}-\d{2}-\d{2}', date_str):
            return datetime.strptime(date_str.split()[0], '%Y-%m-%d').date()
        # Try DD/MM/YYYY
        elif re.match(r'^\d{2}/\d{2}/\d{4}', date_str):
            return datetime.strptime(date_str.split()[0], '%d/%m/%Y').date()
        # Try DD-MM-YYYY
        elif re.match(r'^\d{2}-\d{2}-\d{4}', date_str):
            return datetime.strptime(date_str.split()[0], '%d-%m-%Y').date()
        else:
            # Try to parse as-is
            return datetime.strptime(date_str.split()[0], '%Y-%m-%d').date()
    except:
        return None


@bookings_bp.route('/send-payment-reminders', methods=['POST'])
@jwt_required()
def send_payment_reminders():
    """
    Check all confirmed bookings and send payment reminder emails to customers
    whose tours start in 7 days and haven't fully paid.
    Can be called manually or scheduled via cron job.
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Only admin can trigger this manually
        if user.role != 'admin':
            return jsonify({'error': 'Chỉ admin mới có quyền chạy tác vụ này'}), 403
        
        today = datetime.utcnow().date()
        target_date = today + timedelta(days=7)
        
        # Find all confirmed bookings that:
        # 1. Are confirmed (not cancelled)
        # 2. Payment status is not 'paid'
        # 3. Tour date is in 7 days (approximately)
        confirmed_bookings = Booking.query.filter(
            Booking.status == 'confirmed',
            Booking.payment_status.in_(['unpaid', 'partial'])
        ).all()
        
        sent_count = 0
        failed_count = 0
        skipped_count = 0
        results = []
        
        for booking in confirmed_bookings:
            try:
                # Parse booking date
                booking_date = parse_date_string(booking.date)
                
                if not booking_date:
                    skipped_count += 1
                    results.append({
                        'booking_id': booking.id,
                        'status': 'skipped',
                        'reason': f'Không thể parse ngày: {booking.date}'
                    })
                    continue
                
                # Check if booking date is approximately 7 days away (6-8 days range for flexibility)
                days_until = (booking_date - today).days
                
                if days_until < 6 or days_until > 8:
                    skipped_count += 1
                    continue
                
                # Check if customer has email
                if not booking.email:
                    skipped_count += 1
                    results.append({
                        'booking_id': booking.id,
                        'status': 'skipped',
                        'reason': 'Khách hàng chưa cung cấp email'
                    })
                    continue
                
                # Get tour and seller info
                tour = Tour.query.get(booking.tour_id)
                if not tour:
                    skipped_count += 1
                    continue
                
                seller = User.query.get(tour.seller_id) if tour.seller_id else None
                
                # Try to send reminder email
                try:
                    # Try to import email function if not already imported
                    global send_payment_reminder_email
                    if send_payment_reminder_email is None:
                        try:
                            from utils.email import send_payment_reminder_email as imported_func
                            send_payment_reminder_email = imported_func
                        except ImportError:
                            failed_count += 1
                            results.append({
                                'booking_id': booking.id,
                                'status': 'failed',
                                'reason': 'Email utility không khả dụng'
                            })
                            continue
                    
                    email_sent = send_payment_reminder_email(
                        booking, tour, booking.email, seller=seller, days_until_tour=days_until
                    )
                    
                    if email_sent:
                        sent_count += 1
                        results.append({
                            'booking_id': booking.id,
                            'customer': booking.email,
                            'tour': tour.title,
                            'days_until': days_until,
                            'status': 'sent'
                        })
                    else:
                        failed_count += 1
                        results.append({
                            'booking_id': booking.id,
                            'status': 'failed',
                            'reason': 'Gửi email thất bại (kiểm tra log để biết chi tiết)'
                        })
                except Exception as e:
                    failed_count += 1
                    results.append({
                        'booking_id': booking.id,
                        'status': 'failed',
                        'reason': str(e)
                    })
                    print(f"❌ Error sending reminder for booking {booking.id}: {str(e)}")
                    
            except Exception as e:
                failed_count += 1
                results.append({
                    'booking_id': booking.id,
                    'status': 'error',
                    'reason': str(e)
                })
                print(f"❌ Error processing booking {booking.id}: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': f'Đã xử lý {len(confirmed_bookings)} bookings',
            'summary': {
                'total_processed': len(confirmed_bookings),
                'sent': sent_count,
                'failed': failed_count,
                'skipped': skipped_count
            },
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi gửi email nhắc nhở: {str(e)}'}), 500


@bookings_bp.route('/send-payment-reminder/<int:booking_id>', methods=['POST'])
@jwt_required()
def send_payment_reminder_for_booking(booking_id):
    """
    Send payment reminder email for a specific booking.
    Seller can send reminders for their own tour bookings.
    """
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        # Convert to int if it's a string (JWT identity might be stored as string)
        current_user_id = int(current_user_id) if isinstance(current_user_id, str) else current_user_id
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        
        # Get booking
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking không tồn tại'}), 404
        
        # Get tour
        tour = Tour.query.get(booking.tour_id)
        if not tour:
            return jsonify({'error': 'Tour không tồn tại'}), 404
        
        # Permission check: seller can only send reminders for their own tours
        # Ensure both IDs are integers for proper comparison
        tour_seller_id = int(tour.seller_id) if tour.seller_id is not None else None
        print(f"[PAYMENT REMINDER DEBUG] User ID: {current_user_id} (type: {type(current_user_id)}), Role: {user.role}, Tour Seller ID: {tour_seller_id} (type: {type(tour_seller_id)}), Booking ID: {booking_id}")
        if user.role != 'admin' and tour_seller_id != current_user_id:
            print(f"[PAYMENT REMINDER DEBUG] Permission denied: User {current_user_id} (role: {user.role}) trying to send reminder for booking {booking_id} of tour owned by {tour_seller_id}")
            return jsonify({'error': 'Bạn không có quyền gửi email nhắc nhở cho booking này'}), 403
        
        # Check if booking is confirmed and has payment pending
        if booking.status != 'confirmed':
            return jsonify({'error': 'Chỉ có thể gửi email nhắc nhở cho booking đã được xác nhận'}), 400
        
        if booking.payment_status == 'paid':
            return jsonify({'error': 'Booking đã thanh toán đầy đủ, không cần gửi email nhắc nhở'}), 400
        
        # Check if customer has email
        if not booking.email:
            return jsonify({'error': 'Khách hàng chưa cung cấp email'}), 400
        
        # Calculate days until tour
        booking_date = parse_date_string(booking.date)
        if not booking_date:
            return jsonify({'error': f'Không thể parse ngày booking: {booking.date}'}), 400
        
        today = datetime.utcnow().date()
        days_until = (booking_date - today).days
        
        if days_until < 0:
            return jsonify({'error': 'Tour đã qua ngày'}), 400
        
        # Get seller info
        seller = User.query.get(tour.seller_id) if tour.seller_id else None
        
        # Try to send reminder email
        try:
            global send_payment_reminder_email
            if send_payment_reminder_email is None:
                try:
                    from utils.email import send_payment_reminder_email as imported_func
                    send_payment_reminder_email = imported_func
                except ImportError:
                    return jsonify({'error': 'Email utility không khả dụng'}), 500
            
            email_sent = send_payment_reminder_email(
                booking, tour, booking.email, seller=seller, days_until_tour=days_until
            )
            
            if email_sent:
                return jsonify({
                    'success': True,
                    'message': f'Đã gửi email nhắc nhở thanh toán cho {booking.email}',
                    'booking_id': booking.id,
                    'customer': booking.email,
                    'tour': tour.title,
                    'days_until': days_until
                }), 200
            else:
                return jsonify({'error': 'Gửi email thất bại (kiểm tra log để biết chi tiết)'}), 500
                
        except Exception as e:
            print(f"❌ Error sending reminder for booking {booking.id}: {str(e)}")
            return jsonify({'error': f'Lỗi khi gửi email: {str(e)}'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Lỗi xử lý: {str(e)}'}), 500
