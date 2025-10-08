# VieGo - Blog Du Lịch & Ẩm Thực Sáng Tạo 🌟

VieGo là một nền tảng web blog tập trung vào du lịch và ẩm thực, nhắm đến giới trẻ Việt Nam (18-35 tuổi). Website là một "hub sáng tạo" với giao diện tối ưu cho desktop, tích hợp gamification, AI, NFT và các tính năng cộng tác thời gian thực.

## 🚀 Tính Năng Chính

### 📝 Nội Dung & Blog

- **Bài viết chi tiết** với title, content, tags, và hình ảnh chất lượng cao
- **Hỗ trợ đa ngôn ngữ** (Tiếng Việt, Anh, Pháp, Trung) qua Flask-Babel
- **SEO-friendly** với meta tags, sitemap.xml, robots.txt
- **Interactive storytelling** - Choose Your Adventure trong bài viết
- **Collaborative editing** - Đồng chỉnh sửa bài viết real-time

### 🎥 Mini Video & Media

- Hỗ trợ **embed YouTube** hoặc upload trực tiếp
- Giao diện video responsive, ưu tiên hiển thị lớn trên desktop
- **Virtual Tour Builder** - Tạo itinerary tương tác với canvas kéo-thả

### 🗺️ Bản Đồ Tương Tác

- **Google Maps API** với chế độ full-screen
- Đánh dấu địa điểm du lịch/ẩm thực
- Zoom/pan mượt mà trên desktop
- Tích hợp với Virtual Tour Builder

### 💬 Tương Tác & Chat

- **Bình luận threaded** với like/share
- **Real-time chat** qua Flask-SocketIO
- **Auto-translate** đa ngôn ngữ với Google Translate API
- **Chat rooms** và direct messages

### 🤖 AI & Personalization

- **AI gợi ý địa điểm** dựa trên UserPreferences
- **Chatbox hỏi đáp** du lịch/ẩm thực với OpenAI API
- **Personalized recommendations** với machine learning

### 🏆 Gamification & NFT

- **Web Explorer Points System** - Kiếm điểm khi tương tác
- **NFT Badge Collection** - Unlock badge độc quyền trên Polygon testnet
- **NFT Gallery Web Wall** - Dashboard cá nhân hiển thị collection
- **Achievement system** với levels và rewards

### 🛒 Tours & E-commerce

- **Tour marketplace** với affiliate links
- **Shop tích hợp** bán tour/dịch vụ
- **Booking system** với pricing và availability
- **Commission tracking** cho sellers

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** (SSR cho SEO)
- **React 18** với TypeScript
- **Tailwind CSS** cho styling
- **Framer Motion** cho animations
- **Socket.IO Client** cho real-time features

### Backend

- **Python Flask** với các extension:
  - Flask-SQLAlchemy (ORM)
  - Flask-JWT-Extended (Authentication)
  - Flask-SocketIO (Real-time)
  - Flask-CORS (Cross-origin)
  - Flask-Babel (i18n)

### Database

- **MySQL** (WAMP Server compatible)
- **Schema design** với 8+ tables
- **Full-text search** và indexing
- **JSON fields** cho flexible data

### AI & Blockchain

- **OpenAI API** cho chatbot và recommendations
- **Google Translate API** cho auto-translation
- **Web3.py** + **Polygon testnet** cho NFT features
- **scikit-learn** cho ML recommendations

## 📦 Cài Đặt & Chạy Dự Án

### Yêu Cầu Hệ Thống

- **Node.js** 18+ và npm/yarn
- **Python** 3.9+ và pip
- **WAMP Server** hoặc MySQL 8.0+
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/your-repo/viego-blog.git
cd viego-blog
```

### 2. Setup Database (WAMP Server)

1. Khởi động WAMP Server
2. Truy cập phpMyAdmin (http://localhost/phpmyadmin)
3. Import database schema:

```bash
# Import file schema.sql vào MySQL
mysql -u root -p < database/schema.sql
```

### 3. Backend Setup (Flask API)

```bash
cd backend

# Tạo virtual environment
python -m venv viego_env
viego_env\Scripts\activate  # Windows
# source viego_env/bin/activate  # Linux/Mac

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env từ .env.example
copy .env.example .env

# Chỉnh sửa .env với thông tin database và API keys
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_mysql_password
# GOOGLE_MAPS_API_KEY=your_api_key
# OPENAI_API_KEY=your_openai_key

# Chạy Flask server
python app.py
```

### 4. Frontend Setup (Next.js)

```bash
cd frontend

# Cài đặt dependencies
npm install
# hoặc yarn install

# Tạo file .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key" >> .env.local

# Chạy development server
npm run dev
# hoặc yarn dev
```

### 5. Truy Cập Ứng Dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: http://localhost/phpmyadmin

## 🔑 API Keys Cần Thiết

### Google APIs

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project mới hoặc chọn existing project
3. Enable APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Translate API**
4. Tạo API credentials và thêm vào `.env`

### OpenAI API

1. Đăng ký tại [OpenAI Platform](https://platform.openai.com)
2. Tạo API key
3. Thêm vào `OPENAI_API_KEY` trong `.env`

### Polygon (NFT - Optional)

1. Tạo wallet trên Metamask
2. Chuyển sang Polygon Mumbai testnet
3. Get testnet MATIC từ [Polygon Faucet](https://faucet.polygon.technology)
4. Deploy NFT contract (sử dụng Remix IDE)
5. Thêm contract address vào `.env`

## 📱 Tính Năng Nổi Bật

### 🎨 UI/UX Design

- **Desktop-first approach** với breakpoints 1280px+
- **Minimalist design** với màu sắc VieGo (Teal + Coral)
- **Typography** tối ưu với font Poppins/Quicksand
- **Parallax scrolling** và smooth animations
- **Responsive** nhưng ưu tiên desktop experience

### 🎮 Gamification Elements

- **Points System**: Kiếm điểm khi đăng bài, comment, share
- **Level System**: Tăng level theo points (1000 points = 1 level)
- **Badge Collection**: NFT badges unlock khi đạt milestone
- **Leaderboards**: Top contributors hàng tuần/tháng

### 🤝 Collaboration Features

- **Real-time editing**: Đồng chỉnh sửa bài viết như Google Docs
- **Live chat**: Chat với users khác trong real-time
- **Group planning**: Tạo kế hoạch du lịch cùng nhau
- **Social sharing**: Share trên social media với custom widgets

### 🔍 SEO & Performance

- **Server-side rendering** với Next.js
- **Meta tags** tự động generate
- **Sitemap.xml** và robots.txt
- **Image optimization** với Next.js Image
- **Lazy loading** cho performance
- **Google Analytics** integration

## 🌐 Deployment

### Development

- Frontend: `npm run dev` (localhost:3000)
- Backend: `python app.py` (localhost:5000)

### Production

- **Frontend**: Deploy trên Vercel
- **Backend**: Deploy trên Heroku/Railway
- **Database**: MySQL trên cloud (PlanetScale/Railway)
- **Static files**: AWS S3 hoặc Cloudinary

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## 📄 License

Dự án được phát hành dưới [MIT License](LICENSE).

## 📞 Liên Hệ & Hỗ Trợ

- **Email**: support@viego.com
- **Discord**: VieGo Community Server
- **Facebook**: @VieGoBlog
- **Instagram**: @viego_official

## 🗺️ Roadmap

### Phase 1 ✅ (Đã hoàn thành)

- [x] Database schema design
- [x] Basic Flask API endpoints
- [x] User authentication system
- [x] Frontend layout và components
- [x] Real-time chat với Socket.IO

### Phase 2 🚧 (Đang phát triển)

- [ ] Google Maps integration
- [ ] AI recommendation system
- [ ] NFT minting functionality
- [ ] Virtual Tour Builder
- [ ] Advanced collaboration features

### Phase 3 📅 (Sắp tới)

- [ ] Mobile app (React Native)
- [ ] Advanced AI features
- [ ] Marketplace cho sellers
- [ ] Analytics dashboard
- [ ] Multi-region deployment

---

**VieGo** - Khám phá Việt Nam theo cách của bạn! 🇻🇳✨
