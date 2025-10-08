# ADMIN DASHBOARD FIX - HOÀN TẤT ✅

## Tóm Tắt Vấn Đề

Admin dashboard không hiển thị data, tất cả số liệu đều là 0, và có lỗi 401/500 khi gọi API.

## Nguyên Nhân

1. **Token key mismatch**: Frontend dùng "viego_token" nhưng AuthContext lưu "access_token"
2. **JWT identity type**: Backend truyền `user.id` (int) thay vì `str(user.id)` vào JWT
3. **Database schema mismatch**: Post model và Comment model khai báo columns không có trong MySQL

## Các Lỗi Đã Fix

### 1. Frontend - Token Key Mismatch ✅

**Files đã sửa:**

- `frontend/app/dashboard/admin/page.tsx` - 18 occurrences
- `frontend/app/dashboard/admin/page_enhanced.tsx` - 17 occurrences
- `frontend/lib/SocketContext.tsx`

**Thay đổi:** `localStorage.getItem("viego_token")` → `localStorage.getItem("access_token")`

### 2. Backend - JWT Identity Type ✅

**File:** `backend/routes/auth.py`

**Thay đổi:**

```python
# Before
create_access_token(identity=user.id)

# After
create_access_token(identity=str(user.id))
```

**Line 70 & Line 114**

### 3. Backend - Admin Decorator ✅

**File:** `backend/routes/admin.py`

**Thay đổi:**

```python
# Before
user = User.query.get(current_user_id)

# After
user = User.query.get(int(current_user_id))
```

### 4. Database - Posts Table Columns ✅

**Columns đã thêm:**

```sql
-- Content metadata
content_type ENUM('blog', 'video', 'photo', 'tour_guide') DEFAULT 'blog'
language VARCHAR(10) DEFAULT 'vi'
reading_time INT NULL

-- Media
images JSON NULL
video_url VARCHAR(255) NULL
video_embed TEXT NULL

-- Location
location_lat DECIMAL(10,8) NULL
location_lng DECIMAL(11,8) NULL
location_name VARCHAR(255) NULL
location_address TEXT NULL

-- Categorization
category ENUM('travel', 'food', 'culture', 'adventure', 'budget', 'luxury') DEFAULT 'travel'
difficulty_level VARCHAR(20) NULL

-- Engagement
views_count INT DEFAULT 0
likes_count INT DEFAULT 0
shares_count INT DEFAULT 0
comments_count INT DEFAULT 0

-- Publishing
featured TINYINT(1) DEFAULT 0

-- SEO
meta_title VARCHAR(255) NULL
meta_keywords TEXT NULL

-- Interactive
is_interactive TINYINT(1) DEFAULT 0
story_choices JSON NULL

-- Collaboration
collaborative TINYINT(1) DEFAULT 0
collaborators JSON NULL
```

### 5. Database - Comments Table Columns ✅

**Columns đã thêm:**

```sql
level INT DEFAULT 0
likes_count INT DEFAULT 0
replies_count INT DEFAULT 0
flagged TINYINT(1) DEFAULT 0
flag_reason VARCHAR(255) NULL
language VARCHAR(10) DEFAULT 'vi'
translated_content TEXT NULL
```

## Verification Test Results ✅

```
=== TEST ADMIN AUTH ===
1. Login: ✅ 200 OK
2. Stats endpoint: ✅ 200 OK
   - Total Users: 17
   - Total Posts: 2
   - Total Comments: 0
```

## Next Steps

### ⚠️ QUAN TRỌNG - Phải làm để dashboard hoạt động:

1. **Restart Backend**

   ```bash
   # Stop backend hiện tại (Ctrl+C)
   # Rồi chạy lại:
   .\run_backend.bat
   ```

2. **Clear Browser Cache & Tokens**

   ```javascript
   // Mở Console trong browser (F12)
   localStorage.clear();
   // Rồi refresh trang
   ```

3. **Login lại với admin**

   - Username: `admin`
   - Password: `admin123`

4. **Vào Admin Dashboard**
   - URL: `http://localhost:3000/dashboard/admin`
   - Sẽ thấy stats hiện đúng số liệu
   - Không còn lỗi 401 hoặc 500

## Files Created (For Reference)

- `fix_database_columns.py` - Thêm columns cho posts
- `fix_language_column.py` - Thêm language column
- `fix_all_columns.py` - Thêm batch columns
- `fix_category_tags.py` - Thêm category & tags
- `fix_final_columns.py` - Thêm views_count, likes_count, etc
- `fix_comments_columns.py` - Thêm columns cho comments
- `check_posts_schema.py` - Kiểm tra schema posts
- `check_comments_schema.py` - Kiểm tra schema comments
- `test_admin_auth.py` - Test authentication & API

## Technical Notes

### JWT Token Format

```javascript
{
  "identity": "1",  // String, not number!
  "exp": 1234567890,
  "iat": 1234567890,
  "fresh": false
}
```

### Admin Authentication Flow

1. User login → Backend generates JWT with `identity=str(user.id)`
2. Token saved to `localStorage.getItem("access_token")`
3. Admin page reads token from "access_token" key
4. Backend receives JWT, extracts identity as string
5. Admin decorator converts `int(current_user_id)` for database query
6. Returns user data if role is 'admin' or 'moderator'

### Database Schema Philosophy

- Post model khai báo đầy đủ columns cho future features
- Database schema ban đầu chỉ có basic columns
- Đã sync 100% giữa model và database
- Sử dụng JSON type cho arrays (tags, images, collaborators, story_choices)
- Sử dụng ENUM cho status fields

## Troubleshooting

### Nếu vẫn thấy 401 Unauthorized:

```javascript
// Check token trong browser console:
localStorage.getItem("access_token");
// Nếu null hoặc undefined → login lại
```

### Nếu vẫn thấy 500 Server Error:

```python
# Check backend logs để xem "Unknown column" error
# Nếu còn thiếu column nào → chạy lại fix script
```

### Nếu dashboard vẫn hiển thị 0 0 0:

```bash
# Restart backend để áp dụng JWT fix
# Clear localStorage trong browser
# Login lại
```

---

**Status:** ✅ All fixes applied and verified  
**Last Test:** Admin API returning 200 with correct data  
**Action Required:** Restart backend + clear browser cache + re-login
