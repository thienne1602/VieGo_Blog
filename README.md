# VieGo Blog - Travel & Food Blog Platform

<div align="center">

**🌍 Nền tảng blog du lịch & ẩm thực tích hợp hệ thống quản lý tour toàn diện**

_Social Network + Tour Management + E-commerce + AI Recommendations + NFT System_

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-green.svg)](https://flask.palletsprojects.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-purple.svg)](https://socket.io/)
[![Web3](https://img.shields.io/badge/Web3-Blockchain-yellow.svg)](https://web3py.readthedocs.io/)

</div>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Điểm nổi bật](#-điểm-nổi-bật)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [API Documentation](#-api-documentation)
- [Database Models](#-database-models)
- [Tài liệu tham khảo](#-tài-liệu-tham-khảo)

---

## 🚀 Giới thiệu

**VieGo Blog** là nền tảng blog du lịch và ẩm thực kết hợp hệ thống quản lý tour chuyên nghiệp. Dự án cung cấp giải pháp toàn diện cho việc chia sẻ trải nghiệm du lịch, đặt tour, quản lý booking và theo dõi tiến trình tour real-time.

### 🎯 Đối tượng sử dụng

| Vai trò                     | Chức năng                                               |
| --------------------------- | ------------------------------------------------------- |
| **Du khách (User)**         | Tìm kiếm, đọc blog, đặt tour, theo dõi lịch trình, chat |
| **Blogger/Content Creator** | Chia sẻ trải nghiệm, viết bài, tương tác cộng đồng      |
| **Seller**                  | Quản lý tour, xử lý booking, phân công hướng dẫn viên   |
| **Tour Guide**              | Nhận tour, cập nhật tiến trình, check-in điểm tham quan |
| **Moderator**               | Quản lý nội dung, duyệt bài viết, xử lý vi phạm         |
| **Admin**                   | Quản lý toàn bộ hệ thống, người dùng, analytics         |

---

## ✨ Tính năng chính

### 📝 Hệ thống Blog & Nội dung

- ✅ Tạo, chỉnh sửa bài viết với rich text editor
- ✅ Hỗ trợ nhiều loại nội dung: `blog`, `video`, `photo`, `tour_guide`
- ✅ Danh mục: `travel`, `food`, `culture`, `adventure`, `budget`, `luxury`
- ✅ Upload và quản lý hình ảnh/video
- ✅ Tìm kiếm full-text, lọc theo danh mục, tags
- ✅ SEO support (meta title, description, keywords)
- ✅ Hệ thống comment đa cấp (nested replies)
- ✅ Đánh giá (like/dislike) và rating
- ✅ Chia sẻ lên mạng xã hội
- ✅ Lập lịch đăng bài (scheduled posts)
- ✅ Bài viết hợp tác (collaborative posts)
- ✅ Interactive storytelling

### 🎫 Quản lý Tour & Booking

- ✅ Tạo và quản lý tour với lịch trình chi tiết
- ✅ Categories: `adventure`, `cultural`, `food`, `nature`, `urban`, `spiritual`
- ✅ Difficulty levels: `easy`, `moderate`, `hard`
- ✅ Hệ thống booking tour trực tuyến
- ✅ Quản lý thông tin người tham gia (participants)
- ✅ Phân loại: adults, children, infants
- ✅ Thanh toán và xác nhận booking
- ✅ Gửi email xác nhận và thông tin tour
- ✅ Xuất danh sách người tham gia (Excel/CSV)
- ✅ Auto-generate tour content từ địa danh

### 👥 Phân công & Quản lý Hướng dẫn viên

- ✅ Phân công hướng dẫn viên cho từng tour
- ✅ Dashboard riêng cho tour guide
- ✅ Xem danh sách tour được phân công
- ✅ Thông báo real-time khi được phân công
- ✅ Email thông tin HDV cho khách

### 📍 Theo dõi Tiến trình Tour (Real-time)

- ✅ Checkpoint system cho tour
- ✅ Check-in/Check-out tại các điểm tham quan
- ✅ GPS tracking vị trí đoàn tour
- ✅ Cập nhật tiến trình real-time qua Socket.IO
- ✅ Upload hình ảnh tại điểm check-in
- ✅ Ghi chú và mô tả hoạt động
- ✅ Khách hàng xem tiến trình tour (Journey page)

### 👤 Quản lý Người dùng & Phân quyền

- ✅ Đăng ký, đăng nhập với JWT
- ✅ Phân quyền: `user`, `blogger`, `seller`, `tour_guide`, `moderator`, `admin`
- ✅ Xác thực email
- ✅ Quản lý profile, avatar, cover image
- ✅ Hệ thống điểm, level, badges
- ✅ Account ban, post ban, comment ban
- ✅ Violation tracking

### 💬 Social Features

- ✅ Follow/Unfollow users
- ✅ Friend requests và quản lý bạn bè
- ✅ Real-time chat 1-1 (Socket.IO)
- ✅ Group chat
- ✅ Audio messages
- ✅ Typing indicators, online status
- ✅ Message delivery & read receipts
- ✅ GIF/Stickers support
- ✅ News feed và timeline

### 📖 Stories (24h)

- ✅ Image/Video stories
- ✅ Auto-expire sau 24h
- ✅ Story archiving
- ✅ View count tracking

### 🔔 Notifications System

- ✅ Real-time notifications qua Socket.IO
- ✅ Phân loại: `message`, `like`, `comment`, `follow`, `friend_request`, `booking`, `system`, `tour_assignment`, `violation_warning`
- ✅ Mark as read / batch operations
- ✅ Filter by type
- ✅ Notification settings

### 🏆 Gamification & NFT System

- ✅ Points system (tích điểm từ hoạt động)
- ✅ Level progression (1000 points = 1 level)
- ✅ Badges: `explorer`, `foodie`, `photographer`, `traveler`, `adventurer`, `cultural`, `special`
- ✅ Badge levels: `bronze`, `silver`, `gold`, `platinum`, `legendary`
- ✅ NFT minting cho achievements
- ✅ NFT gallery với rarity system
- ✅ Blockchain integration (Web3)

### 🗺️ Maps & Locations

- ✅ Location database với categories
- ✅ Leaflet + Google Maps integration
- ✅ Nearby search
- ✅ Location ratings
- ✅ Route planning

### 📊 Analytics & AI/ML

- ✅ User behavior tracking
- ✅ Personalized tour recommendations
- ✅ Interest profiling với AI analysis
- ✅ Trending detection
- ✅ Category analytics
- ✅ User segmentation thông minh
- ✅ Export báo cáo Excel
- ✅ Dashboard thống kê người dùng

### 📧 Email Marketing & Campaigns

- ✅ Campaign management (tạo, quản lý chiến dịch)
- ✅ User segmentation targeting
- ✅ Personalized emails với {name} placeholder
- ✅ Campaign analytics (tỷ lệ mở, click)
- ✅ Template system
- ✅ Scheduled campaigns
- ✅ Gửi email hàng loạt theo phân khúc

### 📍 Tour Location Tracking (Real-time)

- ✅ Real-time member location tracking
- ✅ SOS emergency alerts
- ✅ Geofence system (vùng an toàn)
- ✅ Location history & route tracking
- ✅ Distance calculation giữa các thành viên
- ✅ Member ping system
- ✅ Socket.IO real-time updates

### 👨‍💼 Admin Dashboard

- ✅ Dashboard statistics overview
- ✅ User management (CRUD, role assignment)
- ✅ Content moderation
- ✅ Reports management
- ✅ Activity logs
- ✅ Revenue analytics
- ✅ **User Analytics Tab** (thống kê người dùng AI)
- ✅ **Email Campaign Tab** (quản lý chiến dịch email)
- ✅ Excel export đa dạng báo cáo

### 💰 Seller Dashboard

- ✅ Revenue statistics (daily/monthly/yearly)
- ✅ Tour management
- ✅ Booking management
- ✅ Tour guide management
- ✅ Company profile
- ✅ Revenue charts
- ✅ Export reports (Excel/CSV)

### 📧 Email System

- ✅ Booking confirmation emails
- ✅ Payment reminders
- ✅ Password reset emails
- ✅ Tour assignment notifications
- ✅ Promotional emails
- ✅ Custom email templates

---

## 🌟 Điểm nổi bật

### So sánh với các nền tảng khác

| Tính năng          | VieGo | Traveloka | Agoda | Klook |
| ------------------ | :---: | :-------: | :---: | :---: |
| Đặt tour           |  ✅   |    ✅     |  ✅   |  ✅   |
| Blog/Content       |  ✅   |    ❌     |  ❌   |  ❌   |
| Social Network     |  ✅   |    ❌     |  ❌   |  ❌   |
| Real-time Chat     |  ✅   |    ❌     |  ❌   |  ❌   |
| Tour Tracking      |  ✅   |    ❌     |  ❌   |  ❌   |
| HDV Management     |  ✅   |    ❌     |  ❌   |  ❌   |
| NFT/Gamification   |  ✅   |    ❌     |  ❌   |  ❌   |
| AI Recommendations |  ✅   |    ⚠️     |  ⚠️   |  ⚠️   |

---

## 🛠 Công nghệ sử dụng

### Backend Technologies

| Công nghệ              | Version | Mục đích              |
| ---------------------- | ------- | --------------------- |
| **Flask**              | 2.3.3   | Web framework chính   |
| **Flask-SQLAlchemy**   | 3.0.5   | ORM cho database      |
| **Flask-JWT-Extended** | 4.5.3   | JWT authentication    |
| **Flask-SocketIO**     | 5.3.6   | Real-time WebSocket   |
| **Flask-CORS**         | 4.0.0   | Cross-origin support  |
| **Flask-Babel**        | 4.0.0   | Internationalization  |
| **Flask-Mail**         | 0.10.0  | Email functionality   |
| **Flask-Compress**     | 1.14    | Response compression  |
| **SQLAlchemy**         | 2.0.23  | Database ORM          |
| **PyMySQL**            | 1.1.0   | MySQL connector       |
| **python-socketio**    | 5.9.0   | Socket.IO server      |
| **eventlet**           | 0.33.3  | Async networking      |
| **bcrypt**             | 4.1.1   | Password hashing      |
| **Pillow**             | 10.1.0  | Image processing      |
| **pandas**             | 2.1.3   | Data manipulation     |
| **openpyxl**           | 3.1.2   | Excel file generation |
| **ReportLab**          | 4.0.7   | PDF generation        |
| **gunicorn**           | 21.2.0  | Production server     |
| **marshmallow**        | 3.20.1  | Serialization         |

### AI/ML Technologies

| Công nghệ        | Version | Mục đích            |
| ---------------- | ------- | ------------------- |
| **OpenAI**       | 0.28.1  | AI-powered features |
| **scikit-learn** | 1.3.2   | ML algorithms       |
| **pandas**       | 2.1.3   | Data processing     |

### Blockchain Technologies

| Công nghệ        | Version | Mục đích                         |
| ---------------- | ------- | -------------------------------- |
| **web3**         | 6.11.3  | Blockchain integration (Backend) |
| **cryptography** | 41.0.7  | Encryption                       |

### Translation & i18n

| Công nghệ                  | Version | Mục đích                   |
| -------------------------- | ------- | -------------------------- |
| **google-cloud-translate** | 3.12.1  | Multi-language translation |
| **Flask-Babel**            | 4.0.0   | Backend i18n               |

### Frontend Technologies

| Công nghệ                     | Version | Mục đích                |
| ----------------------------- | ------- | ----------------------- |
| **Next.js**                   | 16.0.5  | React framework         |
| **React**                     | 18.2.0  | UI library              |
| **TypeScript**                | 5.2.0   | Type safety             |
| **TailwindCSS**               | 3.3.0   | Styling                 |
| **Socket.IO Client**          | 4.7.0   | Real-time communication |
| **Axios**                     | 1.5.0   | HTTP client             |
| **Framer Motion**             | 10.18.0 | Animations              |
| **Recharts**                  | 2.15.4  | Charts/graphs           |
| **Leaflet**                   | 1.9.4   | Open source maps        |
| **React-Leaflet**             | 4.2.1   | React map integration   |
| **@googlemaps/js-api-loader** | 1.16.0  | Google Maps             |
| **i18next**                   | 25.7.3  | Internationalization    |
| **react-i18next**             | 16.5.0  | React i18n              |
| **next-i18next**              | 15.4.3  | Next.js i18n            |
| **lucide-react**              | 0.544.0 | Icons                   |
| **react-markdown**            | 9.0.0   | Markdown rendering      |
| **react-pdf**                 | 7.5.0   | PDF viewing             |
| **react-share**               | 4.4.0   | Social sharing          |
| **react-helmet-async**        | 1.3.0   | SEO/Head management     |
| **ogl**                       | 1.0.11  | WebGL graphics          |
| **web3**                      | 4.2.0   | Blockchain (Frontend)   |

### Database

| Công nghệ      | Version | Mục đích         |
| -------------- | ------- | ---------------- |
| **MySQL**      | 8.0     | Primary database |
| **SQLAlchemy** | 2.0.23  | ORM layer        |

### DevOps & Tools

| Công nghệ        | Mục đích                |
| ---------------- | ----------------------- |
| **Git**          | Version control         |
| **npm**          | Node.js package manager |
| **pip**          | Python package manager  |
| **pytest**       | Backend testing         |
| **Jest**         | Frontend testing        |
| **ESLint**       | Code linting            |
| **PostCSS**      | CSS processing          |
| **Autoprefixer** | CSS vendor prefixes     |

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

## 🧭 Quản lý nội dung tour

Tất cả dữ liệu tour giờ được dựng tự động từ bộ mô tả địa danh tại `backend/utils/tour_content_generator.py`. Hồ sơ của từng điểm đến (đèo, bãi biển, đặc sản, lễ hội...) sẽ được dùng để tạo:

- Mô tả hành trình đa đoạn
- Lịch trình từng ngày với hoạt động, bữa ăn, lưu trú
- Danh sách dịch vụ bao gồm/không bao gồm
- Chính sách giá, trẻ em, hủy tour và bảo hiểm

### Cập nhật lại toàn bộ tour

```powershell
cd backend
python update_tour_content.py
```

Tùy chọn:

- `--dry-run`: Xem danh sách tour bị ảnh hưởng mà không ghi xuống DB.
- `--tour-id 15`: Chỉ làm mới 1 tour cụ thể.
- `--only-missing`: Chỉ cập nhật những tour chưa có lịch trình chi tiết.

> Lưu ý: Script sẽ tự động tái tạo mô tả bằng tiếng Việt nên hãy cập nhật `tour_content_generator.py` nếu bạn muốn bổ sung điểm đến mới hoặc tinh chỉnh nội dung.

### Seed dữ liệu

`backend/seed_30_tours.py` đã được tích hợp generator, vì vậy mỗi lần seed lại hệ thống sẽ có đầy đủ lịch trình, chính sách và nội dung giống như tour thật.

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

## 📊 Database Models

Dự án sử dụng **30+ database models**:

| Model                | Mô tả                                          |
| -------------------- | ---------------------------------------------- |
| `User`               | Users với roles, gamification, social features |
| `Post`               | Blog posts với categories, SEO, collaboration  |
| `Comment`            | Nested comments với moderation                 |
| `Tour`               | Tour listings với full details                 |
| `Booking`            | Tour bookings với payment tracking             |
| `BookingParticipant` | Individual booking participants                |
| `BookingItinerary`   | Booking-specific itineraries                   |
| `TourAssignment`     | Tour guide assignments                         |
| `TourProgress`       | Tour checkpoint tracking                       |
| `TourItinerary`      | Tour day-by-day plans                          |
| `TourMemberLocation` | Real-time member locations                     |
| `TourLocationHistory`| Lịch sử vị trí thành viên tour                 |
| `TourGeofence`       | Vùng an toàn/checkpoint cho tour               |
| `TourLocationAlert`  | Cảnh báo SOS và geofence violations            |
| `Location`           | Map locations database                         |
| `Chat`               | Direct messages                                |
| `GroupChat`          | Group chat rooms                               |
| `UserBehavior`       | Theo dõi hành vi người dùng (AI Analytics)     |
| `UserInterestProfile`| Profile sở thích được AI phân tích             |
| `PromotionalCampaign`| Chiến dịch email marketing                     |
| `EmailLog`           | Log gửi email và tracking                      |
| `Story`              | 24-hour stories                                |
| `NFT`                | Achievement NFTs                               |
| `Notification`       | User notifications                             |
| `FriendRequest`      | Friend request management                      |
| `Friendship`         | Friend relationships                           |
| `Report`             | Content reports                                |
| `Contact`            | Support tickets                                |
| `BannedKeyword`      | Content moderation keywords                    |
| `UserBehavior`       | Analytics tracking                             |
| `UserPreferences`    | User settings                                  |
| `UserSettings`       | Privacy/notification settings                  |
| `SellerTourGuide`    | Seller-guide relationships                     |

---

## 📈 Project Statistics

- **30+** Database Models
- **28+** Route Files (API Endpoints)
- **50+** Backend Dependencies
- **30+** Frontend Dependencies
- **6** User Roles
- **22+** Major Features
- **5** Real-time Socket.IO modules
- **3** AI/ML powered features

---

## 📖 Tài liệu tham khảo

- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Hướng dẫn khởi động nhanh
- **[DATA_DICTIONARY.md](./DATA_DICTIONARY.md)** - Từ điển dữ liệu (Database Schema)
- **[TOUR_FEATURES_README.md](./TOUR_FEATURES_README.md)** - Tài liệu chi tiết tính năng tour
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Checklist triển khai production
- **[README_AI_ANALYTICS.md](./docs/README_AI_ANALYTICS.md)** - Hệ thống AI Analytics & Email Marketing
- **[README_CHAT_SYSTEM.md](./docs/README_CHAT_SYSTEM.md)** - Hệ thống Chat real-time
- **[README_TOUR_LOCATION_TRACKING.md](./docs/README_TOUR_LOCATION_TRACKING.md)** - Định vị tour real-time
- **[README_TESTS.md](./docs/README_TESTS.md)** - Hướng dẫn chạy tests

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

_Cập nhật: 01/01/2026_

</div>
