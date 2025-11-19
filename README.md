# VieGo Blog - Travel & Food Blog Platform

<div align="center">

**Nền tảng blog du lịch & ẩm thực tích hợp hệ thống quản lý tour toàn diện**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)](https://flask.palletsprojects.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)

</div>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [API Documentation](#-api-documentation)
- [Tài liệu tham khảo](#-tài-liệu-tham-khảo)

---

## 🚀 Giới thiệu

**VieGo Blog** là nền tảng blog du lịch và ẩm thực kết hợp hệ thống quản lý tour chuyên nghiệp. Dự án cung cấp giải pháp toàn diện cho việc chia sẻ trải nghiệm du lịch, đặt tour, quản lý booking và theo dõi tiến trình tour real-time.

### Đối tượng sử dụng

- **Du khách**: Tìm kiếm, đọc blog, đặt tour, theo dõi lịch trình
- **Blogger/Content Creator**: Chia sẻ trải nghiệm, viết bài, tương tác cộng đồng
- **Seller**: Quản lý tour, xử lý booking, phân công hướng dẫn viên
- **Tour Guide**: Nhận tour, cập nhật tiến trình, check-in điểm tham quan
- **Admin**: Quản lý toàn bộ hệ thống, người dùng, nội dung

---

## ✨ Tính năng chính

### 📝 Hệ thống Blog & Nội dung

- ✅ Tạo, chỉnh sửa bài viết với rich text editor
- ✅ Hỗ trợ nhiều loại nội dung: blog, video, photo gallery, tour guide
- ✅ Upload và quản lý hình ảnh
- ✅ Tìm kiếm full-text, lọc theo danh mục, tags
- ✅ Hệ thống comment và tương tác
- ✅ Đánh giá (like/dislike) và rating
- ✅ Chia sẻ lên mạng xã hội

### 🎫 Quản lý Tour & Booking

- ✅ Tạo và quản lý tour với lịch trình chi tiết
- ✅ Hệ thống booking tour trực tuyến
- ✅ Quản lý thông tin người tham gia (participants)
- ✅ Thanh toán và xác nhận booking
- ✅ Gửi email xác nhận và thông tin tour
- ✅ Xuất danh sách người tham gia (Excel/CSV)

### 👥 Phân công & Quản lý Hướng dẫn viên

- ✅ Phân công hướng dẫn viên cho từng tour
- ✅ Xem danh sách tour được phân công
- ✅ Thông báo real-time khi được phân công
- ✅ Quản lý thông tin hướng dẫn viên

### 📍 Theo dõi Tiến trình Tour

- ✅ Check-in/Check-out tại các điểm tham quan
- ✅ Cập nhật tiến trình real-time
- ✅ Upload hình ảnh tại điểm check-in
- ✅ Ghi chú và mô tả hoạt động
- ✅ Khách hàng xem tiến trình tour của mình

### 👤 Quản lý Người dùng & Phân quyền

- ✅ Đăng ký, đăng nhập với JWT
- ✅ Phân quyền: User, Moderator, Admin, Seller, Tour Guide
- ✅ Xác thực email
- ✅ Quản lý profile, avatar, cover image
- ✅ Hệ thống điểm, level, badges

### 💬 Social Features

- ✅ Follow/Unfollow users
- ✅ Friend requests và quản lý bạn bè
- ✅ Real-time chat (Socket.io)
- ✅ Group chat
- ✅ Notifications hệ thống
- ✅ News feed và timeline

### 🎯 Tính năng Nâng cao

- ✅ Đa ngôn ngữ (i18n)
- ✅ Google Maps integration
- ✅ Tích hợp AI/ML recommendations
- ✅ Analytics và dashboard
- ✅ Dark mode / Light mode
- ✅ Responsive design (mobile-first)

---

## 🛠 Công nghệ sử dụng

### Backend

- **Framework**: Flask 2.3.3
- **Database**: MySQL 8.0 + SQLAlchemy ORM
- **Authentication**: Flask-JWT-Extended
- **Real-time**: Flask-SocketIO + Socket.io
- **Email**: Flask-Mail
- **File Processing**: Pillow, ReportLab, openpyxl

### Frontend

- **Framework**: Next.js 14.0 (React 18.2)
- **Styling**: TailwindCSS 3.3
- **State Management**: React Hooks + Context API
- **API Client**: Axios
- **Real-time**: Socket.io-client
- **Maps**: Google Maps API
- **UI Libraries**: Framer Motion, Lucide Icons

### DevOps & Tools

- **Version Control**: Git
- **Package Managers**: pip (Python), npm (Node.js)
- **Testing**: pytest (Backend), Jest (Frontend)

---

## 📋 Yêu cầu hệ thống

- **Python**: 3.8 trở lên
- **Node.js**: 16.x trở lên
- **MySQL**: 8.0 trở lên
- **npm** hoặc **yarn**
- **Git**

---

## 🔧 Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/thienne1602/VieGo_Blog.git
cd VieGo_Blog
```

### 2. Cài đặt Backend

#### Tạo môi trường ảo (Virtual Environment)

```powershell
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

```bash
# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

#### Cài đặt dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Cài đặt thêm gói cần thiết cho tính năng xuất Excel

```bash
pip install openpyxl
```

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
# hoặc
yarn install
```

### 4. Cài đặt Database

#### Tạo database MySQL

```sql
CREATE DATABASE viego_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Chạy migration scripts

```bash
# Từ thư mục gốc dự án
python database/schema.sql
```

Hoặc sử dụng file bat:

```bash
.\database\create_database_manual.sql
```

#### Seed dữ liệu mẫu (Optional)

```bash
.\scripts\setup\seed_data.bat
```

---

## ⚙️ Cấu hình

### Backend Configuration

Tạo file `.env` trong thư mục `backend/`:

```env
# Database
DATABASE_URL=mysql+pymysql://root:password@localhost/viego_blog

# JWT Secret
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-flask-secret-key

# Upload Configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216  # 16MB
```

### Frontend Configuration

Tạo file `.env.local` trong thư mục `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

---

## 🚀 Chạy ứng dụng

### Cách 1: Chạy thủ công

#### Chạy Backend

```bash
# Từ thư mục backend
python main.py
```

Backend sẽ chạy tại: `http://localhost:5000`

#### Chạy Frontend

```bash
# Từ thư mục frontend
npm run dev
# hoặc
yarn dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

### Cách 2: Sử dụng file launcher (Windows)

```powershell
# Chạy toàn bộ hệ thống (Backend + Frontend)
.\scripts\launchers\launcher.ps1

# Hoặc chạy riêng lẻ
.\scripts\run_backend.bat
.\scripts\run_frontend.bat
```

### Cách 3: Sử dụng start.bat

```bash
# Chạy cả backend và frontend trong một terminal
.\scripts\start.bat
```

---

## 📁 Cấu trúc thư mục

```
VieGo_Blog/
├── backend/                 # Backend Flask
│   ├── main.py             # Entry point
│   ├── models/             # SQLAlchemy models
│   ├── routes/             # API endpoints
│   ├── utils/              # Helpers, utilities
│   ├── migrations/         # Database migrations
│   ├── tests/              # Unit tests
│   ├── uploads/            # File uploads
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # Frontend Next.js
│   ├── app/               # App router (Next.js 14)
│   ├── components/        # React components
│   ├── lib/               # Utilities, helpers
│   ├── public/            # Static assets
│   ├── styles/            # Global styles
│   └── package.json       # Node dependencies
│
├── database/              # Database scripts
│   ├── schema.sql        # Database schema
│   ├── migrations/       # Migration scripts
│   └── *.sql            # SQL migration files
│
├── scripts/              # Scripts thực thi
│   ├── launchers/       # PowerShell launcher scripts
│   ├── setup/           # Setup & installation scripts
│   ├── run_backend.bat  # Chạy backend server
│   ├── run_frontend.bat # Chạy frontend server
│   └── start.bat        # Khởi động toàn bộ hệ thống
│
├── docs/                 # Tài liệu
│   ├── DATA_DICTIONARY.md # Từ điển dữ liệu
│   ├── DEPLOYMENT_CHECKLIST.md # Checklist triển khai
│   ├── QUICK_START_GUIDE.md # Hướng dẫn nhanh
│   └── TOUR_FEATURES_README.md # Tài liệu tính năng tour
│
├── tests/               # Test files
├── uploads/            # Uploaded files
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

---

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register          # Đăng ký
POST   /api/auth/login             # Đăng nhập
POST   /api/auth/logout            # Đăng xuất
GET    /api/auth/profile           # Lấy thông tin profile
PUT    /api/auth/profile           # Cập nhật profile
```

### Posts & Content

```
GET    /api/posts                  # Danh sách bài viết
GET    /api/posts/:id              # Chi tiết bài viết
POST   /api/posts                  # Tạo bài viết mới
PUT    /api/posts/:id              # Cập nhật bài viết
DELETE /api/posts/:id              # Xóa bài viết
```

### Tours & Bookings

```
GET    /api/tours                  # Danh sách tour
GET    /api/tours/:id              # Chi tiết tour
POST   /api/tours                  # Tạo tour mới
GET    /api/bookings               # Danh sách booking
POST   /api/bookings               # Tạo booking mới
GET    /api/bookings/:id/participants # Danh sách người tham gia
```

### Tour Management (Seller/Tour Guide)

```
POST   /api/tours/:id/assign       # Phân công hướng dẫn viên
GET    /api/tours/my-assignments   # Tour được phân công
POST   /api/tours/:id/check-in     # Check-in điểm tham quan
GET    /api/tours/:id/progress     # Xem tiến trình tour
POST   /api/tours/:id/progress     # Cập nhật tiến trình
```

### Social Features

```
POST   /api/users/:id/follow       # Follow user
POST   /api/users/:id/friend-request # Gửi lời mời kết bạn
GET    /api/notifications          # Lấy thông báo
POST   /api/messages               # Gửi tin nhắn
GET    /api/messages/:userId       # Lịch sử chat
```

Chi tiết đầy đủ xem tại: `backend/routes/`

---

## 📖 Tài liệu tham khảo

- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Hướng dẫn khởi động nhanh
- **[DATA_DICTIONARY.md](./DATA_DICTIONARY.md)** - Từ điển dữ liệu (Database Schema)
- **[TOUR_FEATURES_README.md](./TOUR_FEATURES_README.md)** - Tài liệu chi tiết tính năng tour
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Checklist triển khai production

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/
# hoặc
python run_tests.py
```

### Frontend Tests

```bash
cd frontend
npm test
# hoặc
yarn test
```

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📝 License

Dự án này được phát triển cho mục đích học tập và nghiên cứu.

---

## 👥 Tác giả

**VieGo Blog Team**

- GitHub: [@thienne1602](https://github.com/thienne1602)
- Email: your-email@example.com

---

## 🙏 Lời cảm ơn

Cảm ơn tất cả các thư viện và công cụ mã nguồn mở đã được sử dụng trong dự án này.

---

<div align="center">

**⭐ Nếu bạn thấy dự án hữu ích, hãy cho một Star nhé! ⭐**

Made with ❤️ by VieGo Team

</div>
