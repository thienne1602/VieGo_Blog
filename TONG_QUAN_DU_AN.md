# VieGo Blog - Tổng Quan Dự Án

## 📌 Giới Thiệu Tổng Quát

**VieGo Blog** là một nền tảng blog du lịch và ẩm thực toàn diện, kết hợp **mạng xã hội** với **hệ thống quản lý tour chuyên nghiệp**. Dự án được xây dựng với kiến trúc hiện đại:

- **Backend**: Flask (Python) + MySQL + Socket.IO
- **Frontend**: Next.js 14 + React 18 + TailwindCSS
- **Real-time**: Socket.IO cho chat và notifications

---

## ✨ Các Chức Năng Chính

### 1. **Hệ Thống Blog & Nội Dung**
- Tạo, chỉnh sửa bài viết với rich text editor
- Hỗ trợ đa dạng loại nội dung: blog, video, photo gallery, tour guide
- Tìm kiếm full-text, lọc theo danh mục, tags
- Hệ thống comment đa cấp và tương tác
- Đánh giá (like/dislike) và rating

### 2. **Quản Lý Tour & Booking**
- Tạo và quản lý tour với lịch trình chi tiết
- Hệ thống booking tour trực tuyến
- Quản lý thông tin người tham gia (participants)
- Thanh toán và xác nhận booking
- Gửi email xác nhận tự động

### 3. **Mạng Xã Hội**
- Follow/Unfollow users
- Hệ thống kết bạn (friend requests)
- Real-time chat 1-1 và group chat
- News feed và timeline
- Notifications real-time

### 4. **Quản Lý Người Dùng**
- Phân quyền: User, Moderator, Admin, Seller, Tour Guide
- Xác thực email với JWT
- Quản lý profile, avatar, cover image
- Hệ thống điểm, level, badges

---

## 🌟 Các Chức Năng NỔI TRỘI (Khác Biệt So Với Các Website Du Lịch Thông Thường)

### 1. **📍 Theo Dõi Tiến Trình Tour Real-time** ⭐⭐⭐
```
✅ Check-in/Check-out tại các điểm tham quan
✅ Cập nhật tiến trình real-time
✅ Upload hình ảnh tại điểm check-in
✅ Khách hàng xem tiến trình tour của mình trực tiếp
```
**Điểm khác biệt**: Hầu hết website du lịch chỉ cho đặt tour và chờ đợi, không có tính năng theo dõi hành trình thực tế. VieGo Blog cho phép khách hàng **xem HDV đang ở đâu, đã đến checkpoint nào**, tạo sự yên tâm và minh bạch.

### 2. **👥 Hệ Thống Phân Công & Quản Lý Hướng Dẫn Viên Chuyên Nghiệp**
```
✅ Seller phân công HDV cho từng tour cụ thể
✅ HDV nhận thông báo real-time khi được phân công
✅ Quản lý danh sách tour được phân công
✅ Gửi email tự động cho khách về thông tin HDV
```
**Điểm khác biệt**: Các website du lịch thường không quản lý HDV một cách chuyên nghiệp. VieGo Blog có **workflow hoàn chỉnh** từ phân công → thông báo → theo dõi.

### 3. **💬 Real-time Chat & Social Network Tích Hợp**
```
✅ Chat trực tiếp với HDV và seller
✅ Group chat cho tour
✅ Typing indicators
✅ Online/Offline status
✅ Message delivery & read receipts
✅ Hệ thống kết bạn để tạo cộng đồng du lịch
```
**Điểm khác biệt**: Hầu hết website du lịch chỉ có form liên hệ hoặc hotline. VieGo Blog tạo **cộng đồng du lịch thực sự** với chat real-time, giúp khách hàng kết nối với nhau và với HDV ngay lập tức.

### 4. **📊 Quản Lý Chi Tiết Người Tham Gia Tour**
```
✅ Lưu thông tin chi tiết từng người tham gia
✅ Phân loại: người lớn/trẻ em/người cao tuổi
✅ Yêu cầu đặc biệt (ăn chay, dị ứng...)
✅ Xuất danh sách Excel/CSV
```
**Điểm khác biệt**: Các website thường chỉ lưu thông tin người đặt, không chi tiết về từng người đi. VieGo Blog **quản lý từng cá nhân**, giúp HDV chuẩn bị tốt hơn.

### 5. **🗺️ Tự Động Tạo Lịch Trình Chi Tiết Từ Dữ Liệu Địa Danh**
```
✅ Bộ mô tả địa danh tự động (tour_content_generator.py)
✅ Tạo mô tả hành trình đa đoạn
✅ Lịch trình từng ngày với hoạt động, bữa ăn, lưu trú
✅ Chính sách giá, trẻ em, hủy tour tự động
```
**Điểm khác biệt**: Seller không cần viết mô tả thủ công, hệ thống **tự động generate nội dung chuyên nghiệp** dựa trên các điểm đến.

### 6. **🔔 Hệ Thống Notification Đa Kênh & Phân Loại**
```
✅ Real-time notifications qua Socket.IO
✅ Email notifications
✅ Push notifications (hỗ trợ)
✅ Phân loại: Message, Like, Comment, Follow, Friend Request, Booking, System
✅ Lọc theo loại và trạng thái
✅ Thống kê notifications
```
**Điểm khác biệt**: Thông báo được **phân loại rõ ràng** và **real-time**, không bị lẫn lộn như các hệ thống thông thường.

### 7. **👨‍👩‍👧‍👦 Multi-role System Linh Hoạt**
```
✅ User: Đọc blog, đặt tour, chat
✅ Blogger/Content Creator: Viết bài, chia sẻ
✅ Seller: Quản lý tour, booking, phân công HDV
✅ Tour Guide: Nhận tour, cập nhật tiến trình
✅ Moderator: Quản lý nội dung
✅ Admin: Toàn quyền hệ thống
```
**Điểm khác biệt**: Hệ thống **phân quyền chi tiết**, mỗi vai trò có dashboard và chức năng riêng, không bị trùng lắp.

### 8. **🎯 AI/ML Recommendations & Personalization**
```
✅ Gợi ý tour dựa trên sở thích
✅ Personalization data (JSON cho ML)
✅ Travel interests, budget range, travel style
✅ Dietary restrictions, cuisine preferences
```
**Điểm khác biệt**: Chuẩn bị sẵn **hệ thống cá nhân hóa** để tích hợp AI/ML sau này.

### 9. **🌐 Đa Ngôn Ngữ & Google Maps Integration**
```
✅ i18n support
✅ Google Maps API tích hợp
✅ Location-based features
✅ Geocoding và reverse geocoding
```
**Điểm khác biệt**: Hỗ trợ **đa ngôn ngữ** và **bản đồ tương tác** ngay từ đầu.

---

## 🎯 Kết Luận

VieGo Blog không chỉ là một website đặt tour thông thường, mà là một **nền tảng du lịch toàn diện** kết hợp:

1. **Blog & Content** (chia sẻ trải nghiệm)
2. **E-commerce** (đặt tour, thanh toán)
3. **Social Network** (kết bạn, chat, follow)
4. **Tour Management** (quản lý chuyên nghiệp cho seller/HDV)
5. **Real-time Tracking** (theo dõi hành trình thực tế)

### Những tính năng **độc đáo nhất**:
- ✅ Theo dõi tiến trình tour real-time
- ✅ Quản lý HDV chuyên nghiệp
- ✅ Chat & social network tích hợp
- ✅ Tự động tạo nội dung tour
- ✅ Quản lý chi tiết người tham gia

👉 **Đây là điểm khác biệt lớn nhất so với các website du lịch như Traveloka, Agoda, Klook** - họ chỉ tập trung vào đặt phòng/tour, còn VieGo Blog tạo ra một **hệ sinh thái du lịch hoàn chỉnh**.
