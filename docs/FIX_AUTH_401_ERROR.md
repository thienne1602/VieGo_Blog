# FIX: Authentication Error 401 Unauthorized

## Vấn Đề

Các API calls tới `/api/social/friends` và `/api/social/friends/check/<user_id>` đang trả về **401 Unauthorized**

```
127.0.0.1 - - [19/Nov/2025 14:01:05] "GET /api/social/friends HTTP/1.1" 401 -
127.0.0.1 - - [19/Nov/2025 14:01:05] "GET /api/social/friends/check/11 HTTP/1.1" 401 -
```

## Nguyên Nhân

JWT token không được gửi trong `Authorization` header, hoặc token đã hết hạn/không hợp lệ.

## Giải Pháp

### 1. Kiểm Tra Frontend Code

Frontend phải gửi JWT token trong **Authorization header** với format:

```
Authorization: Bearer <token>
```

#### ✅ Cách Đúng:

```javascript
// Get token from localStorage hoặc state management
const token = localStorage.getItem("access_token");

// Send API request with Authorization header
const response = await fetch("http://localhost:5000/api/social/friends", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

#### ❌ Cách Sai (Missing Token):

```javascript
// WRONG - No Authorization header
const response = await fetch("http://localhost:5000/api/social/friends", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
});
```

### 2. Kiểm Tra Token Storage

Sau khi login thành công, token phải được lưu:

```javascript
// After successful login
const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: username,
    password: password,
  }),
});

const data = await loginResponse.json();

if (data.access_token) {
  // Save token to localStorage
  localStorage.setItem("access_token", data.access_token);
  console.log("Token saved:", data.access_token);
}
```

### 3. Tạo API Helper Function

Tạo utility function để tự động thêm Authorization header:

```javascript
// utils/api.js
export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if token exists
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`http://localhost:5000${endpoint}`, config);

  // Handle 401 - token expired or invalid
  if (response.status === 401) {
    console.error("Authentication failed - redirecting to login");
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Authentication required");
  }

  return response;
}

// Usage
import { apiCall } from "./utils/api";

async function getFriends() {
  try {
    const response = await apiCall("/api/social/friends");
    const data = await response.json();
    return data.friends;
  } catch (error) {
    console.error("Error getting friends:", error);
  }
}
```

### 4. Test Token Manually

Để test xem token có hoạt động không:

```bash
# Get token from login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Copy token from response, then test friends endpoint
curl -X GET http://localhost:5000/api/social/friends \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Debug Steps

1. **Mở Browser Console**

   ```javascript
   // Check if token exists
   console.log("Token:", localStorage.getItem("access_token"));
   ```

2. **Check Network Tab**

   - Mở DevTools → Network tab
   - Click vào request `/api/social/friends`
   - Check **Request Headers** section
   - Verify có `Authorization: Bearer <token>` không

3. **Verify Token Format**
   ```javascript
   const token = localStorage.getItem("access_token");
   if (token) {
     console.log("Token length:", token.length);
     console.log("Token starts with:", token.substring(0, 20));
     // JWT token should have 3 parts separated by dots
     console.log("Token parts:", token.split(".").length); // Should be 3
   } else {
     console.error("No token found!");
   }
   ```

### 6. Common Issues & Solutions

#### Issue 1: Token không tồn tại

```javascript
// Solution: Check login flow
const token = localStorage.getItem("access_token");
if (!token) {
  console.error("User not logged in");
  // Redirect to login page
  window.location.href = "/login";
}
```

#### Issue 2: Token format sai

```javascript
// Wrong
headers: {
  'Authorization': token // Missing "Bearer "
}

// Correct
headers: {
  'Authorization': `Bearer ${token}`
}
```

#### Issue 3: Token expired

```javascript
// Backend will return 401 with "Token has expired"
// Frontend should handle this:
if (response.status === 401) {
  // Token expired - re-login
  localStorage.removeItem("access_token");
  window.location.href = "/login";
}
```

### 7. React Example

```javascript
// Using React hooks
import { useState, useEffect } from "react";

function FriendsList() {
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadFriends() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login first");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/social/friends",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed");
          }
          throw new Error("Failed to fetch friends");
        }

        const data = await response.json();
        setFriends(data.friends);
      } catch (error) {
        console.error("Error:", error);
        setError(error.message);

        // Redirect to login if auth failed
        if (error.message === "Authentication failed") {
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        }
      }
    }

    loadFriends();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Friends List</h2>
      <ul>
        {friends.map((friend) => (
          <li key={friend.id}>{friend.full_name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 8. Axios Example

Nếu dùng Axios:

```javascript
import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to include token in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Usage
async function getFriends() {
  const response = await api.get("/social/friends");
  return response.data.friends;
}

async function checkFriendship(userId) {
  const response = await api.get(`/social/friends/check/${userId}`);
  return response.data;
}
```

## Backend Debug Added

Backend đã được thêm logging chi tiết hơn trong `main.py`:

```python
@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"[JWT] Missing token error: {error}")
    print(f"[JWT] Request path: {request.path}")
    print(f"[JWT] Request method: {request.method}")
    print(f"[JWT] Request headers: {dict(request.headers)}")
    return jsonify({'error': 'Authorization token is required'}), 401
```

Bây giờ khi có lỗi 401, backend sẽ log:

- Request path
- Request method
- All request headers

Điều này sẽ giúp debug xem có Authorization header không.

## Checklist

- [ ] Token được lưu sau khi login thành công
- [ ] Token được gửi trong Authorization header
- [ ] Format: `Bearer <token>` (có space sau "Bearer")
- [ ] Token chưa expired
- [ ] Token có 3 parts (JWT format: header.payload.signature)
- [ ] Network tab shows Authorization header in request
- [ ] Handle 401 errors và redirect to login

## Next Steps

1. Kiểm tra frontend code nơi gọi `/api/social/friends`
2. Verify token được lưu sau khi login
3. Thêm Authorization header vào tất cả authenticated requests
4. Test lại với token hợp lệ

Sau khi fix frontend, API sẽ hoạt động bình thường! ✅
