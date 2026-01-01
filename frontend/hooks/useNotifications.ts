"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/lib/SocketContext";
import { useAuth } from "@/lib/AuthContext";
import { getAccessToken } from "@/lib/storage-utils";
import { getAPIURL } from "@/lib/apiConfig";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  related_type?: string;
  related_id?: number;
  is_read: boolean;
  is_seen: boolean;
  action_url?: string;
  actor?: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const previousUserIdRef = useRef<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const token = getAccessToken();
      if (!token) {
        console.warn("[Notifications] No token found");
        setLoading(false);
        return;
      }

      const API_BASE_URL = getAPIURL();
      const url = `${API_BASE_URL}/notifications?per_page=20`;
      console.log("[Notifications] Fetching from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("[Notifications] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[Notifications] Received data:", {
          notificationsCount: data.notifications?.length || 0,
          unreadCount: data.unread_count || 0,
          notifications: data.notifications,
        });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } else if (response.status === 401) {
        // Unauthorized - token might be expired
        console.warn("[Notifications] Unauthorized access");
        setNotifications([]);
        setUnreadCount(0);
      } else {
        const errorText = await response.text();
        console.error(
          "[Notifications] Error response:",
          response.status,
          errorText
        );
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("[Notifications] Error fetching notifications:", error);
      // Set empty arrays on error to prevent UI from breaking
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const token = getAccessToken();
      if (!token) {
        console.warn("[Notifications] No token available for unread count");
        return;
      }

      const API_BASE_URL = getAPIURL();
      const response = await fetch(
        `${API_BASE_URL}/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      } else if (response.status === 401) {
        console.warn("[Notifications] Unauthorized - token may be invalid");
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      if (!user) return;

      try {
        const token = getAccessToken();
        if (!token) {
          console.warn("[Notifications] No token available for markAsRead");
          return;
        }
        const API_BASE_URL = getAPIURL();
        const response = await fetch(
          `${API_BASE_URL}/notifications/${notificationId}/read`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === notificationId ? { ...notif, is_read: true } : notif
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [user]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const token = getAccessToken();
      if (!token) {
        console.warn("[Notifications] No token available for markAllAsRead");
        return;
      }
      const API_BASE_URL = getAPIURL();
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user]);

  const deleteNotification = useCallback(
    async (notificationId: number) => {
      if (!user) return;

      try {
        const token = getAccessToken();
        if (!token) {
          console.warn(
            "[Notifications] No token available for deleteNotification"
          );
          return;
        }
        const API_BASE_URL = getAPIURL();
        const response = await fetch(
          `${API_BASE_URL}/notifications/${notificationId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setNotifications((prev) =>
            prev.filter((notif) => notif.id !== notificationId)
          );
          // If it was unread, decrease count
          const notif = notifications.find((n) => n.id === notificationId);
          if (notif && !notif.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [user, notifications]
  );

  // Listen for new notifications via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (data: any) => {
      console.log(
        "[Notifications] New notification received via Socket.IO:",
        data
      );

      // IMPORTANT: Verify this notification is for the current user
      // Backend should only send notifications to the correct user's room, but double-check here
      if (data.user_id && user && data.user_id !== user.id) {
        console.warn(
          `[Notifications] Ignoring notification not for current user. Current user: ${user.id}, Notification user: ${data.user_id}`
        );
        return;
      }

      // Use the unread_count from server if provided, otherwise increment
      if (data.unread_count !== undefined) {
        setUnreadCount(data.unread_count);
      } else {
        setUnreadCount((prev) => prev + 1);
      }

      // If we have the full notification object, add it to the list immediately
      if (data.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
      } else {
        // Otherwise refresh notifications to get the latest list
        fetchNotifications();
      }
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, isConnected, fetchNotifications]);

  // Refresh notifications when Socket.IO connects
  useEffect(() => {
    if (socket && isConnected && user) {
      console.log(
        "[Notifications] Socket.IO connected, refreshing notifications"
      );
      fetchNotifications();
    }
  }, [socket, isConnected, user, fetchNotifications]);

  // Clear state when user changes or logs out
  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;

    // Clear state if user logged out OR if user.id changed (different user logged in)
    if (
      !user ||
      (previousUserId !== null && previousUserId !== currentUserId)
    ) {
      console.log(
        `[Notifications] User changed from ${previousUserId} to ${currentUserId}, clearing state`
      );
      setNotifications([]);
      setUnreadCount(0);
      setLoading(true);
    }

    previousUserIdRef.current = currentUserId;
  }, [user?.id, user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      const token = getAccessToken();
      if (!token) {
        console.warn("[Notifications] No token available, skipping fetch");
        setLoading(false);
        return;
      }

      // Clear state first, then fetch new data
      setNotifications([]);
      setUnreadCount(0);
      setLoading(true);
      fetchNotifications();
      // Refresh unread count periodically
      const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id, fetchNotifications, fetchUnreadCount]); // Use user.id to detect user changes

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
