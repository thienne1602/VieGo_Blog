"""
Script to seed tour data into the database
Run with: python backend/seed_tours.py
"""
import os
import sys
from datetime import datetime, timedelta
import json

# Add backend to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv()

# Initialize Flask app and database
from main import app
import models
db = models.init_db(app)

from models.user import User
from models.tour import Tour

def generate_available_dates():
    """Generate available dates for next 3 months"""
    today = datetime.now()
    dates = []
    for i in range(1, 91, 3):  # Every 3 days
        date = today + timedelta(days=i)
        dates.append(date.strftime('%Y-%m-%d'))
    return dates

def seed_tours(seller_username=None):
    """Seed tour data
    
    Args:
        seller_username: Optional username to assign tours to. If None, finds first seller.
    """
    print("\n" + "="*70)
    print("🎫 Seeding Tours...")
    print("="*70)
    
    with app.app_context():
        # Find seller by username if provided, or find any seller
        seller = None
        if seller_username:
            seller = User.query.filter_by(username=seller_username, role='seller').first()
            if seller:
                print(f"✅ Found seller by username: {seller.username} (ID: {seller.id})")
            else:
                print(f"⚠️  Seller '{seller_username}' not found, searching for any seller...")
        
        if not seller:
            # Find any seller
            seller = User.query.filter_by(role='seller').first()
            if seller:
                print(f"✅ Using existing seller: {seller.username} (ID: {seller.id})")
        
        if not seller:
            # Try admin as fallback
            seller = User.query.filter_by(role='admin').first()
            if seller:
                print(f"✅ Using admin user as seller: {seller.username} (ID: {seller.id})")
        
        if not seller:
            # Create a default seller
            seller = User(
                username='tourseller',
                email='seller@viego.com',
                password_hash='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewf1/2xDETnh4ArW',  # password: admin
                full_name='Tour Seller',
                role='seller'
            )
            db.session.add(seller)
            db.session.commit()
            print(f"✅ Created seller user: {seller.username} (ID: {seller.id})")
        
        tours_data = [
            {
                'title': 'Hà Nội Street Food Adventure',
                'description': 'Khám phá ẩm thực đường phố Hà Nội với local guide chuyên nghiệp. Trải nghiệm các món ăn truyền thống như phở, bún chả, chả cá Lã Vọng, cà phê trứng và nhiều món ngon khác.',
                'duration_days': 1,
                'max_participants': 8,
                'min_participants': 2,
                'difficulty_level': 'easy',
                'starting_location': 'Hoàn Kiếm, Hà Nội',
                'ending_location': 'Hoàn Kiếm, Hà Nội',
                'price_per_person': 500000,
                'currency': 'VND',
                'discount_percentage': 0,
                'category': 'food',
                'rating': 4.8,
                'reviews_count': 124,
                'views_count': 850,
                'featured_image': '/images/tours/hanoi-food.svg',
                'itinerary': [
                    {
                        'day': 1,
                        'title': 'Khám phá ẩm thực Hà Nội',
                        'description': 'Tour khám phá các món ăn đường phố đặc trưng của Thủ đô',
                        'activities': [
                            'Gặp gỡ tại điểm hẹn, giới thiệu tour ẩm thực Hà Nội',
                            'Tham quan phố cổ Hà Nội',
                            'Thưởng thức phở bò truyền thống',
                            'Ăn bún chả Obama tại quán nổi tiếng',
                            'Thử nem cuốn tươi ngon',
                            'Thưởng thức cà phê trứng đặc sản',
                            'Ăn chè và các món tráng miệng',
                        ],
                        'accommodation': 'Không có (tour 1 ngày)',
                        'meals': 'Bao gồm tất cả các món ăn trong tour'
                    }
                ],
                'inclusions': [
                    'Hướng dẫn viên địa phương',
                    '8-10 món ăn đường phố',
                    'Nước uống',
                    'Bản đồ khu vực'
                ],
                'exclusions': [
                    'Đồ uống có cồn',
                    'Chi phí cá nhân',
                    'Tips (khuyến khích)'
                ],
                'tags': ['hà nội', 'ẩm thực', 'phố cổ', 'street food'],
                'available_dates': generate_available_dates()
            },
            {
                'title': 'Sapa Trekking Experience',
                'description': 'Trekking 2 ngày 1 đêm tại Sapa với homestay và văn hóa địa phương. Ngắm ruộng bậc thang, gặp gỡ người dân tộc, và tận hưởng không khí trong lành vùng núi.',
                'duration_days': 2,
                'max_participants': 12,
                'min_participants': 2,
                'difficulty_level': 'moderate',
                'starting_location': 'Sapa, Lào Cai',
                'ending_location': 'Sapa, Lào Cai',
                'price_per_person': 1200000,
                'currency': 'VND',
                'discount_percentage': 10,
                'category': 'adventure',
                'rating': 4.9,
                'reviews_count': 89,
                'views_count': 1123,
                'featured_image': '/images/tours/sapa-trekking.svg',
                'itinerary': [
                    {
                        'day': 1,
                        'title': 'Sapa - Cat Cat - Lao Chải',
                        'description': 'Trekking khám phá các làng bản và ruộng bậc thang',
                        'activities': [
                            'Khởi hành từ Sapa, trekking đến làng Cat Cat',
                            'Tham quan thác nước và nhà máy thủy điện cổ',
                            'Trekking qua ruộng bậc thang tuyệt đẹp',
                            'Đến làng Lao Chải, gặp gỡ người H\'Mông',
                            'Check-in homestay',
                            'Thưởng thức bữa tối địa phương',
                            'Tham gia hoạt động văn hóa với người dân'
                        ],
                        'accommodation': 'Homestay tại làng Lao Chải',
                        'meals': 'Trưa: Cơm hộp, Tối: Cơm homestay'
                    },
                    {
                        'day': 2,
                        'title': 'Tả Van - Trở về Sapa',
                        'description': 'Ngắm bình minh và trekking về Sapa',
                        'activities': [
                            'Ngắm bình minh trên ruộng bậc thang',
                            'Ăn sáng tại homestay',
                            'Trekking đến làng Tả Van',
                            'Gặp gỡ người dân tộc Giáy',
                            'Tìm hiểu văn hóa và nghề thủ công',
                            'Trekking trở về Sapa',
                            'Kết thúc tour, chia tay'
                        ],
                        'accommodation': 'Không có',
                        'meals': 'Sáng: Homestay, Trưa: Cơm địa phương'
                    }
                ],
                'inclusions': [
                    'Hướng dẫn viên trekking',
                    'Homestay 1 đêm',
                    'Bữa ăn theo chương trình',
                    'Bảo hiểm du lịch',
                    'Phí tham quan làng bản'
                ],
                'exclusions': [
                    'Xe đưa đón từ Hà Nội',
                    'Đồ uống cá nhân',
                    'Chi phí phát sinh'
                ],
                'tags': ['sapa', 'trekking', 'ruộng bậc thang', 'văn hóa'],
                'available_dates': generate_available_dates()
            },
            {
                'title': 'Vịnh Hạ Long 2 Ngày 1 Đêm',
                'description': 'Khám phá vịnh Hạ Long - Di sản thiên nhiên thế giới. Du thuyền trên vịnh, tham quan hang động, chèo kayak, và tận hưởng cảnh quan đá vôi tuyệt đẹp.',
                'duration_days': 2,
                'max_participants': 20,
                'min_participants': 2,
                'difficulty_level': 'easy',
                'starting_location': 'Hà Nội',
                'ending_location': 'Hà Nội',
                'price_per_person': 2500000,
                'currency': 'VND',
                'discount_percentage': 10,
                'category': 'nature',
                'rating': 4.8,
                'reviews_count': 342,
                'views_count': 2150,
                'featured_image': '/images/tours/halong-bay.svg',
                'itinerary': [
                    {
                        'day': 1,
                        'title': 'Hà Nội - Vịnh Hạ Long',
                        'description': 'Khởi hành từ Hà Nội, du thuyền trên vịnh Hạ Long',
                        'activities': [
                            'Đón khách tại Hà Nội lúc 8:00 sáng',
                            'Khởi hành đi Hạ Long (3-4 giờ)',
                            'Check-in tàu du lịch',
                            'Thưởng thức bữa trưa trên tàu',
                            'Tham quan hang Sửng Sốt - hang động đẹp nhất vịnh',
                            'Chèo kayak khám phá động Luồn',
                            'Tắm biển tại bãi Titop',
                            'Bữa tối hải sản tươi sống',
                            'Câu mực đêm hoặc karaoke'
                        ],
                        'accommodation': 'Du thuyền 3 sao với phòng đôi có cửa sổ view vịnh',
                        'meals': 'Trưa: Hải sản trên tàu, Tối: Buffet hải sản'
                    },
                    {
                        'day': 2,
                        'title': 'Hạ Long - Hà Nội',
                        'description': 'Ngắm bình minh và khám phá thêm vịnh Hạ Long',
                        'activities': [
                            'Ngắm bình minh trên vịnh',
                            'Tập Thái Cực Quyền trên boong tàu',
                            'Ăn sáng buffet',
                            'Tham quan hang Thiên Cung',
                            'Thưởng thức brunch trên tàu',
                            'Trả phòng, quay về cảng',
                            'Về đến Hà Nội lúc 16:00-17:00',
                            'Tiễn khách tại điểm đón ban đầu'
                        ],
                        'accommodation': 'Không có',
                        'meals': 'Sáng: Buffet trên tàu, Trưa: Brunch'
                    }
                ],
                'inclusions': [
                    'Xe đưa đón Hà Nội - Hạ Long',
                    'Tàu tham quan vịnh',
                    'Hướng dẫn viên',
                    'Bữa ăn theo chương trình',
                    'Phòng nghỉ trên tàu',
                    'Bảo hiểm du lịch'
                ],
                'exclusions': [
                    'Đồ uống cá nhân',
                    'Chi phí phát sinh',
                    'Tips',
                    'Dịch vụ spa/massage'
                ],
                'tags': ['hạ long', 'di sản', 'du thuyền', 'thiên nhiên'],
                'available_dates': generate_available_dates()
            },
            {
                'title': 'Hội An Ancient Town & Lantern Festival',
                'description': 'Khám phá phố cổ Hội An với kiến trúc cổ kính, làm đèn lồng truyền thống, và ngắm lễ hội đèn lồng vào buổi tối. Trải nghiệm văn hóa và ẩm thực địa phương.',
                'duration_days': 1,
                'max_participants': 15,
                'min_participants': 2,
                'difficulty_level': 'easy',
                'starting_location': 'Hội An, Quảng Nam',
                'ending_location': 'Hội An, Quảng Nam',
                'price_per_person': 800000,
                'currency': 'VND',
                'discount_percentage': 5,
                'category': 'cultural',
                'rating': 4.7,
                'reviews_count': 156,
                'views_count': 980,
                'featured_image': '/images/tours/hoi-an.svg',
                'itinerary': [
                    {
                        'day': 1,
                        'title': 'Phố cổ Hội An & Lễ hội đèn lồng',
                        'description': 'Khám phá vẻ đẹp phố cổ và trải nghiệm làm đèn lồng truyền thống',
                        'activities': [
                            'Tham quan Chùa Cầu - biểu tượng của Hội An',
                            'Khám phá Hội quán Phúc Kiến',
                            'Tham quan Nhà cổ Tân Kỳ',
                            'Lớp học làm đèn lồng truyền thống',
                            'Thưởng thức Cao lầu - đặc sản Hội An',
                            'Đi dạo phố cổ ban đêm ngắm đèn lồng',
                            'Thả hoa đăng trên sông Hoài',
                            'Trải nghiệm ẩm thực đường phố'
                        ],
                        'accommodation': 'Không có (tour 1 ngày)',
                        'meals': 'Tối: Set menu đặc sản Hội An (Cao lầu, Bánh bao - Bánh vạc, Chè)'
                    }
                ],
                'inclusions': [
                    'Hướng dẫn viên',
                    'Vé tham quan phố cổ',
                    'Lớp làm đèn lồng',
                    'Bữa tối',
                    'Bản đồ du lịch'
                ],
                'exclusions': [
                    'Đồ uống',
                    'Chi phí shopping',
                    'Tips'
                ],
                'tags': ['hội an', 'phố cổ', 'đèn lồng', 'văn hóa'],
                'available_dates': generate_available_dates()
            },
            {
                'title': 'Phú Quốc Island Paradise',
                'description': 'Khám phá đảo ngọc Phú Quốc với những bãi biển đẹp, vườn tiêu, nhà tù Phú Quốc, và tham quan các điểm du lịch nổi tiếng. Tận hưởng ẩm thực hải sản tươi sống.',
                'duration_days': 3,
                'max_participants': 16,
                'min_participants': 2,
                'difficulty_level': 'easy',
                'starting_location': 'Phú Quốc, Kiên Giang',
                'ending_location': 'Phú Quốc, Kiên Giang',
                'price_per_person': 3500000,
                'currency': 'VND',
                'discount_percentage': 12,
                'category': 'nature',
                'rating': 4.6,
                'reviews_count': 203,
                'views_count': 1450,
                'featured_image': '/images/tours/phu-quoc.svg',
                'itinerary': [
                    {
                        'day': 1,
                        'title': 'Đến Phú Quốc - Khám phá bãi biển',
                        'description': 'Check-in và tham quan các bãi biển đẹp nhất Phú Quốc',
                        'activities': [
                            'Đón khách tại sân bay Phú Quốc',
                            'Check-in khách sạn/resort',
                            'Tham quan bãi Sao - bãi biển đẹp nhất đảo',
                            'Tắm biển tại bãi Khem',
                            'Chụp ảnh với ghế đá Hòn Thơm',
                            'Thưởng thức hải sản tươi sống tại chợ đêm',
                            'Mua sắm đặc sản (nước mắm, sim rượu, ngọc trai)'
                        ],
                        'accommodation': 'Khách sạn 3 sao hoặc resort gần biển',
                        'meals': 'Tối: Hải sản tự chọn tại chợ đêm'
                    },
                    {
                        'day': 2,
                        'title': 'Tour bắc đảo - Văn hóa & Thiên nhiên',
                        'description': 'Khám phá lịch sử và thiên nhiên phía bắc đảo',
                        'activities': [
                            'Ăn sáng buffet tại khách sạn',
                            'Tham quan vườn tiêu Khu Tượng',
                            'Ghé nhà thùng sản xuất nước mắm',
                            'Tham quan nhà tù Phú Quốc - di tích lịch sử',
                            'Bữa trưa hải sản tại nhà hàng địa phương',
                            'Tắm biển và nghỉ ngơi tại resort',
                            'Ngắm hoàng hôn tại Sunset Sanato Beach Club',
                            'Khám phá chợ đêm Dinh Cậu'
                        ],
                        'accommodation': 'Khách sạn 3 sao hoặc resort',
                        'meals': 'Sáng: Buffet, Trưa: Set menu hải sản, Tối: Tự túc'
                    },
                    {
                        'day': 3,
                        'title': 'Lặn biển & Kết thúc hành trình',
                        'description': 'Trải nghiệm lặn ngắm san hô và mua sắm',
                        'activities': [
                            'Ăn sáng tại khách sạn',
                            'Tham gia tour lặn ngắm san hô tại Hòn Thơm/Hòn Mây Rút',
                            'Câu cá và BBQ trên đảo',
                            'Trả phòng khách sạn',
                            'Mua sắm đặc sản làm quà',
                            'Đưa ra sân bay',
                            'Kết thúc tour'
                        ],
                        'accommodation': 'Không có',
                        'meals': 'Sáng: Buffet tại khách sạn'
                    }
                ],
                'inclusions': [
                    'Xe đưa đón',
                    'Hướng dẫn viên',
                    'Bữa ăn theo chương trình',
                    'Khách sạn 2 đêm',
                    'Vé tham quan'
                ],
                'exclusions': [
                    'Vé máy bay',
                    'Đồ uống',
                    'Chi phí spa/massage'
                ],
                'tags': ['phú quốc', 'biển', 'đảo', 'hải sản'],
                'available_dates': generate_available_dates()
            },
            {
                'title': 'Mekong Delta - Sông Nước Miền Tây',
                'description': 'Khám phá đồng bằng sông Cửu Long với chợ nổi Cái Răng, làng nghề, vườn trái cây, và cuộc sống miền Tây. Trải nghiệm đi thuyền trên sông và thưởng thức trái cây miền Tây.',
                'duration_days': 2,
                'max_participants': 18,
                'min_participants': 2,
                'difficulty_level': 'easy',
                'starting_location': 'Cần Thơ',
                'ending_location': 'Cần Thơ',
                'price_per_person': 1500000,
                'currency': 'VND',
                'discount_percentage': 8,
                'category': 'cultural',
                'rating': 4.5,
                'reviews_count': 178,
                'views_count': 920,
                'featured_image': '/images/tours/mekong-delta.svg',
                'itinerary': [
                    {
                        'day': 1,
                        'title': 'Chợ nổi Cái Răng - Vườn trái cây',
                        'description': 'Trải nghiệm chợ nổi độc đáo và thưởng thức trái cây miền Tây',
                        'activities': [
                            'Khởi hành sáng sớm (5:00) đến chợ nổi Cái Răng',
                            'Tham quan và mua sắm trên thuyền',
                            'Thưởng thức bún riêu/hủ tiếu sáng trên sông',
                            'Ghé vườn trái cây 9 hecta',
                            'Thưởng thức trái cây tươi miền Tây',
                            'Nghe đờn ca tài tử',
                            'Bữa trưa đặc sản miền Tây tại vườn',
                            'Tham quan làm kẹo dừa',
                            'Check-in homestay ven sông',
                            'Bữa tối gia đình tại homestay'
                        ],
                        'accommodation': 'Homestay ven sông Hậu',
                        'meals': 'Sáng: Bún riêu/hủ tiếu, Trưa: Cơm miền Tây, Tối: Gia đình homestay'
                    },
                    {
                        'day': 2,
                        'title': 'Làng nghề & Rạch miền Tây',
                        'description': 'Khám phá làng nghề và cuộc sống trên sông nước',
                        'activities': [
                            'Ăn sáng đặc sản miền Tây',
                            'Đi thuyền nhỏ qua các rạch nhỏ',
                            'Tham quan làng nghề bánh tráng',
                            'Ghé vườn sầu riêng',
                            'Mua đặc sản (kẹo dừa, mứt, trái cây sấy)',
                            'Trở về Cần Thơ',
                            'Kết thúc tour'
                        ],
                        'accommodation': 'Không có',
                        'meals': 'Sáng: Homestay, Trưa: Cơm miền Tây'
                    }
                ],
                'inclusions': [
                    'Xe đưa đón',
                    'Thuyền tham quan',
                    'Hướng dẫn viên',
                    'Bữa ăn',
                    'Homestay 1 đêm',
                    'Vé tham quan'
                ],
                'exclusions': [
                    'Đồ uống',
                    'Chi phí cá nhân'
                ],
                'tags': ['miền tây', 'sông nước', 'chợ nổi', 'văn hóa'],
                'available_dates': generate_available_dates()
            },
            {
                'title': 'Huế - Cố Đô Việt Nam',
                'description': 'Khám phá cố đô Huế với Đại Nội, lăng tẩm các vua, chùa Thiên Mụ, và ẩm thực cung đình. Tìm hiểu lịch sử và văn hóa triều Nguyễn.',
                'duration_days': 2,
                'max_participants': 14,
                'min_participants': 2,
                'difficulty_level': 'moderate',
                'starting_location': 'Huế',
                'ending_location': 'Huế',
                'price_per_person': 1800000,
                'currency': 'VND',
                'discount_percentage': 10,
                'category': 'cultural',
                'rating': 4.7,
                'reviews_count': 145,
                'views_count': 1080,
                'featured_image': '/images/tours/hue-imperial.svg',
                'itinerary': [
                    {
                        'day': 1,
                        'title': 'Đại Nội Huế - Lăng tẩm các vua',
                        'description': 'Khám phá hoàng cung và lăng tẩm triều Nguyễn',
                        'activities': [
                            'Tham quan Đại Nội Huế - Di sản văn hóa thế giới',
                            'Khám phá Hoàng Thành và Tử Cấm Thành',
                            'Tham quan Thái Hòa Điện',
                            'Bữa trưa cơm Huế đặc sản',
                            'Tham quan lăng Khải Định - kiến trúc độc đáo',
                            'Tham quan lăng Minh Mạng - lăng đẹp nhất Huế',
                            'Bữa tối cung đình Huế (Bánh bèo, bánh nậm, nem lụi)',
                            'Nghe nhạc cung đình'
                        ],
                        'accommodation': 'Khách sạn 3 sao trung tâm Huế',
                        'meals': 'Trưa: Cơm Huế, Tối: Cung đình Huế'
                    },
                    {
                        'day': 2,
                        'title': 'Sông Hương - Chùa Thiên Mụ',
                        'description': 'Du thuyền sông Hương và tham quan chùa cổ',
                        'activities': [
                            'Ăn sáng tại khách sạn',
                            'Du thuyền sông Hương',
                            'Tham quan chùa Thiên Mụ - biểu tượng của Huế',
                            'Nghe giảng về lịch sử Phật giáo Huế',
                            'Bữa trưa ở nhà hàng ven sông',
                            'Tham quan chợ Đông Ba',
                            'Mua đặc sản (mè xửng, bánh khoái, sim)',
                            'Kết thúc tour, tiễn khách'
                        ],
                        'accommodation': 'Không có',
                        'meals': 'Sáng: Buffet khách sạn, Trưa: Cơm Huế'
                    }
                ],
                'inclusions': [
                    'Xe đưa đón',
                    'Hướng dẫn viên',
                    'Vé tham quan',
                    'Bữa ăn',
                    'Khách sạn 1 đêm'
                ],
                'exclusions': [
                    'Đồ uống',
                    'Chi phí phát sinh'
                ],
                'tags': ['huế', 'cố đô', 'lịch sử', 'văn hóa'],
                'available_dates': generate_available_dates()
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for tour_data in tours_data:
            # Check if tour exists
            existing = Tour.query.filter_by(title=tour_data['title']).first()
            
            if existing:
                # Update existing tour
                for key, value in tour_data.items():
                    if key == 'itinerary':
                        existing.set_itinerary(value)
                    elif key == 'inclusions':
                        existing.set_inclusions(value)
                    elif key == 'exclusions':
                        existing.set_exclusions(value)
                    elif key == 'tags':
                        existing.set_tags(value)
                    elif key == 'available_dates':
                        existing.set_available_dates(value)
                    elif hasattr(existing, key):
                        setattr(existing, key, value)
                existing.status = 'active'
                updated_count += 1
                print(f"  ✅ Updated: {tour_data['title'][:50]}...")
            else:
                # Create new tour
                tour = Tour(
                    title=tour_data['title'],
                    description=tour_data['description'],
                    seller_id=seller.id
                )
                
                # Set all fields
                for key, value in tour_data.items():
                    if key == 'itinerary':
                        tour.set_itinerary(value)
                    elif key == 'inclusions':
                        tour.set_inclusions(value)
                    elif key == 'exclusions':
                        tour.set_exclusions(value)
                    elif key == 'tags':
                        tour.set_tags(value)
                    elif key == 'available_dates':
                        tour.set_available_dates(value)
                    elif hasattr(tour, key):
                        setattr(tour, key, value)
                
                tour.status = 'active'
                db.session.add(tour)
                created_count += 1
                print(f"  ✅ Created: {tour_data['title'][:50]}...")
        
        db.session.commit()
        
        print(f"\n✅ Seeding complete!")
        print(f"   - Created: {created_count} tours")
        print(f"   - Updated: {updated_count} tours")
        print(f"   - Total active tours: {Tour.query.filter_by(status='active').count()}\n")

if __name__ == '__main__':
    import sys
    # Allow passing seller username as argument: python seed_tours.py tour_seller_vn
    seller_username = sys.argv[1] if len(sys.argv) > 1 else os.getenv('SEED_SELLER_USERNAME')
    seed_tours(seller_username)

