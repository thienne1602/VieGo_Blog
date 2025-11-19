# Chat & Notification System Documentation

## Overview
Hệ thống chat và notification real-time cho VieGo Blog, hỗ trợ:
- ✅ Direct messaging giữa các users
- ✅ Group chat
- ✅ Online/offline status tracking
- ✅ Typing indicators
- ✅ Message delivery & read confirmations
- ✅ Real-time notifications
- ✅ File sharing (images, audio, files)
- ✅ Location sharing
- ✅ Message search

## Architecture

### Backend Components

#### 1. Socket.IO Handlers (`socket_handlers.py`)
Xử lý real-time communication:
- **Connection Management**: Track online users, join/leave rooms
- **Presence System**: Broadcast online/offline status to friends
- **Typing Indicators**: Real-time typing status
- **Message Delivery**: Confirmation & read receipts
- **Online Status Query**: Check which friends are online

#### 2. Chat API Routes (`routes/chat.py`)
REST API endpoints:
- `GET /api/chat/conversations` - Lấy danh sách cuộc trò chuyện
- `GET /api/chat/messages/<user_id>` - Lấy tin nhắn với user cụ thể
- `POST /api/chat/messages` - Gửi tin nhắn mới
- `PUT /api/chat/messages/<id>/read` - Đánh dấu đã đọc
- `GET /api/chat/unread-count` - Số tin nhắn chưa đọc
- `GET /api/chat/search` - Tìm kiếm tin nhắn
- `GET /api/chat/online-users` - Danh sách bạn bè online
- `DELETE /api/chat/conversations/<user_id>` - Xóa cuộc trò chuyện

##### Group Chat Endpoints
- `POST /api/chat/groups` - Tạo nhóm chat
- `GET /api/chat/groups` - Lấy danh sách nhóm
- `GET /api/chat/groups/<room_id>` - Chi tiết nhóm
- `GET /api/chat/groups/<room_id>/messages` - Tin nhắn nhóm
- `POST /api/chat/groups/<room_id>/messages` - Gửi tin nhắn nhóm
- `GET /api/chat/groups/<room_id>/members` - Thành viên nhóm

#### 3. Notification API Routes (`routes/notifications.py`)
REST API endpoints:
- `GET /api/notifications` - Lấy thông báo (có filtering)
- `GET /api/notifications/unread-count` - Số thông báo chưa đọc
- `PUT /api/notifications/<id>/read` - Đánh dấu đã đọc
- `PUT /api/notifications/read-all` - Đánh dấu tất cả đã đọc
- `DELETE /api/notifications/<id>` - Xóa thông báo
- `DELETE /api/notifications/delete-all` - Xóa tất cả
- `DELETE /api/notifications/delete-read` - Xóa thông báo đã đọc
- `GET /api/notifications/stats` - Thống kê thông báo

#### 4. Models
- **Chat**: Lưu tin nhắn (text, image, audio, file, location)
- **Notification**: Lưu thông báo
- **GroupChat**: Thông tin nhóm chat
- **GroupMember**: Thành viên nhóm

## Client Integration Guide

### 1. Socket.IO Connection

```javascript
import io from 'socket.io-client';

// Kết nối với authentication
const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('access_token')
  },
  transports: ['websocket', 'polling']
});

// Lắng nghe sự kiện connected
socket.on('connected', (data) => {
  console.log('Connected:', data);
  // data.user_id, data.room, data.online_users
});

// Lắng nghe user online/offline
socket.on('user_online', (data) => {
  console.log('User online:', data.user_id, data.username);
  // Update UI to show user is online
});

socket.on('user_offline', (data) => {
  console.log('User offline:', data.user_id, data.last_seen);
  // Update UI to show user is offline
});
```

### 2. Receiving Messages

```javascript
// Tin nhắn mới
socket.on('new_message', (data) => {
  console.log('New message:', data);
  // {
  //   id, message, message_type, sender, receiver_id,
  //   sender_id, created_at, status, file_url, file_type
  // }
  
  // Update UI: add message to conversation
  // Show notification
  // Play sound
  
  // Send delivery confirmation
  socket.emit('message_delivered', {
    message_id: data.id,
    receiver_id: currentUserId
  });
});

// Tin nhắn đã gửi (confirmation)
socket.on('message_sent', (data) => {
  console.log('Message sent successfully:', data);
  // Update UI: mark message as sent
});

// Cập nhật trạng thái tin nhắn
socket.on('message_status_updated', (data) => {
  console.log('Message status:', data);
  // data.message_id, data.status ('delivered' or 'read')
  // Update UI: show checkmarks
});

// Tin nhắn nhóm
socket.on('new_group_message', (data) => {
  console.log('New group message:', data);
  // Update group chat UI
});
```

### 3. Sending Messages

```javascript
// Gửi tin nhắn qua API (recommended)
async function sendMessage(receiverId, message, messageType = 'text') {
  const response = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      receiver_id: receiverId,
      message: message,
      message_type: messageType
    })
  });
  
  return await response.json();
}

// Gửi file (image, audio)
async function sendFileMessage(receiverId, file, messageType) {
  const formData = new FormData();
  formData.append('receiver_id', receiverId);
  formData.append('message_type', messageType);
  formData.append('file', file);
  
  const response = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}
```

### 4. Typing Indicators

```javascript
let typingTimeout;

function onUserTyping(receiverId) {
  // Emit typing event
  socket.emit('typing_message', {
    sender_id: currentUserId,
    receiver_id: receiverId,
    is_typing: true
  });
  
  // Clear previous timeout
  clearTimeout(typingTimeout);
  
  // Auto-stop after 3 seconds
  typingTimeout = setTimeout(() => {
    socket.emit('typing_message', {
      sender_id: currentUserId,
      receiver_id: receiverId,
      is_typing: false
    });
  }, 3000);
}

// Listen for typing events
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
  // data.sender_id, data.sender_name, data.is_typing, data.timestamp
  
  if (data.is_typing) {
    // Show "User is typing..." indicator
  } else {
    // Hide typing indicator
  }
});
```

### 5. Online Status

```javascript
// Query online status
socket.emit('get_online_status', {
  user_ids: [userId1, userId2, userId3]
});

socket.on('online_status_response', (data) => {
  console.log('Online status:', data.users);
  // data.users = {
  //   user_id: { is_online: true/false, last_seen: timestamp }
  // }
});

// Get online friends via API
async function getOnlineFriends() {
  const response = await fetch('/api/chat/online-users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
  // { online_friends: [...], count: number }
}
```

### 6. Notifications

```javascript
// Real-time notifications
socket.on('new_notification', (data) => {
  console.log('New notification:', data);
  // {
  //   type, message, title, notification_id,
  //   unread_count, action_url, created_at
  // }
  
  // Update notification badge
  // Show notification popup
  // Play sound
});

// Fetch notifications
async function getNotifications(page = 1, unreadOnly = false, type = null) {
  let url = `/api/notifications?page=${page}&per_page=20`;
  if (unreadOnly) url += '&unread_only=true';
  if (type) url += `&type=${type}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
  // {
  //   notifications: [...],
  //   total, page, pages,
  //   unread_count, unread_stats
  // }
}

// Mark as read
async function markNotificationRead(notificationId) {
  await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

// Mark all as read
async function markAllRead() {
  await fetch('/api/notifications/read-all', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
```

### 7. Conversations

```javascript
// Get all conversations
async function getConversations() {
  const response = await fetch('/api/chat/conversations', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
  // { conversations: [...] }
}

// Get messages with specific user
async function getMessages(userId, page = 1) {
  const response = await fetch(`/api/chat/messages/${userId}?page=${page}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
  // { messages: [...], total, page, pages }
}

// Search messages
async function searchMessages(query, type = 'all') {
  const response = await fetch(
    `/api/chat/search?q=${encodeURIComponent(query)}&type=${type}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return await response.json();
}
```

### 8. Message Read Receipts

```javascript
// When user opens a conversation, mark messages as read
async function markConversationAsRead(otherUserId) {
  // Get all unread messages from this user
  const messages = await getMessages(otherUserId);
  
  for (const msg of messages.messages) {
    if (msg.status !== 'read' && msg.sender_id === otherUserId) {
      // Send read confirmation via Socket.IO
      socket.emit('message_read', {
        message_id: msg.id,
        reader_id: currentUserId
      });
    }
  }
}
```

## Features

### Message Types
1. **text**: Text messages
2. **image**: Image files
3. **audio**: Voice messages
4. **file**: Document files
5. **location**: GPS coordinates
6. **system**: System messages (e.g., "User created group")

### Message Status
1. **sent**: Message sent to server
2. **delivered**: Message delivered to recipient's device
3. **read**: Message opened by recipient
4. **deleted**: Message deleted

### Notification Types
1. **message**: New chat message
2. **like**: Post/comment liked
3. **comment**: New comment on post
4. **follow**: New follower
5. **friend_request**: Friend request
6. **booking**: Tour booking updates
7. **system**: System announcements

## Best Practices

### 1. Connection Management
- Reconnect automatically on disconnect
- Handle connection errors gracefully
- Store offline messages and send when reconnected

### 2. Message Queuing
- Queue messages when user is offline
- Retry failed messages
- Show pending status in UI

### 3. Performance
- Paginate message history
- Lazy load conversations
- Debounce typing indicators
- Cache online status

### 4. UI/UX
- Show online status with green dot
- Display typing indicator
- Show message status (sent/delivered/read)
- Play notification sound
- Badge with unread count
- Desktop notifications

### 5. Error Handling
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Show error message to user
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Retry connection
});
```

## Testing

Run test suite:
```bash
cd backend
python -m pytest tests/test_chat_realtime.py -v
```

## Troubleshooting

### Messages not delivered
- Check if both users are friends
- Verify JWT token is valid
- Check Socket.IO connection status
- Ensure user has joined their room

### Typing indicator not working
- Verify sender_id and receiver_id are correct
- Check if users are friends
- Ensure Socket.IO is connected

### Notifications not showing
- Check if `emit_realtime=True` in create_notification
- Verify user has joined their room (user_{user_id})
- Check browser console for Socket.IO errors

## Security

- All endpoints require JWT authentication
- Users can only message friends
- Messages filtered by user_id
- Notifications filtered by user_id
- No cross-user data leakage
- Rate limiting recommended for production

## Future Enhancements

- [ ] End-to-end encryption
- [ ] Message reactions (emoji)
- [ ] Message replies/threads
- [ ] Voice/video calls
- [ ] Screen sharing
- [ ] File transfer with progress
- [ ] Message translation
- [ ] Read receipts for group messages
- [ ] Push notifications (FCM/APNs)
- [ ] Message scheduling
