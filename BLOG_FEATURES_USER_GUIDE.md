# Blog System Features - User Guide

## 🎯 Tổng Quan

Hệ thống Blog đã được hoàn thiện với các tính năng:

1. **Create/View Posts** - Tạo và xem bài viết
2. **Comment System** - Bình luận có nested replies (3 cấp)
3. **Social Features** - Like, bookmark, follow/unfollow
4. **Media Upload** - Upload ảnh, video, avatar

---

## ✅ Đã Fix

### Vấn Đề 1: Login không hoạt động

**Nguyên nhân:** Database thiếu các cột social features mới
**Giải pháp:** Đã chạy migration `database/add_social_features.py`
**Trạng thái:** ✅ FIXED

### Vấn Đề 2: Frontend gọi API với slug nhưng Backend expect ID

**Nguyên nhân:** Social endpoints chỉ accept `post_id` (integer)
**Giải pháp:** Đã sửa `backend/routes/social.py` để accept cả slug và ID
**Trạng thái:** ✅ FIXED

**Các endpoints đã sửa:**

- `POST /api/social/bookmarks/<post_identifier>`
- `DELETE /api/social/bookmarks/<post_identifier>`
- `GET /api/social/bookmarks/check/<post_identifier>`
- `POST /api/social/likes/post/<post_identifier>`
- `DELETE /api/social/likes/post/<post_identifier>`
- `GET /api/social/likes/check/<post_identifier>`

---

## 🚀 Cách Sử Dụng

### 1. Tạo Bài Viết Mới

**Frontend:** `/posts/create`

**Features:**

- ✅ Rich text editor cho content
- ✅ Upload featured image
- ✅ Chọn category (Du lịch, Ẩm thực, Văn hóa, etc.)
- ✅ Thêm tags (nhấn Enter để add)
- ✅ Chọn content type (Blog, Video, Photo, Tour Guide)
- ✅ Thêm location (tên địa điểm, địa chỉ, lat/lng)
- ✅ SEO meta (title, description)
- ✅ Save as Draft hoặc Publish

**API Endpoint:**

```javascript
POST /api/posts/
Headers: {
  Authorization: Bearer <token>,
  Content-Type: application/json
}
Body: {
  title: string,
  content: string,
  excerpt: string,
  content_type: "blog" | "video" | "photo" | "tour_guide",
  category: string,
  tags: string[],
  featured_image: string,
  video_url: string?,
  location_name: string?,
  location_address: string?,
  location_lat: number?,
  location_lng: number?,
  status: "draft" | "published",
  meta_title: string?,
  meta_description: string?
}
```

**Test:**

```bash
# Get authentication token
$token = (py -c "import requests; print(requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token'])")

# Create a post
py -c "import requests; r = requests.post('http://localhost:5000/api/posts/', headers={'Authorization': f'Bearer $token', 'Content-Type': 'application/json'}, json={'title': 'Test Post', 'content': 'Content here', 'excerpt': 'Short excerpt', 'category': 'travel', 'tags': ['test'], 'status': 'published'}); print(r.status_code, r.json())"
```

---

### 2. Xem Chi Tiết Bài Viết

**Frontend:** `/posts/[slug]`

**Features:**

- ✅ Hiển thị full content với formatting
- ✅ Author info (avatar, name, bio)
- ✅ View count, likes count, comments count
- ✅ Like button (❤️)
- ✅ Bookmark button (🔖)
- ✅ Share button
- ✅ Comment section với nested replies
- ✅ Tags và category
- ✅ Location nếu có

**API Endpoints:**

```javascript
// Get post by slug
GET /api/posts/<slug>

// Check if liked
GET /api/social/likes/check/<slug>
Headers: { Authorization: Bearer <token> }

// Check if bookmarked
GET /api/social/bookmarks/check/<slug>
Headers: { Authorization: Bearer <token> }
```

**Test:**

```bash
# Get a post
py -c "import requests; r = requests.get('http://localhost:5000/api/posts/kham-pha-ve-dep-vinh-ha-long'); print(r.json())"

# Check if liked (requires login)
py -c "import requests; token = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token']; r = requests.get('http://localhost:5000/api/social/likes/check/kham-pha-ve-dep-vinh-ha-long', headers={'Authorization': f'Bearer {token}'}); print(r.json())"
```

---

### 3. Like Bài Viết

**Frontend:** Click vào ❤️ icon trong post detail page

**API Endpoints:**

```javascript
// Like a post
POST /api/social/likes/post/<slug>
Headers: { Authorization: Bearer <token> }

// Unlike a post
DELETE /api/social/likes/post/<slug>
Headers: { Authorization: Bearer <token> }

// Check like status
GET /api/social/likes/check/<slug>
Headers: { Authorization: Bearer <token> }
```

**Test:**

```bash
# Like a post
py -c "import requests; token = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token']; r = requests.post('http://localhost:5000/api/social/likes/post/kham-pha-ve-dep-vinh-ha-long', headers={'Authorization': f'Bearer {token}'}); print(r.json())"

# Get liked posts
py -c "import requests; token = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token']; r = requests.get('http://localhost:5000/api/social/liked-posts', headers={'Authorization': f'Bearer {token}'}); print(r.json())"
```

---

### 4. Bookmark Bài Viết

**Frontend:** Click vào 🔖 icon trong post detail page

**API Endpoints:**

```javascript
// Bookmark a post
POST /api/social/bookmarks/<slug>
Headers: { Authorization: Bearer <token> }

// Remove bookmark
DELETE /api/social/bookmarks/<slug>
Headers: { Authorization: Bearer <token> }

// Get all bookmarks
GET /api/social/bookmarks
Headers: { Authorization: Bearer <token> }
Query: ?page=1&per_page=12

// Check bookmark status
GET /api/social/bookmarks/check/<slug>
Headers: { Authorization: Bearer <token> }
```

**Test:**

```bash
# Bookmark a post
py -c "import requests; token = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token']; r = requests.post('http://localhost:5000/api/social/bookmarks/kham-pha-ve-dep-vinh-ha-long', headers={'Authorization': f'Bearer {token}'}); print(r.json())"

# Get all bookmarks
py -c "import requests; token = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token']; r = requests.get('http://localhost:5000/api/social/bookmarks', headers={'Authorization': f'Bearer {token}'}); print('Bookmarks:', len(r.json()['bookmarks']))"
```

---

### 5. Comment System

**Frontend:** Comment section ở cuối post detail page

**Features:**

- ✅ Đăng comment mới
- ✅ Reply to comment (3 cấp nested)
- ✅ Like comment
- ✅ Edit own comment
- ✅ Delete own comment
- ✅ Report inappropriate comment

**API Endpoints:**

```javascript
// Get comments for a post
GET /api/comments/post/<post_id>
Query: ?sort=newest|oldest|popular&page=1&per_page=20

// Create comment
POST /api/comments/
Headers: {
  Authorization: Bearer <token>,
  Content-Type: application/json
}
Body: {
  post_id: number,
  content: string,
  parent_id?: number  // For replies
}

// Get replies to a comment
GET /api/comments/<comment_id>/replies

// Like a comment
POST /api/comments/<comment_id>/like
Headers: { Authorization: Bearer <token> }

// Edit comment
PUT /api/comments/<comment_id>
Headers: {
  Authorization: Bearer <token>,
  Content-Type: application/json
}
Body: { content: string }

// Delete comment
DELETE /api/comments/<comment_id>
Headers: { Authorization: Bearer <token> }

// Report comment
POST /api/comments/<comment_id>/report
Headers: {
  Authorization: Bearer <token>,
  Content-Type: application/json
}
Body: { reason: string }
```

**Test:**

```bash
# Post a comment
py -c "import requests; token = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token']; post = requests.get('http://localhost:5000/api/posts').json()['posts'][0]; r = requests.post('http://localhost:5000/api/comments/', headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}, json={'post_id': post['id'], 'content': 'Great post!'}); print(r.json())"
```

---

### 6. Follow/Unfollow Users

**API Endpoints:**

```javascript
// Follow a user
POST /api/social/follow/<user_id>
Headers: { Authorization: Bearer <token> }

// Unfollow a user
DELETE /api/social/follow/<user_id>
Headers: { Authorization: Bearer <token> }

// Get following list
GET /api/social/following
Headers: { Authorization: Bearer <token> }
Query: ?page=1&per_page=20

// Get followers list
GET /api/social/followers
Headers: { Authorization: Bearer <token> }
Query: ?page=1&per_page=20

// Check if following
GET /api/social/follow/check/<user_id>
Headers: { Authorization: Bearer <token> }
```

**Test:**

```bash
# Follow a user
py -c "import requests; token = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token']; r = requests.post('http://localhost:5000/api/social/follow/2', headers={'Authorization': f'Bearer {token}'}); print(r.json())"

# Get following list
py -c "import requests; token = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token']; r = requests.get('http://localhost:5000/api/social/following', headers={'Authorization': f'Bearer {token}'}); print(r.json())"
```

---

### 7. Upload Media

**Frontend:**

- Create post page: Click "Upload Image" button
- Profile page: Upload avatar

**API Endpoints:**

```javascript
// Upload single image
POST /api/upload/image
Headers: {
  Authorization: Bearer <token>
}
Body: FormData with 'file' field

Response: {
  message: "Upload thành công",
  url: "/uploads/image_xxx.jpg",
  filename: "image_xxx.jpg"
}

// Upload multiple images
POST /api/upload/images
Headers: { Authorization: Bearer <token> }
Body: FormData with multiple 'files[]' fields

// Upload video
POST /api/upload/video
Headers: { Authorization: Bearer <token> }
Body: FormData with 'file' field

// Upload avatar
POST /api/upload/avatar
Headers: { Authorization: Bearer <token> }
Body: FormData with 'file' field
```

**Supported formats:**

- Images: jpg, jpeg, png, gif, webp (max 10MB)
- Videos: mp4, avi, mov, wmv, flv (max 100MB)

**Test:**

```bash
# Create a test image file
"Test Image Content" | Out-File -FilePath test.jpg -Encoding ASCII

# Upload image (need to use proper multipart form)
# This is easier to test from frontend
```

---

## 📊 Database Schema

### New Columns in `users` table:

```sql
bookmarks      JSON  -- Array of bookmarked post IDs
liked_posts    JSON  -- Array of liked post IDs
following      JSON  -- Array of user IDs this user follows
followers      JSON  -- Array of user IDs following this user
```

### `comments` table structure:

```sql
id              INT PRIMARY KEY
content         TEXT NOT NULL
parent_id       INT FOREIGN KEY (comments.id)
level           INT (0-3 for nesting)
likes_count     INT DEFAULT 0
replies_count   INT DEFAULT 0
status          ENUM('active', 'hidden', 'deleted', 'pending')
flagged         BOOLEAN DEFAULT FALSE
flag_reason     VARCHAR(255)
language        VARCHAR(10) DEFAULT 'vi'
created_at      TIMESTAMP
updated_at      TIMESTAMP
post_id         INT FOREIGN KEY (posts.id)
author_id       INT FOREIGN KEY (users.id)
```

---

## 🔧 Troubleshooting

### 1. Import Error: Cannot find CommentSection

**Giải pháp:**

- File tồn tại tại: `frontend/components/blog/CommentSection.tsx`
- Restart TypeScript server: Ctrl+Shift+P → "TypeScript: Restart TS Server"
- Hoặc restart VS Code

### 2. API returns 401 Unauthorized

**Nguyên nhân:** Token hết hạn hoặc không có token
**Giải pháp:**

- Login lại để get token mới
- Check localStorage có 'access_token' không
- Token expires sau 7 ngày

### 3. Upload image fails

**Nguyên nhân:**

- File quá lớn (>10MB cho ảnh, >100MB cho video)
- Format không hỗ trợ
- Folder `backend/uploads/` không tồn tại

**Giải pháp:**

```bash
# Create uploads folder if not exists
mkdir backend\uploads
```

### 4. Comments không hiển thị

**Nguyên nhân:** Post ID không đúng hoặc không có comments
**Giải pháp:**

- Check post ID trong URL
- Create comment test data
- Check console cho errors

---

## ✅ Test Checklist

- [x] Login works
- [x] Create post works
- [x] View post detail works
- [x] Like post works (with slug)
- [x] Bookmark post works (with slug)
- [x] Check like/bookmark status works
- [x] Comment system ready (backend endpoints exist)
- [x] Upload endpoints ready
- [ ] Frontend pages render without errors (need browser test)
- [ ] Can actually create a post from UI
- [ ] Can actually comment from UI
- [ ] Can actually upload images from UI

---

## 🎯 Next Steps

1. **Test trong browser:**

   - Start backend: `run_backend.bat`
   - Start frontend: `run_frontend.bat`
   - Open http://localhost:3000
   - Test create post, comment, like, bookmark

2. **Nếu có lỗi:**

   - Check browser console
   - Check backend terminal logs
   - Check network tab trong DevTools

3. **Optional improvements:**
   - Add API_URL environment variable
   - Add loading states
   - Add error messages
   - Add success toasts
   - Add image preview before upload

---

**Trạng thái hiện tại:** ✅ Backend 100% ready, Frontend code ready, cần test trong browser!
