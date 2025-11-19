"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Flag,
  MessageCircle,
  Calendar,
  Award,
  Activity,
  Filter,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Trash2,
  Ban,
  Send,
  Settings,
  HelpCircle,
  Plus,
  X,
} from "lucide-react";
import PostModal from "@/components/common/PostModal";
import SuccessPopup from "@/components/common/SuccessPopup";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Toast Component
const Toast = ({ message, type = "success", onClose }: any) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white`}
  >
    <div className="flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4">
        <X className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

// Confirm Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ModeratorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [successPopup, setSuccessPopup] = useState<{isOpen: boolean; message: string; type?: "success" | "error" | "info" | "warning"}>({
    isOpen: false,
    message: "",
    type: "success",
  });
  
  // Stats
  const [stats, setStats] = useState<any>({});
  const [profile, setProfile] = useState<any>(null);
  
  // Posts
  const [posts, setPosts] = useState<any[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsPagination, setPostsPagination] = useState<any>({});
  const [postsSearch, setPostsSearch] = useState("");
  const [postsStatusFilter, setPostsStatusFilter] = useState("");
  
  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsPagination, setCommentsPagination] = useState<any>({});
  const [commentsSearch, setCommentsSearch] = useState("");
  
  // Banned Keywords
  const [bannedKeywords, setBannedKeywords] = useState<any[]>([]);
  const [keywordsPage, setKeywordsPage] = useState(1);
  const [keywordsPagination, setKeywordsPagination] = useState<any>({});
  const [newKeyword, setNewKeyword] = useState({ keyword: "", severity: "medium", description: "" });
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  
  // Contacts
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsPagination, setContactsPagination] = useState<any>({});
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [contactResponse, setContactResponse] = useState("");

  // Banned Users
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [bannedUsersPage, setBannedUsersPage] = useState(1);
  const [bannedUsersPagination, setBannedUsersPagination] = useState<any>({});
  const [bannedUsersSearch, setBannedUsersSearch] = useState("");
  const [bannedUsersFilter, setBannedUsersFilter] = useState("all");

  // Warning Users (users with 3+ violations)
  const [warningUsers, setWarningUsers] = useState<any[]>([]);
  const [warningUsersPage, setWarningUsersPage] = useState(1);
  const [warningUsersPagination, setWarningUsersPagination] = useState<any>({});
  const [warningUsersSearch, setWarningUsersSearch] = useState("");

  // Notifications
  const [notificationForm, setNotificationForm] = useState({
    user_id: "",
    message: "",
    title: "Thông báo từ Moderator",
    type: "info",
  });
  const [warningForm, setWarningForm] = useState({
    user_id: "",
    reason: "Vi phạm quy định cộng đồng",
    content_id: "",
    content_type: "post",
  });

  // Post Modal
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);

  // Ban Modal
  const [banModal, setBanModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    banType: 'account' | 'post' | 'comment' | null;
    duration: string;
    reason: string;
  }>({
    isOpen: false,
    userId: null,
    banType: null,
    duration: '1d',
    reason: 'Vi phạm quy định cộng đồng',
  });

  const tabItems = [
    { id: "posts", icon: FileText, label: "Quản Lý Bài Đăng" },
    { id: "comments", icon: MessageCircle, label: "Quản Lý Bình Luận" },
    { id: "keywords", icon: Ban, label: "Từ Khóa Cấm" },
    { id: "warnings", icon: AlertTriangle, label: "Cảnh Báo" },
    { id: "banned-users", icon: Shield, label: "Tài Khoản Bị Khóa" },
    { id: "contacts", icon: HelpCircle, label: "Hỗ Trợ & Liên Hệ" },
    { id: "notifications", icon: Send, label: "Gửi Thông Báo" },
  ];

  // API Functions
  const getToken = () => localStorage.getItem("access_token");

  const moderatorAPI = {
    getStats: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/moderator/stats?_t=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },

    getProfile: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },

    getPosts: async (params: any = {}) => {
      const token = getToken();
      // Add cache-busting timestamp
      const paramsWithCache = { ...params, _t: Date.now() };
      const queryParams = new URLSearchParams(paramsWithCache).toString();
      const response = await fetch(`${API_BASE_URL}/moderator/posts?${queryParams}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },

    deletePost: async (postId: number) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/moderator/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete post");
      return response.json();
    },

    searchPostsWithBanned: async (params: any = {}) => {
      const token = getToken();
      // Add cache-busting timestamp
      const paramsWithCache = { ...params, _t: Date.now() };
      const queryParams = new URLSearchParams(paramsWithCache).toString();
      const response = await fetch(`${API_BASE_URL}/moderator/posts/search-banned?${queryParams}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      if (!response.ok) throw new Error("Failed to search posts");
      return response.json();
    },

    getComments: async (params: any = {}) => {
      const token = getToken();
      // Add cache-busting timestamp
      const paramsWithCache = { ...params, _t: Date.now() };
      const queryParams = new URLSearchParams(paramsWithCache).toString();
      const response = await fetch(`${API_BASE_URL}/moderator/comments?${queryParams}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },

    deleteComment: async (commentId: number) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/moderator/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete comment");
      return response.json();
    },

    searchCommentsWithBanned: async (params: any = {}) => {
      const token = getToken();
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/moderator/comments/search-banned?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to search comments");
      return response.json();
    },

    getBannedKeywords: async (params: any = {}) => {
      const token = getToken();
      // Add cache-busting timestamp
      const paramsWithCache = { ...params, _t: Date.now() };
      const queryParams = new URLSearchParams(paramsWithCache).toString();
      const response = await fetch(`${API_BASE_URL}/moderator/banned-keywords?${queryParams}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      if (!response.ok) throw new Error("Failed to fetch keywords");
      return response.json();
    },

    createBannedKeyword: async (data: any) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/moderator/banned-keywords`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create keyword");
      return response.json();
    },

    updateBannedKeyword: async (keywordId: number, data: any) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/moderator/banned-keywords/${keywordId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update keyword");
      return response.json();
    },

    deleteBannedKeyword: async (keywordId: number) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/moderator/banned-keywords/${keywordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete keyword");
      return response.json();
    },

    getContacts: async (params: any = {}) => {
      const token = getToken();
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/moderator/contacts?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },

    assignContact: async (contactId: number) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/moderator/contacts/${contactId}/assign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to assign contact");
      return response.json();
    },

    respondToContact: async (contactId: number, response: string, status: string) => {
      const token = getToken();
      const response_data = await fetch(`${API_BASE_URL}/moderator/contacts/${contactId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ response, status }),
      });
      if (!response_data.ok) throw new Error("Failed to respond");
      return response_data.json();
    },

    sendNotification: async (data: any) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/moderator/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to send notification");
      return response.json();
    },

    sendWarning: async (data: any) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/moderator/warnings/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to send warning");
      return response.json();
    },

    banUser: async (userId: number, banType: string, duration: string, reason: string) => {
      const token = getToken();
      const endpoint = banType === 'account' ? 'ban' : banType === 'post' ? 'ban-post' : 'ban-comment';
      const response = await fetch(`${API_BASE_URL}/moderator/users/${userId}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration, reason }),
      });
      if (!response.ok) throw new Error("Failed to ban user");
      return response.json();
    },

    unbanUser: async (userId: number, banType: string) => {
      const token = getToken();
      const endpoint = banType === 'account' ? 'unban' : banType === 'post' ? 'unban-post' : 'unban-comment';
      const response = await fetch(`${API_BASE_URL}/moderator/users/${userId}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to unban user");
      return response.json();
    },

    getBannedUsers: async (params: any = {}) => {
      const token = getToken();
      // Add cache-busting timestamp
      const paramsWithCache = { ...params, _t: Date.now() };
      const queryParams = new URLSearchParams(paramsWithCache).toString();
      const response = await fetch(`${API_BASE_URL}/moderator/users/banned?${queryParams}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      if (!response.ok) throw new Error("Failed to fetch banned users");
      return response.json();
    },

    getWarningUsers: async (params: any = {}) => {
      const token = getToken();
      // Add cache-busting timestamp
      const paramsWithCache = { ...params, _t: Date.now() };
      const queryParams = new URLSearchParams(paramsWithCache).toString();
      const response = await fetch(`${API_BASE_URL}/moderator/warnings/users?${queryParams}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      if (!response.ok) throw new Error("Failed to fetch warning users");
      return response.json();
    },
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsData, profileData] = await Promise.all([
          moderatorAPI.getStats(),
          moderatorAPI.getProfile(),
        ]);
        setStats(statsData);
        setProfile(profileData.user || profileData);
      } catch (error: any) {
        if (error.message.includes("401") || error.message.includes("403")) {
          router.push("/welcome");
        } else {
          showToast("Lỗi tải dữ liệu", "error");
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load banned users
  const loadBannedUsers = async () => {
    try {
      const data = await moderatorAPI.getBannedUsers({
        page: bannedUsersPage,
        per_page: 20,
        search: bannedUsersSearch,
        ban_type: bannedUsersFilter,
      });
      setBannedUsers(data.users || []);
      setBannedUsersPagination(data.pagination || {});
    } catch (error: any) {
      console.error("Error loading banned users:", error);
      showToast(error.message || "Lỗi tải danh sách tài khoản bị khóa", "error");
      // Don't clear existing data on error
      if (bannedUsers.length === 0) {
        setBannedUsers([]);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "banned-users") {
      loadBannedUsers();
    }
  }, [activeTab, bannedUsersPage, bannedUsersSearch, bannedUsersFilter]);

  // Load warning users
  const loadWarningUsers = async () => {
    try {
      const data = await moderatorAPI.getWarningUsers({
        page: warningUsersPage,
        per_page: 20,
        search: warningUsersSearch,
      });
      setWarningUsers(data.users || []);
      setWarningUsersPagination(data.pagination || {});
    } catch (error: any) {
      console.error("Error loading warning users:", error);
      showToast(error.message || "Lỗi tải danh sách cảnh báo", "error");
      // Don't clear existing data on error
      if (warningUsers.length === 0) {
        setWarningUsers([]);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "warnings") {
      loadWarningUsers();
    }
  }, [activeTab, warningUsersPage, warningUsersSearch]);

  // Load posts
  useEffect(() => {
    if (activeTab === "posts") {
      loadPosts();
    }
  }, [activeTab, postsPage, postsSearch, postsStatusFilter]);

  // Load comments
  useEffect(() => {
    if (activeTab === "comments") {
      loadComments();
    }
  }, [activeTab, commentsPage, commentsSearch]);

  // Load keywords
  useEffect(() => {
    if (activeTab === "keywords") {
      loadKeywords();
    }
  }, [activeTab, keywordsPage]);

  // Load contacts
  useEffect(() => {
    if (activeTab === "contacts") {
      loadContacts();
    }
  }, [activeTab, contactsPage]);

  const loadPosts = async () => {
    try {
      const params: any = { page: postsPage, per_page: 20 };
      if (postsSearch) params.search = postsSearch;
      if (postsStatusFilter) params.status = postsStatusFilter;
      const data = await moderatorAPI.getPosts(params);
      setPosts(data.posts || []);
      setPostsPagination(data.pagination || {});
    } catch (error: any) {
      console.error("Error loading posts:", error);
      showToast(error.message || "Lỗi tải danh sách bài viết", "error");
      // Don't clear existing data on error
      if (posts.length === 0) {
        setPosts([]);
      }
    }
  };

  const loadComments = async () => {
    try {
      const params: any = { page: commentsPage, per_page: 20 };
      if (commentsSearch) params.search = commentsSearch;
      const data = await moderatorAPI.getComments(params);
      setComments(data.comments || []);
      setCommentsPagination(data.pagination || {});
    } catch (error: any) {
      console.error("Error loading comments:", error);
      showToast(error.message || "Lỗi tải danh sách bình luận", "error");
      // Don't clear existing data on error
      if (comments.length === 0) {
        setComments([]);
      }
    }
  };

  const loadKeywords = async () => {
    try {
      const params: any = { page: keywordsPage, per_page: 50 };
      const data = await moderatorAPI.getBannedKeywords(params);
      setBannedKeywords(data.keywords || []);
      setKeywordsPagination(data.pagination || {});
    } catch (error: any) {
      console.error("Error loading keywords:", error);
      showToast(error.message || "Lỗi tải danh sách từ khóa cấm", "error");
      // Don't clear existing data on error
      if (bannedKeywords.length === 0) {
        setBannedKeywords([]);
      }
    }
  };

  const loadContacts = async () => {
    try {
      const params: any = { page: contactsPage, per_page: 20 };
      const data = await moderatorAPI.getContacts(params);
      setContacts(data.contacts || []);
      setContactsPagination(data.pagination || {});
    } catch (error: any) {
      console.error("Error loading contacts:", error);
      showToast(error.message || "Lỗi tải danh sách liên hệ", "error");
      // Don't clear existing data on error
      if (contacts.length === 0) {
        setContacts([]);
      }
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await moderatorAPI.deletePost(postId);
      setSuccessPopup({
        isOpen: true,
        message: "Xóa bài viết thành công!",
        type: "success",
      });
      loadPosts();
    } catch (error) {
      setSuccessPopup({
        isOpen: true,
        message: "Lỗi xóa bài viết",
        type: "error",
      });
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await moderatorAPI.deleteComment(commentId);
      setSuccessPopup({
        isOpen: true,
        message: "Xóa bình luận thành công!",
        type: "success",
      });
      loadComments();
    } catch (error) {
      setSuccessPopup({
        isOpen: true,
        message: "Lỗi xóa bình luận",
        type: "error",
      });
    }
  };

  const handleBanUser = async () => {
    if (!banModal.userId || !banModal.banType) return;
    try {
      const result = await moderatorAPI.banUser(
        banModal.userId,
        banModal.banType,
        banModal.duration,
        banModal.reason
      );
      const banTypeText = banModal.banType === 'account' ? 'tài khoản' : banModal.banType === 'post' ? 'đăng bài' : 'bình luận';
      setSuccessPopup({
        isOpen: true,
        message: result.message || `Khóa ${banTypeText} thành công!`,
        type: "success",
      });
      setBanModal({ ...banModal, isOpen: false });
      // Force reload data immediately after ban
      setTimeout(() => {
        loadPosts();
        loadComments();
        if (activeTab === "banned-users") {
          loadBannedUsers();
        }
        if (activeTab === "warnings") {
          loadWarningUsers();
        }
        // Also reload stats to reflect changes
        moderatorAPI.getStats().then(setStats).catch(() => {});
      }, 100);
    } catch (error: any) {
      setSuccessPopup({
        isOpen: true,
        message: error.message || "Lỗi khóa người dùng",
        type: "error",
      });
    }
  };

  const handleUnbanUser = async (userId: number, banType: string) => {
    try {
      const result = await moderatorAPI.unbanUser(userId, banType);
      const banTypeText = banType === 'account' ? 'tài khoản' : banType === 'post' ? 'đăng bài' : 'bình luận';
      setSuccessPopup({
        isOpen: true,
        message: result.message || `Mở khóa ${banTypeText} thành công!`,
        type: "success",
      });
      // Force reload data immediately after unban
      if (activeTab === "banned-users") {
        // Small delay to ensure backend has processed the change
        setTimeout(() => {
          loadBannedUsers();
        }, 100);
      }
      // Also reload stats to reflect changes
      setTimeout(() => {
        moderatorAPI.getStats().then(setStats).catch(() => {});
      }, 200);
    } catch (error: any) {
      setSuccessPopup({
        isOpen: true,
        message: error.message || "Lỗi mở khóa người dùng",
        type: "error",
      });
    }
  };

  const handleUnbanAll = async (userId: number, banStatus: any) => {
    try {
      const unbans: Promise<any>[] = [];
      if (banStatus.account) {
        unbans.push(moderatorAPI.unbanUser(userId, 'account'));
      }
      if (banStatus.post) {
        unbans.push(moderatorAPI.unbanUser(userId, 'post'));
      }
      if (banStatus.comment) {
        unbans.push(moderatorAPI.unbanUser(userId, 'comment'));
      }
      
      await Promise.all(unbans);
      setSuccessPopup({
        isOpen: true,
        message: "Mở khóa tất cả thành công!",
        type: "success",
      });
      
      // Force reload data immediately after unban
      if (activeTab === "banned-users") {
        setTimeout(() => {
          loadBannedUsers();
        }, 100);
      }
      setTimeout(() => {
        moderatorAPI.getStats().then(setStats).catch(() => {});
      }, 200);
    } catch (error: any) {
      setSuccessPopup({
        isOpen: true,
        message: error.message || "Lỗi mở khóa người dùng",
        type: "error",
      });
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.keyword.trim()) {
      showToast("Vui lòng nhập từ khóa", "error");
      return;
    }
    try {
      await moderatorAPI.createBannedKeyword(newKeyword);
      showToast("Thêm từ khóa cấm thành công!", "success");
      setNewKeyword({ keyword: "", severity: "medium", description: "" });
      setShowAddKeyword(false);
      // Force reload immediately
      setTimeout(() => {
        loadKeywords();
      }, 100);
    } catch (error: any) {
      showToast(error.message || "Lỗi thêm từ khóa cấm", "error");
    }
  };

  const handleDeleteKeyword = async (keywordId: number) => {
    try {
      await moderatorAPI.deleteBannedKeyword(keywordId);
      showToast("Xóa từ khóa cấm thành công!", "success");
      // Force reload immediately
      setTimeout(() => {
        loadKeywords();
      }, 100);
    } catch (error) {
      showToast("Lỗi xóa từ khóa cấm", "error");
    }
  };

  const handleAssignContact = async (contactId: number) => {
    try {
      await moderatorAPI.assignContact(contactId);
      showToast("Phân công xử lý thành công!", "success");
      loadContacts();
    } catch (error) {
      showToast("Lỗi phân công", "error");
    }
  };

  const handleRespondContact = async () => {
    if (!contactResponse.trim()) {
      showToast("Vui lòng nhập phản hồi", "error");
      return;
    }
    try {
      await moderatorAPI.respondToContact(selectedContact.id, contactResponse, "resolved");
      showToast("Phản hồi thành công!", "success");
      setSelectedContact(null);
      setContactResponse("");
      loadContacts();
    } catch (error) {
      showToast("Lỗi phản hồi", "error");
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  const renderPosts = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Quản Lý Bài Đăng</h3>
          <div className="flex items-center space-x-4">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={postsSearch}
                onChange={(e) => setPostsSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={postsStatusFilter}
              onChange={(e) => setPostsStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
              <option value="pending">Chờ duyệt</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
            <button
              onClick={() => {
                moderatorAPI.searchPostsWithBanned({ page: 1 }).then((data) => {
                  setPosts(data.posts || []);
                  setPostsPagination(data.pagination || {});
                  showToast("Đã tìm thấy " + (data.posts?.length || 0) + " bài viết có từ khóa cấm", "success");
                });
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Ban className="w-4 h-4 inline mr-2" />
              Tìm bài có từ cấm
            </button>
          </div>
              </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            whileHover={{ scale: 1.01 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {post.status}
                  </span>
                  {post.has_banned_keywords && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Có từ khóa cấm
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    bởi {post.author?.username || "Unknown"}
                  </span>
                  <span className="text-xs text-gray-500">
                    • {formatDate(post.created_at)}
                </span>
              </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h4>
                <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt || post.content?.substring(0, 200)}</p>
                {post.banned_keywords && post.banned_keywords.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-red-600">
                      Từ khóa cấm: {post.banned_keywords.map((kw: any) => kw.keyword).join(", ")}
                    </p>
            </div>
                )}
          </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setSelectedPostSlug(post.slug)}
                  className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Xem</span>
                </button>
                <button
                  onClick={() => {
                    if (post.author?.id) {
                      setNotificationForm({
                        ...notificationForm,
                        user_id: post.author.id.toString(),
                      });
                      setWarningForm({
                        ...warningForm,
                        user_id: post.author.id.toString(),
                        content_id: post.id.toString(),
                        content_type: "post",
                      });
                      setActiveTab("notifications");
                      showToast("Đã điền thông tin User ID và Post ID", "success");
                    } else {
                      showToast("Không tìm thấy thông tin tác giả", "error");
                    }
                  }}
                  className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors"
                  title="Điền thông tin vào form gửi thông báo"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-sm">Gửi TB</span>
                </button>
                {post.author?.id && (
                  <button
                    onClick={() => {
                      setBanModal({
                        isOpen: true,
                        userId: post.author.id,
                        banType: 'post',
                        duration: '1d',
                        reason: 'Vi phạm quy định đăng bài',
                      });
                    }}
                    className="flex items-center space-x-1 bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg transition-colors"
                    title="Khóa đăng bài"
                  >
                    <Ban className="w-4 h-4" />
                    <span className="text-sm">Khóa ĐB</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: "Xóa bài viết",
                      message: `Bạn có chắc muốn xóa bài viết "${post.title}"?`,
                      onConfirm: () => {
                        handleDeletePost(post.id);
                        setConfirmModal(null);
                      },
                    });
                  }}
                  className="flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Xóa</span>
          </button>
        </div>
            </div>
          </motion.div>
        ))}
      </div>

      {postsPagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
            disabled={postsPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-4 py-2">
            Trang {postsPage} / {postsPagination.totalPages}
          </span>
          <button
            onClick={() => setPostsPage((p) => Math.min(postsPagination.totalPages, p + 1))}
            disabled={postsPage >= postsPagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Sau
          </button>
            </div>
      )}
            </div>
  );

  const renderComments = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Quản Lý Bình Luận</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={commentsSearch}
                onChange={(e) => setCommentsSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                moderatorAPI.searchCommentsWithBanned({ page: 1 }).then((data) => {
                  setComments(data.comments || []);
                  setCommentsPagination(data.pagination || {});
                  showToast("Đã tìm thấy " + (data.comments?.length || 0) + " bình luận có từ khóa cấm", "success");
                });
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Ban className="w-4 h-4 inline mr-2" />
              Tìm comment có từ cấm
            </button>
            </div>
            </div>
          </div>

      <div className="space-y-4">
        {comments.map((comment) => (
        <motion.div
            key={comment.id}
            whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    {comment.status}
                  </span>
                  {comment.has_banned_keywords && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Có từ khóa cấm
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    bởi {comment.author?.username || "Unknown"}
                  </span>
                  <span className="text-xs text-gray-500">
                    • {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-900 mb-2">{comment.content}</p>
                {comment.post && (
                  <div className="flex items-center space-x-2 mt-2">
                    <p className="text-sm text-gray-600">
                      Trong bài: <span className="font-medium">{comment.post.title}</span>
                    </p>
                    <button
                      onClick={() => setSelectedPostSlug(comment.post.slug)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem bài viết</span>
                    </button>
                  </div>
                )}
                {comment.banned_keywords && comment.banned_keywords.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-red-600">
                      Từ khóa cấm: {comment.banned_keywords.map((kw: any) => kw.keyword).join(", ")}
              </p>
            </div>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => {
                    if (comment.author?.id) {
                      setNotificationForm({
                        ...notificationForm,
                        user_id: comment.author.id.toString(),
                      });
                      setWarningForm({
                        ...warningForm,
                        user_id: comment.author.id.toString(),
                        content_id: comment.post?.id ? comment.post.id.toString() : comment.id.toString(),
                        content_type: comment.post ? "post" : "comment",
                      });
                      setActiveTab("notifications");
                      showToast("Đã điền thông tin User ID và Content ID", "success");
                    } else {
                      showToast("Không tìm thấy thông tin tác giả", "error");
                    }
                  }}
                  className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors"
                  title="Điền thông tin vào form gửi thông báo"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-sm">Gửi TB</span>
                </button>
                {comment.author?.id && (
                  <>
                    <button
                      onClick={() => {
                        setBanModal({
                          isOpen: true,
                          userId: comment.author.id,
                          banType: 'comment',
                          duration: '1d',
                          reason: 'Vi phạm quy định bình luận',
                        });
                      }}
                      className="flex items-center space-x-1 bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg transition-colors"
                      title="Khóa bình luận"
                    >
                      <Ban className="w-4 h-4" />
                      <span className="text-sm">Khóa BL</span>
                    </button>
                    <button
                      onClick={() => {
                        setBanModal({
                          isOpen: true,
                          userId: comment.author.id,
                          banType: 'account',
                          duration: '1d',
                          reason: 'Vi phạm quy định cộng đồng',
                        });
                      }}
                      className="flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-lg transition-colors"
                      title="Khóa tài khoản"
                    >
                      <Ban className="w-4 h-4" />
                      <span className="text-sm">Khóa TK</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: "Xóa bình luận",
                      message: "Bạn có chắc muốn xóa bình luận này?",
                      onConfirm: () => {
                        handleDeleteComment(comment.id);
                        setConfirmModal(null);
                      },
                    });
                  }}
                  className="flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Xóa</span>
                </button>
            </div>
          </div>
        </motion.div>
        ))}
      </div>

      {commentsPagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
            disabled={commentsPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-4 py-2">
            Trang {commentsPage} / {commentsPagination.totalPages}
          </span>
          <button
            onClick={() => setCommentsPage((p) => Math.min(commentsPagination.totalPages, p + 1))}
            disabled={commentsPage >= commentsPagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Sau
          </button>
            </div>
      )}
            </div>
  );

  const renderKeywords = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Quản Lý Từ Khóa Cấm</h3>
          <button
            onClick={() => setShowAddKeyword(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm từ khóa</span>
          </button>
          </div>
      </div>

      {showAddKeyword && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="font-semibold mb-4">Thêm từ khóa cấm mới</h4>
          <div className="space-y-4">
              <div>
              <label className="block text-sm font-medium mb-1">Từ khóa *</label>
              <input
                type="text"
                value={newKeyword.keyword}
                onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Nhập từ khóa cấm"
              />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">Mức độ nghiêm trọng</label>
              <select
                value={newKeyword.severity}
                onChange={(e) => setNewKeyword({ ...newKeyword, severity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="critical">Nghiêm trọng</option>
              </select>
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <textarea
                value={newKeyword.description}
                onChange={(e) => setNewKeyword({ ...newKeyword, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Lý do từ khóa này bị cấm"
              />
              </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddKeyword(false);
                  setNewKeyword({ keyword: "", severity: "medium", description: "" });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {bannedKeywords.map((keyword) => (
          <motion.div
            key={keyword.id}
            whileHover={{ scale: 1.01 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    {keyword.keyword}
                </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    keyword.severity === "critical" ? "bg-red-200 text-red-900" :
                    keyword.severity === "high" ? "bg-orange-100 text-orange-800" :
                    keyword.severity === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {keyword.severity}
              </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    keyword.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {keyword.is_active ? "Đang hoạt động" : "Đã tắt"}
              </span>
            </div>
                {keyword.description && (
                  <p className="text-gray-600 text-sm">{keyword.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Tạo lúc: {formatDate(keyword.created_at)}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => {
                    moderatorAPI.updateBannedKeyword(keyword.id, { is_active: !keyword.is_active }).then(() => {
                      showToast("Cập nhật thành công!", "success");
                      loadKeywords();
                    });
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  {keyword.is_active ? "Tắt" : "Bật"}
                </button>
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: "Xóa từ khóa cấm",
                      message: `Bạn có chắc muốn xóa từ khóa "${keyword.keyword}"?`,
                      onConfirm: () => {
                        handleDeleteKeyword(keyword.id);
                        setConfirmModal(null);
                      },
                    });
                  }}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
            </div>
          </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Quản Lý Hỗ Trợ & Liên Hệ</h3>
        <p className="text-gray-600">Xử lý các yêu cầu hỗ trợ từ người dùng</p>
      </div>

      <div className="space-y-4">
        {contacts.map((contact) => (
          <motion.div
            key={contact.id}
            whileHover={{ scale: 1.01 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    contact.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    contact.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                    contact.status === "resolved" ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {contact.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    contact.priority === "urgent" ? "bg-red-100 text-red-800" :
                    contact.priority === "high" ? "bg-orange-100 text-orange-800" :
                    contact.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {contact.priority}
                  </span>
                  <span className="text-xs text-gray-500">
                    {contact.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    • {formatDate(contact.created_at)}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{contact.subject}</h4>
                <p className="text-gray-600 text-sm mb-2">{contact.message}</p>
                <p className="text-sm text-gray-500">
                  Từ: {contact.name} ({contact.email})
                </p>
                {contact.response && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Phản hồi:</p>
                    <p className="text-sm text-green-700">{contact.response}</p>
              </div>
                )}
              </div>
              <div className="flex flex-col space-y-2 ml-4">
                {contact.status === "pending" && (
                  <button
                    onClick={() => handleAssignContact(contact.id)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Nhận xử lý
                </button>
                )}
                <button
                  onClick={() => setSelectedContact(contact)}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                >
                  Phản hồi
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Phản hồi yêu cầu hỗ trợ</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Yêu cầu:</p>
              <p className="text-gray-900">{selectedContact.message}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Phản hồi *</label>
              <textarea
                value={contactResponse}
                onChange={(e) => setContactResponse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={6}
                placeholder="Nhập phản hồi của bạn..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedContact(null);
                  setContactResponse("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleRespondContact}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => {
    const handleSendNotification = async () => {
      if (!notificationForm.user_id || !notificationForm.message) {
        showToast("Vui lòng điền đầy đủ thông tin", "error");
        return;
      }
      try {
        await moderatorAPI.sendNotification(notificationForm);
        showToast("Gửi thông báo thành công!", "success");
        setNotificationForm({ user_id: "", message: "", title: "Thông báo từ Moderator", type: "info" });
      } catch (error) {
        showToast("Lỗi gửi thông báo", "error");
      }
    };

    const handleSendWarning = async () => {
      if (!warningForm.user_id) {
        showToast("Vui lòng nhập User ID", "error");
        return;
      }
      try {
        await moderatorAPI.sendWarning(warningForm);
        showToast("Gửi cảnh báo thành công!", "success");
        setWarningForm({ user_id: "", reason: "Vi phạm quy định cộng đồng", content_id: "", content_type: "post" });
      } catch (error) {
        showToast("Lỗi gửi cảnh báo", "error");
      }
    };

    return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Gửi Thông Báo</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">User ID *</label>
              <input
                type="number"
                value={notificationForm.user_id}
                onChange={(e) => setNotificationForm({ ...notificationForm, user_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="ID người dùng"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề</label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nội dung *</label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={4}
                placeholder="Nội dung thông báo"
              />
            </div>
            <button
              onClick={handleSendNotification}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Gửi thông báo
            </button>
          </div>
      </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Gửi Cảnh Báo Vi Phạm</h3>
      <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">User ID *</label>
              <input
                type="number"
                value={warningForm.user_id}
                onChange={(e) => setWarningForm({ ...warningForm, user_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="ID người dùng"
              />
                </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lý do vi phạm</label>
              <input
                type="text"
                value={warningForm.reason}
                onChange={(e) => setWarningForm({ ...warningForm, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content ID (tùy chọn)</label>
              <input
                type="number"
                value={warningForm.content_id}
                onChange={(e) => setWarningForm({ ...warningForm, content_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="ID bài viết/bình luận"
              />
              </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loại nội dung</label>
              <select
                value={warningForm.content_type}
                onChange={(e) => setWarningForm({ ...warningForm, content_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="post">Bài viết</option>
                <option value="comment">Bình luận</option>
              </select>
            </div>
            <button
              onClick={handleSendWarning}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Gửi cảnh báo
            </button>
          </div>
      </div>
    </div>
  );
  };

  const renderWarnings = () => {
    const getSeverityColor = (count: number) => {
      if (count >= 10) return "bg-red-100 text-red-800 border-red-300";
      if (count >= 5) return "bg-orange-100 text-orange-800 border-orange-300";
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    };

    const openBanModal = (userId: number, banType: 'account' | 'post' | 'comment') => {
      setBanModal({
        isOpen: true,
        userId,
        banType,
        duration: '1d',
        reason: 'Vi phạm quy định cộng đồng - Đã vi phạm từ khóa cấm nhiều lần',
      });
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Cảnh Báo Người Dùng Vi Phạm</h3>
              <p className="text-sm text-gray-500 mt-1">
                Danh sách người dùng đã vi phạm từ khóa cấm từ 3 lần trở lên
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm username, email..."
                value={warningUsersSearch}
                onChange={(e) => setWarningUsersSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {warningUsers.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có người dùng nào cần cảnh báo</p>
            </div>
          ) : (
            warningUsers.map((user) => {
              const violationCount = user.violation_count || 0;
              return (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {user.full_name || user.username}
                          </h4>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getSeverityColor(violationCount)}`}>
                          ⚠️ {violationCount} lần vi phạm
                        </span>
                        {user.is_account_banned && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            🔒 Đã khóa tài khoản
                          </span>
                        )}
                        {user.is_post_banned && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            📝 Đã khóa đăng bài
                          </span>
                        )}
                        {user.is_comment_banned && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            💬 Đã khóa bình luận
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {!user.is_account_banned && (
                        <button
                          onClick={() => openBanModal(user.id, 'account')}
                          className="flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg transition-colors"
                          title="Khóa tài khoản"
                        >
                          <Ban className="w-4 h-4" />
                          <span className="text-sm font-semibold">Khóa TK</span>
                        </button>
                      )}
                      {!user.is_post_banned && (
                        <button
                          onClick={() => openBanModal(user.id, 'post')}
                          className="flex items-center space-x-1 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-2 rounded-lg transition-colors"
                          title="Khóa đăng bài"
                        >
                          <Ban className="w-4 h-4" />
                          <span className="text-sm font-semibold">Khóa ĐB</span>
                        </button>
                      )}
                      {!user.is_comment_banned && (
                        <button
                          onClick={() => openBanModal(user.id, 'comment')}
                          className="flex items-center space-x-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg transition-colors"
                          title="Khóa bình luận"
                        >
                          <Ban className="w-4 h-4" />
                          <span className="text-sm font-semibold">Khóa BL</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {warningUsersPagination.pages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setWarningUsersPage((p) => Math.max(1, p - 1))}
              disabled={warningUsersPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-4 py-2">
              Trang {warningUsersPage} / {warningUsersPagination.pages}
            </span>
            <button
              onClick={() => setWarningUsersPage((p) => Math.min(warningUsersPagination.pages, p + 1))}
              disabled={warningUsersPage >= warningUsersPagination.pages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderBannedUsers = () => {
    const formatBanDate = (dateString: string | null) => {
      if (!dateString) return "Vĩnh viễn";
      const date = new Date(dateString);
      const now = new Date();
      if (date > now) {
        return date.toLocaleString("vi-VN");
      }
      return "Đã hết hạn";
    };

    const getBanStatus = (user: any) => {
      const now = new Date();
      // Check if user has any active ban (not null and not expired)
      const accountBanned = user.account_banned_until && new Date(user.account_banned_until) > now;
      const postBanned = user.post_banned_until && new Date(user.post_banned_until) > now;
      const commentBanned = user.comment_banned_until && new Date(user.comment_banned_until) > now;
      
      // Also check if user has ban fields set (even if expired, we should show unban option)
      // This handles cases where ban might have expired but still exists in DB
      const hasAccountBan = user.account_banned_until !== null && user.account_banned_until !== undefined;
      const hasPostBan = user.post_banned_until !== null && user.post_banned_until !== undefined;
      const hasCommentBan = user.comment_banned_until !== null && user.comment_banned_until !== undefined;
      
      return {
        account: accountBanned || hasAccountBan,
        post: postBanned || hasPostBan,
        comment: commentBanned || hasCommentBan,
      };
    };

    return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Quản Lý Tài Khoản Bị Khóa</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm username, email..."
                  value={bannedUsersSearch}
                  onChange={(e) => setBannedUsersSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={bannedUsersFilter}
                onChange={(e) => setBannedUsersFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Tất cả loại khóa</option>
                <option value="account">Khóa tài khoản</option>
                <option value="post">Khóa đăng bài</option>
                <option value="comment">Khóa bình luận</option>
              </select>
            </div>
          </div>
      </div>

        <div className="space-y-4">
          {bannedUsers.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có tài khoản nào bị khóa</p>
            </div>
          ) : (
            bannedUsers.map((user) => {
              const banStatus = getBanStatus(user);
              return (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {user.full_name || user.username}
                          </h4>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {banStatus.account && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            🔒 Khóa tài khoản đến: {formatBanDate(user.account_banned_until)}
                          </span>
                        )}
                        {banStatus.post && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            📝 Khóa đăng bài đến: {formatBanDate(user.post_banned_until)}
                          </span>
                        )}
                        {banStatus.comment && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            💬 Khóa bình luận đến: {formatBanDate(user.comment_banned_until)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4 flex-wrap">
                      {/* Đếm số loại ban */}
                      {(() => {
                        const banCount = [banStatus.account, banStatus.post, banStatus.comment].filter(Boolean).length;
                        const hasAnyBan = banStatus.account || banStatus.post || banStatus.comment;
                        
                        // Nếu có nhiều hơn 1 loại ban, hiển thị nút "Mở khóa tất cả"
                        if (banCount > 1) {
                          return (
                            <>
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Mở khóa tất cả",
                                    message: `Bạn có chắc muốn mở khóa tất cả các loại khóa cho ${user.username}?`,
                                    onConfirm: () => {
                                      handleUnbanAll(user.id, banStatus);
                                      setConfirmModal(null);
                                    },
                                  });
                                }}
                                className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors"
                                title="Mở khóa tất cả"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Mở khóa tất cả</span>
                              </button>
                              {banStatus.account && (
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: "Mở khóa tài khoản",
                                      message: `Bạn có chắc muốn mở khóa tài khoản của ${user.username}?`,
                                      onConfirm: () => {
                                        handleUnbanUser(user.id, 'account');
                                        setConfirmModal(null);
                                      },
                                    });
                                  }}
                                  className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors"
                                  title="Mở khóa tài khoản"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm">Mở khóa TK</span>
                                </button>
                              )}
                              {banStatus.post && (
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: "Mở khóa đăng bài",
                                      message: `Bạn có chắc muốn mở khóa đăng bài cho ${user.username}?`,
                                      onConfirm: () => {
                                        handleUnbanUser(user.id, 'post');
                                        setConfirmModal(null);
                                      },
                                    });
                                  }}
                                  className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors"
                                  title="Mở khóa đăng bài"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm">Mở khóa ĐB</span>
                                </button>
                              )}
                              {banStatus.comment && (
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: "Mở khóa bình luận",
                                      message: `Bạn có chắc muốn mở khóa bình luận cho ${user.username}?`,
                                      onConfirm: () => {
                                        handleUnbanUser(user.id, 'comment');
                                        setConfirmModal(null);
                                      },
                                    });
                                  }}
                                  className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors"
                                  title="Mở khóa bình luận"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm">Mở khóa BL</span>
                                </button>
                              )}
                            </>
                          );
                        }
                        
                        // Nếu chỉ có 1 loại ban, hiển thị nút mở khóa tương ứng
                        if (banCount === 1) {
                          if (banStatus.account) {
                            return (
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Mở khóa tài khoản",
                                    message: `Bạn có chắc muốn mở khóa tài khoản của ${user.username}?`,
                                    onConfirm: () => {
                                      handleUnbanUser(user.id, 'account');
                                      setConfirmModal(null);
                                    },
                                  });
                                }}
                                className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors"
                                title="Mở khóa tài khoản"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Mở khóa TK</span>
                              </button>
                            );
                          }
                          if (banStatus.post) {
                            return (
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Mở khóa đăng bài",
                                    message: `Bạn có chắc muốn mở khóa đăng bài cho ${user.username}?`,
                                    onConfirm: () => {
                                      handleUnbanUser(user.id, 'post');
                                      setConfirmModal(null);
                                    },
                                  });
                                }}
                                className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors"
                                title="Mở khóa đăng bài"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Mở khóa ĐB</span>
                              </button>
                            );
                          }
                          if (banStatus.comment) {
                            return (
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Mở khóa bình luận",
                                    message: `Bạn có chắc muốn mở khóa bình luận cho ${user.username}?`,
                                    onConfirm: () => {
                                      handleUnbanUser(user.id, 'comment');
                                      setConfirmModal(null);
                                    },
                                  });
                                }}
                                className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors"
                                title="Mở khóa bình luận"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Mở khóa BL</span>
                              </button>
                            );
                          }
                        }
                        
                        // Fallback: Nếu không có ban nào được phát hiện nhưng user vẫn có ban trong DB
                        if (!hasAnyBan && (user.account_banned_until !== null || user.post_banned_until !== null || user.comment_banned_until !== null)) {
                          const banTypes = [];
                          if (user.account_banned_until !== null) banTypes.push('account');
                          if (user.post_banned_until !== null) banTypes.push('post');
                          if (user.comment_banned_until !== null) banTypes.push('comment');
                          
                          if (banTypes.length === 1) {
                            return (
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Mở khóa",
                                    message: `Bạn có chắc muốn mở khóa cho ${user.username}?`,
                                    onConfirm: () => {
                                      handleUnbanUser(user.id, banTypes[0]);
                                      setConfirmModal(null);
                                    },
                                  });
                                }}
                                className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors"
                                title="Mở khóa"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Mở khóa</span>
                              </button>
                            );
                          } else if (banTypes.length > 1) {
                            return (
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Mở khóa tất cả",
                                    message: `Bạn có chắc muốn mở khóa tất cả các loại khóa cho ${user.username}?`,
                                    onConfirm: () => {
                                      handleUnbanAll(user.id, {
                                        account: banTypes.includes('account'),
                                        post: banTypes.includes('post'),
                                        comment: banTypes.includes('comment'),
                                      });
                                      setConfirmModal(null);
                                    },
                                  });
                                }}
                                className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors"
                                title="Mở khóa tất cả"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Mở khóa tất cả</span>
                              </button>
                            );
                          }
                        }
                        
                        return null;
                      })()}
              </div>
            </div>
                </motion.div>
              );
            })
          )}
        </div>

        {bannedUsersPagination.totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setBannedUsersPage((p) => Math.max(1, p - 1))}
              disabled={bannedUsersPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-4 py-2">
              Trang {bannedUsersPage} / {bannedUsersPagination.totalPages}
            </span>
            <button
              onClick={() => setBannedUsersPage((p) => Math.min(bannedUsersPagination.totalPages, p + 1))}
              disabled={bannedUsersPage >= bannedUsersPagination.totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Sau
            </button>
      </div>
        )}
    </div>
  );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Moderator Dashboard</h1>
          <p className="text-gray-600 mt-2">Quản lý và kiểm duyệt nội dung VieGo Blog</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tổng Bài Viết</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPosts || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tổng Bình Luận</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalComments || 0}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Yêu Cầu Hỗ Trợ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContacts || 0}</p>
              </div>
              <HelpCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Từ Khóa Cấm</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBannedKeywords || 0}</p>
              </div>
              <Ban className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === "posts" && renderPosts()}
        {activeTab === "comments" && renderComments()}
        {activeTab === "keywords" && renderKeywords()}
        {activeTab === "warnings" && renderWarnings()}
        {activeTab === "banned-users" && renderBannedUsers()}
        {activeTab === "contacts" && renderContacts()}
        {activeTab === "notifications" && renderNotifications()}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Success Popup */}
      <SuccessPopup
        isOpen={successPopup.isOpen}
        onClose={() => setSuccessPopup({ ...successPopup, isOpen: false })}
        message={successPopup.message}
        type={successPopup.type}
        duration={3000}
      />

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
        />
      )}

      {/* Ban Modal */}
      {banModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-semibold mb-4">
                {banModal.banType === 'account' && '🔒 Khóa Tài Khoản'}
                {banModal.banType === 'post' && '📝 Khóa Đăng Bài'}
                {banModal.banType === 'comment' && '💬 Khóa Bình Luận'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Thời gian khóa *</label>
                  <select
                    value={banModal.duration}
                    onChange={(e) => setBanModal({ ...banModal, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="30min">30 phút</option>
                    <option value="2h">2 giờ</option>
                    <option value="1d">1 ngày</option>
                    <option value="3d">3 ngày</option>
                    <option value="7d">7 ngày</option>
                    <option value="permanent">Vĩnh viễn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lý do *</label>
                  <textarea
                    value={banModal.reason}
                    onChange={(e) => setBanModal({ ...banModal, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Nhập lý do khóa..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleBanUser}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Xác nhận khóa
                  </button>
                  <button
                    onClick={() => setBanModal({ ...banModal, isOpen: false })}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      {/* Post Modal */}
      {selectedPostSlug && (
        <PostModal
          slug={selectedPostSlug}
          onClose={() => setSelectedPostSlug(null)}
        />
      )}
    </div>
  );
}
