# Tour Features - Tính năng mới cho hệ thống Tour

## Tổng quan

Hệ thống đã được nâng cấp với các tính năng mới sau:

1. **Quản lý người tham gia tour** - Lưu thông tin chi tiết từng người tham gia
2. **Role hướng dẫn viên** - Thêm vai trò tour guide vào hệ thống
3. **Phân công hướng dẫn viên** - Seller có thể phân công HDV cho các tour
4. **Gửi email thông tin HDV** - Tự động gửi email cho khách hàng khi có HDV được phân công
5. **Quản lý tiến trình tour** - Theo dõi checkpoint và tiến độ tour
6. **Xuất danh sách người tham gia** - Export file Excel/CSV danh sách khách
7. **Trang hành trình du lịch** - Người dùng và HDV xem tiến trình tour

## Cài đặt

### 1. Cài đặt dependencies

```bash
pip install openpyxl
```

### 2. Chạy migration database

Chạy file `run_tour_migration.bat` hoặc:

```bash
python database/migrate_tour_features.py
```

Migration sẽ tạo các bảng mới:

- `booking_participants` - Lưu thông tin người tham gia
- `tour_assignments` - Quản lý phân công HDV
- `tour_progress` - Theo dõi tiến trình tour

### 3. Khởi động lại backend

```bash
python backend/main.py
```

## API Endpoints

### Booking Participants

#### Lấy danh sách người tham gia

```http
GET /api/booking-participants/booking/{booking_id}
Authorization: Bearer {token}
```

#### Thêm người tham gia

```http
POST /api/booking-participants
Authorization: Bearer {token}
Content-Type: application/json

{
  "booking_id": 1,
  "full_name": "Nguyễn Văn A",
  "gender": "male",
  "date_of_birth": "1990-01-01",
  "id_number": "123456789",
  "phone": "0901234567",
  "email": "email@example.com",
  "participant_type": "adult",
  "special_requirements": "Ăn chay"
}
```

#### Thêm nhiều người tham gia cùng lúc

```http
POST /api/booking-participants/booking/{booking_id}/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "participants": [
    {
      "full_name": "Nguyễn Văn A",
      "participant_type": "adult",
      ...
    },
    {
      "full_name": "Trần Thị B",
      "participant_type": "child",
      ...
    }
  ],
  "replace": false
}
```

#### Cập nhật thông tin người tham gia

```http
PATCH /api/booking-participants/{participant_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "0909999999",
  "email": "newemail@example.com"
}
```

#### Xóa người tham gia

```http
DELETE /api/booking-participants/{participant_id}
Authorization: Bearer {token}
```

#### Xuất danh sách người tham gia

```http
GET /api/booking-participants/booking/{booking_id}/export?format=excel
Authorization: Bearer {token}
```

Tham số `format`: `excel` (mặc định) hoặc `csv`

### Tour Assignments (Phân công hướng dẫn viên)

#### Phân công HDV cho booking (Seller only)

```http
POST /api/tour-assignments
Authorization: Bearer {token}
Content-Type: application/json

{
  "booking_id": 1,
  "tour_guide_id": 5,
  "notes": "Ghi chú cho hướng dẫn viên"
}
```

#### Lấy thông tin phân công theo booking

```http
GET /api/tour-assignments/booking/{booking_id}
Authorization: Bearer {token}
```

#### Lấy danh sách tour được phân công (Tour Guide)

```http
GET /api/tour-assignments/my-assignments
Authorization: Bearer {token}
```

#### Cập nhật trạng thái phân công (Tour Guide)

```http
PATCH /api/tour-assignments/{assignment_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "accepted",
  "guide_notes": "Đã xác nhận, sẽ liên hệ khách hàng"
}
```

Các trạng thái: `assigned`, `accepted`, `in_progress`, `completed`, `cancelled`

#### Hủy phân công (Seller only)

```http
DELETE /api/tour-assignments/{assignment_id}
Authorization: Bearer {token}
```

### Tour Progress (Tiến trình tour)

#### Lấy tất cả checkpoint của booking

```http
GET /api/tour-progress/booking/{booking_id}
Authorization: Bearer {token}
```

#### Tạo checkpoint mới

```http
POST /api/tour-progress
Authorization: Bearer {token}
Content-Type: application/json

{
  "booking_id": 1,
  "checkpoint_name": "Đến khách sạn",
  "checkpoint_order": 1,
  "location_name": "Khách sạn ABC",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "scheduled_time": "2025-12-01T10:00:00",
  "status": "pending"
}
```

#### Khởi tạo checkpoint từ itinerary tour

```http
POST /api/tour-progress/booking/{booking_id}/init-from-itinerary
Authorization: Bearer {token}
```

#### Cập nhật checkpoint (Tour Guide)

```http
PATCH /api/tour-progress/{checkpoint_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed",
  "notes": "Đã hoàn thành, khách rất hài lòng",
  "images": ["url1.jpg", "url2.jpg"]
}
```

#### Xóa checkpoint

```http
DELETE /api/tour-progress/{checkpoint_id}
Authorization: Bearer {token}
```

## Quy trình sử dụng

### 1. Khách hàng đặt tour với thông tin người tham gia

Khi đặt tour, frontend cần:

1. Thu thập thông tin cơ bản booking (như cũ)
2. Hiển thị form nhập thông tin cho từng người tham gia
3. Gửi request tạo booking
4. Sau khi booking được tạo, gửi thông tin người tham gia:

```javascript
// Tạo booking trước
const bookingResponse = await fetch("/api/bookings", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(bookingData),
});

const booking = await bookingResponse.json();

// Thêm thông tin người tham gia
const participantsResponse = await fetch(
  `/api/booking-participants/booking/${booking.id}/batch`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      participants: participantsData,
      replace: false,
    }),
  }
);
```

### 2. Seller xem booking và phân công HDV

1. Seller truy cập trang quản lý booking
2. Xem chi tiết booking bao gồm danh sách người tham gia
3. Chọn hướng dẫn viên từ danh sách user có role `tour_guide`
4. Phân công HDV:

```javascript
const assignResponse = await fetch("/api/tour-assignments", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    booking_id: bookingId,
    tour_guide_id: guideId,
    notes: "Ghi chú cho HDV",
  }),
});
```

5. Hệ thống tự động gửi email cho khách hàng với thông tin HDV

### 3. Khách hàng nhận email thông tin HDV

Email sẽ bao gồm:

- Thông tin hướng dẫn viên (tên, email, số điện thoại)
- Thông tin tour
- Danh sách người tham gia
- Thông tin liên hệ

### 4. Tour Guide quản lý tour được phân công

HDV có thể:

- Xem danh sách tour được phân công
- Xem thông tin khách hàng và người tham gia
- Cập nhật trạng thái phân công
- Quản lý tiến trình tour

### 5. Quản lý tiến trình tour

#### Seller khởi tạo checkpoint

```javascript
// Tự động tạo từ itinerary
await fetch(`/api/tour-progress/booking/${bookingId}/init-from-itinerary`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
```

#### Tour Guide cập nhật tiến trình

```javascript
await fetch(`/api/tour-progress/${checkpointId}`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    status: "in_progress", // hoặc 'completed'
    notes: "Ghi chú",
    images: ["url1.jpg"],
  }),
});
```

### 6. Xuất danh sách người tham gia

Seller hoặc HDV có thể xuất file:

```javascript
// Xuất Excel
window.open(
  `/api/booking-participants/booking/${bookingId}/export?format=excel`
);

// Xuất CSV
window.open(`/api/booking-participants/booking/${bookingId}/export?format=csv`);
```

## Phân quyền

### Booking Participants

- **Khách hàng**: Thêm/sửa/xóa người tham gia cho booking của mình
- **Seller**: Xem/thêm/sửa/xóa người tham gia cho booking của tour mình bán
- **Tour Guide**: Xem người tham gia của tour được phân công
- **Admin**: Toàn quyền

### Tour Assignments

- **Seller**: Phân công/hủy phân công HDV cho tour của mình
- **Tour Guide**: Xem và cập nhật trạng thái tour được phân công
- **Admin**: Toàn quyền

### Tour Progress

- **Seller**: Tạo/xóa checkpoint cho tour của mình
- **Tour Guide**: Xem và cập nhật tiến trình tour được phân công
- **Khách hàng**: Xem tiến trình tour của mình
- **Admin**: Toàn quyền

## Tạo user với role Tour Guide

Có 2 cách:

### 1. Từ Admin Panel (khuyến nghị)

Admin có thể thay đổi role của user thành `tour_guide`

### 2. Qua API

```http
PATCH /api/admin/users/{user_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "tour_guide"
}
```

## Email Templates

Email được gửi tự động khi:

1. **Booking được confirm**: Email xác nhận đặt tour (đã có từ trước)
2. **HDV được phân công**: Email thông tin HDV kèm danh sách người tham gia (MỚI)

Email sử dụng:

- Seller email nếu đã cấu hình
- System email nếu seller chưa cấu hình

## Frontend Implementation Guide

### Form đặt tour với thông tin người tham gia

```jsx
function BookingForm() {
  const [participantCount, setParticipantCount] = useState(1);
  const [participants, setParticipants] = useState([
    {
      full_name: "",
      participant_type: "adult",
      phone: "",
      email: "",
    },
  ]);

  const handleParticipantCountChange = (newCount) => {
    setParticipantCount(newCount);

    // Thêm hoặc bớt participant objects
    const newParticipants = [...participants];
    if (newCount > participants.length) {
      for (let i = participants.length; i < newCount; i++) {
        newParticipants.push({
          full_name: "",
          participant_type: "adult",
          phone: "",
          email: "",
        });
      }
    } else {
      newParticipants.splice(newCount);
    }
    setParticipants(newParticipants);
  };

  return (
    <div>
      <input
        type="number"
        value={participantCount}
        onChange={(e) => handleParticipantCountChange(parseInt(e.target.value))}
      />

      {participants.map((participant, index) => (
        <div key={index}>
          <h3>Người tham gia {index + 1}</h3>
          <input
            placeholder="Họ tên"
            value={participant.full_name}
            onChange={(e) => {
              const newParticipants = [...participants];
              newParticipants[index].full_name = e.target.value;
              setParticipants(newParticipants);
            }}
          />
          {/* Các field khác... */}
        </div>
      ))}
    </div>
  );
}
```

### Trang quản lý cho Seller

```jsx
function BookingDetailPage({ bookingId }) {
  const [booking, setBooking] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [tourGuides, setTourGuides] = useState([]);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    fetchBooking();
    fetchParticipants();
    fetchTourGuides();
    fetchAssignment();
  }, [bookingId]);

  const handleAssignGuide = async (guideId) => {
    await fetch("/api/tour-assignments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        booking_id: bookingId,
        tour_guide_id: guideId,
      }),
    });
    // Refresh assignment
    fetchAssignment();
  };

  const handleExport = () => {
    window.open(
      `/api/booking-participants/booking/${bookingId}/export?format=excel`
    );
  };

  return (
    <div>
      <h2>Chi tiết Booking #{bookingId}</h2>

      {/* Danh sách người tham gia */}
      <section>
        <h3>Danh sách người tham gia</h3>
        <button onClick={handleExport}>Xuất file Excel</button>
        <table>{/* Render participants */}</table>
      </section>

      {/* Phân công HDV */}
      <section>
        <h3>Phân công hướng dẫn viên</h3>
        {assignment ? (
          <div>Đã phân công: {assignment.tour_guide?.full_name}</div>
        ) : (
          <select onChange={(e) => handleAssignGuide(e.target.value)}>
            <option>Chọn hướng dẫn viên</option>
            {tourGuides.map((guide) => (
              <option key={guide.id} value={guide.id}>
                {guide.full_name}
              </option>
            ))}
          </select>
        )}
      </section>
    </div>
  );
}
```

### Trang hành trình du lịch

```jsx
function TourJourneyPage({ bookingId }) {
  const [progress, setProgress] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const isGuide = user?.role === "tour_guide";

  useEffect(() => {
    fetchProgress();
    fetchAssignment();
  }, [bookingId]);

  const fetchProgress = async () => {
    const res = await fetch(`/api/tour-progress/booking/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProgress(data.checkpoints);
  };

  const updateCheckpoint = async (checkpointId, status) => {
    await fetch(`/api/tour-progress/${checkpointId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    fetchProgress();
  };

  return (
    <div>
      <h2>Hành trình du lịch</h2>

      {assignment && (
        <div>Hướng dẫn viên: {assignment.tour_guide?.full_name}</div>
      )}

      <div className="timeline">
        {progress.map((checkpoint, index) => (
          <div
            key={checkpoint.id}
            className={`checkpoint ${checkpoint.status}`}
          >
            <h3>{checkpoint.checkpoint_name}</h3>
            <p>{checkpoint.checkpoint_description}</p>
            <p>Trạng thái: {checkpoint.status}</p>

            {isGuide && (
              <div>
                <button
                  onClick={() => updateCheckpoint(checkpoint.id, "in_progress")}
                >
                  Bắt đầu
                </button>
                <button
                  onClick={() => updateCheckpoint(checkpoint.id, "completed")}
                >
                  Hoàn thành
                </button>
              </div>
            )}

            {checkpoint.images?.length > 0 && (
              <div className="images">
                {checkpoint.images.map((img) => (
                  <img key={img} src={img} alt="Checkpoint" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Lưu ý

1. **Email configuration**: Cần cấu hình email (system hoặc seller email) để gửi thông báo HDV
2. **openpyxl**: Cần cài đặt để xuất Excel. Nếu không có sẽ fallback về CSV
3. **Tour Guide role**: Cần tạo users với role `tour_guide` trước khi phân công
4. **Checkpoint initialization**: Nên khởi tạo checkpoint từ itinerary tour để tiết kiệm thời gian

## Troubleshooting

### Không gửi được email

- Kiểm tra cấu hình email trong .env hoặc seller profile
- Kiểm tra Flask-Mail đã cài đặt: `pip install Flask-Mail`
- Xem log backend để biết lỗi chi tiết

### Không xuất được Excel

- Cài đặt openpyxl: `pip install openpyxl`
- Fallback về CSV nếu không có openpyxl

### Lỗi permission

- Kiểm tra role của user
- Xác nhận seller_id của tour khớp với current user
- Admin có full quyền cho tất cả features

## Support

Nếu có vấn đề, kiểm tra:

1. Log backend khi chạy `python main.py`
2. Database đã migration chưa
3. Các dependencies đã cài đặt đầy đủ
