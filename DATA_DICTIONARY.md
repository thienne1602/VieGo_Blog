# Data Dictionary - VieGo Blog

Tệp này liệt kê Từ điển Dữ liệu cho các bảng chính trong cơ sở dữ liệu (dựa trên `database/schema.sql`).

Mỗi bảng gồm các cột với các thuộc tính: Tên Cột (Code), Tên Logic, Kiểu dữ liệu, Khóa, Bắt buộc, Mô tả.

---

## users

| Tên Cột (Code)  | Tên Logic            |                              Kiểu dữ liệu |          Khóa | Bắt buộc | Mô tả                                |
| --------------- | -------------------- | ----------------------------------------: | ------------: | -------: | ------------------------------------ |
| id              | ID người dùng        |                        INT AUTO_INCREMENT |            PK |      Yes | Khóa chính, định danh người dùng     |
| username        | Tên đăng nhập        |                               VARCHAR(80) | UNIQUE, INDEX |      Yes | Tên đăng nhập hiển thị và đăng nhập  |
| email           | Email                |                              VARCHAR(120) | UNIQUE, INDEX |      Yes | Email người dùng                     |
| password_hash   | Mật khẩu (hash)      |                              VARCHAR(255) |               |      Yes | Hash mật khẩu                        |
| full_name       | Họ và tên            |                              VARCHAR(255) |               |       No | Tên đầy đủ                           |
| bio             | Tiểu sử              |                                      TEXT |               |       No | Mô tả ngắn về người dùng             |
| avatar_url      | Ảnh đại diện         |                              VARCHAR(255) |               |       No | URL ảnh đại diện                     |
| cover_image_url | Ảnh bìa              |                              VARCHAR(255) |               |       No | URL ảnh bìa                          |
| role            | Vai trò              | ENUM('user','moderator','admin','seller') |               |       No | Vai trò/ quyền của người dùng        |
| is_active       | Kích hoạt            |                                   BOOLEAN |               |       No | Trạng thái hoạt động                 |
| is_verified     | Xác thực             |                                   BOOLEAN |               |       No | Đã xác thực email                    |
| points          | Điểm                 |                                       INT |               |       No | Điểm tích lũy                        |
| level           | Cấp độ               |                                       INT |               |       No | Cấp độ/level người dùng              |
| badges          | Huy hiệu             |                                      TEXT |               |       No | JSON chuỗi các huy hiệu              |
| location        | Vị trí               |                              VARCHAR(255) |               |       No | Tên nơi/địa điểm người dùng khai báo |
| language        | Ngôn ngữ             |                               VARCHAR(10) |               |       No | Mã ngôn ngữ (vd 'vi')                |
| timezone        | Múi giờ              |                               VARCHAR(50) |               |       No | Múi giờ                              |
| social_links    | Liên kết mạng xã hội |                                      TEXT |               |       No | JSON các liên kết                    |
| created_at      | Ngày tạo             |                                  DATETIME |         INDEX |       No | Thời điểm tạo bản ghi                |
| updated_at      | Cập nhật             |                                  DATETIME |               |       No | Thời điểm cập nhật                   |
| last_login      | Lần đăng nhập cuối   |                                  DATETIME |               |       No | Thời điểm đăng nhập gần nhất         |

---

## posts

| Tên Cột (Code)   | Tên Logic       |       Kiểu dữ liệu |            Khóa | Bắt buộc | Mô tả                       |
| ---------------- | --------------- | -----------------: | --------------: | -------: | --------------------------- |
| id               | ID bài viết     | INT AUTO_INCREMENT |              PK |      Yes | Khóa chính                  |
| title            | Tiêu đề         |       VARCHAR(255) |           INDEX |      Yes | Tiêu đề bài viết            |
| slug             | Slug            |       VARCHAR(255) |   UNIQUE, INDEX |      Yes | Đường dẫn thân thiện        |
| content          | Nội dung        |               TEXT |        FULLTEXT |      Yes | Nội dung chính              |
| excerpt          | Tóm tắt         |               TEXT |                 |       No | Đoạn tóm tắt                |
| content_type     | Loại nội dung   |               ENUM |                 |       No | blog/video/photo/tour_guide |
| language         | Ngôn ngữ        |        VARCHAR(10) |                 |       No | Mã ngôn ngữ                 |
| reading_time     | Thời gian đọc   |                INT |                 |       No | Độ dài ước tính (phút)      |
| featured_image   | Ảnh đại diện    |       VARCHAR(255) |                 |       No | URL ảnh                     |
| images           | Ảnh (danh sách) |               TEXT |                 |       No | JSON mảng URL ảnh           |
| video_url        | URL video       |       VARCHAR(255) |                 |       No | URL video                   |
| location_lat     | Vĩ độ           |              FLOAT |           INDEX |       No | Vị trí lat                  |
| location_lng     | Kinh độ         |              FLOAT |           INDEX |       No | Vị trí lng                  |
| location_name    | Tên địa điểm    |       VARCHAR(255) |                 |       No | Tên vị trí liên quan        |
| location_address | Địa chỉ         |       VARCHAR(500) |                 |       No | Địa chỉ chi tiết            |
| category         | Thể loại        |               ENUM |                 |       No | travel/food/...             |
| tags             | Thẻ             |               TEXT |                 |       No | JSON mảng thẻ               |
| views_count      | Lượt xem        |                INT |                 |       No | Số lượt xem                 |
| likes_count      | Lượt thích      |                INT |                 |       No | Số lượt thích               |
| comments_count   | Số bình luận    |                INT |                 |       No | Tổng bình luận              |
| status           | Trạng thái      |               ENUM |           INDEX |       No | draft/published/archived    |
| published_at     | Ngày xuất bản   |           DATETIME |           INDEX |       No | Thời điểm xuất bản          |
| featured         | Nổi bật         |            BOOLEAN |                 |       No | Cờ bài viết nổi bật         |
| author_id        | Tác giả (user)  |                INT | FK -> users(id) |      Yes | Khóa ngoại tới bảng `users` |

---

## locations

| Tên Cột (Code) | Tên Logic     |       Kiểu dữ liệu |            Khóa | Bắt buộc | Mô tả                                     |
| -------------- | ------------- | -----------------: | --------------: | -------: | ----------------------------------------- |
| id             | ID địa điểm   | INT AUTO_INCREMENT |              PK |      Yes | Khóa chính                                |
| name           | Tên           |       VARCHAR(255) |           INDEX |      Yes | Tên địa điểm                              |
| description    | Mô tả         |               TEXT |                 |       No | Mô tả chi tiết                            |
| latitude       | Vĩ độ         |              FLOAT |           INDEX |      Yes | Vị trí lat                                |
| longitude      | Kinh độ       |              FLOAT |           INDEX |      Yes | Vị trí lng                                |
| address        | Địa chỉ       |       VARCHAR(500) |                 |       No | Địa chỉ                                   |
| city           | Thành phố     |       VARCHAR(100) |                 |       No | Thành phố                                 |
| province       | Tỉnh          |       VARCHAR(100) |                 |       No | Tỉnh/Thành                                |
| country        | Quốc gia      |       VARCHAR(100) |                 |       No | Mặc định 'Vietnam'                        |
| category       | Danh mục      |               ENUM |                 |      Yes | Loại địa điểm (restaurant/attraction/...) |
| rating         | Điểm đánh giá |              FLOAT |                 |       No | Điểm trung bình                           |
| reviews_count  | Số đánh giá   |                INT |                 |       No | Tổng đánh giá                             |
| phone          | Điện thoại    |        VARCHAR(20) |                 |       No | SĐT liên hệ                               |
| website        | Website       |       VARCHAR(255) |                 |       No | URL website                               |
| opening_hours  | Giờ mở cửa    |               TEXT |                 |       No | JSON giờ mở cửa                           |
| price_range    | Khoảng giá    |               ENUM |                 |       No | budget/mid-range/luxury                   |
| images         | Ảnh           |               TEXT |                 |       No | JSON mảng URL                             |
| verified       | Đã xác minh   |            BOOLEAN |                 |       No | Cờ xác nhận                               |
| status         | Trạng thái    |               ENUM |                 |       No | active/inactive                           |
| created_by     | Người tạo     |                INT | FK -> users(id) |       No | Người tạo (nếu có)                        |

---

## comments

| Tên Cột (Code)     | Tên Logic     |       Kiểu dữ liệu |               Khóa | Bắt buộc | Mô tả                 |
| ------------------ | ------------- | -----------------: | -----------------: | -------: | --------------------- |
| id                 | ID bình luận  | INT AUTO_INCREMENT |                 PK |      Yes | Khóa chính            |
| content            | Nội dung      |               TEXT |                    |      Yes | Nội dung bình luận    |
| parent_id          | Bình luận cha |                INT | FK -> comments(id) |       No | Cho threaded comments |
| level              | Cấp độ lồng   |                INT |                    |       No | Mức lồng (nesting)    |
| likes_count        | Lượt thích    |                INT |                    |       No | Số lượt thích         |
| replies_count      | Số trả lời    |                INT |                    |       No | Tổng trả lời          |
| status             | Trạng thái    |               ENUM |                    |       No | active/hidden/deleted |
| flagged            | Bị báo cáo    |            BOOLEAN |                    |       No | Cờ báo cáo            |
| flag_reason        | Lý do báo cáo |       VARCHAR(255) |                    |       No | Mô tả lý do           |
| language           | Ngôn ngữ      |        VARCHAR(10) |                    |       No | Mã ngôn ngữ           |
| translated_content | Nội dung dịch |               TEXT |                    |       No | Nội dung đã dịch      |
| post_id            | Bài viết      |                INT |    FK -> posts(id) |      Yes | Bài viết liên quan    |
| author_id          | Tác giả       |                INT |    FK -> users(id) |      Yes | Tác giả bình luận     |
| created_at         | Ngày tạo      |           DATETIME |              INDEX |       No | Thời điểm tạo         |

---

## chats

| Tên Cột (Code)     | Tên Logic      |       Kiểu dữ liệu |            Khóa | Bắt buộc | Mô tả                                 |
| ------------------ | -------------- | -----------------: | --------------: | -------: | ------------------------------------- |
| id                 | ID tin nhắn    | INT AUTO_INCREMENT |              PK |      Yes | Khóa chính                            |
| message            | Nội dung       |               TEXT |                 |      Yes | Nội dung tin nhắn                     |
| message_type       | Loại tin nhắn  |               ENUM |                 |       No | text/image/audio/file/location/system |
| file_url           | URL tệp        |       VARCHAR(255) |                 |       No | URL file/ảnh                          |
| file_type          | MIME           |        VARCHAR(50) |                 |       No | Kiểu MIME tệp                         |
| room_id            | Phòng          |       VARCHAR(100) |           INDEX |       No | ID phòng (group)                      |
| conversation_type  | Loại hội thoại |               ENUM |                 |       No | direct/group/public                   |
| status             | Trạng thái     |               ENUM |                 |       No | sent/delivered/read/deleted           |
| language           | Ngôn ngữ       |        VARCHAR(10) |                 |       No | Mã ngôn ngữ                           |
| translated_message | Tin đã dịch    |               TEXT |                 |       No | Tin nhắn đã tự động dịch              |
| sender_id          | Người gửi      |                INT | FK -> users(id) |      Yes | Người gửi                             |
| receiver_id        | Người nhận     |                INT | FK -> users(id) |       No | Người nhận (direct)                   |
| created_at         | Ngày gửi       |           DATETIME |           INDEX |       No | Thời điểm gửi                         |

---

## user_preferences

| Tên Cột (Code)          | Tên Logic           |       Kiểu dữ liệu |                    Khóa | Bắt buộc | Mô tả                        |
| ----------------------- | ------------------- | -----------------: | ----------------------: | -------: | ---------------------------- |
| id                      | ID cấu hình         | INT AUTO_INCREMENT |                      PK |      Yes | Khóa chính                   |
| user_id                 | Người dùng          |                INT | FK -> users(id), UNIQUE |      Yes | Mỗi user một bản preferences |
| travel_interests        | Sở thích du lịch    |               TEXT |                         |       No | JSON mảng sở thích           |
| budget_range            | Khoảng ngân sách    |               ENUM |                         |       No | budget/mid-range/luxury      |
| travel_style            | Phong cách du lịch  |               ENUM |                         |       No | backpacker/family/...        |
| dietary_restrictions    | Chế độ ăn           |               TEXT |                         |       No | JSON mảng                    |
| cuisine_preferences     | Ưu thích ẩm thực    |               TEXT |                         |       No | JSON                         |
| spice_tolerance         | Độ cay              |               ENUM |                         |       No | none/mild/medium/hot         |
| preferred_activities    | Hoạt động ưa thích  |               TEXT |                         |       No | JSON                         |
| email_notifications     | Email thông báo     |            BOOLEAN |                         |       No | Bật/tắt email                |
| push_notifications      | Push                |            BOOLEAN |                         |       No | Bật/tắt push                 |
| newsletter_subscription | Đăng ký bản tin     |            BOOLEAN |                         |       No |                              |
| ai_recommendations      | Gợi ý AI            |            BOOLEAN |                         |       No |                              |
| personalization_data    | Dữ liệu cá nhân hóa |               TEXT |                         |       No | JSON cho ML                  |
| created_at              | Ngày tạo            |           DATETIME |                         |       No |                              |
| updated_at              | Ngày cập nhật       |           DATETIME |                         |       No |                              |

---

## nfts

| Tên Cột (Code)   | Tên Logic        |       Kiểu dữ liệu |            Khóa | Bắt buộc | Mô tả                        |
| ---------------- | ---------------- | -----------------: | --------------: | -------: | ---------------------------- |
| id               | ID NFT           | INT AUTO_INCREMENT |              PK |      Yes | Khóa chính                   |
| token_id         | Token ID         |       VARCHAR(100) |   UNIQUE, INDEX |      Yes | Mã token NFT                 |
| contract_address | Địa chỉ hợp đồng |       VARCHAR(100) |                 |      Yes | Địa chỉ smart contract       |
| name             | Tên NFT          |       VARCHAR(255) |                 |      Yes | Tên hiển thị                 |
| description      | Mô tả            |               TEXT |                 |       No | Mô tả NFT                    |
| badge_type       | Loại huy hiệu    |               ENUM |                 |      Yes | Loại huy hiệu                |
| badge_level      | Cấp huy hiệu     |               ENUM |                 |       No | bronze/silver/...            |
| rarity           | Độ hiếm          |               ENUM |                 |       No | common/uncommon/...          |
| image_url        | Ảnh              |       VARCHAR(255) |                 |      Yes | URL ảnh NFT                  |
| points_required  | Điểm yêu cầu     |                INT |                 |       No | Điểm cần để mở khóa          |
| owner_id         | Chủ sở hữu       |                INT | FK -> users(id) |      Yes | Người sở hữu hiện tại        |
| status           | Trạng thái       |               ENUM |                 |       No | minted/pending/failed/burned |
| created_at       | Ngày tạo         |           DATETIME |           INDEX |       No | Ngày tạo bản ghi             |

---

## tours

| Tên Cột (Code)        | Tên Logic        |       Kiểu dữ liệu |            Khóa | Bắt buộc | Mô tả                    |
| --------------------- | ---------------- | -----------------: | --------------: | -------: | ------------------------ |
| id                    | ID tour          | INT AUTO_INCREMENT |              PK |      Yes | Khóa chính               |
| title                 | Tiêu đề          |       VARCHAR(255) |           INDEX |      Yes | Tên tour                 |
| description           | Mô tả            |               TEXT |                 |      Yes | Mô tả chi tiết           |
| duration_days         | Số ngày          |                INT |                 |      Yes | Thời lượng (ngày)        |
| max_participants      | Số tối đa        |                INT |                 |       No | Số khách tối đa          |
| min_participants      | Số tối thiểu     |                INT |                 |       No | Số khách tối thiểu       |
| starting_location     | Điểm bắt đầu     |       VARCHAR(255) |                 |      Yes | Nơi bắt đầu tour         |
| itinerary             | Lịch trình       |               TEXT |                 |       No | JSON chi tiết lịch trình |
| locations_covered     | Địa điểm bao phủ |               TEXT |                 |       No | JSON mảng ID location    |
| price_per_person      | Giá mỗi người    |              FLOAT |                 |      Yes | Giá (theo `currency`)    |
| currency              | Tiền tệ          |         VARCHAR(3) |                 |       No | Mã tiền tệ (VND, USD)    |
| featured_image        | Ảnh chính        |       VARCHAR(255) |                 |       No | URL ảnh                  |
| available_dates       | Ngày khả dụng    |               TEXT |                 |       No | JSON mảng ngày           |
| booking_deadline_days | Hạn chót đặt     |                INT |                 |       No | Số ngày trước bắt đầu    |
| status                | Trạng thái       |               ENUM |           INDEX |       No | active/draft/...         |
| seller_id             | Người bán        |                INT | FK -> users(id) |      Yes | Người tạo/đăng tour      |
| created_at            | Ngày tạo         |           DATETIME |           INDEX |       No |                          |

---

### Ghi chú

- Tài liệu này dựa trên `database/schema.sql`. Trong repository còn nhiều script SQL khác (ví dụ `create_friend_requests_table.sql`, `create_group_chat_tables.sql`, `create_notifications_table.sql`) và các model trong `backend/models/` chứa thêm bảng/cột; nếu bạn muốn tôi sẽ mở rộng để bao gồm tất cả file SQL và mọi model tự động.
- Nếu bạn muốn định dạng CSV/Excel để import, tôi có thể xuất thêm file `data_dictionary.csv`.

---

Tôi đã tạo tệp này trong repository: `DATA_DICTIONARY.md`.
