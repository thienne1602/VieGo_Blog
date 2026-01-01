"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useChat } from "@/hooks/useChat";
import ThemeToggle from "@/components/common/ThemeToggle";
import HeaderWeatherWidget from "@/components/common/HeaderWeatherWidget";
import LanguageSelector from "@/components/common/LanguageSelector";
import BackgroundMusic from "@/components/common/BackgroundMusic";
import {
  Search,
  UserPlus,
  MessageCircle,
  UserCheck,
  User,
  X,
  Check,
} from "lucide-react";
import api from "@/lib/api";
import NotificationDetailModal from "@/components/common/NotificationDetailModal";
import LoginRequestPopup from "@/components/common/LoginRequestPopup";

const Header = () => {
  const { t } = useTranslation("common");
  const [searchValue, setSearchValue] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<
    Record<number, boolean>
  >({});
  const [friendshipStatus, setFriendshipStatus] = useState<
    Record<
      number,
      {
        is_friend: boolean;
        request_status: string | null;
        request_id: number | null;
      }
    >
  >({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(
    null
  );
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [selectedNavIndex, setSelectedNavIndex] = useState<number | null>(null);
  const [hoveredNavIndex, setHoveredNavIndex] = useState<number | null>(null);
  const navRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Set initial selected nav based on current pathname
  useEffect(() => {
    const navItems = [
      "/",
      "/tours",
      ...(user ? ["/tour-journey"] : []),
      "/contact",
    ];
    const index = navItems.findIndex((href) => href === pathname);
    if (index !== -1) {
      setSelectedNavIndex(index);
    }
  }, [pathname, user]);

  // Load search history from localStorage
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(`search_history_${user.id}`);
        if (saved) {
          const history = JSON.parse(saved);
          setSearchHistory(Array.isArray(history) ? history : []);
        }
      } catch (e) {
        console.error("Error loading search history:", e);
      }
    }
  }, [user]);

  // Save search to history
  const saveToHistory = (query: string) => {
    if (!user || !query.trim()) return;

    try {
      const trimmed = query.trim();
      const updated = [
        trimmed,
        ...searchHistory.filter((h) => h !== trimmed),
      ].slice(0, 10); // Keep last 10
      setSearchHistory(updated);
      localStorage.setItem(
        `search_history_${user.id}`,
        JSON.stringify(updated)
      );
    } catch (e) {
      console.error("Error saving search history:", e);
    }
  };

  // Clear search history
  const clearSearchHistory = () => {
    if (!user) return;
    setSearchHistory([]);
    localStorage.removeItem(`search_history_${user.id}`);
  };

  // Remove single item from history
  const removeFromHistory = (query: string) => {
    if (!user) return;
    const updated = searchHistory.filter((h) => h !== query);
    setSearchHistory(updated);
    localStorage.setItem(`search_history_${user.id}`, JSON.stringify(updated));
  };

  // Use real hooks for notifications and chat
  const {
    notifications: realNotifications,
    unreadCount: unreadNotificationsCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    fetchNotifications: fetchNotificationsList,
    deleteNotification,
  } = useNotifications();

  const {
    conversations,
    unreadCount: unreadMessagesCount,
    fetchConversations,
  } = useChat();

  // Calculate unread count excluding message notifications
  const nonMessageUnreadCount = realNotifications.filter(
    (notif) => notif.type !== "message" && !notif.is_read
  ).length;

  // Handle click outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSearchSuggestions &&
        searchContainerRef.current &&
        searchDropdownRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSearchSuggestions(false);
      }
    };

    if (showSearchSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchSuggestions]);

  // Show search history when clicking on search input (even if empty)
  const handleSearchFocus = () => {
    setShowSearchSuggestions(true);
  };

  // Search users function
  const searchUsers = async (query: string) => {
    if (!query.trim() || !user) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get("/users", {
        search: query.trim(),
        per_page: 10,
      });

      if (response.success && response.data?.data) {
        // Filter out current user
        const filteredResults = response.data.data.filter(
          (u: any) => u.id !== user.id
        );
        setSearchResults(filteredResults);

        // Check following and friendship status for each user
        const statusPromises = filteredResults.map(async (u: any) => {
          try {
            const [followResponse, friendshipResponse] = await Promise.all([
              api.get(`/social/check-follow/${u.id}`),
              api.get(`/social/friends/check/${u.id}`),
            ]);
            return {
              id: u.id,
              isFollowing:
                followResponse.success && followResponse.data?.is_following,
              friendship: friendshipResponse.success
                ? friendshipResponse.data
                : { is_friend: false, request_status: null, request_id: null },
            };
          } catch {
            return {
              id: u.id,
              isFollowing: false,
              friendship: {
                is_friend: false,
                request_status: null,
                request_id: null,
              },
            };
          }
        });

        const statuses = await Promise.all(statusPromises);
        const followStatusMap: Record<number, boolean> = {};
        const friendStatusMap: Record<
          number,
          {
            is_friend: boolean;
            request_status: string | null;
            request_id: number | null;
          }
        > = {};
        statuses.forEach(({ id, isFollowing, friendship }) => {
          followStatusMap[id] = isFollowing;
          friendStatusMap[id] = friendship;
        });
        setFollowingStatus(followStatusMap);
        setFriendshipStatus(friendStatusMap);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchValue.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchValue);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, user]);

  // Handle follow/unfollow
  const handleFollow = async (targetUserId: number) => {
    if (!user) return;

    const isFollowing = followingStatus[targetUserId];

    try {
      const endpoint = `/social/${
        isFollowing ? "unfollow" : "follow"
      }/${targetUserId}`;
      const response = await api.post(endpoint);

      if (response.success) {
        setFollowingStatus((prev) => ({
          ...prev,
          [targetUserId]: !isFollowing,
        }));
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  // Handle friend request
  const handleFriendRequest = async (targetUserId: number) => {
    if (!user) return;

    const friendship = friendshipStatus[targetUserId];

    try {
      if (friendship?.is_friend) {
        // Already friends, do nothing or show message
        return;
      } else if (friendship?.request_status === "sent") {
        // Cancel request
        if (friendship.request_id) {
          const response = await api.post(
            `/social/friends/cancel/${friendship.request_id}`
          );
          if (response.success) {
            // Clear cache after successful cancel
            api.clearCacheFor(`/social/friends/check/${targetUserId}`);
            setFriendshipStatus((prev) => ({
              ...prev,
              [targetUserId]: {
                is_friend: false,
                request_status: null,
                request_id: null,
              },
            }));
          }
        }
      } else if (friendship?.request_status === "received") {
        // Accept request - use safer endpoint that accepts by target_user_id
        try {
          // Clear cache for friendship check before accepting
          api.clearCacheFor(`/social/friends/check/${targetUserId}`);

          // Use the safer endpoint that finds the request automatically
          const response = await api.post(
            `/social/friends/accept-by-user/${targetUserId}`
          );
          if (response.success) {
            // Clear cache after successful accept
            api.clearCacheFor(`/social/friends/check/${targetUserId}`);
            setFriendshipStatus((prev) => ({
              ...prev,
              [targetUserId]: {
                is_friend: true,
                request_status: null,
                request_id: null,
              },
            }));
          } else {
            // If accept fails, refresh status
            const errorMsg =
              response.error ||
              response.data?.error ||
              t("header.acceptFriendError");
            alert(errorMsg || t("header.acceptFriendError"));
            // Refresh status to get correct state
            const refreshResponse = await api.get(
              `/social/friends/check/${targetUserId}`,
              {},
              { bypassCache: true }
            );
            if (refreshResponse.success) {
              setFriendshipStatus((prev) => ({
                ...prev,
                [targetUserId]: refreshResponse.data,
              }));
            }
          }
        } catch (acceptError: any) {
          console.error("Error accepting friend request:", acceptError);
          const errorMsg =
            acceptError.response?.data?.error ||
            acceptError.error ||
            t("header.acceptFriendError");
          alert(errorMsg);
          // Refresh status on error
          try {
            const refreshResponse = await api.get(
              `/social/friends/check/${targetUserId}`,
              {},
              { bypassCache: true }
            );
            if (refreshResponse.success) {
              setFriendshipStatus((prev) => ({
                ...prev,
                [targetUserId]: refreshResponse.data,
              }));
            }
          } catch (e) {
            console.error("Error refreshing friendship status:", e);
          }
        }
      } else {
        // Send new request - refresh status first to avoid duplicate requests
        try {
          // Clear cache and refresh status before sending
          api.clearCacheFor(`/social/friends/check/${targetUserId}`);
          const checkResponse = await api.get(
            `/social/friends/check/${targetUserId}`,
            {},
            { bypassCache: true }
          );

          if (checkResponse.success) {
            const latestFriendship = checkResponse.data;

            // Check if already friends or has pending request
            if (latestFriendship?.is_friend) {
              setFriendshipStatus((prev) => ({
                ...prev,
                [targetUserId]: latestFriendship,
              }));
              return;
            }

            if (latestFriendship?.request_status === "sent") {
              setFriendshipStatus((prev) => ({
                ...prev,
                [targetUserId]: latestFriendship,
              }));
              alert(t("header.friendRequestAlreadySent"));
              return;
            }

            if (latestFriendship?.request_status === "received") {
              setFriendshipStatus((prev) => ({
                ...prev,
                [targetUserId]: latestFriendship,
              }));
              alert(t("header.friendRequestReceived"));
              return;
            }
          }

          // Now send the request
          const response = await api.post(
            `/social/friends/request/${targetUserId}`
          );
          if (response.success) {
            // Clear cache after sending request
            api.clearCacheFor(`/social/friends/check/${targetUserId}`);
            setFriendshipStatus((prev) => ({
              ...prev,
              [targetUserId]: {
                is_friend: false,
                request_status: "sent",
                request_id: response.data?.friend_request?.id || null,
              },
            }));
          } else {
            // If send fails (e.g., duplicate request), refresh status
            const errorMsg =
              response.error ||
              response.data?.error ||
              t("header.sendFriendError");
            alert(errorMsg || t("header.acceptFriendError"));
            // Refresh status to get correct state
            try {
              const refreshResponse = await api.get(
                `/social/friends/check/${targetUserId}`,
                {},
                { bypassCache: true }
              );
              if (refreshResponse.success) {
                setFriendshipStatus((prev) => ({
                  ...prev,
                  [targetUserId]: refreshResponse.data,
                }));
              }
            } catch (e) {
              console.error("Error refreshing friendship status:", e);
            }
          }
        } catch (refreshError: any) {
          console.error(
            "Error refreshing before sending request:",
            refreshError
          );
          // Try to send anyway, but handle errors
          try {
            const response = await api.post(
              `/social/friends/request/${targetUserId}`
            );
            if (response.success) {
              api.clearCacheFor(`/social/friends/check/${targetUserId}`);
              setFriendshipStatus((prev) => ({
                ...prev,
                [targetUserId]: {
                  is_friend: false,
                  request_status: "sent",
                  request_id: response.data?.friend_request?.id || null,
                },
              }));
            } else {
              const errorMsg =
                response.error ||
                response.data?.error ||
                t("header.sendFriendError");
              alert(errorMsg || t("header.acceptFriendError"));
              // Refresh status
              try {
                const refreshResponse = await api.get(
                  `/social/friends/check/${targetUserId}`,
                  {},
                  { bypassCache: true }
                );
                if (refreshResponse.success) {
                  setFriendshipStatus((prev) => ({
                    ...prev,
                    [targetUserId]: refreshResponse.data,
                  }));
                }
              } catch (e) {
                console.error("Error refreshing friendship status:", e);
              }
            }
          } catch (sendError: any) {
            const errorMsg =
              sendError.response?.data?.error ||
              sendError.error ||
              t("header.sendFriendError");
            alert(errorMsg || t("header.acceptFriendError"));
            // Refresh status on error
            try {
              const refreshResponse = await api.get(
                `/social/friends/check/${targetUserId}`,
                {},
                { bypassCache: true }
              );
              if (refreshResponse.success) {
                setFriendshipStatus((prev) => ({
                  ...prev,
                  [targetUserId]: refreshResponse.data,
                }));
              }
            } catch (e) {
              console.error("Error refreshing friendship status:", e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error handling friend request:", error);
      const errorMsg =
        error.response?.data?.error || error.error || "Có lỗi xảy ra";
      alert(errorMsg);
      // Refresh status on error
      try {
        const refreshResponse = await api.get(
          `/social/friends/check/${targetUserId}`,
          {},
          { bypassCache: true }
        );
        if (refreshResponse.success) {
          setFriendshipStatus((prev) => ({
            ...prev,
            [targetUserId]: refreshResponse.data,
          }));
        }
      } catch (e) {
        console.error("Error refreshing friendship status:", e);
      }
    }
  };

  // Handle create conversation
  const handleStartChat = async (targetUserId: number) => {
    if (!user) return;

    try {
      // Send an initial message to create conversation
      const response = await api.post("/chat/messages", {
        receiver_id: targetUserId,
        message: "👋 Chào bạn!",
        message_type: "text",
      });

      if (response.success) {
        // Navigate to messages page
        router.push(`/messages/${targetUserId}`);
        setShowSearchSuggestions(false);
        setSearchValue("");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      // Still navigate even if there's an error
      router.push(`/messages/${targetUserId}`);
      setShowSearchSuggestions(false);
      setSearchValue("");
    }
  };

  const handleSearch = (query?: string) => {
    const searchQuery = query || searchValue.trim();
    if (!searchQuery) return;

    // Save to history
    saveToHistory(searchQuery);

    // Set search value and trigger search
    setSearchValue(searchQuery);
    searchUsers(searchQuery);
    setShowSearchSuggestions(true);
  };

  // Format time ago helper
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("header.justNow");
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} ${t("header.minutesAgo")}`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} ${t("header.hoursAgo")}`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} ${t("header.daysAgo")}`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 604800)} ${t("header.weeksAgo")}`;
    return `${Math.floor(diffInSeconds / 2592000)} ${t("header.monthsAgo")}`;
  };

  const handleNotificationClick = (notification: any) => {
    // Don't navigate if it's a friend request (we have buttons for that)
    if (notification.type === "friend_request") {
      return;
    }

    // Show detail modal for moderator notifications and violation warnings
    const isModeratorNotification =
      notification.actor?.role === "moderator" ||
      notification.actor?.role === "admin" ||
      notification.type === "violation_warning" ||
      [
        "account_banned",
        "post_banned",
        "comment_banned",
        "account_unbanned",
        "post_unbanned",
        "comment_unbanned",
        "warning",
        "info",
      ].includes(notification.type);

    if (isModeratorNotification) {
      setSelectedNotification(notification);
      setShowNotificationModal(true);
      setShowNotifications(false);
      return;
    }

    if (!notification.is_read) {
      markNotificationAsRead(notification.id);
    }

    // Handle different notification types
    if (notification.type === "message" && notification.actor?.id) {
      // Navigate to messages page
      router.push(`/messages/${notification.actor.id}`);
      setShowNotifications(false);
    } else if (
      notification.type === "friend_request_accepted" &&
      notification.actor?.id
    ) {
      // Navigate to the profile of the user who accepted the request
      router.push(`/profile/user?id=${notification.actor.id}`);
      setShowNotifications(false);
    } else if (notification.action_url) {
      // For other notifications, use the action_url
      if (notification.action_url.startsWith("/")) {
        router.push(notification.action_url);
      } else {
        window.location.href = notification.action_url;
      }
      setShowNotifications(false);
    } else if (notification.actor?.id) {
      // Fallback: navigate to actor's profile if available
      router.push(`/profile/user?id=${notification.actor.id}`);
      setShowNotifications(false);
    }
  };

  // Handle accept friend request from notification
  const handleAcceptFriendRequest = async (
    notification: any,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }
    if (!user || !notification.actor?.id) return;

    try {
      const response = await api.post(
        `/social/friends/accept-by-user/${notification.actor.id}`
      );
      if (response.success) {
        // Delete notification after accepting
        deleteNotification(notification.id);
        // Refresh notifications
        fetchNotificationsList();
      } else {
        alert(response.error || t("header.acceptFriendError"));
      }
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      alert(
        error.response?.data?.error ||
          error.error ||
          t("header.acceptFriendError")
      );
    }
  };

  // Handle reject friend request from notification
  const handleRejectFriendRequest = async (
    notification: any,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }
    if (!user || !notification.related_id) return;

    try {
      // Get request_id from metadata or related_id
      const requestId =
        notification.metadata?.request_id || notification.related_id;
      const response = await api.post(`/social/friends/reject/${requestId}`);
      if (response.success) {
        // Delete notification after rejecting
        deleteNotification(notification.id);
        // Refresh notifications
        fetchNotificationsList();
      } else {
        alert(response.error || t("header.rejectFriendError"));
      }
    } catch (error: any) {
      console.error("Error rejecting friend request:", error);
      alert(
        error.response?.data?.error ||
          error.error ||
          t("header.rejectFriendError")
      );
    }
  };

  const navItems = [
    {
      name: t("nav.home"),
      href: "/",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      protected: false,
    },
    {
      name: t("nav.tours"),
      href: "/tours",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      protected: false,
    },
    {
      name: t("nav.journey"),
      href: "/tour-journey",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
      protected: true,
    },
    {
      name: t("nav.contact"),
      href: "/contact",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      protected: false,
    },
  ];

  const handleNavClick = (item: any, index: number, e: React.MouseEvent) => {
    if (item.protected && !user) {
      e.preventDefault();
      setShowLoginPopup(true);
      return;
    }
    setSelectedNavIndex(index);
    router.push(item.href);
  };

  return (
    <>
      <motion.header
        className="fixed left-0 right-0 z-30 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300"
        style={{ top: "var(--marquee-height, 0px)" }}
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        <div className="h-full px-3 sm:px-4 lg:px-6 w-full">
          <div className="h-full flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 w-full">
            {/* Logo - Fixed width */}
            <Link
              href="/"
              className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0"
            >
              <motion.div
                className="relative w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <img
                  src="/images/Logo_viego.svg"
                  alt="VieGo Logo"
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">
                  VieGo
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  Travel Vietnam
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center space-x-1 relative">
              {/* Magnifying backdrop - Pill shape covering entire button */}
              {(hoveredNavIndex !== null || selectedNavIndex !== null) && (
                <div
                  className="magnifying-backdrop"
                  style={{
                    position: "absolute",
                    left:
                      hoveredNavIndex !== null &&
                      navRefs.current[hoveredNavIndex]
                        ? `${navRefs.current[hoveredNavIndex]!.offsetLeft}px`
                        : selectedNavIndex !== null &&
                          navRefs.current[selectedNavIndex]
                        ? `${navRefs.current[selectedNavIndex]!.offsetLeft}px`
                        : "0px",
                    top: "0px",
                    width:
                      hoveredNavIndex !== null &&
                      navRefs.current[hoveredNavIndex]
                        ? `${navRefs.current[hoveredNavIndex]!.offsetWidth}px`
                        : selectedNavIndex !== null &&
                          navRefs.current[selectedNavIndex]
                        ? `${navRefs.current[selectedNavIndex]!.offsetWidth}px`
                        : "auto",
                    height: "100%",
                    background:
                      "linear-gradient(135deg, rgba(100, 150, 255, 0.08) 0%, rgba(150, 200, 255, 0.12) 100%)",
                    border: "2px solid",
                    borderColor: "rgba(100, 180, 255, 0.5)",
                    borderRadius: "9999px",
                    transition:
                      "all 1s cubic-bezier(0, 0.0018, 0.0069, 1.0448)",
                    filter: "drop-shadow(0 4px 12px rgba(100, 150, 255, 0.25))",
                    pointerEvents: "none",
                    overflow: "hidden",
                    backdropFilter: "blur(8px) saturate(180%)",
                    WebkitBackdropFilter: "blur(8px) saturate(180%)",
                    zIndex: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(ellipse 120% 80% at 50% 50%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 60%)",
                      mixBlendMode: "overlay",
                    }}
                  />
                </div>
              )}

              {navItems.map((item, index) => (
                <button
                  key={index}
                  ref={(el) => {
                    navRefs.current[index] = el;
                  }}
                  onClick={(e) => handleNavClick(item, index, e)}
                  onMouseEnter={() => setHoveredNavIndex(index)}
                  onMouseLeave={() => setHoveredNavIndex(null)}
                  onFocus={() => setHoveredNavIndex(index)}
                  onBlur={() => setHoveredNavIndex(null)}
                  className={`relative flex items-center space-x-2 px-3 xl:px-4 py-2 rounded-full text-sm xl:text-base font-medium transition-all duration-300 ${
                    selectedNavIndex === index
                      ? "text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  style={{ zIndex: 1 }}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>

            {/* Search Bar - Flexible width */}
            <div ref={searchContainerRef} className="relative flex-1 min-w-0">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={
                    user
                      ? t("header.searchPlaceholder")
                      : t("header.searchPlaceholderGuest")
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pl-9 sm:pl-11 bg-gray-100 dark:bg-gray-800 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={handleSearchFocus}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                </div>
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearchSuggestions && user && (
                  <motion.div
                    ref={searchDropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[400px] overflow-y-auto z-50"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {searchLoading ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        {t("header.loading")}
                      </div>
                    ) : !searchValue.trim() ? (
                      <div className="py-2">
                        {searchHistory.length > 0 ? (
                          <>
                            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                {t("header.searchHistory")}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearSearchHistory();
                                }}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                {t("header.clearAll")}
                              </button>
                            </div>
                            {searchHistory.map((historyItem, idx) => (
                              <div
                                key={idx}
                                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSearch(historyItem);
                                  }}
                                  className="flex items-center space-x-2 flex-1 text-left min-w-0"
                                >
                                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                    {historyItem}
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromHistory(historyItem);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity"
                                  title="Xóa"
                                >
                                  <X className="w-4 h-4 text-gray-400" />
                                </button>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              {t("header.searchFriendsHint")}
                            </p>
                            <p className="text-xs mt-1">
                              {t("header.historyHint")}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((result) => {
                          const isFollowing =
                            followingStatus[result.id] || false;
                          return (
                            <div
                              key={result.id}
                              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 group"
                            >
                              {/* Clickable area for profile */}
                              <Link
                                href={`/profile/user?id=${result.id}`}
                                className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                                onClick={() => setShowSearchSuggestions(false)}
                              >
                                {/* Avatar */}
                                {result.avatar_url ? (
                                  <img
                                    src={result.avatar_url}
                                    alt={result.full_name || result.username}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary-500 dark:bg-primary-400 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                    {(result.full_name ||
                                      result.username ||
                                      "?")[0].toUpperCase()}
                                  </div>
                                )}

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {result.full_name || result.username}
                                  </p>
                                  {result.full_name && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      @{result.username}
                                    </p>
                                  )}
                                </div>
                              </Link>

                              {/* Actions - Not part of the clickable area */}
                              <div
                                className="flex items-center space-x-2 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                {/* View Profile Button */}
                                <Link
                                  href={`/profile/user?id=${result.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Don't close immediately, let navigation happen
                                    setTimeout(
                                      () => setShowSearchSuggestions(false),
                                      100
                                    );
                                  }}
                                >
                                  <motion.button
                                    className="p-1.5 rounded-lg bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title={t("header.viewProfile")}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <User className="w-4 h-4" />
                                  </motion.button>
                                </Link>

                                {/* Friend Request Button */}
                                {(() => {
                                  const friendship =
                                    friendshipStatus[result.id];
                                  const isFriend = friendship?.is_friend;
                                  const requestStatus =
                                    friendship?.request_status;

                                  if (isFriend) {
                                    return (
                                      <motion.button
                                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 dark:bg-green-600 text-white"
                                        title="Đã là bạn bè"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        <UserCheck className="w-3 h-3" />
                                        <span>{t("header.friends")}</span>
                                      </motion.button>
                                    );
                                  } else if (requestStatus === "sent") {
                                    return (
                                      <motion.button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFriendRequest(result.id);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        title={t("header.cancel")}
                                      >
                                        <X className="w-3 h-3" />
                                        <span>{t("header.sent")}</span>
                                      </motion.button>
                                    );
                                  } else if (requestStatus === "received") {
                                    return (
                                      <motion.button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFriendRequest(result.id);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500 dark:bg-primary-400 text-white hover:bg-primary-600 dark:hover:bg-primary-500"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        title={t("header.accept")}
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Chấp nhận</span>
                                      </motion.button>
                                    );
                                  } else {
                                    return (
                                      <motion.button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFriendRequest(result.id);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500 dark:bg-primary-400 text-white hover:bg-primary-600 dark:hover:bg-primary-500"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <UserPlus className="w-3 h-3" />
                                        <span>{t("header.addFriend")}</span>
                                      </motion.button>
                                    );
                                  }
                                })()}

                                {/* Message Button - Only show if friends */}
                                {friendshipStatus[result.id]?.is_friend && (
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartChat(result.id);
                                      setTimeout(
                                        () => setShowSearchSuggestions(false),
                                        100
                                      );
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-lg bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title={t("header.message")}
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : searchValue.trim() ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        {t("header.noUsers")}
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* Language Selector */}
              <LanguageSelector />

              {/* Background Music */}
              <BackgroundMusic />

              {/* Dark Mode Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <motion.button
                className="relative p-2 sm:p-2.5 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 rounded-full transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!user) {
                    setShowLoginPopup(true);
                    return;
                  }
                  const newState = !showNotifications;
                  setShowNotifications(newState);
                  setShowMessages(false);
                  // Refresh notifications when opening dropdown
                  if (newState && user) {
                    fetchNotificationsList();
                  }
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title={t("header.notifications")}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {nonMessageUnreadCount > 0 && (
                  <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                    {nonMessageUnreadCount > 9 ? "9+" : nonMessageUnreadCount}
                  </span>
                )}
              </motion.button>

              {/* Messages */}
              <motion.button
                className="relative p-2 sm:p-2.5 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 rounded-full transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!user) {
                    setShowLoginPopup(true);
                    return;
                  }
                  const newState = !showMessages;
                  setShowMessages(newState);
                  setShowNotifications(false);
                  // Refresh conversations when opening dropdown
                  if (newState && user) {
                    fetchConversations();
                  }
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title={t("header.messages")}
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 bg-green-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                    {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                  </span>
                )}
              </motion.button>

              {/* User Profile/Auth */}
              {user ? (
                <Link href="/profile">
                  <motion.div
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-500 dark:bg-primary-400 rounded-full flex items-center justify-center shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <span className="text-white text-xs sm:text-sm font-bold">
                      {user.full_name?.charAt(0).toUpperCase() ||
                        user.username?.charAt(0).toUpperCase() ||
                        "U"}
                    </span>
                  </motion.div>
                </Link>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link href="/welcome?force=true">
                    <motion.button
                      className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {t("header.login")}
                    </motion.button>
                  </Link>
                  <Link href="/register">
                    <motion.button
                      className="px-3 py-1.5 bg-primary-500 dark:bg-primary-400 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300 text-sm"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      {t("header.register")}
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      showMobileMenu
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </motion.button>

              {/* Weather Widget - Rightmost */}
              <div className="flex-shrink-0 ml-1 sm:ml-2">
                <HeaderWeatherWidget />
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-lg lg:hidden transition-colors duration-300"
            style={{ top: "calc(var(--marquee-height, 0px) + 64px)" }}
          >
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={(e) => {
                    if (item.protected && !user) {
                      e.preventDefault();
                      setShowLoginPopup(true);
                      setShowMobileMenu(false);
                      return;
                    }
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 font-medium transition-all duration-300"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
              {!user && (
                <div className="pt-2 border-t border-gray-200 space-y-2 md:hidden">
                  <Link
                    href="/welcome?force=true"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <button className="w-full px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium text-left rounded-lg hover:bg-primary-50 dark:hover:bg-gray-800 transition-all duration-300">
                      {t("header.login")}
                    </button>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <button className="w-full px-4 py-2.5 bg-primary-500 dark:bg-primary-400 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300">
                      {t("header.register")}
                    </button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed right-4 sm:right-6 z-50 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[500px] overflow-hidden flex flex-col"
            style={{ top: "calc(var(--marquee-height, 0px) + 64px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {!user ? (
              <div className="p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  {t("header.loginToViewNotifications")}
                </div>
                <Link href="/welcome?force=true">
                  <motion.button
                    className="px-4 py-2 bg-primary-500 dark:bg-primary-400 text-white rounded-lg hover:bg-primary-600 dark:hover:bg-primary-500 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNotifications(false)}
                  >
                    Đăng nhập
                  </motion.button>
                </Link>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t("header.notifications")}
                  </h3>
                  {nonMessageUnreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {t("header.markAllRead")}
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1">
                  {realNotifications.filter((notif) => notif.type !== "message")
                    .length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      {t("header.noNotifications")}
                    </div>
                  ) : (
                    (() => {
                      // Filter out duplicate friend requests from same actor
                      const uniqueNotifications = realNotifications.reduce(
                        (acc: any[], current) => {
                          if (
                            current.type === "friend_request" &&
                            current.actor?.id
                          ) {
                            const exists = acc.find(
                              (n) =>
                                n.type === "friend_request" &&
                                n.actor?.id === current.actor?.id
                            );
                            if (!exists) {
                              acc.push(current);
                            }
                          } else {
                            acc.push(current);
                          }
                          return acc;
                        },
                        []
                      );

                      return uniqueNotifications
                        .filter((notif) => notif.type !== "message")
                        .map((notif) => (
                          <motion.div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 ${
                              notif.type === "friend_request"
                                ? ""
                                : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            } transition-colors ${
                              !notif.is_read
                                ? "bg-blue-50 dark:bg-blue-900/20"
                                : ""
                            }`}
                            whileHover={
                              notif.type === "friend_request"
                                ? {}
                                : { backgroundColor: "rgba(0,0,0,0.02)" }
                            }
                          >
                            <div className="flex items-start space-x-3">
                              {notif.actor?.avatar_url ? (
                                <img
                                  src={notif.actor.avatar_url}
                                  alt={
                                    notif.actor.full_name ||
                                    notif.actor.username
                                  }
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                                  {(notif.actor?.full_name ||
                                    notif.actor?.username ||
                                    "?")[0].toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notif.title || notif.message}
                                </p>
                                {notif.message &&
                                  (!notif.title ||
                                    notif.message !== notif.title) && (
                                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap line-clamp-2">
                                      {notif.message}
                                    </p>
                                  )}
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {formatTimeAgo(notif.created_at)}
                                </p>
                                {/* Action buttons for friend requests */}
                                {notif.type === "friend_request" &&
                                  notif.actor?.id && (
                                    <div className="flex items-center space-x-2 mt-2">
                                      <motion.button
                                        onClick={(e) =>
                                          handleAcceptFriendRequest(notif, e)
                                        }
                                        className="px-3 py-1.5 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Check className="w-3 h-3 inline mr-1" />
                                        Chấp nhận
                                      </motion.button>
                                      <motion.button
                                        onClick={(e) =>
                                          handleRejectFriendRequest(notif, e)
                                        }
                                        className="px-3 py-1.5 text-xs font-medium bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <X className="w-3 h-3 inline mr-1" />
                                        Từ chối
                                      </motion.button>
                                    </div>
                                  )}
                              </div>
                              {!notif.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              )}
                            </div>
                          </motion.div>
                        ));
                    })()
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Dropdown */}
      <AnimatePresence>
        {showMessages && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed right-4 sm:right-6 z-50 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[500px] overflow-hidden flex flex-col"
            style={{ top: "calc(var(--marquee-height, 0px) + 64px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {!user ? (
              <div className="p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  {t("header.loginToViewMessages")}
                </div>
                <Link href="/welcome?force=true">
                  <motion.button
                    className="px-4 py-2 bg-primary-500 dark:bg-primary-400 text-white rounded-lg hover:bg-primary-600 dark:hover:bg-primary-500 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMessages(false)}
                  >
                    Đăng nhập
                  </motion.button>
                </Link>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t("header.messages")}
                  </h3>
                  <Link
                    href="/messages"
                    onClick={() => setShowMessages(false)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t("header.viewAll")}
                  </Link>
                </div>
                <div className="overflow-y-auto flex-1">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">{t("header.noConversations")}</p>
                      <p className="text-xs mt-1">
                        {t("header.findFriendsHint")}
                      </p>
                    </div>
                  ) : (
                    conversations
                      .map((conv) => {
                        const isGroup = (conv as any).type === "group";
                        const group = (conv as any).group;
                        const otherUser = (conv as any).other_user;

                        // Skip if neither group nor other_user exists
                        if (!isGroup && !otherUser) {
                          return null;
                        }

                        // Determine URL and display info
                        const href = isGroup
                          ? `/messages/${group?.room_id}?type=group`
                          : `/messages/${otherUser?.id}`;

                        const displayName = isGroup
                          ? group?.name || "Nhóm chat"
                          : otherUser?.full_name ||
                            otherUser?.username ||
                            "Người dùng";

                        const avatarUrl = isGroup
                          ? group?.avatar_url
                          : otherUser?.avatar_url;

                        const avatarInitial = isGroup
                          ? (group?.name || "?")[0].toUpperCase()
                          : (otherUser?.full_name ||
                              otherUser?.username ||
                              "?")[0].toUpperCase();

                        const lastMessageText =
                          conv.last_message?.message || "";
                        const lastMessageSender =
                          isGroup && (conv.last_message as any)?.sender
                            ? `${
                                (conv.last_message as any).sender?.full_name ||
                                (conv.last_message as any).sender?.username ||
                                "Người dùng"
                              }: `
                            : "";

                        return (
                          <Link
                            key={conv.id}
                            href={href}
                            onClick={() => setShowMessages(false)}
                            className="block px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={displayName}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                                  {avatarInitial}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {displayName}
                                  </p>
                                  {conv.last_message && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimeAgo(
                                        conv.last_message.created_at
                                      )}
                                    </p>
                                  )}
                                </div>
                                {conv.last_message && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                                    {lastMessageSender}
                                    {lastMessageText}
                                  </p>
                                )}
                              </div>
                              {conv.unread_count > 0 && (
                                <div className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                  {conv.unread_count > 9
                                    ? "9+"
                                    : conv.unread_count}
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })
                      .filter(Boolean)
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {(showNotifications || showMessages || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowMessages(false);
            setShowUserMenu(false);
          }}
        />
      )}

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false);
          setSelectedNotification(null);
        }}
        onMarkAsRead={markNotificationAsRead}
      />

      <LoginRequestPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
      />

      {/* SVG Filter for magnifying effect */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter
            id="magnify-filter"
            colorInterpolationFilters="linearRGB"
            filterUnits="objectBoundingBox"
            primitiveUnits="userSpaceOnUse"
          >
            <feDisplacementMap
              in="SourceGraphic"
              in2="SourceGraphic"
              scale="8"
              xChannelSelector="A"
              yChannelSelector="A"
              x="0"
              y="0"
              width="100%"
              height="100%"
              result="displacementMap"
            />
          </filter>
        </defs>
      </svg>

      <style jsx global>{`
        .magnifying-backdrop {
          /* Light mode colors */
          --magnify-glow: rgba(255, 255, 255, 0.2);
        }

        @media (prefers-color-scheme: dark) {
          .magnifying-backdrop {
            /* Dark mode colors */
            --magnify-glow: rgba(100, 150, 255, 0.3);
          }
        }
      `}</style>
    </>
  );
};

export default Header;
