// API configuration and utilities for VieGo Blog
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// API client with error handling and caching
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
      // Set cookie as well for consistency
      document.cookie = `access_token=${token};path=/;max-age=${
        7 * 24 * 60 * 60
      };SameSite=Strict`;
    }
  }

  // Get authentication token
  getToken() {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  }

  // Clear authentication
  clearAuth() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      // Clear cookie
      document.cookie =
        "access_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
    }
  }

  // Cache management
  getCacheKey(endpoint, options) {
    return `${endpoint}_${JSON.stringify(options?.params || {})}`;
  }

  isValidCache(cacheData) {
    return Date.now() - cacheData.timestamp < this.cacheTimeout;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    return cached && this.isValidCache(cached) ? cached.data : null;
  }

  // Make API request with automatic error handling and caching
  async request(endpoint, options = {}) {
    const cacheKey = this.getCacheKey(endpoint, options);

    // Check cache for GET requests
    if (!options.method || options.method === "GET") {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Cache successful GET requests
      if (!options.method || options.method === "GET") {
        this.setCache(cacheKey, data);
      }

      return { success: true, data: data, response };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);

      // If network error or JSON parse error
      if (error instanceof TypeError) {
        return {
          success: false,
          error:
            "Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối mạng.",
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

  // GET request
  async get(endpoint, params = {}) {
    const queryString = Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";

    return this.request(`${endpoint}${queryString}`, {
      method: "GET",
    });
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
        localStorage.setItem("user", JSON.stringify(result.data.user));
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
      const userStr = localStorage.getItem("user");
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

  // Posts methods
  async getPosts(filters = {}) {
    return this.get("/posts", filters);
  }

  async getPost(slug) {
    return this.get(`/posts/${slug}`);
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

  // Locations methods
  async getLocations(filters = {}) {
    return this.get("/locations", filters);
  }

  async getFeaturedLocations() {
    return this.getLocations({ featured: true, per_page: 10 });
  }

  // Tours methods
  async getTours(filters = {}) {
    return this.get("/tours", filters);
  }

  async getTour(slug) {
    return this.get(`/tours/${slug}`);
  }

  // Bookings methods
  async getSellerBookings() {
    return this.get("/bookings/mine");
  }

  async getSellerStats() {
    return this.get("/seller/stats");
  }

  async updateBooking(bookingId, data) {
    return this.request(`/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
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

  async updateProfile(profileData) {
    return this.put("/auth/profile", profileData);
  }

  // Upload methods
  async uploadImage(file, type = "post") {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", type);

    const token = this.getToken();
    const config = {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    };

    try {
      const response = await fetch(`${this.baseURL}/upload/image`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      return { success: true, data };
    } catch (error) {
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
