"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "moderator" | "user";
  status: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return default values instead of throwing error
    console.warn(
      "useAuth must be used within an AuthProvider. Using default values."
    );
    return {
      user: null,
      isAuthenticated: false,
      login: async () => false,
      logout: () => {},
      loading: false,
    };
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Helper functions for cookie management
  const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  };

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  };

  // Check for existing auth token on mount
  useEffect(() => {
    const token =
      getCookie("access_token") || localStorage.getItem("access_token");
    console.log(
      "🔑 Token found on mount:",
      token ? "Yes (length: " + token.length + ")" : "No"
    );
    if (token) {
      // Try to get user info from localStorage first
      const cachedUser = localStorage.getItem("user");
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          console.log("✅ Using cached user data:", userData);
          setUser(userData);
          setLoading(false);
          // Verify token in background without clearing user if fails
          verifyToken(token, true);
          return;
        } catch (e) {
          console.warn("⚠️ Failed to parse cached user, will verify token");
        }
      }
      // If no cached user, verify token
      verifyToken(token, false);
    } else {
      console.log("⚠️ No token found, user not authenticated");
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string, skipSetUser: boolean = false) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      console.log("🔍 Verifying token...");
      console.log(`📤 Sending request to: ${apiUrl}/api/auth/verify-token`);
      console.log(
        "📤 Authorization header: Bearer " + token.substring(0, 20) + "..."
      );

      const response = await fetch(`${apiUrl}/api/auth/verify-token`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📥 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Token valid:", data);
        if (data.valid && data.user) {
          // Only update user if not using cached data
          if (!skipSetUser) {
            setUser(data.user);
            // Update cached user data
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        } else {
          console.warn("⚠️ Token invalid (data.valid=false), removing...");
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          deleteCookie("access_token");
          setUser(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Verify failed:", response.status, errorData);
        // Only clear if not using cached data (meaning this is initial verification)
        if (!skipSetUser) {
          console.warn("⚠️ Removing invalid token...");
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          deleteCookie("access_token");
          setUser(null);
        } else {
          console.warn(
            "⚠️ Background verification failed, keeping cached user"
          );
        }
      }
    } catch (error) {
      console.error("❌ Token verification exception:", error);
      // Don't clear user if we're doing background verification
      if (!skipSetUser) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        deleteCookie("access_token");
        setUser(null);
      } else {
        console.warn(
          "⚠️ Background verification exception, keeping cached user"
        );
      }
    } finally {
      if (!skipSetUser) {
        setLoading(false);
      }
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: username, password }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        // Store token in both localStorage and cookie
        localStorage.setItem("access_token", data.access_token);
        setCookie("access_token", data.access_token, 7);

        // Cache user data to avoid verification delay
        localStorage.setItem("user", JSON.stringify(data.user));

        // Set user immediately
        setUser(data.user);

        console.log("✅ Login successful:", data.user);
        console.log("✅ Token stored:", data.access_token);

        return true;
      } else {
        console.error("❌ Login failed:", data.error || data.message);
        return false;
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    deleteCookie("access_token");
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
