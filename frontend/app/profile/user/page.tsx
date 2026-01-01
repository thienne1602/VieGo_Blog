"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Bookmark,
  FileText,
  Users,
  PlusCircle,
  Settings,
  MapPin,
  Calendar,
  Award,
  Star,
  TrendingUp,
  Eye,
  MessageCircle,
  Share2,
  Edit,
  Camera,
  Mail,
  Link as LinkIcon,
  UserPlus,
  UserCheck,
  UserMinus,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import apiClient, { getAPIURL } from "@/lib/api";
import PostCard from "@/components/blog/PostCard";
import { Package } from "lucide-react";
import FriendActionPopup from "@/components/common/FriendActionPopup";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
}

export default function UserProfileNew() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "posts" | "bookmarks" | "likes" | "following"
  >("posts");

  // Reset to posts tab when viewing different user
  useEffect(() => {
    if (viewingUserId && viewingUserId !== user?.id) {
      setActiveTab("posts");
    }
  }, [viewingUserId, user?.id]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<{
    is_friend: boolean;
    request_status: "sent" | "received" | null;
    request_id: number | null;
  } | null>(null);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [sellerTours, setSellerTours] = useState<any[]>([]);
  const [loadingTours, setLoadingTours] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<
    "sent" | "cancelled" | "accepted" | "rejected" | "unfriended"
  >("sent");
  const [popupMessage, setPopupMessage] = useState<string | undefined>(
    undefined
  );

  // Get user ID from query parameter
  useEffect(() => {
    const userIdParam = searchParams.get("id");
    if (userIdParam) {
      const userId = parseInt(userIdParam);
      if (!isNaN(userId)) {
        setViewingUserId(userId);
      }
    }
  }, [searchParams]);

  // Fetch viewing user profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      if (viewingUserId && viewingUserId !== user.id) {
        setLoadingProfile(true);
        try {
          // Always get fresh token from localStorage
          const token = apiClient.getToken();
          const API_BASE_URL = getAPIURL();

          console.log(
            "[Profile] Token check:",
            token ? `Yes (${token.length} chars)` : "No token found"
          );

          // Fetch user info
          const userResponse = await fetch(
            `${API_BASE_URL}/users/${viewingUserId}`,
            {
              headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {},
            }
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            setViewingUser(userData.data || userData);
          }

          // Check friendship status - ALWAYS send token if available
          if (token && user) {
            console.log("[Profile] Checking friendship with token");
            const friendshipResponse = await fetch(
              `${API_BASE_URL}/social/friends/check/${viewingUserId}?t=${Date.now()}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (friendshipResponse.ok) {
              const friendshipData = await friendshipResponse.json();
              console.log("[Profile] Friendship data:", friendshipData);
              setFriendshipStatus({
                is_friend: friendshipData.is_friend || false,
                request_status: friendshipData.request_status || null,
                request_id: friendshipData.request_id || null,
              });
            } else if (friendshipResponse.status === 401) {
              console.warn("[Profile] Unauthorized - token may be invalid");
            }
          } else {
            console.warn("[Profile] No token or user for friendship check", {
              hasToken: !!token,
              hasUser: !!user,
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setViewingUser(null);
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user, viewingUserId]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/welcome");
    }
  }, [user, loading, router]);

  // Refresh friendship status from server
  const refreshFriendshipStatus = async () => {
    if (!user || !viewingUserId || viewingUserId === user.id) return;

    try {
      const token = apiClient.getToken();
      if (!token) {
        console.warn(
          "[Profile] No token available for refreshing friendship status"
        );
        return;
      }

      const API_BASE_URL = getAPIURL();

      const response = await fetch(
        `${API_BASE_URL}/social/friends/check/${viewingUserId}?t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFriendshipStatus({
          is_friend: data.is_friend || false,
          request_status: data.request_status || null,
          request_id: data.request_id || null,
        });
      }
    } catch (error) {
      console.error("Error refreshing friendship status:", error);
    }
  };

  // Handle reject friend request
  const handleRejectFriendRequest = async () => {
    if (!user || !friendshipStatus?.request_id) return;
    if (friendRequestLoading) return;

    setFriendRequestLoading(true);
    try {
      const token = apiClient.getToken();
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        return;
      }

      const API_BASE_URL = getAPIURL();

      const response = await fetch(
        `${API_BASE_URL}/social/friends/reject/${friendshipStatus.request_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (response.ok && data.success) {
        await refreshFriendshipStatus();
        setPopupType("rejected");
        setPopupMessage("Đã từ chối lời mời kết bạn");
        setShowPopup(true);
      } else {
        alert(data.error || "Có lỗi xảy ra khi từ chối lời mời");
      }
    } catch (error: any) {
      console.error("Error rejecting friend request:", error);
      alert("Có lỗi xảy ra: " + (error.message || "Unknown error"));
    } finally {
      setFriendRequestLoading(false);
    }
  };

  // Handle friend request
  const handleFriendRequest = async () => {
    console.log("handleFriendRequest called", {
      user: user?.id,
      viewingUserId,
      friendshipStatus,
    });

    if (!user || !viewingUserId || viewingUserId === user.id) {
      console.log("Early return:", {
        hasUser: !!user,
        viewingUserId,
        isOwnProfile: viewingUserId === user?.id,
      });
      return;
    }

    if (friendRequestLoading) {
      console.log("Already processing, skipping");
      return;
    }

    setFriendRequestLoading(true);

    try {
      const token = apiClient.getToken();
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        return;
      }

      const API_BASE_URL = getAPIURL();

      if (friendshipStatus?.is_friend) {
        // Unfriend - remove friend
        console.log("Unfriending user", viewingUserId);
        const response = await fetch(
          `${API_BASE_URL}/social/friends/remove/${viewingUserId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        console.log("Unfriend response:", { ok: response.ok, data });
        if (response.ok && data.success) {
          // Refresh status after unfriend
          await refreshFriendshipStatus();
          setPopupType("unfriended");
          setPopupMessage("Đã hủy kết bạn thành công");
          setShowPopup(true);
        } else {
          alert(data.error || "Có lỗi xảy ra khi hủy kết bạn");
        }
      } else if (friendshipStatus?.request_status === "sent") {
        // Cancel request
        console.log("Canceling request", friendshipStatus.request_id);
        if (friendshipStatus.request_id) {
          const response = await fetch(
            `${API_BASE_URL}/social/friends/cancel/${friendshipStatus.request_id}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await response.json();
          console.log("Cancel response:", { ok: response.ok, data });
          if (response.ok && data.success) {
            // Refresh status after cancel
            await refreshFriendshipStatus();
            setPopupType("cancelled");
            setPopupMessage("Đã hủy lời mời kết bạn thành công");
            setShowPopup(true);
          } else {
            alert(data.error || "Có lỗi xảy ra khi hủy lời mời");
          }
        }
      } else if (friendshipStatus?.request_status === "received") {
        // Accept request
        console.log("Accepting request", friendshipStatus.request_id);
        if (friendshipStatus.request_id) {
          const response = await fetch(
            `${API_BASE_URL}/social/friends/accept/${friendshipStatus.request_id}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await response.json();
          console.log("Accept response:", { ok: response.ok, data });
          if (response.ok && data.success) {
            // Refresh status after accept
            await refreshFriendshipStatus();
            setPopupType("accepted");
            setPopupMessage("Đã là bạn bè");
            setShowPopup(true);
          } else {
            alert(data.error || "Có lỗi xảy ra khi chấp nhận lời mời");
          }
        }
      } else {
        // Send new request
        console.log("Sending new request to user", viewingUserId);
        const response = await fetch(
          `${API_BASE_URL}/social/friends/request/${viewingUserId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        console.log("Send request response:", { ok: response.ok, data });
        if (response.ok && data.success) {
          // Refresh status after sending
          await refreshFriendshipStatus();
          setPopupType("sent");
          setPopupMessage(
            "Đã gửi lời mời kết bạn thành công và đợi người kia phản hồi nhé"
          );
          setShowPopup(true);
        } else {
          alert(data.error || "Có lỗi xảy ra khi gửi lời mời");
        }
      }
    } catch (error: any) {
      console.error("Error handling friend request:", error);
      alert("Có lỗi xảy ra: " + (error.message || "Unknown error"));
    } finally {
      setFriendRequestLoading(false);
    }
  };

  // Fetch data when user is loaded OR when tab changes
  useEffect(() => {
    const fetchTabData = async () => {
      if (!user) return;

      const targetUserId =
        viewingUserId && viewingUserId !== user.id ? viewingUserId : user.id;
      const isViewingOthers = viewingUserId && viewingUserId !== user.id;

      setLoadingData(true);
      const token = apiClient.getToken();
      const API_BASE_URL = getAPIURL();

      try {
        if (activeTab === "posts") {
          const response = await fetch(
            `${API_BASE_URL}/posts?author_id=${targetUserId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.ok) {
            const data = await response.json();
            // Map posts with is_liked and is_bookmarked from API
            const postsWithStatus = (data.posts || []).map((post: any) => ({
              ...post,
              is_liked: post.is_liked || false,
              is_bookmarked: post.is_bookmarked || false,
            }));
            setMyPosts(postsWithStatus);
          } else {
            console.error("Failed to fetch posts:", response.status);
          }
        } else if (activeTab === "bookmarks") {
          // Only show bookmarks for own profile
          if (isViewingOthers) {
            setBookmarks([]);
          } else {
            const response = await fetch(`${API_BASE_URL}/social/bookmarks`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              const data = await response.json();
              setBookmarks(data.bookmarks || []);
            } else {
              console.error("Failed to fetch bookmarks:", response.status);
            }
          }
        } else if (activeTab === "likes") {
          // Only show likes for own profile
          if (isViewingOthers) {
            setLikedPosts([]);
          } else {
            const response = await fetch(`${API_BASE_URL}/social/liked-posts`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              const data = await response.json();
              setLikedPosts(data.liked_posts || []);
            } else {
              console.error("Failed to fetch liked posts:", response.status);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user && !loadingProfile) {
      fetchTabData();
    }
  }, [user, activeTab, viewingUserId, loadingProfile]);

  // Listen for posts update event to refresh posts list
  useEffect(() => {
    const handlePostsUpdated = () => {
      const postsUpdated = localStorage.getItem("posts_updated");
      if (postsUpdated && activeTab === "posts" && user) {
        localStorage.removeItem("posts_updated");
        // Refetch posts
        const targetUserId =
          viewingUserId && viewingUserId !== user.id ? viewingUserId : user.id;
        const token = apiClient.getToken();
        const API_BASE_URL = getAPIURL();

        fetch(`${API_BASE_URL}/posts?author_id=${targetUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((response) => response.json())
          .then((data) => {
            const postsWithStatus = (data.posts || []).map((post: any) => ({
              ...post,
              is_liked: post.is_liked || false,
              is_bookmarked: post.is_bookmarked || false,
            }));
            setMyPosts(postsWithStatus);
          })
          .catch((error) => console.error("Error refetching posts:", error));
      }
    };

    // Handle custom event
    const handlePostsUpdatedEvent = () => {
      handlePostsUpdated();
    };

    // Check on focus/visibility change
    document.addEventListener("visibilitychange", handlePostsUpdated);
    window.addEventListener("focus", handlePostsUpdated);
    window.addEventListener("postsUpdated", handlePostsUpdatedEvent);
    window.addEventListener("storage", handlePostsUpdated);

    return () => {
      document.removeEventListener("visibilitychange", handlePostsUpdated);
      window.removeEventListener("focus", handlePostsUpdated);
      window.removeEventListener("postsUpdated", handlePostsUpdatedEvent);
      window.removeEventListener("storage", handlePostsUpdated);
    };
  }, [user, activeTab, viewingUserId]);

  // Fetch seller tours if viewing a seller profile
  useEffect(() => {
    const fetchSellerTours = async () => {
      if (!viewingUserId || !viewingUser) return;

      // Check if user is a seller
      if (viewingUser.role === "seller" || viewingUser.role === "admin") {
        setLoadingTours(true);
        try {
          const token = apiClient.getToken();
          const API_BASE_URL = getAPIURL();
          const response = await fetch(
            `${API_BASE_URL}/tours/seller/${viewingUserId}`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            setSellerTours(data.tours || []);
          }
        } catch (error) {
          console.error("Error fetching seller tours:", error);
        } finally {
          setLoadingTours(false);
        }
      }
    };

    if (
      viewingUser &&
      (viewingUser.role === "seller" || viewingUser.role === "admin")
    ) {
      fetchSellerTours();
    }
  }, [viewingUserId, viewingUser]);

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 dark:border-t-primary-400"></div>
      </div>
    );
  }

  if (!user) return null;

  // Determine which user to display
  const displayUser = viewingUser || user;
  const isOwnProfile = !viewingUserId || viewingUserId === user.id;

  const currentPosts =
    activeTab === "posts"
      ? myPosts
      : activeTab === "bookmarks"
      ? bookmarks
      : activeTab === "likes"
      ? likedPosts
      : [];

  const totalStats = {
    posts: myPosts.length,
    bookmarks: bookmarks.length,
    likes: likedPosts.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Hero Section với Cover & Avatar - Modern Design */}
      <div className="relative">
        {/* Cover Background - Enhanced Gradient */}
        <div className="relative h-72 md:h-80 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 dark:from-primary-700 dark:via-primary-800 dark:to-purple-800">
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                backgroundImage:
                  "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
                backgroundSize: "60px 60px",
              }}
            />
            {/* Animated gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          </div>

          {/* Cover Image */}
          {displayUser.cover_image_url && (
            <img
              src={
                displayUser.cover_image_url.startsWith("http")
                  ? displayUser.cover_image_url
                  : `${
                      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
                      getBaseURL()
                    }${displayUser.cover_image_url}`
              }
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Edit Cover Button - Only show for own profile */}
          {isOwnProfile && (
            <motion.label
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute top-4 right-4 bg-white/20 dark:bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-xl hover:bg-white/30 dark:hover:bg-white/20 transition-all shadow-lg flex items-center space-x-2 border border-white/30 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">
                {uploadingCover ? "Đang tải..." : "Đổi ảnh bìa"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingCover(true);
                  try {
                    const result = await apiClient.uploadCover(file);
                    if (result.success) {
                      // Refresh user data
                      const token = apiClient.getToken();
                      const API_BASE_URL = getAPIURL();
                      const profileResponse = await fetch(
                        `${API_BASE_URL}/auth/profile`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );
                      if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        if (profileData.user) {
                          // Update localStorage with new user data
                          localStorage.setItem(
                            "user",
                            JSON.stringify(profileData.user)
                          );
                          // Update viewing user state if it's own profile
                          if (!viewingUserId || viewingUserId === user?.id) {
                            setViewingUser(profileData.user);
                          }
                          // Trigger custom event for other components to update
                          window.dispatchEvent(
                            new CustomEvent("userUpdated", {
                              detail: profileData.user,
                            })
                          );
                          // Show success message
                          alert("Ảnh bìa đã được cập nhật thành công!");
                        }
                      } else {
                        alert("Lỗi khi tải thông tin người dùng");
                      }
                    } else {
                      alert(result.error || "Lỗi upload ảnh bìa");
                    }
                  } catch (error: any) {
                    alert(error.message || "Lỗi upload ảnh bìa");
                  } finally {
                    setUploadingCover(false);
                  }
                }}
                disabled={uploadingCover}
              />
            </motion.label>
          )}
        </div>

        {/* Profile Info Card - Modern Floating Design */}
        <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20 dark:border-gray-700/50"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar - Enhanced Design */}
              <div className="relative group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-36 h-36 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br from-primary-400 to-purple-500 dark:from-primary-600 dark:to-purple-700 p-1.5 shadow-2xl"
                >
                  <div className="w-full h-full rounded-3xl overflow-hidden bg-white dark:bg-gray-800">
                    <img
                      src={
                        displayUser.avatar_url &&
                        displayUser.avatar_url.startsWith("http")
                          ? displayUser.avatar_url
                          : displayUser.avatar_url &&
                            !displayUser.avatar_url.startsWith("http")
                          ? `${
                              process.env.NEXT_PUBLIC_API_URL?.replace(
                                "/api",
                                ""
                              ) || getBaseURL()
                            }${displayUser.avatar_url}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              displayUser.full_name ||
                                displayUser.username ||
                                "User"
                            )}&size=200&background=5b9a8b&color=fff&bold=true`
                      }
                      alt={displayUser.full_name || displayUser.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes("name=")) {
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            displayUser.full_name ||
                              displayUser.username ||
                              "User"
                          )}&size=200&background=5b9a8b&color=fff&bold=true`;
                        }
                      }}
                    />
                  </div>
                </motion.div>
                {isOwnProfile && (
                  <motion.label
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-2 right-2 bg-primary-600 dark:bg-primary-500 text-white p-3 rounded-full shadow-xl hover:bg-primary-700 dark:hover:bg-primary-600 transition-all opacity-0 group-hover:opacity-100 border-2 border-white dark:border-gray-800 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingAvatar(true);
                        try {
                          const result = await apiClient.uploadAvatar(file);
                          if (result.success) {
                            // Refresh user data
                            const token = apiClient.getToken();
                            const API_BASE_URL = getAPIURL();
                            const profileResponse = await fetch(
                              `${API_BASE_URL}/auth/profile`,
                              {
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );
                            if (profileResponse.ok) {
                              const profileData = await profileResponse.json();
                              if (profileData.user) {
                                // Update localStorage with new user data
                                localStorage.setItem(
                                  "user",
                                  JSON.stringify(profileData.user)
                                );
                                // Update viewing user state if it's own profile
                                if (
                                  !viewingUserId ||
                                  viewingUserId === user?.id
                                ) {
                                  setViewingUser(profileData.user);
                                }
                                // Trigger custom event for other components to update
                                window.dispatchEvent(
                                  new CustomEvent("userUpdated", {
                                    detail: profileData.user,
                                  })
                                );
                                // Show success message
                                alert("Avatar đã được cập nhật thành công!");
                              }
                            } else {
                              alert("Lỗi khi tải thông tin người dùng");
                            }
                          } else {
                            alert(result.error || "Lỗi upload avatar");
                          }
                        } catch (error: any) {
                          alert(error.message || "Lỗi upload avatar");
                        } finally {
                          setUploadingAvatar(false);
                        }
                      }}
                      disabled={uploadingAvatar}
                    />
                  </motion.label>
                )}

                {/* Level Badge - Enhanced */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 text-white px-4 py-2 rounded-full font-bold flex items-center space-x-1 shadow-xl border-2 border-white dark:border-gray-800"
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>Lv {displayUser.level || 1}</span>
                </motion.div>
              </div>

              {/* User Info - Enhanced Typography */}
              <div className="flex-1 text-center md:text-left">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent mb-2"
                >
                  {displayUser.full_name || displayUser.username}
                </motion.h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-4 font-medium">
                  @{displayUser.username}
                </p>

                {displayUser.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-2xl text-base leading-relaxed">
                    {displayUser.bio}
                  </p>
                )}

                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm mb-6">
                  {displayUser.location && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-700"
                    >
                      <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        {displayUser.location}
                      </span>
                    </motion.div>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600"
                  >
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Tham gia{" "}
                      {displayUser.created_at
                        ? new Date(displayUser.created_at).toLocaleDateString(
                            "vi-VN"
                          )
                        : "N/A"}
                    </span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 px-4 py-2 rounded-full border border-yellow-200 dark:border-yellow-700"
                  >
                    <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-bold text-yellow-700 dark:text-yellow-300">
                      {displayUser.points || 0} điểm
                    </span>
                  </motion.div>
                </div>

                {/* Action Buttons - Enhanced */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {isOwnProfile ? (
                    <>
                      <Link href="/posts/create">
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                          <PlusCircle className="w-5 h-5" />
                          <span>Tạo bài viết</span>
                        </motion.button>
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                      >
                        <Edit className="w-5 h-5" />
                        <span>Chỉnh sửa</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                      >
                        <Share2 className="w-5 h-5" />
                        <span className="hidden sm:inline">Chia sẻ</span>
                      </motion.button>
                    </>
                  ) : (
                    <>
                      {/* Friend Request Button - Show for others' profiles */}
                      {viewingUserId && viewingUserId !== user?.id && (
                        <>
                          {loadingProfile || !friendshipStatus ? (
                            <motion.button
                              disabled
                              className="flex items-center space-x-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <UserPlus className="w-5 h-5" />
                              <span>Đang tải...</span>
                            </motion.button>
                          ) : friendshipStatus.is_friend ? (
                            <motion.button
                              onClick={handleFriendRequest}
                              disabled={friendRequestLoading}
                              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-red-500 hover:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{
                                scale: friendRequestLoading ? 1 : 1.05,
                                y: friendRequestLoading ? 0 : -2,
                              }}
                              whileTap={{
                                scale: friendRequestLoading ? 1 : 0.95,
                              }}
                            >
                              <UserMinus className="w-5 h-5" />
                              <span>
                                {friendRequestLoading
                                  ? "Đang xử lý..."
                                  : "Hủy kết bạn"}
                              </span>
                            </motion.button>
                          ) : friendshipStatus.request_status === "sent" ? (
                            <motion.button
                              onClick={handleFriendRequest}
                              disabled={friendRequestLoading}
                              className="flex items-center space-x-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{
                                scale: friendRequestLoading ? 1 : 1.05,
                              }}
                              whileTap={{
                                scale: friendRequestLoading ? 1 : 0.95,
                              }}
                            >
                              <X className="w-5 h-5" />
                              <span>
                                {friendRequestLoading
                                  ? "Đang xử lý..."
                                  : "Đã gửi lời mời"}
                              </span>
                            </motion.button>
                          ) : friendshipStatus.request_status === "received" ? (
                            <>
                              <motion.button
                                onClick={handleFriendRequest}
                                disabled={friendRequestLoading}
                                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{
                                  scale: friendRequestLoading ? 1 : 1.05,
                                  y: friendRequestLoading ? 0 : -2,
                                }}
                                whileTap={{
                                  scale: friendRequestLoading ? 1 : 0.95,
                                }}
                              >
                                <Check className="w-5 h-5" />
                                <span>
                                  {friendRequestLoading
                                    ? "Đang xử lý..."
                                    : "Chấp nhận"}
                                </span>
                              </motion.button>
                              <motion.button
                                onClick={handleRejectFriendRequest}
                                disabled={friendRequestLoading}
                                className="flex items-center space-x-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{
                                  scale: friendRequestLoading ? 1 : 1.05,
                                }}
                                whileTap={{
                                  scale: friendRequestLoading ? 1 : 0.95,
                                }}
                              >
                                <X className="w-5 h-5" />
                                <span>Từ chối</span>
                              </motion.button>
                            </>
                          ) : (
                            <motion.button
                              onClick={handleFriendRequest}
                              disabled={friendRequestLoading}
                              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{
                                scale: friendRequestLoading ? 1 : 1.05,
                                y: friendRequestLoading ? 0 : -2,
                              }}
                              whileTap={{
                                scale: friendRequestLoading ? 1 : 0.95,
                              }}
                            >
                              <UserPlus className="w-5 h-5" />
                              <span>
                                {friendRequestLoading
                                  ? "Đang gửi..."
                                  : "Kết bạn"}
                              </span>
                            </motion.button>
                          )}
                        </>
                      )}
                      {/* Message Button - Only show if friends */}
                      {friendshipStatus?.is_friend && (
                        <Link href={`/messages/${viewingUserId}`}>
                          <motion.button
                            className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span>Nhắn tin</span>
                          </motion.button>
                        </Link>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                      >
                        <Share2 className="w-5 h-5" />
                        <span className="hidden sm:inline">Chia sẻ</span>
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards - Enhanced Design */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                  {totalStats.posts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  Bài viết
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="text-center p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent">
                  {totalStats.bookmarks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  Đã lưu
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="text-center p-5 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-2xl border-2 border-pink-200 dark:border-pink-800 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-700 dark:from-pink-400 dark:to-pink-500 bg-clip-text text-transparent">
                  {totalStats.likes}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  Đã thích
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Section - Enhanced */}
      <div className="max-w-6xl mx-auto px-4 mt-8 pb-12">
        {/* Tabs - Modern Design */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              {
                id: "posts",
                label: "Bài viết",
                icon: FileText,
                count: myPosts.length,
                color: "blue",
                show: true,
              },
              {
                id: "bookmarks",
                label: "Đã lưu",
                icon: Bookmark,
                count: bookmarks.length,
                color: "purple",
                show: isOwnProfile,
              },
              {
                id: "likes",
                label: "Đã thích",
                icon: Heart,
                count: likedPosts.length,
                color: "pink",
                show: isOwnProfile,
              },
              {
                id: "following",
                label: "Theo dõi",
                icon: Users,
                count: 0,
                color: "green",
                show: false, // Disabled for now
              },
            ]
              .filter((tab) => tab.show)
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const colorClasses = {
                  blue: {
                    active: "text-blue-600 dark:text-blue-400",
                    bg: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                    gradient: "from-blue-500 to-blue-600",
                  },
                  purple: {
                    active: "text-purple-600 dark:text-purple-400",
                    bg: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
                    gradient: "from-purple-500 to-purple-600",
                  },
                  pink: {
                    active: "text-pink-600 dark:text-pink-400",
                    bg: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
                    gradient: "from-pink-500 to-pink-600",
                  },
                  green: {
                    active: "text-green-600 dark:text-green-400",
                    bg: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                    gradient: "from-green-500 to-green-600",
                  },
                };
                const colorClass =
                  colorClasses[tab.color as keyof typeof colorClasses];

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-4 font-semibold transition-all relative ${
                      isActive
                        ? colorClass.active
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isActive ? colorClass.active : ""}`}
                    />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isActive
                            ? colorClass.bg
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClass.gradient}`}
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {loadingData ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 dark:border-t-primary-400"></div>
              </div>
            ) : currentPosts.length === 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center shadow-lg"
                >
                  {activeTab === "posts" && (
                    <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  )}
                  {activeTab === "bookmarks" && (
                    <Bookmark className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  )}
                  {activeTab === "likes" && (
                    <Heart className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  )}
                  {activeTab === "following" && (
                    <Users className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  )}
                </motion.div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                  {activeTab === "posts" && "Chưa có bài viết nào"}
                  {activeTab === "bookmarks" && "Chưa lưu bài viết nào"}
                  {activeTab === "likes" && "Chưa thích bài viết nào"}
                  {activeTab === "following" && "Chức năng đang phát triển"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-base">
                  {activeTab === "posts" &&
                    "Hãy chia sẻ những trải nghiệm du lịch tuyệt vời của bạn!"}
                  {activeTab === "bookmarks" &&
                    "Lưu lại những bài viết yêu thích để đọc sau"}
                  {activeTab === "likes" &&
                    "Khám phá và thích những bài viết hay ho"}
                  {activeTab === "following" &&
                    "Tính năng theo dõi người dùng sẽ sớm ra mắt"}
                </p>
                {activeTab === "posts" && (
                  <Link href="/posts/create">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Tạo bài viết đầu tiên</span>
                    </motion.button>
                  </Link>
                )}
              </motion.div>
            ) : activeTab === "posts" ? (
              <div className="space-y-6">
                {myPosts.map((post, index) => {
                  // Helper function to convert relative path to full URL
                  const getImageUrl = (
                    imagePath: string | null | undefined
                  ) => {
                    if (!imagePath) return null;
                    if (imagePath.startsWith("http")) return imagePath;
                    const baseUrl =
                      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
                      getBaseURL();
                    return `${baseUrl}${imagePath}`;
                  };

                  // Get images array from post
                  const postImages =
                    (post as any).images &&
                    Array.isArray((post as any).images) &&
                    (post as any).images.length > 0
                      ? (post as any).images
                      : post.featured_image
                      ? [post.featured_image]
                      : [];

                  // Transform post data to match PostCard interface
                  const postCardData = {
                    id: post.id,
                    slug: post.slug,
                    title: post.title || "",
                    content: post.excerpt || (post as any).content || "",
                    author_name:
                      displayUser.full_name || displayUser.username || "User",
                    author_id: displayUser.id,
                    author_avatar:
                      getImageUrl(displayUser.avatar_url) || undefined,
                    location: displayUser.location,
                    featured_image:
                      getImageUrl(post.featured_image) || undefined,
                    images: postImages
                      .map((img: any) => getImageUrl(img))
                      .filter(Boolean) as string[],
                    published_at: post.published_at,
                    like_count: post.likes_count || 0,
                    comment_count: post.comments_count || 0,
                    views_count: post.views_count || 0,
                    shares_count: 0,
                    is_liked: (post as any).is_liked || false,
                    is_bookmarked: (post as any).is_bookmarked || false,
                    tags: (post as any).tags || [],
                  };
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PostCard post={postCardData} />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8 }}
                  >
                    <Link href={`/posts/${post.slug}`}>
                      <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200/50 dark:border-gray-700/50">
                        {/* Post Image */}
                        {post.featured_image && (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={post.featured_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        )}

                        {/* Post Content */}
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent dark:group-hover:from-primary-400 dark:group-hover:to-purple-400 transition-all">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>

                          {/* Post Stats */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4 text-gray-500">
                              <motion.span
                                whileHover={{ scale: 1.2 }}
                                className="flex items-center space-x-1 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Heart className="w-4 h-4" />
                                <span className="font-medium">
                                  {post.likes_count}
                                </span>
                              </motion.span>
                              <motion.span
                                whileHover={{ scale: 1.2 }}
                                className="flex items-center space-x-1 hover:text-blue-500 transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="font-medium">
                                  {post.comments_count}
                                </span>
                              </motion.span>
                              <motion.span
                                whileHover={{ scale: 1.2 }}
                                className="flex items-center space-x-1 hover:text-green-500 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="font-medium">
                                  {post.views_count || 0}
                                </span>
                              </motion.span>
                            </div>
                            <span className="text-gray-400 text-xs font-medium">
                              {new Date(post.published_at).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Seller Tours Section - Show if viewing a seller */}
        {(viewingUser?.role === "seller" || viewingUser?.role === "admin") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Package className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Tours của {displayUser.full_name || displayUser.username}
                </h2>
              </div>
            </div>

            {loadingTours ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-teal-600 dark:border-t-teal-400"></div>
              </div>
            ) : sellerTours.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-600 dark:text-gray-400">
                  Chưa có tour nào
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerTours.map((tour, index) => (
                  <motion.div
                    key={tour.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link href={`/tours/${tour.id}`}>
                      <div className="group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700">
                        {/* Tour Image */}
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={
                              tour.featured_image?.startsWith("http")
                                ? tour.featured_image
                                : `${
                                    process.env.NEXT_PUBLIC_API_URL?.replace(
                                      "/api",
                                      ""
                                    ) || getBaseURL()
                                  }${
                                    tour.featured_image ||
                                    "/uploads/default-tour.jpg"
                                  }`
                            }
                            alt={tour.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-3 right-3">
                            <span className="px-3 py-1 bg-teal-600 text-white text-xs font-semibold rounded-full">
                              {tour.price_per_person
                                ? new Intl.NumberFormat("vi-VN").format(
                                    tour.price_per_person
                                  ) + " VND"
                                : "Liên hệ"}
                            </span>
                          </div>
                        </div>

                        {/* Tour Content */}
                        <div className="p-5">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {tour.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {tour.description || tour.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4 text-gray-500">
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{tour.starting_location || "N/A"}</span>
                              </span>
                              {tour.rating > 0 && (
                                <span className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span>{tour.rating.toFixed(1)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Seller Info */}
            {viewingUser &&
              (viewingUser.company_name ||
                viewingUser.company_email ||
                viewingUser.company_phone) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Thông tin công ty
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingUser.company_name && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Tên công ty
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {viewingUser.company_name}
                        </p>
                      </div>
                    )}
                    {viewingUser.company_address && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Địa chỉ
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {viewingUser.company_address}
                        </p>
                      </div>
                    )}
                    {viewingUser.company_phone && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Số điện thoại
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {viewingUser.company_phone}
                        </p>
                      </div>
                    )}
                    {viewingUser.company_email && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Email
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {viewingUser.company_email}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
          </motion.div>
        )}
      </div>

      {/* Friend Action Popup - For friend requests and actions */}
      <FriendActionPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        type={popupType}
        message={popupMessage}
      />
    </div>
  );
}
