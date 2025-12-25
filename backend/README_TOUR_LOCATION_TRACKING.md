# Chức năng Định vị Realtime cho Tour

## Tổng quan

Chức năng này cho phép theo dõi vị trí realtime của tất cả thành viên và hướng dẫn viên trong một tour. Hướng dẫn viên có thể dễ dàng tìm kiếm thành viên nếu không may thất lạc.

## Tính năng chính

### 1. **Theo dõi vị trí realtime**

- Cập nhật vị trí liên tục qua Socket.IO
- Hiển thị vị trí tất cả thành viên trên bản đồ
- Phân biệt hướng dẫn viên và khách du lịch

### 2. **Cảnh báo SOS khẩn cấp**

- Thành viên có thể gửi tín hiệu SOS khi gặp nguy hiểm
- Hướng dẫn viên nhận thông báo ngay lập tức
- Hiển thị vị trí chính xác của người cần hỗ trợ

### 3. **Geofence (Vùng an toàn)**

- Tạo vùng an toàn quanh các địa điểm
- Cảnh báo khi thành viên rời khỏi vùng an toàn
- Thiết lập nhiều loại vùng: checkpoint, meeting_point, restricted

### 4. **Lịch sử di chuyển**

- Lưu trữ lịch sử vị trí của từng thành viên
- Xem lại lộ trình di chuyển
- Tính toán khoảng cách giữa các thành viên

---

## API Endpoints

### Member Locations

| Method | Endpoint                                                       | Mô tả                                  |
| ------ | -------------------------------------------------------------- | -------------------------------------- |
| GET    | `/api/tour-location/bookings/<booking_id>/members`             | Lấy vị trí tất cả thành viên           |
| GET    | `/api/tour-location/bookings/<booking_id>/members/<member_id>` | Lấy vị trí và lịch sử của 1 thành viên |
| POST   | `/api/tour-location/bookings/<booking_id>/update-location`     | Cập nhật vị trí của mình               |
| POST   | `/api/tour-location/bookings/<booking_id>/start-tracking`      | Bắt đầu theo dõi vị trí                |
| POST   | `/api/tour-location/bookings/<booking_id>/stop-tracking`       | Dừng theo dõi vị trí                   |

### SOS Emergency

| Method | Endpoint                                                      | Mô tả                            |
| ------ | ------------------------------------------------------------- | -------------------------------- |
| POST   | `/api/tour-location/bookings/<booking_id>/sos`                | Gửi tín hiệu SOS                 |
| POST   | `/api/tour-location/bookings/<booking_id>/sos/<sos_id>/clear` | Xử lý SOS (tour guide)           |
| GET    | `/api/tour-location/bookings/<booking_id>/sos/active`         | Lấy danh sách SOS đang hoạt động |

### Geofences

| Method | Endpoint                                                   | Mô tả                         |
| ------ | ---------------------------------------------------------- | ----------------------------- |
| GET    | `/api/tour-location/bookings/<booking_id>/geofences`       | Lấy danh sách geofences       |
| POST   | `/api/tour-location/bookings/<booking_id>/geofences`       | Tạo geofence mới              |
| PUT    | `/api/tour-location/bookings/<booking_id>/geofences/<id>`  | Cập nhật geofence             |
| DELETE | `/api/tour-location/bookings/<booking_id>/geofences/<id>`  | Xóa geofence                  |
| POST   | `/api/tour-location/bookings/<booking_id>/geofences/check` | Kiểm tra vị trí với geofences |

### History & Distance

| Method | Endpoint                                                   | Mô tả                                |
| ------ | ---------------------------------------------------------- | ------------------------------------ |
| GET    | `/api/tour-location/bookings/<booking_id>/history`         | Lấy lịch sử vị trí                   |
| GET    | `/api/tour-location/bookings/<booking_id>/route/<user_id>` | Lấy lộ trình di chuyển               |
| GET    | `/api/tour-location/bookings/<booking_id>/distances`       | Tính khoảng cách giữa các thành viên |

---

## Socket.IO Events

### Client gửi (emit)

```javascript
// Tham gia room theo dõi tour
socket.emit("join_tour_tracking", {
  booking_id: 123,
  user_id: 456,
  member_type: "participant", // 'tour_guide', 'participant', 'leader'
});

// Cập nhật vị trí
socket.emit("update_member_location", {
  booking_id: 123,
  user_id: 456,
  latitude: 10.762622,
  longitude: 106.660172,
  accuracy: 10,
  altitude: 15,
  heading: 45,
  speed: 1.5,
  battery_level: 85,
  location_source: "gps",
});

// Gửi SOS
socket.emit("trigger_sos", {
  booking_id: 123,
  user_id: 456,
  message: "Tôi bị lạc!",
  latitude: 10.762622,
  longitude: 106.660172,
});

// Xóa SOS (tour guide)
socket.emit("clear_sos", {
  booking_id: 123,
  target_user_id: 456,
  cleared_by: 789, // tour guide ID
});

// Yêu cầu vị trí tất cả thành viên
socket.emit("request_all_locations", {
  booking_id: 123,
});

// Ping một thành viên cập nhật vị trí
socket.emit("ping_member", {
  booking_id: 123,
  target_user_id: 456,
  requester_id: 789,
});

// Rời khỏi room
socket.emit("leave_tour_tracking", {
  booking_id: 123,
  user_id: 456,
});
```

### Client nhận (on)

```javascript
// Khi tham gia thành công
socket.on("tour_tracking_joined", (data) => {
  console.log("Joined room:", data.room);
});

// Khi có thành viên mới tham gia
socket.on("member_joined_tracking", (data) => {
  console.log(`${data.member_name} joined tracking`);
});

// Khi vị trí thành viên cập nhật
socket.on("member_location_updated", (data) => {
  // data.member chứa thông tin vị trí
  updateMapMarker(data.member);
});

// Khi có SOS
socket.on("sos_alert", (data) => {
  // data: booking_id, user_id, member_name, message, location
  showSOSAlert(data);
});

// Khi SOS được xử lý
socket.on("sos_cleared", (data) => {
  hideSOSAlert(data.target_user_id);
});

// Khi vi phạm geofence
socket.on("geofence_alert", (data) => {
  // data: alert_type ('geofence_exit'/'geofence_enter'), member, geofence, message
  showGeofenceAlert(data);
});

// Nhận danh sách vị trí tất cả thành viên
socket.on("all_locations_response", (data) => {
  // data.members chứa array vị trí
  renderAllMembers(data.members);
});

// Khi được ping yêu cầu cập nhật vị trí
socket.on("location_ping", (data) => {
  // Tự động lấy vị trí hiện tại và gửi lên
  getCurrentLocationAndSend();
});

// Khi thành viên rời khỏi
socket.on("member_left_tracking", (data) => {
  removeMapMarker(data.user_id);
});
```

---

## Ví dụ Frontend Implementation

### React Hook cho Location Tracking

```javascript
import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

export function useTourLocationTracking(bookingId, userId, token) {
  const [socket, setSocket] = useState(null);
  const [members, setMembers] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Kết nối Socket.IO
    const newSocket = io("http://localhost:5000", {
      auth: { token },
    });

    newSocket.on("connect", () => {
      setConnected(true);
      // Tham gia room tracking
      newSocket.emit("join_tour_tracking", {
        booking_id: bookingId,
        user_id: userId,
        member_type: "participant",
      });
    });

    // Lắng nghe cập nhật vị trí
    newSocket.on("member_location_updated", (data) => {
      setMembers((prev) => {
        const index = prev.findIndex((m) => m.id === data.member.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data.member;
          return updated;
        }
        return [...prev, data.member];
      });
    });

    // Lắng nghe SOS
    newSocket.on("sos_alert", (data) => {
      setSosAlerts((prev) => [...prev, data]);
      // Hiển thị thông báo khẩn cấp
      alert(`🆘 SOS từ ${data.member_name}: ${data.message}`);
    });

    // Lắng nghe geofence alerts
    newSocket.on("geofence_alert", (data) => {
      console.log("Geofence alert:", data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit("leave_tour_tracking", {
        booking_id: bookingId,
        user_id: userId,
      });
      newSocket.disconnect();
    };
  }, [bookingId, userId, token]);

  // Cập nhật vị trí của mình
  const updateMyLocation = useCallback(
    (location) => {
      if (socket && connected) {
        socket.emit("update_member_location", {
          booking_id: bookingId,
          user_id: userId,
          ...location,
        });
      }
    },
    [socket, connected, bookingId, userId]
  );

  // Gửi SOS
  const triggerSOS = useCallback(
    (message, location) => {
      if (socket && connected) {
        socket.emit("trigger_sos", {
          booking_id: bookingId,
          user_id: userId,
          message,
          ...location,
        });
      }
    },
    [socket, connected, bookingId, userId]
  );

  return {
    members,
    sosAlerts,
    connected,
    updateMyLocation,
    triggerSOS,
  };
}
```

### Continuous Location Tracking

```javascript
function startLocationTracking(updateCallback) {
  if (!navigator.geolocation) {
    console.error("Geolocation not supported");
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      updateCallback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
      });
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000, // Cập nhật tối đa 5 giây
    }
  );

  return watchId;
}

// Sử dụng
const watchId = startLocationTracking((location) => {
  updateMyLocation(location);
});

// Khi cần dừng
navigator.geolocation.clearWatch(watchId);
```

---

## Database Schema

### tour_member_locations

Lưu trữ vị trí hiện tại của mỗi thành viên.

### tour_location_history

Lưu trữ lịch sử vị trí để vẽ lại lộ trình.

### tour_geofences

Định nghĩa các vùng an toàn và checkpoint.

### tour_location_alerts

Lưu trữ các cảnh báo (geofence violations, SOS).

---

## Lưu ý quan trọng

1. **Privacy**: Vị trí chỉ được chia sẻ trong phạm vi tour
2. **Battery**: Cân nhắc tần suất cập nhật để tiết kiệm pin
3. **Accuracy**: Sử dụng GPS cho độ chính xác cao nhất
4. **Offline**: Xem xét lưu cache vị trí khi mất kết nối

---

## Chạy Migration

```bash
cd database
python migrate_tour_location_tracking.py
```

## Rollback Migration

```bash
cd database
python migrate_tour_location_tracking.py --rollback
```
