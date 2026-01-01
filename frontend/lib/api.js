// API configuration and utilities for VieGo Blog
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Default timeout for API requests (10 seconds)
const DEFAULT_TIMEOUT = 10000;

// Normalize base URL to ensure it ends with /api
function normalizeBaseURL(url) {
  if (!url) return "http://localhost:5000/api";
  // Remove trailing slash
  url = url.replace(/\/$/, "");
  // Add /api if not present
  if (!url.endsWith("/api")) {
    url = url + "/api";
  }
  return url;
}

// Fetch with timeout helper - exported for use in other components
export async function fetchWithTimeout(
  url,
  options = {},
  timeout = DEFAULT_TIMEOUT
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new TypeError(
        "Request timeout: Không thể kết nối với máy chủ trong thời gian quy định."
      );
    }
    throw error;
  }
}

// Get current port from window.location
function getCurrentPort() {
  if (typeof window !== "undefined") {
    const port =
      window.location.port ||
      (window.location.protocol === "https:" ? "443" : "80");
    return port;
  }
  return "3000"; // Default fallback
}

// Get storage key with port suffix to ensure isolation between clients
export function getStorageKey(baseKey) {
  const port = getCurrentPort();
  return `${baseKey}_${port}`;
}

// Get cookie name with port suffix
function getCookieName(baseName) {
  const port = getCurrentPort();
  return `${baseName}_${port}`;
}

// API client with error handling and caching
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    // Normalize base URL to ensure it always ends with /api
    this.baseURL = normalizeBaseURL(baseURL);
    this.token = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes default

    // Longer cache for static/rarely-changing data
    this.longCacheTimeout = 30 * 60 * 1000; // 30 minutes for categories, locations
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem(getStorageKey("access_token"), token);
      // Set cookie as well for consistency (with port-specific name)
      const port = getCurrentPort();
      const cookieName = getCookieName("access_token");
      document.cookie = `${cookieName}=${token};path=/;max-age=${
        7 * 24 * 60 * 60
      };SameSite=Strict`;
    }
  }

  // Get authentication token
  getToken() {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      return localStorage.getItem(getStorageKey("access_token"));
    }
    return null;
  }

  // Clear authentication
  clearAuth() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(getStorageKey("access_token"));
      localStorage.removeItem(getStorageKey("user"));
      // Clear cookie (with port-specific name)
      const cookieName = getCookieName("access_token");
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  }

  // Cache management
  getCacheKey(endpoint, options) {
    return `${endpoint}_${JSON.stringify(options?.params || {})}`;
  }

  getCacheTimeout(endpoint) {
    // Use longer cache for static data endpoints
    const longCacheEndpoints = ["/categories", "/maps/locations", "/locations"];
    if (longCacheEndpoints.some((path) => endpoint.includes(path))) {
      return this.longCacheTimeout;
    }
    return this.cacheTimeout;
  }

  isValidCache(cacheData, timeout) {
    const cacheTimeout = timeout || cacheData.timeout || this.cacheTimeout;
    return Date.now() - cacheData.timestamp < cacheTimeout;
  }

  setCache(key, data, timeout = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeout: timeout || this.cacheTimeout,
    });
  }

  getCache(key, endpoint) {
    const cached = this.cache.get(key);
    const timeout = this.getCacheTimeout(endpoint || "");
    return cached && this.isValidCache(cached, timeout) ? cached.data : null;
  }

  // Download file helper
  async downloadFile(endpoint, filename, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error("Download error:", error);
      return { success: false, error: error.message };
    }
  }

  // Make API request with automatic error handling and caching
  async request(endpoint, options = {}) {
    const cacheKey = this.getCacheKey(endpoint, options);

    // Check cache for GET requests (skip if cache: false in options)
    if (
      (!options.method || options.method === "GET") &&
      options.cache !== false
    ) {
      const cached = this.getCache(cacheKey, endpoint);
      if (cached) {
        // Only log cache hits in development
        if (process.env.NODE_ENV === "development") {
          console.log(`[API] 💨 Cache hit for: ${endpoint}`);
        }
        return cached;
      }
    }

    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    // Debug: Log URL for troubleshooting
    console.log(`[API] Request URL: ${url}`);

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add no-cache headers in development to prevent aggressive caching
    if (process.env.NODE_ENV === "development") {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
      config.headers["Expires"] = "0";
      // Add cache buster timestamp to URL for GET requests
      if (!options.method || options.method === "GET") {
        // Skip cache for development
        config.cache = "no-store";
      }
    }

    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      // Use fetchWithTimeout instead of fetch
      const timeout = options.timeout || DEFAULT_TIMEOUT;
      const response = await fetchWithTimeout(url, config, timeout);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not JSON, return error
        return {
          success: false,
          error: "Server response is not valid JSON",
          status: response.status,
        };
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          console.warn(
            "[API] 🚫 401 Unauthorized - clearing auth and redirecting to login"
          );
          this.clearAuth();

          // Only redirect if we're in the browser and not already on login page
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.includes("/login")
          ) {
            window.location.href = "/login?expired=true";
          }
        }

        throw new Error(
          data.error ||
            data.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Format response object
      const responseObj = { success: true, data: data, response };

      console.log(`[API] ✅ Response received for ${endpoint}:`, {
        success: responseObj.success,
        hasData: !!responseObj.data,
        dataKeys: responseObj.data ? Object.keys(responseObj.data) : [],
        cacheKey,
      });

      // Extra debug for bookings endpoint
      if (endpoint.includes("bookings")) {
        console.log(`[API] 🔍 Raw data from backend:`, data);
        console.log(`[API] 🔍 responseObj.data:`, responseObj.data);
        if (data && data.data) {
          console.log(`[API] 🔍 data.data:`, data.data);
          console.log(`[API] 🔍 data.data.bookings:`, data.data.bookings);
        }
      }

      // Cache successful GET requests - cache the formatted response object (skip if cache: false)
      if (
        (!options.method || options.method === "GET") &&
        options.cache !== false
      ) {
        const timeout = this.getCacheTimeout(endpoint);
        this.setCache(cacheKey, responseObj, timeout);
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[API] 💾 Cached response for: ${endpoint} (TTL: ${
              timeout / 1000
            }s)`
          );
        }
      }

      return responseObj;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);

      // If network error, timeout, or JSON parse error
      if (error instanceof TypeError || error.name === "AbortError") {
        return {
          success: false,
          error:
            error.message ||
            "Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo backend đang chạy.",
          status: 0,
        };
      }

      return {
        success: false,
        error: error.message || "Network error occurred",
        status: error.status,
      };
    }
  }

  // Download file (for exports)
  async download(endpoint) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {},
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetchWithTimeout(url, config, DEFAULT_TIMEOUT * 3); // Longer timeout for downloads

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Download failed" }));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "download";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, filename };
    } catch (error) {
      console.error(`Download Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error.message || "Download failed",
      };
    }
  }

  // GET request
  async get(endpoint, params = {}, options = {}) {
    // Clear cache for this specific request if bypassCache is set
    if (options.bypassCache) {
      const cacheKey = this.getCacheKey(endpoint, { params });
      this.cache.delete(cacheKey);
      console.log(`[API] 🗑️ Cleared cache for: ${cacheKey}`);
    }

    const queryString = Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";

    return this.request(`${endpoint}${queryString}`, {
      method: "GET",
      cache: options.cache, // Pass cache option to request
    });
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
  }

  // Clear cache for specific endpoint
  clearCacheFor(endpoint, params = {}) {
    const cacheKey = this.getCacheKey(endpoint, { params });
    this.cache.delete(cacheKey);
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  // Health check
  async healthCheck() {
    return this.get("/health");
  }

  // Authentication methods
  async login(credentials) {
    const result = await this.post("/auth/login", credentials);

    if (result.success && result.data.access_token) {
      this.setToken(result.data.access_token);

      // Store user info
      if (typeof window !== "undefined") {
        localStorage.setItem(
          getStorageKey("user"),
          JSON.stringify(result.data.user)
        );
      }
    }

    return result;
  }

  async logout() {
    this.clearAuth();
    return { success: true };
  }

  // Get current user from localStorage
  getCurrentUser() {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem(getStorageKey("user"));
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          console.error("Error parsing user data:", e);
          this.clearAuth();
        }
      }
    }
    return null;
  }

  // Posts methods - skip cache for fresh visibility data
  async getPosts(filters = {}) {
    return this.get("/posts", filters, { cache: false });
  }

  async getPost(slug) {
    return this.get(`/posts/${slug}`, {}, { cache: false });
  }

  async createPost(postData) {
    return this.post("/posts", postData);
  }

  async updatePost(slug, postData) {
    return this.put(`/posts/${slug}`, postData);
  }

  async deletePost(slug) {
    return this.delete(`/posts/${slug}`);
  }

  // Featured posts
  async getFeaturedPosts() {
    return this.getPosts({ featured: true, per_page: 6 });
  }

  // Posts by category
  async getPostsByCategory(category, page = 1) {
    return this.getPosts({ category, page, per_page: 12 });
  }

  // Search posts
  async searchPosts(query, page = 1) {
    return this.getPosts({ search: query, page, per_page: 12 });
  }

  // Categories methods
  async getCategories() {
    return this.get("/categories");
  }

  // Locations/Maps methods
  async getLocations(filters = {}) {
    return this.get("/maps/locations", filters);
  }

  async getLocation(locationId) {
    return this.get(`/maps/locations/${locationId}`);
  }

  async getLocationCategories() {
    return this.get("/maps/categories");
  }

  async getNearbyLocations(lat, lng, radius = 10) {
    return this.get("/maps/nearby", { lat, lng, radius });
  }

  async getMapStatistics() {
    return this.get("/maps/statistics");
  }

  async createLocation(locationData) {
    return this.post("/maps/locations", locationData);
  }

  async updateLocation(locationId, locationData) {
    return this.put(`/maps/locations/${locationId}`, locationData);
  }

  async deleteLocation(locationId) {
    return this.delete(`/maps/locations/${locationId}`);
  }

  async rateLocation(locationId, rating) {
    return this.post(`/maps/locations/${locationId}/rate`, { rating });
  }

  // Travel Routes methods
  async getTravelRoutes(params = {}) {
    return this.get("/maps/routes", params);
  }

  async createTravelRoute(routeData) {
    return this.post("/maps/routes", routeData);
  }

  // Weather methods
  async getWeather(lat, lng) {
    return this.get("/maps/weather", { lat, lng });
  }

  // Directions methods
  async getDirections(origin, destination, mode = "driving") {
    return this.get("/maps/directions", { origin, destination, mode });
  }

  // Tours methods
  async getTours(filters = {}, options = {}) {
    return this.get("/tours", filters, options);
  }

  async getTour(tourId, options = {}) {
    return this.get(`/tours/${tourId}`, {}, options);
  }

  async getTourCategories() {
    return this.request("/tours/categories");
  }

  async bookTour(tourId, bookingData) {
    return this.post(`/tours/${tourId}/book`, bookingData);
  }

  async getTourReviews(tourId) {
    // Mock data for now as backend endpoint is missing
    // In a real implementation, this would call this.request(`/tours/${tourId}/reviews`)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
            {
              id: 1,
              user: {
                full_name: "Nguyễn Văn A",
                avatar_url: null,
              },
              rating: 5,
              content:
                "Tour rất tuyệt vời, hướng dẫn viên nhiệt tình! Cảnh quan Hạ Long thực sự hùng vĩ, đồ ăn trên tàu cũng rất ngon.",
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
            {
              id: 2,
              user: {
                full_name: "Trần Thị B",
                avatar_url: null,
              },
              rating: 4,
              content:
                "Trải nghiệm đáng nhớ. Tuy nhiên thời gian di chuyển hơi nhiều. Nên mang theo thuốc say xe nếu bạn không quen đi tàu.",
              created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            },
            {
              id: 3,
              user: {
                full_name: "Le Van C",
                avatar_url: null,
              },
              rating: 5,
              content: "Dịch vụ tốt, giá cả hợp lý. Sẽ quay lại lần sau.",
              created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
            },
          ],
        });
      }, 800);
    });
  }

  async createTourReview(tourId, reviewData) {
    // Mock implementation for creating a review
    // In a real implementation, this would call this.post(`/tours/${tourId}/reviews`, reviewData)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            id: Math.floor(Math.random() * 1000) + 100,
            tour_id: tourId,
            ...reviewData,
            created_at: new Date().toISOString(),
            user: this.getCurrentUser() || {
              full_name: "Người dùng",
              avatar_url: null,
            },
          },
          message: "Đánh giá của bạn đã được gửi thành công!",
        });
      }, 1000);
    });
  }

  // Bookings methods
  async createBooking(bookingData) {
    return this.post("/bookings", bookingData);
  }

  async getSellerBookings() {
    return this.get("/bookings/mine");
  }

  async getSellerStats() {
    return this.get("/seller/stats");
  }

  async getRevenueStats(period = "month", startDate = null, endDate = null) {
    let url = `/seller/revenue-stats?period=${period}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return this.get(url);
  }

  async exportRevenue(
    period = "month",
    startDate = null,
    endDate = null,
    format = "excel"
  ) {
    let url = `/seller/export/revenue?period=${period}&format=${format}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return this.download(url);
  }

  async exportBookings(startDate = null, endDate = null, format = "excel") {
    let url = `/seller/export/bookings?format=${format}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return this.download(url);
  }

  async assignAllTours() {
    return this.post("/seller/assign-all-tours");
  }

  async getBooking(bookingId) {
    return this.get(`/bookings/${bookingId}`);
  }

  async updateBooking(bookingId, data) {
    return this.request(`/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async sendPaymentReminder(bookingId) {
    return this.post(`/bookings/send-payment-reminder/${bookingId}`);
  }

  // Comments methods
  async getComments(postId) {
    return this.get(`/posts/${postId}/comments`);
  }

  async addComment(postId, commentData) {
    return this.post(`/posts/${postId}/comments`, commentData);
  }

  // Likes methods
  async likePost(postId) {
    return this.post(`/posts/${postId}/like`);
  }

  async unlikePost(postId) {
    return this.delete(`/posts/${postId}/like`);
  }

  // Profile methods
  async getProfile(userId) {
    return this.get(`/users/${userId}`);
  }

  async getCurrentProfile() {
    // Get current user's full profile with sensitive info (company info for sellers)
    return this.get("/auth/profile");
  }

  async updateProfile(profileData) {
    return this.put("/auth/profile", profileData);
  }

  // Upload methods
  async uploadImage(file, type = "post") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const token = this.getToken();
    const config = {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    };

    try {
      // Use fetchWithTimeout for uploads with longer timeout (30 seconds)
      const response = await fetchWithTimeout(
        `${this.baseURL}/upload/image`,
        config,
        30000
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      return { success: true, data };
    } catch (error) {
      if (error instanceof TypeError || error.name === "AbortError") {
        return {
          success: false,
          error:
            "Upload timeout: Vui lòng thử lại với file nhỏ hơn hoặc kiểm tra kết nối mạng.",
        };
      }
      return { success: false, error: error.message };
    }
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = this.getToken();
    const config = {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    };

    try {
      const response = await fetchWithTimeout(
        `${this.baseURL}/upload/avatar`,
        config,
        30000
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      return { success: true, data };
    } catch (error) {
      if (error instanceof TypeError || error.name === "AbortError") {
        return {
          success: false,
          error:
            "Upload timeout: Vui lòng thử lại với file nhỏ hơn hoặc kiểm tra kết nối mạng.",
        };
      }
      return { success: false, error: error.message };
    }
  }

  async uploadCover(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = this.getToken();
    const config = {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    };

    try {
      const response = await fetchWithTimeout(
        `${this.baseURL}/upload/cover`,
        config,
        30000
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      return { success: true, data };
    } catch (error) {
      if (error instanceof TypeError || error.name === "AbortError") {
        return {
          success: false,
          error:
            "Upload timeout: Vui lòng thử lại với file nhỏ hơn hoặc kiểm tra kết nối mạng.",
        };
      }
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // ADMIN API METHODS
  // ============================================================================

  // Admin Dashboard Stats
  async getAdminStats() {
    return this.get("/admin/stats/overview");
  }

  async getRecentActivity(limit = 20) {
    return this.get("/admin/activity/recent", { limit });
  }

  // Admin User Management
  async getAdminUsers(params = {}) {
    return this.get("/admin/users", params);
  }

  async getAdminUser(userId) {
    return this.get(`/admin/users/${userId}`);
  }

  async updateAdminUser(userId, userData) {
    return this.put(`/admin/users/${userId}`, userData);
  }

  async deleteAdminUser(userId) {
    return this.delete(`/admin/users/${userId}`);
  }

  async banUser(userId) {
    return this.post(`/admin/users/${userId}/ban`);
  }

  async unbanUser(userId) {
    return this.post(`/admin/users/${userId}/unban`);
  }

  // Admin Content Management
  async getAdminPosts(params = {}) {
    return this.get("/admin/posts", params);
  }

  async updateAdminPost(postId, postData) {
    return this.put(`/admin/posts/${postId}`, postData);
  }

  async deleteAdminPost(postId) {
    return this.delete(`/admin/posts/${postId}`);
  }

  // Admin Comments Management
  async getAdminComments(params = {}) {
    return this.get("/admin/comments", params);
  }

  async deleteAdminComment(commentId) {
    return this.delete(`/admin/comments/${commentId}`);
  }

  // Admin Analytics
  async getAdminAnalytics(days = 30) {
    return this.get("/admin/analytics/overview", { days });
  }

  // Admin Settings
  async getAdminSettings() {
    return this.get("/admin/settings");
  }

  async updateAdminSettings(settings) {
    return this.put("/admin/settings", settings);
  }

  // Admin Global Search
  async adminSearch(query) {
    return this.get("/admin/search", { q: query });
  }

  async getDestinationRanking() {
    return this.get("/tours/destinations/ranking");
  }
}

// Create and export API client instance
const apiClient = new ApiClient();

// Export for use in components
export default apiClient;

// Also export the class for custom instances
export { ApiClient };

// Helper function to handle API errors in components
export const handleApiError = (error, defaultMessage = "Đã xảy ra lỗi") => {
  console.error("API Error:", error);

  // Return user-friendly error messages
  if (error.includes("Token has expired")) {
    apiClient.clearAuth();
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error.includes("Authorization token is required")) {
    return "Bạn cần đăng nhập để thực hiện hành động này.";
  }

  if (error.includes("Network error")) {
    return "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
  }

  return error || defaultMessage;
};

// Hook for checking authentication status
export const useAuth = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const currentUser = apiClient.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const result = await apiClient.login(credentials);
    if (result.success) {
      setUser(result.data.user);
    }
    return result;
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
};
