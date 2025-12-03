# Kịch Bản Use Case (Use Case Scenarios) - VieGo Blog

Tài liệu này mô tả chi tiết các kịch bản (scenarios) cho các Use Case chính của hệ thống VieGo Blog, tương ứng với biểu đồ Use Case phân rã cấp 2.

## 1. Quản Lý Tour (Tour Management)

### UC-TOUR-01: Đăng Tour Mới (Create New Tour)

**Actor:** Người bán (Seller)

**Mô tả:** Người bán tạo một tour du lịch mới để đăng bán trên hệ thống.

**Luồng chính (Main Flow):**

1. Người bán chọn chức năng "Đăng Tour".
2. Hệ thống hiển thị form nhập thông tin tour.
3. Người bán nhập các thông tin cơ bản: Tên tour, Mô tả, Giá, Lịch trình.
4. Người bán tải lên hình ảnh cho tour (UC-TOUR-01-01).
5. Người bán thiết lập các tùy chọn giá và số lượng chỗ (UC-TOUR-01-02).
6. Người bán xác nhận đăng tour.
7. Hệ thống kiểm tra tính hợp lệ của dữ liệu.
8. Hệ thống lưu thông tin tour và thông báo thành công.

**Luồng phụ (Alternative Flow):**

- **A1: Dữ liệu không hợp lệ:** Tại bước 7, nếu dữ liệu thiếu hoặc sai định dạng, hệ thống hiển thị thông báo lỗi và yêu cầu nhập lại.
- **A2: Lỗi tải ảnh:** Tại bước 4, nếu ảnh quá lớn hoặc sai định dạng, hệ thống báo lỗi và yêu cầu chọn ảnh khác.

### UC-TOUR-02: Cập Nhật Tour (Update Tour)

**Actor:** Người bán (Seller)

**Mô tả:** Người bán chỉnh sửa thông tin của một tour đã đăng.

**Luồng chính:**

1. Người bán chọn tour cần sửa từ danh sách tour của mình.
2. Hệ thống hiển thị thông tin hiện tại của tour.
3. Người bán thay đổi thông tin (giá, lịch trình, ảnh...).
4. Người bán lưu thay đổi.
5. Hệ thống cập nhật cơ sở dữ liệu và thông báo thành công.

## 2. Quản Lý Đặt Tour (Booking Management)

### UC-BOOK-01: Đặt Tour (Book Tour)

**Actor:** Khách du lịch (Tourist)

**Mô tả:** Khách du lịch thực hiện đặt chỗ cho một tour cụ thể.

**Luồng chính:**

1. Khách du lịch xem chi tiết tour và chọn "Đặt ngay".
2. Hệ thống yêu cầu chọn ngày khởi hành và số lượng người.
3. Hệ thống kiểm tra tình trạng chỗ trống (UC-BOOK-01-01).
4. Nếu còn chỗ, hệ thống hiển thị thông tin thanh toán tạm tính.
5. Khách du lịch xác nhận thông tin và chọn phương thức thanh toán.
6. Hệ thống chuyển sang quy trình thanh toán (UC-BOOK-01-02).
7. Sau khi thanh toán thành công, hệ thống tạo mã đặt chỗ và gửi xác nhận cho khách.

**Luồng phụ:**

- **A1: Hết chỗ:** Tại bước 3, nếu hết chỗ, hệ thống thông báo và gợi ý ngày khác.
- **A2: Thanh toán thất bại:** Tại bước 6, nếu thanh toán lỗi, hệ thống giữ trạng thái "Chờ thanh toán" trong 15 phút để khách thử lại.

### UC-BOOK-02: Hủy Đặt Tour (Cancel Booking)

**Actor:** Khách du lịch (Tourist)

**Mô tả:** Khách hủy một đơn đặt tour đã thực hiện.

**Luồng chính:**

1. Khách chọn đơn hàng cần hủy trong lịch sử đặt tour.
2. Hệ thống kiểm tra chính sách hủy tour (thời gian, phí phạt).
3. Hệ thống hiển thị mức phí hủy (nếu có) và yêu cầu xác nhận.
4. Khách xác nhận hủy.
5. Hệ thống cập nhật trạng thái đơn hàng là "Đã hủy" và tiến hành hoàn tiền (nếu có).

## 3. Mạng Xã Hội (Social Network)

### UC-SOC-01: Đăng Bài Viết (Create Post)

**Actor:** Người dùng (User)

**Mô tả:** Người dùng chia sẻ trải nghiệm, hình ảnh lên bảng tin.

**Luồng chính:**

1. Người dùng chọn "Tạo bài viết".
2. Người dùng nhập nội dung văn bản.
3. Người dùng đính kèm ảnh hoặc video (tùy chọn).
4. Người dùng gắn thẻ địa điểm hoặc bạn bè (tùy chọn).
5. Người dùng nhấn "Đăng".
6. Hệ thống kiểm tra nội dung (bộ lọc từ khóa xấu).
7. Hệ thống hiển thị bài viết lên bảng tin.

### UC-SOC-02: Tương Tác Bài Viết (Interact with Post)

**Actor:** Người dùng (User)

**Mô tả:** Người dùng like, comment hoặc share bài viết.

**Luồng chính:**

1. Người dùng xem bài viết trên bảng tin.
2. Người dùng nhấn nút "Thích" hoặc viết bình luận.
3. Hệ thống cập nhật số lượng like/comment ngay lập tức.
4. Hệ thống gửi thông báo cho chủ bài viết.

## 4. Xác Thực & Tài Khoản (Authentication)

### UC-AUTH-01: Đăng Ký (Register)

**Actor:** Khách (Guest)

**Mô tả:** Người dùng mới tạo tài khoản.

**Luồng chính:**

1. Khách chọn "Đăng ký".
2. Hệ thống hiển thị form đăng ký.
3. Khách nhập Email, Mật khẩu, Họ tên.
4. Hệ thống gửi mã xác thực (OTP) qua Email (UC-AUTH-01-01).
5. Khách nhập mã OTP.
6. Hệ thống kích hoạt tài khoản và tự động đăng nhập.

### UC-AUTH-02: Đăng Nhập (Login)

**Actor:** Khách (Guest)

**Mô tả:** Người dùng truy cập vào hệ thống.

**Luồng chính:**

1. Khách nhập Email và Mật khẩu.
2. Hệ thống kiểm tra thông tin xác thực.
3. Nếu đúng, hệ thống cấp Token truy cập và chuyển vào trang chủ.

**Luồng phụ:**

- **A1: Sai mật khẩu:** Hệ thống báo lỗi và cho phép thử lại (tối đa 5 lần trước khi khóa tạm thời).
- **A2: Quên mật khẩu:** Người dùng chọn "Quên mật khẩu" để kích hoạt quy trình khôi phục (UC-AUTH-03).
