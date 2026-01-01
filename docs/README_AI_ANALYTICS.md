# AI Analytics & Promotional Email System

## Tổng quan

Hệ thống phân tích dữ liệu AI và gửi email khuyến mãi tự động cho VieGo Blog.

### Tính năng chính:

1. **Theo dõi hành vi người dùng** - Ghi nhận mọi tương tác của người dùng
2. **Phân tích sở thích AI** - Tự động phân tích và tạo profile sở thích
3. **Đề xuất tour cá nhân hóa** - Gợi ý tour phù hợp với từng người dùng
4. **Email khuyến mãi tự động** - Gửi email hàng tuần với tour được cá nhân hóa
5. **Quản lý chiến dịch** - Tạo và quản lý các chiến dịch email marketing

---

## Cài đặt

### 1. Cài đặt dependencies

```bash
cd backend
pip install schedule
# hoặc
pip install -r requirements.txt
```

### 2. Chạy migration tạo bảng

```bash
cd database
python migrate_ai_analytics.py
```

### 3. Cấu hình môi trường (.env)

```env
# Email Scheduler Settings
PROMO_EMAIL_WEEKLY_DAY=monday          # Ngày gửi email trong tuần
PROMO_EMAIL_WEEKLY_TIME=09:00          # Giờ gửi email
PROMO_EMAIL_BATCH_SIZE=50              # Số email mỗi batch
AUTO_START_EMAIL_SCHEDULER=false       # Tự động bật scheduler khi khởi động

# Frontend URL (cho tracking links)
FRONTEND_URL=http://localhost:3000

# Email Configuration (đã có sẵn)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

---

## API Endpoints

### Tracking Hành Vi

```http
POST /api/analytics/track
Authorization: Bearer <token>

{
    "action_type": "view_tour",    // Loại hành vi
    "target_id": 123,              // ID đối tượng (tour, location, etc.)
    "target_type": "tour",         // Loại đối tượng
    "metadata": {},                // Dữ liệu bổ sung
    "session_id": "abc123",        // ID phiên
    "duration_seconds": 120        // Thời gian xem
}
```

**Các loại action_type:**

- `view_tour` - Xem tour
- `search_tour` - Tìm kiếm tour
- `book_tour` - Đặt tour
- `wishlist_tour` - Thêm vào danh sách yêu thích
- `share_tour` - Chia sẻ tour
- `review_tour` - Đánh giá tour
- `view_category` - Xem danh mục
- `click_promotion` - Click vào khuyến mãi
- `open_email` - Mở email
- `click_email_link` - Click link trong email

### Tracking Nhanh Xem Tour

```http
POST /api/analytics/track/tour-view/<tour_id>
Authorization: Bearer <token>

{
    "session_id": "abc123",
    "duration_seconds": 120
}
```

### Lấy Đề Xuất Tour

```http
GET /api/analytics/recommendations?limit=10&only_discounted=false
Authorization: Bearer <token>

Response:
{
    "success": true,
    "recommendations": [
        {
            "id": 1,
            "title": "Tour Đà Nẵng",
            "match_score": 85.5,
            "discount_percentage": 20,
            ...
        }
    ],
    "count": 10
}
```

### Xem Profile Sở Thích

```http
GET /api/analytics/my-profile
Authorization: Bearer <token>

Response:
{
    "success": true,
    "profile": {
        "category_scores": {
            "adventure": 85.0,
            "cultural": 60.0,
            "food": 45.0,
            ...
        },
        "top_categories": ["adventure", "cultural", "food"],
        "price_range": {
            "min": 1000000,
            "max": 5000000
        },
        ...
    }
}
```

### Phân Tích Lại Sở Thích

```http
POST /api/analytics/analyze-me?days=90
Authorization: Bearer <token>
```

### Lấy Tour Đang Trending

```http
GET /api/analytics/trending?days=7&limit=10

Response:
{
    "success": true,
    "trending": [...],
    "period_days": 7
}
```

### Xu Hướng Theo Danh Mục

```http
GET /api/analytics/category-trends?days=30

Response:
{
    "success": true,
    "trends": {
        "period_days": 30,
        "categories": [
            {"category": "adventure", "stats": {...}, "rank": 1},
            ...
        ]
    }
}
```

---

## Admin API

### Quản Lý Phân Tích

```http
# Lấy phân loại người dùng theo segments
GET /api/analytics/admin/segments

# Phân tích hàng loạt tất cả người dùng
POST /api/analytics/admin/analyze-all

# Xem profile của một user
GET /api/analytics/admin/user/<user_id>/profile

# Xem lịch sử hành vi
GET /api/analytics/admin/user/<user_id>/behaviors?page=1&per_page=50&days=30
```

### Quản Lý Chiến Dịch

```http
# Liệt kê campaigns
GET /api/analytics/admin/campaigns?status=active&type=weekly_personalized

# Tạo campaign mới
POST /api/analytics/admin/campaigns
{
    "name": "Khuyến mãi cuối năm",
    "description": "Chiến dịch email cuối năm",
    "campaign_type": "weekly_personalized",
    "schedule_type": "weekly",
    "schedule_day": 0,  // 0=Monday
    "schedule_time": "09:00",
    "target_segments": ["high_value", "frequent_bookers"],
    "min_engagement_level": "medium",
    "status": "active"
}

# Cập nhật campaign
PUT /api/analytics/admin/campaigns/<campaign_id>

# Xóa campaign
DELETE /api/analytics/admin/campaigns/<campaign_id>

# Chạy campaign ngay
POST /api/analytics/admin/campaigns/<campaign_id>/run

# Xem thống kê campaign
GET /api/analytics/admin/campaigns/<campaign_id>/stats
```

### Quản Lý Email Logs

```http
GET /api/analytics/admin/email-logs?campaign_id=1&status=sent&page=1
```

### Quản Lý Scheduler

```http
# Xem trạng thái scheduler
GET /api/analytics/admin/scheduler/status

# Bắt đầu scheduler
POST /api/analytics/admin/scheduler/start

# Dừng scheduler
POST /api/analytics/admin/scheduler/stop
```

### Test Gửi Email

```http
POST /api/analytics/admin/test/send-email/<user_id>
```

---

## Loại Chiến Dịch

| Type                  | Mô tả                       |
| --------------------- | --------------------------- |
| `weekly_personalized` | Email cá nhân hóa hàng tuần |
| `flash_sale`          | Flash sale ngắn hạn         |
| `seasonal`            | Theo mùa                    |
| `holiday`             | Ngày lễ                     |
| `new_tours`           | Tour mới                    |
| `abandoned_cart`      | Giỏ hàng bỏ quên            |
| `re_engagement`       | Tái kích hoạt người dùng    |

---

## Segments Người Dùng

| Segment            | Điều kiện                    |
| ------------------ | ---------------------------- |
| `high_value`       | Chi tiêu > 50M VND           |
| `frequent_bookers` | >= 5 bookings                |
| `browsers`         | Xem nhiều (>50), đặt ít (<2) |
| `deal_seekers`     | Price sensitivity > 0.7      |
| `new_users`        | Đăng ký trong 30 ngày        |
| `inactive`         | Không hoạt động > 60 ngày    |

---

## Thuật Toán Phân Tích

### Trọng Số Hành Vi

```python
ACTION_WEIGHTS = {
    'book_tour': 10.0,         # Đặt tour
    'complete_booking': 15.0,   # Hoàn thành booking
    'review_tour': 8.0,        # Đánh giá
    'wishlist_tour': 5.0,      # Wishlist
    'share_tour': 3.0,         # Chia sẻ
    'click_promotion': 2.0,    # Click khuyến mãi
    'open_email': 1.5,         # Mở email
    'click_email_link': 3.0,   # Click link email
    'view_tour': 1.0,          # Xem tour
    'search_tour': 0.5         # Tìm kiếm
}
```

### Time Decay

Hành vi cũ hơn sẽ có trọng số thấp hơn:

```
final_weight = action_weight × (0.95 ^ weeks_ago)
```

### Điểm Match Tour

```python
# 40% - Điểm danh mục
# 20% - Phù hợp giá
# 15% - Phù hợp thời gian
# 10% - Địa điểm yêu thích
# 10% - Tags yêu thích
# 5%  - Bonus giảm giá
```

---

## Tích Hợp Frontend

### Tracking Tour View

```javascript
// Khi user xem chi tiết tour
const trackTourView = async (tourId, sessionId, durationSeconds) => {
  await fetch(`/api/analytics/track/tour-view/${tourId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      session_id: sessionId,
      duration_seconds: durationSeconds,
    }),
  });
};
```

### Lấy Đề Xuất Tour

```javascript
const getRecommendations = async () => {
  const response = await fetch("/api/analytics/recommendations?limit=5", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};
```

### Tracking General

```javascript
const trackBehavior = async (
  actionType,
  targetId,
  targetType,
  metadata = {}
) => {
  await fetch("/api/analytics/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action_type: actionType,
      target_id: targetId,
      target_type: targetType,
      metadata: metadata,
      session_id: getSessionId(),
    }),
  });
};

// Ví dụ sử dụng
trackBehavior("search_tour", null, null, {
  query: "tour đà nẵng",
  category: "adventure",
  location: "Đà Nẵng",
});

trackBehavior("wishlist_tour", 123, "tour");
trackBehavior("book_tour", 123, "tour");
```

---

## Cấu Trúc Database

### user_behaviors

- Ghi nhận mọi hành vi của người dùng
- Lưu metadata, session, device info

### user_interest_profiles

- Profile sở thích được tính toán từ hành vi
- Điểm cho từng danh mục (0-100)
- Phạm vi giá, thời gian yêu thích
- Engagement metrics

### promotional_campaigns

- Quản lý các chiến dịch email
- Lịch gửi, target segments
- Thống kê hiệu quả

### email_logs

- Nhật ký gửi email
- Tracking mở, click
- Error logging

---

## Lưu ý quan trọng

1. **Privacy**: Hệ thống chỉ track hành vi của người dùng đã đăng nhập
2. **Email Preferences**: Tôn trọng cài đặt `email_notifications` của user
3. **Rate Limiting**: Không gửi quá nhiều email cho cùng một user
4. **Unsubscribe**: Cung cấp link hủy đăng ký trong mọi email
5. **Scheduler**: Chạy trong background thread, không block main app
