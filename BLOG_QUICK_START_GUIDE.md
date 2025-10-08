# 🚀 VieGo Blog - Quick Start Guide

**Date:** October 7, 2025  
**Version:** 1.0.0-alpha

---

## 📋 Tổng Quan

Hệ thống Blog VieGo giờ đây đã hoàn thiện với đầy đủ tính năng:

- ✅ Tạo & quản lý bài viết
- ✅ Hệ thống bình luận (nested)
- ✅ Tương tác xã hội (like, bookmark, follow)
- ✅ Upload media (ảnh, video)
- ✅ Tìm kiếm & lọc nội dung

---

## 🔧 Cài Đặt & Chạy

### 1. Backend (Flask - Python)

```bash
# Di chuyển vào thư mục backend
cd d:\project\VieGo_Blog\backend

# Cài đặt dependencies (nếu chưa có)
pip install -r requirements.txt

# Chạy server
python main.py
```

**Server sẽ chạy tại:** `http://localhost:5000`

### 2. Frontend (Next.js - React)

```bash
# Di chuyển vào thư mục frontend
cd d:\project\VieGo_Blog\frontend

# Cài đặt dependencies (nếu chưa có)
npm install

# Chạy development server
npm run dev
```

**App sẽ chạy tại:** `http://localhost:3000`

---

## 📝 Hướng Dẫn Sử Dụng

### A. Tạo Bài Viết Mới

1. **Truy cập trang tạo bài viết:**

   ```
   http://localhost:3000/posts/create
   ```

2. **Điền thông tin:**

   - Chọn loại nội dung (Blog, Video, Photo, Tour Guide)
   - Nhập tiêu đề
   - Upload ảnh đại diện (featured image)
   - Viết nội dung chính
   - Thêm tóm tắt (excerpt)
   - Chọn danh mục (category)
   - Thêm tags (nhấn Enter sau mỗi tag)
   - Nhập thông tin địa điểm (tùy chọn)

3. **Xuất bản:**
   - Click "Lưu nháp" để lưu bản nháp
   - Click "Xuất bản" để đăng bài ngay

### B. Xem & Tương Tác Với Bài Viết

1. **Truy cập danh sách bài viết:**

   ```
   http://localhost:3000/posts
   ```

2. **Xem chi tiết bài viết:**

   - Click vào bài viết bất kỳ
   - Hoặc truy cập: `http://localhost:3000/posts/[slug]`

3. **Tương tác:**
   - **Thích bài:** Click nút "Thích" (trái tim)
   - **Lưu bài:** Click nút "Lưu" (bookmark)
   - **Chia sẻ:** Click nút "Chia sẻ"

### C. Bình Luận

1. **Viết bình luận:**

   - Cuộn xuống phần Comment Section
   - Nhập nội dung vào ô "Viết bình luận của bạn..."
   - Click "Đăng bình luận"

2. **Trả lời bình luận:**

   - Click "Trả lời" dưới bình luận muốn phản hồi
   - Nhập nội dung
   - Click nút "Send" hoặc nhấn Enter

3. **Thích bình luận:**

   - Click icon trái tim ở mỗi bình luận

4. **Xem replies:**
   - Click "Xem X phản hồi" để mở rộng
   - Click "Ẩn X phản hồi" để thu gọn

### D. Social Features

#### 1. Bookmark (Lưu bài viết)

```
POST /api/social/bookmarks/{post_id}  # Lưu bài
DELETE /api/social/bookmarks/{post_id}  # Xóa lưu
GET /api/social/bookmarks  # Xem tất cả bài đã lưu
```

#### 2. Follow/Unfollow

```
POST /api/social/follow/{user_id}  # Follow
POST /api/social/unfollow/{user_id}  # Unfollow
GET /api/social/following  # Danh sách đang follow
GET /api/social/followers  # Danh sách followers
```

### E. Upload Media

#### Upload Ảnh Đơn

```javascript
const formData = new FormData();
formData.append("file", imageFile);

fetch("http://localhost:5000/api/upload/image", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

#### Upload Nhiều Ảnh

```javascript
const formData = new FormData();
files.forEach((file) => formData.append("files", file));

fetch("http://localhost:5000/api/upload/images", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

---

## 🔑 API Endpoints Reference

### Posts API

```
GET    /api/posts/              # Lấy danh sách bài viết (có pagination, filter)
GET    /api/posts/{id}          # Lấy chi tiết bài viết
POST   /api/posts/              # Tạo bài viết mới (cần auth)
PUT    /api/posts/{id}          # Cập nhật bài viết (cần auth)
DELETE /api/posts/{id}          # Xóa bài viết (cần auth)
GET    /api/posts/featured      # Lấy bài viết nổi bật
GET    /api/posts/categories    # Lấy danh sách categories
GET    /api/posts/tags/popular  # Lấy tags phổ biến
```

### Comments API

```
POST   /api/comments/                        # Tạo comment/reply mới
GET    /api/comments/post/{post_id}          # Lấy comments của bài viết
GET    /api/comments/{id}/replies            # Lấy replies của comment
PUT    /api/comments/{id}                    # Cập nhật comment
DELETE /api/comments/{id}                    # Xóa comment
POST   /api/comments/{id}/like               # Like comment
POST   /api/comments/{id}/unlike             # Unlike comment
POST   /api/comments/{id}/report             # Báo cáo comment
```

### Social API

```
# Bookmarks
GET    /api/social/bookmarks                 # Lấy bookmarks của user
POST   /api/social/bookmarks/{post_id}       # Bookmark post
DELETE /api/social/bookmarks/{post_id}       # Xóa bookmark
GET    /api/social/bookmarks/check/{post_id} # Kiểm tra bookmark status

# Likes
POST   /api/social/likes/post/{post_id}      # Like post
DELETE /api/social/likes/post/{post_id}      # Unlike post
GET    /api/social/likes/check/{post_id}     # Kiểm tra like status

# Follow
POST   /api/social/follow/{user_id}          # Follow user
POST   /api/social/unfollow/{user_id}        # Unfollow user
GET    /api/social/following                 # Danh sách đang follow
GET    /api/social/followers                 # Danh sách followers
GET    /api/social/check-follow/{user_id}    # Kiểm tra follow status
```

### Upload API

```
POST   /api/upload/image       # Upload 1 ảnh
POST   /api/upload/images      # Upload nhiều ảnh (max 10)
POST   /api/upload/video       # Upload video
POST   /api/upload/avatar      # Upload & cập nhật avatar
```

---

## 🎯 Query Parameters

### GET /api/posts/

```
?page=1              # Trang số (default: 1)
?per_page=12         # Số bài/trang (default: 12, max: 50)
?category=travel     # Lọc theo category
?tag=hanoi           # Lọc theo tag
?search=keyword      # Tìm kiếm theo keyword
?language=vi         # Lọc theo ngôn ngữ
?featured=true       # Chỉ lấy bài nổi bật
```

### GET /api/comments/post/{post_id}

```
?page=1              # Trang số
?per_page=20         # Số comments/trang (default: 20, max: 50)
```

---

## 🔒 Authentication

Tất cả các endpoints có đánh dấu **(cần auth)** yêu cầu JWT token trong header:

```javascript
headers: {
  'Authorization': `Bearer ${access_token}`
}
```

**Lấy token:**

- Đăng nhập qua `/api/auth/login`
- Token được lưu trong `localStorage.access_token`

---

## 📊 Response Format

### Success Response

```json
{
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "error": "Error message"
}
```

### Pagination Response

```json
{
  "posts": [...],
  "pagination": {
    "page": 1,
    "pages": 5,
    "per_page": 12,
    "total": 58,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 🧪 Testing

### 1. Test Backend API

**Test Posts API:**

```bash
# Lấy danh sách posts
curl http://localhost:5000/api/posts/

# Lấy chi tiết post
curl http://localhost:5000/api/posts/1
```

**Test Comments API:**

```bash
# Lấy comments của post
curl http://localhost:5000/api/comments/post/1
```

**Test với Authentication:**

```bash
# Login để lấy token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@viego.com","password":"admin123"}'

# Sử dụng token
curl http://localhost:5000/api/social/bookmarks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Frontend

**Manual Testing Flow:**

1. ✅ Đăng nhập/Đăng ký
2. ✅ Tạo bài viết mới với đầy đủ thông tin
3. ✅ Upload ảnh featured image
4. ✅ Thêm tags và category
5. ✅ Xuất bản bài viết
6. ✅ Xem bài viết vừa tạo
7. ✅ Like bài viết
8. ✅ Bookmark bài viết
9. ✅ Viết comment
10. ✅ Reply comment
11. ✅ Like comment
12. ✅ Share bài viết

---

## 🐛 Troubleshooting

### Backend không start

```bash
# Kiểm tra Python version
python --version  # Cần >= 3.9

# Kiểm tra MySQL
# Đảm bảo WAMP/MySQL đang chạy

# Kiểm tra dependencies
pip install -r requirements.txt
```

### Frontend không start

```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install

# Hoặc dùng npm cache clean
npm cache clean --force
npm install
```

### CORS Error

- Đảm bảo backend đang chạy trên port 5000
- Frontend đang chạy trên port 3000
- CORS đã được config trong `backend/main.py`

### Upload Error

```bash
# Kiểm tra thư mục uploads tồn tại
mkdir -p backend/uploads/images
mkdir -p backend/uploads/videos
mkdir -p backend/uploads/avatars

# Kiểm tra quyền write
chmod 755 backend/uploads
```

---

## 📱 Routes Frontend

```
/                        → Homepage
/login                   → Đăng nhập
/register                → Đăng ký
/posts                   → Danh sách bài viết
/posts/create            → Tạo bài viết mới
/posts/[slug]            → Chi tiết bài viết
/blog                    → Blog page (alternative)
/profile                 → User profile
/dashboard               → User dashboard
/dashboard/admin         → Admin dashboard
```

---

## 💡 Tips & Best Practices

### Tạo Bài Viết Hiệu Quả

- ✅ Sử dụng tiêu đề hấp dẫn, rõ ràng
- ✅ Upload ảnh đại diện chất lượng cao
- ✅ Viết excerpt ngắn gọn, thu hút
- ✅ Thêm 3-5 tags relevant
- ✅ Chọn category phù hợp
- ✅ Thêm thông tin địa điểm nếu là bài travel

### Tương Tác Tốt

- ✅ Viết comment có ý nghĩa
- ✅ Reply constructive
- ✅ Sử dụng bookmark cho bài hay
- ✅ Follow authors bạn thích

### Performance

- ✅ Compress ảnh trước khi upload (< 2MB recommended)
- ✅ Sử dụng pagination khi load comments
- ✅ Lazy load images
- ✅ Debounce search input

---

## 📚 Additional Resources

### Documentation

- [Project Status](PROJECT_STATUS.md)
- [Implementation Summary](BLOG_SYSTEM_IMPLEMENTATION_SUMMARY.md)
- [User Management Guide](USER_MANAGEMENT_QUICK_START.md)

### API Documentation

- Backend: `http://localhost:5000/api/health`
- Swagger (future): TBD

### Support

- Issues: GitHub Issues
- Questions: Project discussions

---

## 🎉 Chúc Mừng!

Bạn đã sẵn sàng sử dụng hệ thống Blog VieGo!

**Happy Blogging! 🚀✨**
