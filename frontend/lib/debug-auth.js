/**
 * Debug Authentication Script
 * Chạy trong browser console để kiểm tra authentication
 */

console.log("=== VieGo Authentication Debug ===\n");

// 1. Check tokens
console.log("1. Checking tokens in localStorage:");
const accessToken = localStorage.getItem("access_token");
const viegoToken = localStorage.getItem("viego_token");
const user = localStorage.getItem("user");

console.log("  - access_token:", accessToken ? "✅ EXISTS" : "❌ NOT FOUND");
console.log(
  "  - viego_token (old):",
  viegoToken ? "⚠️ EXISTS (should remove)" : "✅ NOT FOUND"
);
console.log("  - user data:", user ? "✅ EXISTS" : "❌ NOT FOUND");

if (accessToken) {
  console.log("\n2. Token Details:");
  try {
    // Decode JWT (base64)
    const parts = accessToken.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log(
        "  - User ID:",
        payload.sub || payload.user_id || payload.identity
      );
      console.log(
        "  - Issued at:",
        payload.iat ? new Date(payload.iat * 1000).toLocaleString() : "N/A"
      );
      console.log(
        "  - Expires at:",
        payload.exp ? new Date(payload.exp * 1000).toLocaleString() : "N/A"
      );

      // Check expiration
      if (payload.exp) {
        const now = Date.now() / 1000;
        const timeLeft = payload.exp - now;
        if (timeLeft < 0) {
          console.log(
            "  - Status: ❌ EXPIRED (" +
              Math.abs(Math.floor(timeLeft / 3600)) +
              " hours ago)"
          );
        } else {
          const hours = Math.floor(timeLeft / 3600);
          const days = Math.floor(hours / 24);
          console.log(
            "  - Status: ✅ VALID (expires in " +
              (days > 0 ? days + " days" : hours + " hours") +
              ")"
          );
        }
      }
    }
  } catch (e) {
    console.log("  ⚠️ Could not decode token:", e.message);
  }
}

if (user) {
  console.log("\n3. User Data:");
  try {
    const userData = JSON.parse(user);
    console.log("  - Username:", userData.username);
    console.log("  - Email:", userData.email);
    console.log("  - Role:", userData.role);
    console.log("  - Is Active:", userData.is_active);
    console.log(
      "  - Admin Access:",
      userData.role === "admin" || userData.role === "moderator"
        ? "✅ YES"
        : "❌ NO"
    );
  } catch (e) {
    console.log("  ⚠️ Could not parse user data:", e.message);
  }
}

// 4. Test API call
console.log("\n4. Testing Admin API Call:");
if (accessToken) {
  fetch("http://localhost:5000/api/admin/stats/overview", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  })
    .then((response) => {
      console.log("  - Response Status:", response.status);
      if (response.status === 200) {
        console.log("  - Result: ✅ SUCCESS");
        return response.json();
      } else if (response.status === 401) {
        console.log("  - Result: ❌ UNAUTHORIZED (token invalid or expired)");
        return response.json();
      } else if (response.status === 403) {
        console.log("  - Result: ❌ FORBIDDEN (not admin role)");
        return response.json();
      } else {
        console.log("  - Result: ⚠️ ERROR");
        return response.json();
      }
    })
    .then((data) => {
      console.log("  - Response Data:", data);
    })
    .catch((err) => {
      console.log("  - Network Error:", err.message);
    });
} else {
  console.log("  ❌ Cannot test - no token found");
}

// 5. Recommendations
console.log("\n5. Recommendations:");
if (!accessToken) {
  console.log("  ⚠️ Please login again at: http://localhost:3000/login");
}
if (viegoToken) {
  console.log(
    '  ⚠️ Old token found! Run: localStorage.removeItem("viego_token")'
  );
}

console.log("\n=== End of Debug ===");
