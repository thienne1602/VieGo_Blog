# Hướng Dẫn Test Và Sử Dụng Hệ Thống Chat & Kết Bạn

## 📋 Tổng Quan

Hệ thống chat và kết bạn đã được cải thiện với các tính năng:

- ✅ Real-time messaging qua Socket.IO
- ✅ Friend request system (send, accept, reject, cancel, remove)
- ✅ Online/Offline status tracking
- ✅ Typing indicators
- ✅ Message read receipts
- ✅ Cross-client communication
- ✅ Bidirectional friendship validation

## 🚀 Cách Chạy Tests

### 1. Test Suite Đầy Đủ (Unit Tests)

```bash
cd backend
python -m pytest tests/test_chat_and_friends_complete.py -v
```

Hoặc:

```bash
cd backend
python tests/test_chat_and_friends_complete.py
```

**Test này bao gồm:**

- ✅ Send friend request
- ✅ Accept friend request
- ✅ Reject friend request
- ✅ Cancel friend request
- ✅ Remove friend
- ✅ Check friendship status
- ✅ Send message (requires friendship)
- ✅ Get messages between friends
- ✅ Get conversations list
- ✅ Unread message count
- ✅ Mark message as read
- ✅ Socket.IO connection with auth
- ✅ Online/Offline notifications
- ✅ Typing indicators
- ✅ Full integration flow

### 2. Test Real-time Chat (Cross-Client)

**Bước 1:** Đảm bảo backend đang chạy:

```bash
cd backend
python main.py
```

**Bước 2:** Tạo test users (nếu chưa có):

```bash
cd backend
python create_admin.py
# Sau đó tạo 2 users thông qua API hoặc database
```

**Bước 3:** Chạy real-time test:

```bash
cd backend
python tests/test_realtime_chat.py
```

**Test này sẽ:**

1. Login 2 users
2. Connect 2 Socket.IO clients
3. User 1 gửi friend request cho User 2
4. User 2 chấp nhận friend request
5. Test typing indicators
6. Gửi messages qua lại
7. Test online/offline notifications
8. Verify tất cả events được nhận đúng

## 🔧 Các API Endpoints

### Friend Request APIs

#### 1. Gửi lời mời kết bạn

```http
POST /api/social/friends/request/{target_user_id}
Authorization: Bearer {token}
```

#### 2. Chấp nhận lời mời kết bạn (bằng request_id)

```http
POST /api/social/friends/accept/{request_id}
Authorization: Bearer {token}
```

#### 3. Chấp nhận lời mời kết bạn (bằng user_id - an toàn hơn)

```http
POST /api/social/friends/accept-by-user/{target_user_id}
Authorization: Bearer {token}
```

#### 4. Từ chối lời mời kết bạn

```http
POST /api/social/friends/reject/{request_id}
Authorization: Bearer {token}
```

#### 5. Hủy lời mời kết bạn đã gửi

```http
POST /api/social/friends/cancel/{request_id}
Authorization: Bearer {token}
```

#### 6. Xóa bạn bè

```http
POST /api/social/friends/remove/{friend_id}
Authorization: Bearer {token}
```

#### 7. Kiểm tra trạng thái kết bạn

```http
GET /api/social/friends/check/{target_user_id}
Authorization: Bearer {token}

Response:
{
    "is_friend": false,
    "request_status": "sent" | "received" | null,
    "request_id": 123 | null
}
```

#### 8. Lấy danh sách lời mời kết bạn

```http
GET /api/social/friends/requests
Authorization: Bearer {token}

Response:
{
    "received_requests": [...],
    "sent_requests": [...],
    "received_count": 2,
    "sent_count": 1
}
```

#### 9. Lấy danh sách bạn bè

```http
GET /api/social/friends
Authorization: Bearer {token}
```

### Chat APIs

#### 1. Gửi tin nhắn

```http
POST /api/chat/messages
Authorization: Bearer {token}
Content-Type: application/json

{
    "receiver_id": 2,
    "message": "Hello!",
    "message_type": "text"
}
```

#### 2. Lấy tin nhắn với một người

```http
GET /api/chat/messages/{other_user_id}?page=1&per_page=50
Authorization: Bearer {token}
```

#### 3. Lấy danh sách cuộc trò chuyện

```http
GET /api/chat/conversations
Authorization: Bearer {token}
```

#### 4. Đánh dấu tin nhắn đã đọc

```http
PUT /api/chat/messages/{message_id}/read
Authorization: Bearer {token}
```

#### 5. Lấy số lượng tin nhắn chưa đọc

```http
GET /api/chat/unread-count
Authorization: Bearer {token}
```

## 🔌 Socket.IO Events

### Client → Server Events

#### 1. Connect với authentication

```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: "your_jwt_token",
  },
});
```

#### 2. Gửi typing indicator

```javascript
socket.emit("typing_message", {
  sender_id: 1,
  receiver_id: 2,
  is_typing: true,
});
```

#### 3. Join conversation room

```javascript
socket.emit("join_direct_conversation", {
  user_id: 1,
  other_user_id: 2,
});
```

#### 4. Leave conversation room

```javascript
socket.emit("leave_direct_conversation", {
  user_id: 1,
  other_user_id: 2,
});
```

#### 5. Xác nhận tin nhắn đã nhận

```javascript
socket.emit("message_delivered", {
  message_id: 123,
  receiver_id: 2,
});
```

#### 6. Xác nhận tin nhắn đã đọc

```javascript
socket.emit("message_read", {
  message_id: 123,
  reader_id: 2,
});
```

#### 7. Kiểm tra online status

```javascript
socket.emit("get_online_status", {
  user_ids: [1, 2, 3],
});
```

### Server → Client Events

#### 1. Connected (khi kết nối thành công)

```javascript
socket.on("connected", (data) => {
  console.log("Connected:", data);
  // data: { message, user_id, room, online_users }
});
```

#### 2. New message (tin nhắn mới)

```javascript
socket.on("new_message", (data) => {
  console.log("New message:", data);
  // data: { id, message, sender, receiver_id, created_at, status }
});
```

#### 3. Message sent (xác nhận gửi thành công)

```javascript
socket.on("message_sent", (data) => {
  console.log("Message sent:", data);
});
```

#### 4. User typing (đang gõ)

```javascript
socket.on("user_typing", (data) => {
  console.log("User typing:", data);
  // data: { sender_id, sender_name, is_typing, conversation_id }
});
```

#### 5. User online (người dùng online)

```javascript
socket.on("user_online", (data) => {
  console.log("User online:", data);
  // data: { user_id, username }
});
```

#### 6. User offline (người dùng offline)

```javascript
socket.on("user_offline", (data) => {
  console.log("User offline:", data);
  // data: { user_id, username, last_seen }
});
```

#### 7. Message status updated

```javascript
socket.on("message_status_updated", (data) => {
  console.log("Message status:", data);
  // data: { message_id, status, timestamp, read_at }
});
```

#### 8. Friend request received

```javascript
socket.on("friend_request_received", (data) => {
  console.log("Friend request:", data);
  // data: { request_id, requester: {...} }
});
```

#### 9. Online status response

```javascript
socket.on("online_status_response", (data) => {
  console.log("Online status:", data);
  // data: { users: { user_id: { is_online, last_seen } } }
});
```

## 📝 Ví Dụ Sử Dụng

### Ví dụ 1: Kết bạn và chat

```javascript
// User 1: Gửi lời mời kết bạn
const sendFriendRequest = async (targetUserId) => {
  const response = await fetch(`/api/social/friends/request/${targetUserId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  console.log("Friend request sent:", data);
};

// User 2: Chấp nhận lời mời
const acceptFriendRequest = async (requestId) => {
  const response = await fetch(`/api/social/friends/accept/${requestId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  console.log("Friend request accepted:", data);
};

// User 1: Gửi tin nhắn (sau khi đã là bạn)
const sendMessage = async (receiverId, message) => {
  const response = await fetch("/api/chat/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiver_id: receiverId,
      message: message,
      message_type: "text",
    }),
  });

  const data = await response.json();
  console.log("Message sent:", data);
};
```

### Ví dụ 2: Real-time chat với Socket.IO

```javascript
import io from "socket.io-client";

// Connect
const socket = io("http://localhost:5000", {
  auth: {
    token: localStorage.getItem("token"),
  },
});

// Listen for connection
socket.on("connected", (data) => {
  console.log("✓ Connected:", data);
});

// Listen for new messages
socket.on("new_message", (data) => {
  console.log("💬 New message:", data);
  // Update UI to show new message
  addMessageToChat(data);
});

// Listen for typing indicators
socket.on("user_typing", (data) => {
  if (data.is_typing) {
    showTypingIndicator(data.sender_name);
  } else {
    hideTypingIndicator();
  }
});

// Listen for online/offline status
socket.on("user_online", (data) => {
  updateUserStatus(data.user_id, "online");
});

socket.on("user_offline", (data) => {
  updateUserStatus(data.user_id, "offline");
});

// Send typing indicator
const startTyping = (receiverId) => {
  socket.emit("typing_message", {
    sender_id: currentUserId,
    receiver_id: receiverId,
    is_typing: true,
  });
};

const stopTyping = (receiverId) => {
  socket.emit("typing_message", {
    sender_id: currentUserId,
    receiver_id: receiverId,
    is_typing: false,
  });
};

// Send message via API (not Socket.IO)
const sendMessage = async (receiverId, message) => {
  const response = await fetch("/api/chat/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiver_id: receiverId,
      message: message,
      message_type: "text",
    }),
  });

  // Socket.IO events will be automatically emitted by the server
};
```

## 🐛 Troubleshooting

### 1. Socket.IO không kết nối được

**Kiểm tra:**

- Backend có đang chạy không?
- CORS có được cấu hình đúng không?
- Token JWT có hợp lệ không?

**Debug:**

```javascript
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
});
```

### 2. Không nhận được tin nhắn real-time

**Kiểm tra:**

- User có đang kết nối Socket.IO không?
- User có là bạn bè không?
- Check console logs trên server

**Debug:**

```python
# Trong socket_handlers.py, đã có logs chi tiết
print(f'[Socket.IO] User {user_id} connected')
print(f'[Socket.IO] Message sent to user {receiver_id}')
```

### 3. Typing indicator không hoạt động

**Kiểm tra:**

- Event name có đúng là 'typing_message' không?
- sender_id và receiver_id có đúng không?
- Client có lắng nghe event 'user_typing' không?

### 4. Online/Offline status không cập nhật

**Kiểm tra:**

- User có kết bạn với nhau không? (chỉ notify friends)
- Socket.IO connection có stable không?
- Check online_users dictionary trong server logs

## ✅ Checklist Test

Trước khi deploy, hãy test các tình huống sau:

### Friend Request System

- [ ] User A gửi friend request cho User B
- [ ] User B nhận được notification real-time
- [ ] User B chấp nhận friend request
- [ ] User A nhận được notification về việc được chấp nhận
- [ ] Cả 2 users đều có nhau trong friends list
- [ ] User A có thể hủy friend request trước khi B chấp nhận
- [ ] User B có thể từ chối friend request
- [ ] User A có thể xóa bạn bè
- [ ] Sau khi xóa bạn, không thể chat với nhau nữa

### Chat System

- [ ] Không thể chat nếu chưa là bạn bè
- [ ] Gửi tin nhắn text thành công
- [ ] Người nhận nhận được tin nhắn real-time
- [ ] Typing indicator hoạt động
- [ ] Online/Offline status cập nhật đúng
- [ ] Đếm tin nhắn chưa đọc chính xác
- [ ] Mark as read hoạt động
- [ ] Lấy conversation list đúng
- [ ] Lấy message history đúng

### Cross-Client Communication

- [ ] Mở 2 browsers khác nhau
- [ ] Login 2 users khác nhau
- [ ] Kết bạn với nhau
- [ ] Chat qua lại mượt mà
- [ ] Typing indicator hiển thị ngay
- [ ] Online/Offline status update ngay
- [ ] Disconnect 1 client, client còn lại thấy offline
- [ ] Reconnect, client còn lại thấy online

## 📊 Performance Tips

1. **Rate Limiting**: Server đã có rate limiting để tránh spam
2. **Message Pagination**: Luôn sử dụng pagination khi load messages
3. **Debounce Typing**: Debounce typing events ở client side
4. **Offline Queue**: Messages sẽ được queue nếu user offline
5. **Connection Pool**: Database connection pool đã được config

## 🔐 Security Notes

1. **Authentication Required**: Tất cả endpoints đều cần JWT token
2. **Friendship Required**: Chỉ chat được với bạn bè
3. **Authorization Checks**: Server kiểm tra quyền trước khi thực hiện action
4. **Data Validation**: Tất cả input đều được validate
5. **SQL Injection Protection**: Sử dụng SQLAlchemy ORM

## 📞 Support

Nếu gặp vấn đề, check:

1. Server logs trong console
2. Browser console logs
3. Network tab để xem requests/responses
4. Database để xem data có đúng không

---

**Tác giả**: GitHub Copilot  
**Ngày cập nhật**: 2025-11-19  
**Version**: 2.0
