/**
 * Authentication Utilities for Admin Dashboard
 * Handles token management and error handling
 */

export const authUtils = {
  /**
   * Get access token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem("access_token");
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      return !this.isTokenExpired(payload);
    } catch {
      return false;
    }
  },

  /**
   * Decode JWT token
   */
  decodeToken(token: string): any {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token format");

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(payload: any): boolean {
    if (!payload.exp) return false;
    const now = Date.now() / 1000;
    return payload.exp < now;
  },

  /**
   * Get user data from localStorage
   */
  getUser(): any | null {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if user has admin access
   */
  isAdmin(): boolean {
    const user = this.getUser();
    return user && (user.role === "admin" || user.role === "moderator");
  },

  /**
   * Migrate old token to new key (backward compatibility)
   */
  migrateOldToken(): void {
    const oldToken = localStorage.getItem("viego_token");
    const newToken = localStorage.getItem("access_token");

    if (oldToken && !newToken) {
      console.log("Migrating token from viego_token to access_token");
      localStorage.setItem("access_token", oldToken);
      localStorage.removeItem("viego_token");
    }
  },

  /**
   * Clear all auth data
   */
  clearAuth(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("viego_token"); // Remove old token too
    localStorage.removeItem("user");
    sessionStorage.clear();
  },

  /**
   * Handle authentication errors
   */
  handleAuthError(status: number, redirectToLogin: () => void): void {
    if (status === 401) {
      console.error("Authentication failed - token expired or invalid");
      this.clearAuth();
      redirectToLogin();
    } else if (status === 403) {
      console.error("Access forbidden - admin role required");
      alert(
        "Bạn không có quyền truy cập Admin Dashboard. Vui lòng đăng nhập với tài khoản admin."
      );
      redirectToLogin();
    }
  },

  /**
   * Make authenticated API request
   */
  async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    return fetch(url, { ...options, headers });
  },

  /**
   * Validate and get admin stats with error handling
   */
  async getAdminStats(): Promise<any> {
    try {
      const response = await this.fetchWithAuth(
        "http://localhost:5000/api/admin/stats/overview"
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("AUTH_ERROR");
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      throw error;
    }
  },

  /**
   * Debug authentication status
   */
  debugAuth(): void {
    console.group("🔐 Authentication Debug");

    const token = this.getToken();
    const user = this.getUser();

    console.log("Token exists:", !!token);
    console.log("Is authenticated:", this.isAuthenticated());
    console.log("Is admin:", this.isAdmin());

    if (token) {
      try {
        const payload = this.decodeToken(token);
        console.log("Token payload:", {
          userId: payload.sub || payload.identity,
          exp: payload.exp
            ? new Date(payload.exp * 1000).toLocaleString()
            : "N/A",
          isExpired: this.isTokenExpired(payload),
        });
      } catch (e) {
        console.error("Failed to decode token:", e);
      }
    }

    if (user) {
      console.log("User:", {
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
      });
    }

    console.groupEnd();
  },
};

export default authUtils;
