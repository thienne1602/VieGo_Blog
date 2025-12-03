"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "./api";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "moderator" | "user" | "seller" | "tour_guide";
  status: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  level?: number;
  points?: number;
  created_at?: string;
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

  // Get current port from window.location
  const getCurrentPort = (): string => {
    if (typeof window !== "undefined") {
      const port =
        window.location.port ||
        (window.location.protocol === "https:" ? "443" : "80");
      return port;
    }
    return "3000"; // Default fallback
  };

  // Get storage key with port suffix to ensure isolation between clients
  const getStorageKey = (baseKey: string): string => {
    const port = getCurrentPort();
    return `${baseKey}_${port}`;
  };

  // Helper functions for cookie management with port-specific domain
  const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    // Include port in cookie name to ensure isolation between clients
    const port = getCurrentPort();
    const cookieName = `${name}_${port}`;
    // Set cookie with explicit domain (localhost) but port-specific name
    document.cookie = `${cookieName}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    // Also set cookie without port suffix for middleware compatibility
    // Middleware runs server-side and doesn't know the port, so it checks for "access_token"
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  };

  const getCookie = (name: string): string | null => {
    const port = getCurrentPort();
    const cookieName = `${name}_${port}`;
    const nameEQ = cookieName + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deleteCookie = (name: string) => {
    const port = getCurrentPort();
    const cookieName = `${name}_${port}`;
    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    // Also delete cookie without port suffix for middleware compatibility
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  };

  // Check for existing auth token on mount
  useEffect(() => {
    // Safety timeout: ensure loading never stays true for more than 5 seconds
    let safetyTimeout: NodeJS.Timeout | null = setTimeout(() => {
      console.warn(
        "⚠️ Safety timeout: forcing loading to false after 5 seconds"
      );
      setLoading(false);
      safetyTimeout = null;
    }, 5000);

    const clearSafetyTimeout = () => {
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
        safetyTimeout = null;
      }
    };

    const token =
      getCookie("access_token") ||
      localStorage.getItem(getStorageKey("access_token"));
    console.log(
      "🔑 Token found on mount:",
      token ? "Yes (length: " + token.length + ")" : "No"
    );
    if (token) {
      // Ensure api client knows the token
      try {
        api.setToken(token as any);
      } catch (e) {
        // ignore
      }
      // Try to get user info from localStorage first
      const cachedUser = localStorage.getItem(getStorageKey("user"));
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          // Validate role - only allow supported roles
          const validRoles = [
            "admin",
            "moderator",
            "user",
            "seller",
            "tour_guide",
          ];
          if (userData && validRoles.includes(userData.role)) {
            console.log("✅ Using cached user data:", userData);
            setUser(userData);
            setLoading(false);
            clearSafetyTimeout();
            // Verify token in background - if fails, force re-login
            verifyToken(token, false, clearSafetyTimeout); // Changed to false to clear user on invalid token
            return;
          } else {
            console.warn(
              "⚠️ Invalid role in cached user:",
              userData?.role,
              "- will verify token"
            );
            // Clear invalid cached user
            localStorage.removeItem(getStorageKey("user"));
          }
        } catch (e) {
          console.warn("⚠️ Failed to parse cached user, will verify token");
        }
      }
      // If no cached user, verify token
      verifyToken(token, false, clearSafetyTimeout);
    } else {
      console.log("⚠️ No token found, user not authenticated");
      setLoading(false);
      clearSafetyTimeout();
    }

    // Cleanup safety timeout on unmount
    return () => {
      clearSafetyTimeout();
    };
  }, []);

  // Listen for user update events (from avatar/cover upload, etc.)
  useEffect(() => {
    const handleUserUpdate = (event: CustomEvent) => {
      const updatedUser = event.detail;
      if (updatedUser) {
        console.log("✅ User updated event received, updating context");
        setUser(updatedUser);
        localStorage.setItem(
          getStorageKey("user"),
          JSON.stringify(updatedUser)
        );
      }
    };

    window.addEventListener("userUpdated", handleUserUpdate as EventListener);
    return () => {
      window.removeEventListener(
        "userUpdated",
        handleUserUpdate as EventListener
      );
    };
  }, []);

  const verifyToken = async (
    token: string,
    skipSetUser: boolean = false,
    onComplete?: () => void
  ) => {
    try {
      // Normalize API URL: remove /api suffix if present since we add it in path
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      apiUrl = apiUrl.replace(/\/api$/, "");
      console.log("🔍 Verifying token...");
      console.log(`📤 Sending request to: ${apiUrl}/api/auth/verify-token`);
      console.log(
        "📤 Authorization header: Bearer " + token.substring(0, 20) + "..."
      );

      // Reduce timeout to 3 seconds for faster feedback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${apiUrl}/api/auth/verify-token`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("📥 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Token valid:", data);
        if (data.valid && data.user) {
          // Validate role from backend response
          const validRoles = [
            "admin",
            "moderator",
            "user",
            "seller",
            "tour_guide",
          ];
          if (!validRoles.includes(data.user.role)) {
            console.warn(
              "⚠️ Invalid role from backend:",
              data.user.role,
              "- clearing auth"
            );
            if (!skipSetUser) {
              localStorage.removeItem(getStorageKey("access_token"));
              localStorage.removeItem(getStorageKey("user"));
              deleteCookie("access_token");
              setUser(null);
            }
            return;
          }
          // Only update user if not using cached data
          if (!skipSetUser) {
            setUser(data.user);
            // Update cached user data
            localStorage.setItem(
              getStorageKey("user"),
              JSON.stringify(data.user)
            );
            // Make sure api client uses token for subsequent requests
            try {
              api.setToken(token as any);
            } catch (e) {}
          }
        } else {
          console.warn("⚠️ Token invalid (data.valid=false), removing...");
          if (!skipSetUser) {
            localStorage.removeItem(getStorageKey("access_token"));
            localStorage.removeItem(getStorageKey("user"));
            deleteCookie("access_token");
            setUser(null);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Verify failed:", response.status, errorData);
        // Only clear if token is actually invalid (401) - keep cached user for other errors
        if (!skipSetUser) {
          if (response.status === 401) {
            // Token is invalid/expired - clear everything
            console.warn("⚠️ Token invalid (401), removing...");
            localStorage.removeItem(getStorageKey("access_token"));
            localStorage.removeItem(getStorageKey("user"));
            deleteCookie("access_token");
            setUser(null);
          } else {
            // Other errors (500, 503, etc.) - keep cached user if valid
            const cachedUser = localStorage.getItem(getStorageKey("user"));
            if (cachedUser) {
              try {
                const userData = JSON.parse(cachedUser);
                const validRoles = [
                  "admin",
                  "moderator",
                  "user",
                  "seller",
                  "tour_guide",
                ];
                if (userData && validRoles.includes(userData.role)) {
                  console.warn("⚠️ Backend error but keeping cached user");
                  setUser(userData);
                } else {
                  console.warn("⚠️ Invalid role in cached user, clearing");
                  localStorage.removeItem(getStorageKey("user"));
                  setUser(null);
                }
              } catch (e) {
                setUser(null);
              }
            }
          }
        } else {
          console.warn(
            "⚠️ Background verification failed, keeping cached user"
          );
        }
      }
    } catch (error: any) {
      console.error("❌ Token verification exception:", error);

      // Handle timeout/abort errors - backend may not be running
      if (error.name === "AbortError" || error instanceof TypeError) {
        console.warn(
          "⚠️ Token verification timeout - backend may not be running or is slow"
        );
        // If we have a cached user, keep it when backend is unavailable (if valid)
        if (!skipSetUser) {
          const cachedUser = localStorage.getItem(getStorageKey("user"));
          if (cachedUser) {
            try {
              const userData = JSON.parse(cachedUser);
              const validRoles = [
                "admin",
                "moderator",
                "user",
                "seller",
                "tour_guide",
              ];
              if (userData && validRoles.includes(userData.role)) {
                console.warn("⚠️ Backend unavailable - using cached user data");
                setUser(userData);
                // Keep token and user data, just mark as potentially stale
              } else {
                console.warn("⚠️ Invalid role in cached user, clearing");
                localStorage.removeItem(getStorageKey("user"));
                setUser(null);
              }
            } catch (e) {
              console.warn("⚠️ Failed to parse cached user");
              setUser(null);
            }
          } else {
            console.warn("⚠️ Backend unavailable and no cached user");
            setUser(null);
          }
        }
        // Always set loading to false on timeout
        setLoading(false);
        return;
      }

      // For other errors, clear auth if this is initial verification
      if (!skipSetUser) {
        console.warn("⚠️ Verification error, clearing auth");
        localStorage.removeItem(getStorageKey("access_token"));
        localStorage.removeItem(getStorageKey("user"));
        deleteCookie("access_token");
        setUser(null);
      } else {
        console.warn(
          "⚠️ Background verification exception, keeping cached user"
        );
      }
    } finally {
      // Always set loading to false when verification completes (or fails)
      if (!skipSetUser) {
        setLoading(false);
      }
      // Clear safety timeout when verification completes
      if (onComplete) {
        onComplete();
      }
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      // Normalize API URL: remove /api suffix if present since we add it in path
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      apiUrl = apiUrl.replace(/\/api$/, "");

      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: username, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.access_token) {
        // Validate role before storing
        const validRoles = [
          "admin",
          "moderator",
          "user",
          "seller",
          "tour_guide",
        ];
        if (!data.user || !validRoles.includes(data.user.role)) {
          console.error("❌ Invalid role from login:", data.user?.role);
          return false;
        }

        // CRITICAL: If logging in with a different user, clear old data first
        const previousUser = user;
        if (previousUser && previousUser.id !== data.user.id) {
          console.log(
            `[Auth] User changed from ${previousUser.id} to ${data.user.id}, clearing old data`
          );
          // Clear old user's data (conversations, notifications, etc.)
          // Note: State will be cleared by hooks when user.id changes
        }

        // Store token in both localStorage and cookie (with port-specific keys)
        const storageKey = getStorageKey("access_token");
        localStorage.setItem(storageKey, data.access_token);
        setCookie("access_token", data.access_token, 7);

        // Cache user data to avoid verification delay
        const userStorageKey = getStorageKey("user");
        localStorage.setItem(userStorageKey, JSON.stringify(data.user));

        // Set user immediately (this will trigger hooks to clear old state)
        setUser(data.user);

        // Inform API client about token
        try {
          api.setToken(data.access_token);
        } catch (e) {}

        // Verify token was stored correctly
        const storedToken = localStorage.getItem(storageKey);
        const storedUser = localStorage.getItem(userStorageKey);
        console.log("✅ Login successful:", data.user);
        console.log("✅ Token stored in:", storageKey);
        console.log(
          "✅ Token verification:",
          storedToken ? `Found (${storedToken.length} chars)` : "NOT FOUND"
        );
        console.log("✅ User stored in:", userStorageKey);
        console.log(
          "✅ User verification:",
          storedUser ? "Found" : "NOT FOUND"
        );

        return true;
      } else {
        console.error("❌ Login failed:", data.error || data.message);
        return false;
      }
    } catch (error: any) {
      console.error("❌ Login error:", error);

      // Handle timeout errors
      if (error.name === "AbortError" || error instanceof TypeError) {
        console.error("❌ Login timeout - backend may not be running");
      }

      return false;
    }
  };

  const logout = () => {
    // Clear user data first
    localStorage.removeItem(getStorageKey("access_token"));
    localStorage.removeItem(getStorageKey("user"));
    deleteCookie("access_token");
    setUser(null);

    // Clear api client auth
    try {
      api.clearAuth();
    } catch (e) {}

    // Use setTimeout to ensure state updates before redirect
    setTimeout(() => {
      window.location.href = "/goodbye";
    }, 100);
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
