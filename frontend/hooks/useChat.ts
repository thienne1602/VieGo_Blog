"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/lib/SocketContext";
import { useAuth } from "@/lib/AuthContext";
import { getAccessToken } from "@/lib/storage-utils";

interface ChatMessage {
  id: number;
  message: string;
  message_type: string;
  sender_id: number;
  receiver_id: number;
  sender?: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  created_at: string;
  status: string;
}

interface Conversation {
  id: string;
  type?: "direct" | "group";
  other_user?: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  group?: {
    id: number;
    room_id: string;
    name: string;
    description?: string | null;
    avatar_url?: string | null;
    created_by?: number;
  };
  last_message?: {
    id: number;
    message: string;
    sender_id: number;
    created_at: string;
    status: string;
    message_type?: string;
    sender?: {
      id: number;
      username: string;
      full_name: string;
      avatar_url?: string;
    } | null;
  };
  unread_count: number;
  updated_at?: string;
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const previousUserIdRef = useRef<number | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const token = getAccessToken();
      if (!token) {
        console.warn("[Chat] No token found");
        setLoading(false);
        return;
      }

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const url = `${API_BASE_URL}/chat/conversations`;
      console.log("[Chat] Fetching conversations from:", url);

      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("[Chat] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[Chat] Received data:", {
          conversationsCount: data.conversations?.length || 0,
          conversations: data.conversations,
        });
        setConversations(data.conversations || []);
        // Calculate total unread count
        const totalUnread = (data.conversations || []).reduce(
          (sum: number, conv: Conversation) => sum + (conv.unread_count || 0),
          0
        );
        setUnreadCount(totalUnread);
      } else if (response.status === 401) {
        // Unauthorized - token might be expired
        console.warn("[Chat] Unauthorized access");
        setConversations([]);
        setUnreadCount(0);
      } else {
        const errorText = await response.text();
        console.error("[Chat] Error response:", response.status, errorText);
        setConversations([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("[Chat] Error fetching conversations:", error);
      // Set empty arrays on error to prevent UI from breaking
      setConversations([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const token = getAccessToken();
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_BASE_URL}/chat/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user]);

  const sendMessage = useCallback(
    async (
      receiverId: number,
      message: string,
      messageType: string = "text"
    ) => {
      if (!user) return null;

      // Only send via API - backend will handle Socket.IO emission
      // This prevents duplicate messages from being created
      try {
        const token = getAccessToken();
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_BASE_URL}/chat/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiver_id: receiverId,
            message: message,
            message_type: messageType,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.chat;
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }

      return null;
    },
    [user]
  );

  const getMessages = useCallback(
    async (otherUserId: number, page: number = 1) => {
      if (!user) return { messages: [], total: 0 };

      try {
        const token = getAccessToken();
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const response = await fetch(
          `${API_BASE_URL}/chat/messages/${otherUserId}?page=${page}&per_page=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }

      return { messages: [], total: 0 };
    },
    [user]
  );

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data: ChatMessage) => {
      console.log("[Chat] New message received via Socket.IO:", data);

      // IMPORTANT: Only process messages where current user is the RECEIVER
      // We should NOT process messages where current user is the sender (those are handled by message_sent event)
      if (!user || data.receiver_id !== user.id) {
        console.log(
          `[Chat] Ignoring message - current user is not receiver. Current user: ${user?.id}, Message receiver: ${data.receiver_id}, sender: ${data.sender_id}`
        );
        return;
      }

      // This is a new message FOR the current user
      setConversations((prev) => {
        const updated = [...prev];
        // Use both sender_id and receiver_id to identify the conversation
        const conversationId = `${Math.min(
          data.sender_id,
          data.receiver_id
        )}_${Math.max(data.sender_id, data.receiver_id)}`;
        const index = updated.findIndex((c) => c.id === conversationId);

        if (index >= 0) {
          updated[index].last_message = {
            id: data.id,
            message: data.message,
            sender_id: data.sender_id,
            created_at: data.created_at,
            status: data.status,
            message_type: data.message_type,
          };
          updated[index].updated_at = data.created_at;
          // Increment unread count for new messages
          updated[index].unread_count = (updated[index].unread_count || 0) + 1;
          setUnreadCount((prev) => prev + 1);
        } else {
          // New conversation - fetch conversations to update
          console.log(
            "[Chat] New conversation detected, fetching conversations"
          );
          fetchConversations();
        }
        return updated;
      });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, isConnected, user, fetchConversations]);

  // Refresh conversations when Socket.IO connects
  useEffect(() => {
    if (socket && isConnected && user) {
      console.log("[Chat] Socket.IO connected, refreshing conversations");
      fetchConversations();
    }
  }, [socket, isConnected, user, fetchConversations]);

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
        `[Chat] User changed from ${previousUserId} to ${currentUserId}, clearing state`
      );
      setConversations([]);
      setUnreadCount(0);
      setLoading(true);
    }

    previousUserIdRef.current = currentUserId;
  }, [user?.id, user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      // Clear state first, then fetch new data
      setConversations([]);
      setUnreadCount(0);
      setLoading(true);
      fetchConversations();
      // Refresh unread count periodically
      const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id, fetchConversations, fetchUnreadCount]); // Use user.id to detect user changes

  return {
    conversations,
    unreadCount,
    loading,
    fetchConversations,
    sendMessage,
    getMessages,
  };
}
