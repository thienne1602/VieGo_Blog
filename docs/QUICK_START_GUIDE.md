# HƯỚNG DẪN CÀI ĐẶT VÀ SỬ DỤNG TÍNH NĂNG MỚI

## Tổng quan các tính năng đã thêm

✅ **Backend đã hoàn thành:**

1. ✅ Model BookingParticipant - Quản lý thông tin người tham gia tour
2. ✅ Model TourAssignment - Phân công hướng dẫn viên
3. ✅ Model TourProgress - Theo dõi tiến trình tour
4. ✅ Role tour_guide - Vai trò hướng dẫn viên
5. ✅ API endpoints đầy đủ cho tất cả chức năng
6. ✅ Email template gửi thông tin HDV cho khách hàng
7. ✅ Xuất file Excel/CSV danh sách người tham gia
8. ✅ Migration database script

## CÀI ĐẶT

### Bước 1: Cài đặt dependencies

Mở terminal và chạy:

```bash
cd d:\project\VieGo_Blog
pip install openpyxl
```

### Bước 2: Chạy migration database

**Cách 1:** Double click file `run_tour_migration.bat`

**Cách 2:** Chạy trong terminal:

```bash
python database\migrate_tour_features.py
```

Migration sẽ tạo 3 bảng mới:

- `booking_participants` - Thông tin người tham gia
- `tour_assignments` - Phân công HDV
- `tour_progress` - Tiến trình tour

Và cập nhật bảng `users` để thêm role `tour_guide`

### Bước 3: Khởi động lại backend

```bash
python backend\main.py
```

hoặc double click `run_backend.bat`

Xác nhận trong log xuất hiện:

```
[OK] Routes registered successfully (including tour features: participants, assignments, progress)
```

### Bước 4: Tạo user với role Tour Guide (nếu cần)

Có thể tạo bằng SQL hoặc qua admin panel:

```sql
UPDATE users SET role = 'tour_guide' WHERE id = <user_id>;
```

## CẤU TRÚC FILE MỚI

```
backend/
├── models/
│   ├── booking_participant.py  (MỚI)
│   ├── tour_assignment.py      (MỚI)
│   ├── tour_progress.py        (MỚI)
│   └── __init__.py             (đã cập nhật)
│
├── routes/
│   ├── booking_participants.py (MỚI)
│   ├── tour_assignments.py     (MỚI)
│   ├── tour_progress.py        (MỚI)
│   └── bookings.py             (có sẵn, tương thích)
│
├── utils/
│   └── email.py                (đã cập nhật - thêm send_tour_assignment_email)
│
└── main.py                     (đã cập nhật - đăng ký blueprints mới)

database/
├── migrate_tour_features.sql   (MỚI)
└── migrate_tour_features.py    (MỚI)

run_tour_migration.bat          (MỚI)
TOUR_FEATURES_README.md         (MỚI - tài liệu chi tiết)
```

## KIỂM TRA HỆ THỐNG

### 1. Test API với Postman hoặc curl

#### Tạo participant mới:

```bash
curl -X POST http://localhost:5000/api/booking-participants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "full_name": "Nguyễn Văn A",
    "participant_type": "adult",
    "phone": "0901234567"
  }'
```

#### Lấy danh sách tour của HDV:

```bash
curl -X GET http://localhost:5000/api/tour-assignments/my-assignments \
  -H "Authorization: Bearer TOUR_GUIDE_TOKEN"
```

### 2. Kiểm tra database

```sql
-- Kiểm tra bảng được tạo
SHOW TABLES LIKE '%participant%';
SHOW TABLES LIKE '%assignment%';
SHOW TABLES LIKE '%progress%';

-- Kiểm tra role tour_guide
SELECT * FROM users WHERE role = 'tour_guide';
```

## LUỒNG SỬ DỤNG CƠ BẢN

### 1. Khách hàng đặt tour

```
Khách hàng điền form đặt tour
  ↓
Chọn số lượng người (adults, children, infants)
  ↓
Điền thông tin từng người tham gia
  ↓
Submit booking
  ↓
Backend tạo Booking + BookingParticipants
  ↓
Gửi email xác nhận (có danh sách người tham gia)
```

### 2. Seller quản lý và phân công HDV

```
Seller xem booking mới
  ↓
Xác nhận booking (status: confirmed)
  ↓
Chọn hướng dẫn viên từ danh sách
  ↓
Phân công HDV
  ↓
Hệ thống gửi email cho khách hàng
(có thông tin HDV + danh sách người tham gia)
  ↓
Seller có thể xuất file Excel danh sách khách
```

### 3. Hướng dẫn viên nhận tour

```
HDV login
  ↓
Xem danh sách tour được phân công
  ↓
Cập nhật trạng thái: accepted
  ↓
Xem thông tin khách hàng và danh sách người tham gia
  ↓
Liên hệ khách hàng
```

### 4. Quản lý tiến trình tour

```
Seller/HDV khởi tạo checkpoints từ itinerary
  ↓
HDV cập nhật tiến trình khi đi tour
  ↓
Khách hàng và HDV xem tiến trình realtime
  ↓
HDV upload ảnh tại mỗi điểm đến
  ↓
Đánh dấu hoàn thành khi kết thúc
```

## API ENDPOINTS CHÍNH

| Endpoint                                             | Method | Mô tả                        | Quyền                          |
| ---------------------------------------------------- | ------ | ---------------------------- | ------------------------------ |
| `/api/booking-participants/booking/:id`              | GET    | Lấy danh sách người tham gia | Customer, Seller, Guide, Admin |
| `/api/booking-participants`                          | POST   | Thêm người tham gia          | Customer, Seller, Admin        |
| `/api/booking-participants/booking/:id/batch`        | POST   | Thêm nhiều người cùng lúc    | Customer, Seller, Admin        |
| `/api/booking-participants/:id`                      | PATCH  | Cập nhật thông tin           | Customer, Seller, Admin        |
| `/api/booking-participants/:id`                      | DELETE | Xóa người tham gia           | Customer, Seller, Admin        |
| `/api/booking-participants/booking/:id/export`       | GET    | Xuất file Excel/CSV          | Seller, Guide, Admin           |
| `/api/tour-assignments`                              | POST   | Phân công HDV                | Seller, Admin                  |
| `/api/tour-assignments/booking/:id`                  | GET    | Xem phân công                | Seller, Guide, Admin           |
| `/api/tour-assignments/my-assignments`               | GET    | Tour của HDV                 | Guide                          |
| `/api/tour-assignments/:id`                          | PATCH  | Cập nhật trạng thái          | Guide, Admin                   |
| `/api/tour-assignments/:id`                          | DELETE | Hủy phân công                | Seller, Admin                  |
| `/api/tour-progress/booking/:id`                     | GET    | Lấy tiến trình               | Customer, Seller, Guide, Admin |
| `/api/tour-progress`                                 | POST   | Tạo checkpoint               | Seller, Guide, Admin           |
| `/api/tour-progress/booking/:id/init-from-itinerary` | POST   | Khởi tạo từ lịch trình       | Seller, Admin                  |
| `/api/tour-progress/:id`                             | PATCH  | Cập nhật checkpoint          | Seller, Guide, Admin           |
| `/api/tour-progress/:id`                             | DELETE | Xóa checkpoint               | Seller, Admin                  |

## FRONTEND CẦN TRIỂN KHAI

### 1. Cập nhật form đặt tour

- Khi tăng số lượng người, hiện form nhập thông tin từng người
- Các trường: Họ tên, giới tính, ngày sinh, CMND/Passport, điện thoại, email
- Submit cả booking và danh sách participants

### 2. Trang quản lý booking của Seller

- Hiển thị danh sách người tham gia
- Dropdown chọn HDV để phân công
- Button xuất file Excel/CSV
- Hiển thị thông tin HDV đã phân công

### 3. Trang quản lý cho Tour Guide

- Dashboard hiện danh sách tour được phân công
- Chi tiết mỗi tour: thông tin khách, danh sách người tham gia
- Cập nhật trạng thái (accepted, in_progress, completed)
- Quản lý tiến trình tour

### 4. Trang hành trình du lịch

- Timeline hiển thị các checkpoint
- Trạng thái mỗi điểm: pending/in_progress/completed
- HDV: button cập nhật trạng thái, upload ảnh
- Khách: xem tiến trình tour của mình
- Hiển thị map với các điểm đến

### 5. Email template UI

Email đã được xử lý ở backend, frontend không cần làm gì

## VÍ DỤ CODE FRONTEND

Xem file `TOUR_FEATURES_README.md` để có code mẫu React:

- Form đặt tour với participants
- Trang quản lý booking cho Seller
- Trang hành trình du lịch

## PHÂN QUYỀN CHI TIẾT

| Chức năng                            | User                  | Tour Guide               | Seller             | Admin |
| ------------------------------------ | --------------------- | ------------------------ | ------------------ | ----- |
| Xem participants booking của mình    | ✅                    | ❌                       | ❌                 | ✅    |
| Xem participants tour được phân công | ❌                    | ✅                       | ❌                 | ✅    |
| Xem participants tour mình bán       | ❌                    | ❌                       | ✅                 | ✅    |
| Thêm/sửa participants                | ✅ (booking của mình) | ❌                       | ✅ (tour mình bán) | ✅    |
| Xuất file danh sách                  | ❌                    | ✅                       | ✅                 | ✅    |
| Phân công HDV                        | ❌                    | ❌                       | ✅                 | ✅    |
| Xem tour được phân công              | ❌                    | ✅                       | ❌                 | ✅    |
| Cập nhật trạng thái phân công        | ❌                    | ✅                       | ❌                 | ✅    |
| Tạo checkpoint                       | ❌                    | ✅                       | ✅                 | ✅    |
| Cập nhật tiến trình                  | ❌                    | ✅                       | ✅                 | ✅    |
| Xem tiến trình tour                  | ✅ (tour mình đặt)    | ✅ (tour được phân công) | ✅ (tour mình bán) | ✅    |

## TROUBLESHOOTING

### Lỗi: Module 'openpyxl' not found

```bash
pip install openpyxl
```

### Lỗi: Table already exists

- Migration đã chạy trước đó
- Có thể bỏ qua hoặc drop table và chạy lại

### Lỗi: Column 'role' enum missing 'tour_guide'

Chạy SQL:

```sql
ALTER TABLE users
MODIFY COLUMN role ENUM('user', 'moderator', 'admin', 'seller', 'editor', 'tour_guide') DEFAULT 'user';
```

### Không gửi được email HDV

- Kiểm tra cấu hình email trong .env
- Hoặc cấu hình seller email trong profile
- Cài Flask-Mail: `pip install Flask-Mail`

### API trả về 404

- Kiểm tra backend đã khởi động lại chưa
- Xem log có dòng "Routes registered successfully..."
- Kiểm tra import trong main.py

## NEXT STEPS

1. ✅ Backend đã hoàn thành
2. ⏳ Cần triển khai frontend:
   - Form đặt tour với participants
   - Trang quản lý Seller
   - Trang Tour Guide
   - Trang hành trình du lịch
3. ⏳ Test end-to-end workflow
4. ⏳ UI/UX design cho các trang mới

## TÀI LIỆU THAM KHẢO

- `TOUR_FEATURES_README.md` - Chi tiết API và code examples
- `database/migrate_tour_features.sql` - Database schema
- `backend/models/` - Model definitions
- `backend/routes/` - API implementations

---

Chúc bạn triển khai thành công! 🎉
