#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Update tour itinerary format from old {day1: {morning, afternoon, evening}} 
to new [{day, title, description, activities[], accommodation, meals}]
"""

import sys
import json
sys.path.insert(0, 'D:/project/VieGo_Blog/backend')

from models import db
from models.tour import Tour
from main import app

# New itinerary format for each tour
NEW_ITINERARIES = {
    'Hà Nội Street Food Adventure': [
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
    
    'Sapa Trekking Experience': [
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
    
    'Vịnh Hạ Long 2 Ngày 1 Đêm': [
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
    ]
}

def update_tour_itinerary():
    with app.app_context():
        print("🔄 Updating tour itineraries to new format...")
        updated = 0
        
        for title, new_itinerary in NEW_ITINERARIES.items():
            tour = Tour.query.filter_by(title=title).first()
            if tour:
                print(f"  ➡️  Updating: {title}")
                tour.set_itinerary(new_itinerary)
                updated += 1
            else:
                print(f"  ⚠️  Tour not found: {title}")
        
        db.session.commit()
        print(f"\n✅ Successfully updated {updated} tours!")
        print(f"📍 Refresh your browser to see detailed itinerary on tour journey page")

if __name__ == '__main__':
    try:
        update_tour_itinerary()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
