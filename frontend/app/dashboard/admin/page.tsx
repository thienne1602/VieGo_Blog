"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  MessageCircle,
  AlertTriangle,
  TrendingUp,
  Settings,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Plus,
  BarChart3,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  X,
} from "lucide-react";

// Toast notification component
const Toast = ({ message, type, onClose }: any) => (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${
      type === "success"
        ? "bg-green-600 text-white"
        : type === "error"
        ? "bg-red-600 text-white"
        : "bg-blue-600 text-white"
    }`}
  >
    <span>{message}</span>
    <button onClick={onClose} className="ml-4">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

// API functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const adminAPI = {
  getStats: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No token - 401");

    const response = await fetch(`${API_BASE_URL}/api/admin/stats/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) throw new Error("Unauthorized - 401");
    if (response.status === 403) throw new Error("Forbidden - 403");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return response.json();
  },

  getRecentActivity: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No token - 401");

    const response = await fetch(`${API_BASE_URL}/api/admin/activity/recent`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) throw new Error("Unauthorized - 401");
    if (response.status === 403) throw new Error("Forbidden - 403");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return response.json();
  },

  getUsers: async (params: any = {}) => {
    const token = localStorage.getItem("access_token");
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/api/admin/users?${queryParams}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
  },

  updateUser: async (userId: number, data: any) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update user");
    return response.json();
  },

  deleteUser: async (userId: number) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to delete user");
    return response.json();
  },

  banUser: async (userId: number) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_BASE_URL}/api/admin/users/${userId}/ban`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to ban user");
    return response.json();
  },

  unbanUser: async (userId: number) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_BASE_URL}/api/admin/users/${userId}/unban`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to unban user");
    return response.json();
  },

  getPosts: async (params: any = {}) => {
    const token = localStorage.getItem("access_token");
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/api/admin/posts?${queryParams}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch posts");
    return response.json();
  },

  updatePost: async (postId: number, data: any) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update post");
    return response.json();
  },

  deletePost: async (postId: number) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to delete post");
    return response.json();
  },

  getComments: async (params: any = {}) => {
    const token = localStorage.getItem("access_token");
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/api/admin/comments?${queryParams}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch comments");
    return response.json();
  },

  deleteComment: async (commentId: number) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_BASE_URL}/api/admin/comments/${commentId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to delete comment");
    return response.json();
  },

  getAnalytics: async (days: number = 30) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_BASE_URL}/api/admin/analytics/overview?days=${days}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch analytics");
    return response.json();
  },

  getReports: async (params: any = {}) => {
    const token = localStorage.getItem("access_token");
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/api/admin/reports?${queryParams}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch reports");
    return response.json();
  },

  getReportsStats: async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch report stats");
    return response.json();
  },

  resolveReport: async (reportId: number, data: any) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_BASE_URL}/api/admin/reports/${reportId}/resolve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error("Failed to resolve report");
    return response.json();
  },

  dismissReport: async (reportId: number, data: any) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_BASE_URL}/api/admin/reports/${reportId}/dismiss`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error("Failed to dismiss report");
    return response.json();
  },

  getSettings: async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
  },

  updateSettings: async (data: any) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update settings");
    return response.json();
  },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      // Migrate old token if exists
      const oldToken = localStorage.getItem("viego_token");
      const newToken = localStorage.getItem("access_token");

      if (oldToken && !newToken) {
        console.log("Migrating token from viego_token to access_token");
        localStorage.setItem("access_token", oldToken);
        localStorage.removeItem("viego_token");
      }

      // Check if token exists
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No access token found - redirecting to login");
        showToast("Vui lòng đăng nhập lại", "error");
        setTimeout(() => router.push("/login"), 1500);
        return;
      }

      // Check if user is admin
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role !== "admin" && user.role !== "moderator") {
            console.error("User is not admin - access denied");
            showToast("Bạn không có quyền truy cập Admin Dashboard", "error");
            setTimeout(() => router.push("/dashboard"), 1500);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, [router]);

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    pendingReports: 0,
    todayNewUsers: 0,
    todayNewPosts: 0,
    todayNewComments: 0,
    totalViews: 0,
    todayViews: 0,
    activeUsers: 0,
    systemStatus: 99.8,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersPagination, setUsersPagination] = useState<any>({});
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("");
  const [usersStatusFilter, setUsersStatusFilter] = useState("");
  const [usersPage, setUsersPage] = useState(1);

  // User modals state
  const [editUserModal, setEditUserModal] = useState<any>(null);
  const [viewUserModal, setViewUserModal] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<any>(null);

  // Posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [postsPagination, setPostsPagination] = useState<any>({});
  const [postsSearch, setPostsSearch] = useState("");
  const [postsStatusFilter, setPostsStatusFilter] = useState("");
  const [postsCategoryFilter, setPostsCategoryFilter] = useState("");
  const [postsPage, setPostsPage] = useState(1);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [commentsPagination, setCommentsPagination] = useState<any>({});
  const [commentsPage, setCommentsPage] = useState(1);

  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [reportsPagination, setReportsPagination] = useState<any>({});
  const [reportsStats, setReportsStats] = useState<any>({});
  const [reportsStatusFilter, setReportsStatusFilter] = useState("");
  const [reportsPriorityFilter, setReportsPriorityFilter] = useState("");
  const [reportsPage, setReportsPage] = useState(1);

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null);

  // Settings state
  const [settings, setSettings] = useState<any>(null);

  // Toast helper
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load data based on active tab
  useEffect(() => {
    if (authChecked) {
      loadData();
    }
  }, [activeTab, authChecked]);

  // Reload users when filters change
  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    }
  }, [usersPage, usersSearch, usersRoleFilter, usersStatusFilter]);

  // Reload posts when filters change
  useEffect(() => {
    if (activeTab === "content") {
      loadPosts();
    }
  }, [postsPage, postsSearch, postsStatusFilter, postsCategoryFilter]);

  // Reload comments when page changes
  useEffect(() => {
    if (activeTab === "comments") {
      loadComments();
    }
  }, [commentsPage]);

  // Reload reports when filters change
  useEffect(() => {
    if (activeTab === "reports") {
      loadReports();
    }
  }, [reportsPage, reportsStatusFilter, reportsPriorityFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const [statsData, activityData] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getRecentActivity(),
        ]);
        setStats(statsData);
        setRecentActivity(activityData);
      } else if (activeTab === "users") {
        await loadUsers();
      } else if (activeTab === "content") {
        await loadPosts();
      } else if (activeTab === "comments") {
        await loadComments();
      } else if (activeTab === "reports") {
        await loadReports();
        const statsData = await adminAPI.getReportsStats();
        setReportsStats(statsData);
      } else if (activeTab === "analytics") {
        const data = await adminAPI.getAnalytics(30);
        setAnalytics(data);
      } else if (activeTab === "settings") {
        const data = await adminAPI.getSettings();
        setSettings(data);
      }
    } catch (error: any) {
      console.error("Failed to load data:", error);

      // Handle authentication errors
      if (
        error.message?.includes("401") ||
        error.message?.includes("Unauthorized")
      ) {
        showToast("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại", "error");
        localStorage.clear();
        setTimeout(() => router.push("/login"), 2000);
      } else if (
        error.message?.includes("403") ||
        error.message?.includes("Forbidden")
      ) {
        showToast("Bạn không có quyền truy cập", "error");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        showToast("Không thể tải dữ liệu. Vui lòng thử lại", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params: any = { page: usersPage, per_page: 20 };
      if (usersSearch) params.search = usersSearch;
      if (usersRoleFilter) params.role = usersRoleFilter;
      if (usersStatusFilter) params.status = usersStatusFilter;

      const data = await adminAPI.getUsers(params);
      setUsers(data.users);
      setUsersPagination(data.pagination);
    } catch (error) {
      console.error("Failed to load users:", error);
      showToast("Failed to load users", "error");
    }
  };

  const loadPosts = async () => {
    try {
      const params: any = { page: postsPage, per_page: 20 };
      if (postsSearch) params.search = postsSearch;
      if (postsStatusFilter) params.status = postsStatusFilter;
      if (postsCategoryFilter) params.category = postsCategoryFilter;

      const data = await adminAPI.getPosts(params);
      setPosts(data.posts);
      setPostsPagination(data.pagination);
    } catch (error) {
      console.error("Failed to load posts:", error);
      showToast("Failed to load posts", "error");
    }
  };

  const loadComments = async () => {
    try {
      const data = await adminAPI.getComments({
        page: commentsPage,
        per_page: 20,
      });
      setComments(data.comments);
      setCommentsPagination(data.pagination);
    } catch (error) {
      console.error("Failed to load comments:", error);
      showToast("Failed to load comments", "error");
    }
  };

  const loadReports = async () => {
    try {
      const params: any = { page: reportsPage, per_page: 20 };
      if (reportsStatusFilter) params.status = reportsStatusFilter;
      if (reportsPriorityFilter) params.priority = reportsPriorityFilter;

      const data = await adminAPI.getReports(params);
      setReports(data.reports);
      setReportsPagination(data.pagination);
    } catch (error) {
      console.error("Failed to load reports:", error);
      showToast("Failed to load reports", "error");
    }
  };

  const handleUserAction = async (action: string, userId: number) => {
    try {
      if (action === "ban") {
        setConfirmModal({
          title: "Ban User",
          message:
            "Are you sure you want to ban this user? They will not be able to access the platform.",
          action: async () => {
            await adminAPI.banUser(userId);
            showToast("User banned successfully", "success");
            loadUsers();
          },
        });
      } else if (action === "unban") {
        await adminAPI.unbanUser(userId);
        showToast("User unbanned successfully", "success");
        loadUsers();
      } else if (action === "delete") {
        setConfirmModal({
          title: "Delete User",
          message:
            "Are you sure you want to delete this user? This action cannot be undone and will remove all their content.",
          action: async () => {
            await adminAPI.deleteUser(userId);
            showToast("User deleted successfully", "success");
            loadUsers();
          },
        });
      } else if (action === "edit") {
        const user = users.find((u) => u.id === userId);
        if (user) {
          setEditUserModal({
            ...user,
            originalRole: user.role,
          });
        }
      } else if (action === "view") {
        const user = users.find((u) => u.id === userId);
        if (user) {
          setViewUserModal(user);
        }
      }
    } catch (error) {
      showToast("Failed to perform action", "error");
      console.error(error);
    }
  };

  const handleUpdateUser = async (userId: number, data: any) => {
    try {
      await adminAPI.updateUser(userId, data);
      showToast("User updated successfully", "success");
      setEditUserModal(null);
      loadUsers();
    } catch (error) {
      showToast("Failed to update user", "error");
      console.error(error);
    }
  };

  const handlePostAction = async (action: string, postId: number) => {
    try {
      if (action === "delete") {
        if (confirm("Are you sure you want to delete this post?")) {
          await adminAPI.deletePost(postId);
          showToast("Post deleted successfully", "success");
          loadPosts();
        }
      } else if (action === "publish") {
        await adminAPI.updatePost(postId, { status: "published" });
        showToast("Post published successfully", "success");
        loadPosts();
      } else if (action === "feature") {
        await adminAPI.updatePost(postId, { featured: true });
        showToast("Post featured successfully", "success");
        loadPosts();
      }
    } catch (error) {
      showToast("Failed to perform action", "error");
      console.error(error);
    }
  };

  const handleCommentAction = async (action: string, commentId: number) => {
    try {
      if (action === "delete") {
        if (confirm("Are you sure you want to delete this comment?")) {
          await adminAPI.deleteComment(commentId);
          showToast("Comment deleted successfully", "success");
          loadComments();
        }
      }
    } catch (error) {
      showToast("Failed to perform action", "error");
      console.error(error);
    }
  };

  const handleReportAction = async (action: string, reportId: number) => {
    try {
      if (action === "resolve") {
        const actionTaken = prompt(
          "Action taken (none/content_removed/user_warned/user_banned):"
        );
        const notes = prompt("Resolution notes:");
        if (actionTaken) {
          await adminAPI.resolveReport(reportId, { actionTaken, notes });
          showToast("Report resolved successfully", "success");
          loadReports();
        }
      } else if (action === "dismiss") {
        const notes = prompt("Dismissal notes:");
        await adminAPI.dismissReport(reportId, { notes });
        showToast("Report dismissed successfully", "success");
        loadReports();
      }
    } catch (error) {
      showToast("Failed to perform action", "error");
      console.error(error);
    }
  };

  const handleSettingsSave = async () => {
    try {
      await adminAPI.updateSettings(settings);
      showToast("Settings saved successfully", "success");
    } catch (error) {
      showToast("Failed to save settings", "error");
      console.error(error);
    }
  };

  const sidebarItems = [
    {
      id: "overview",
      icon: BarChart3,
      label: "Tổng Quan",
      color: "text-blue-600",
    },
    {
      id: "users",
      icon: Users,
      label: "Quản Lý Users",
      color: "text-green-600",
    },
    {
      id: "content",
      icon: FileText,
      label: "Quản Lý Nội Dung",
      color: "text-purple-600",
    },
    {
      id: "comments",
      icon: MessageCircle,
      label: "Quản Lý Comments",
      color: "text-indigo-600",
    },
    {
      id: "reports",
      icon: AlertTriangle,
      label: "Báo Cáo & Khiếu Nại",
      color: "text-red-600",
    },
    {
      id: "analytics",
      icon: TrendingUp,
      label: "Phân Tích",
      color: "text-orange-600",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Cài Đặt Hệ Thống",
      color: "text-gray-600",
    },
  ];

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value.toLocaleString()}
          </p>
          {change && (
            <p
              className={`text-sm ${
                change > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {change > 0 ? "+" : ""}
              {change} hôm nay
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Tổng Người Dùng"
              value={stats.totalUsers}
              change={stats.todayNewUsers}
              icon={Users}
              color="text-blue-600"
            />
            <StatCard
              title="Tổng Bài Viết"
              value={stats.totalPosts}
              change={stats.todayNewPosts}
              icon={FileText}
              color="text-green-600"
            />
            <StatCard
              title="Tổng Comments"
              value={stats.totalComments}
              change={stats.todayNewComments}
              icon={MessageCircle}
              color="text-purple-600"
            />
            <StatCard
              title="Báo Cáo Chờ Xử Lý"
              value={stats.pendingReports}
              change={null}
              icon={AlertTriangle}
              color="text-red-600"
            />
            <StatCard
              title="Lượt Xem Hôm Nay"
              value={stats.todayViews}
              change={null}
              icon={Eye}
              color="text-orange-600"
            />
            <StatCard
              title="Hoạt Động Hệ Thống"
              value={stats.systemStatus}
              change={null}
              icon={Globe}
              color="text-teal-600"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🚀 Thao Tác Nhanh
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab("users")}
                className="flex items-center space-x-2 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Quản Lý Users
                </span>
              </button>
              <button
                onClick={() => setActiveTab("content")}
                className="flex items-center space-x-2 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              >
                <FileText className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Quản Lý Posts
                </span>
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className="flex items-center space-x-2 p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Shield className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-900">
                  Xem Reports
                </span>
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Phân Tích
                </span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📈 Hoạt Động Gần Đây
            </h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Không có hoạt động gần đây
                </p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.category === "success"
                            ? "bg-green-500"
                            : activity.category === "warning"
                            ? "bg-yellow-500"
                            : activity.category === "error"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <span className="text-sm text-gray-700">
                        {activity.action}: <strong>{activity.user}</strong>
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.time).toLocaleString("vi-VN")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Search and Filter */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm user..."
                    value={usersSearch}
                    onChange={(e) => {
                      setUsersSearch(e.target.value);
                      setUsersPage(1);
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={usersRoleFilter}
                  onChange={(e) => {
                    setUsersRoleFilter(e.target.value);
                    setUsersPage(1);
                  }}
                >
                  <option value="">Tất cả roles</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </select>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={usersStatusFilter}
                  onChange={(e) => {
                    setUsersStatusFilter(e.target.value);
                    setUsersPage(1);
                  }}
                >
                  <option value="">Tất cả status</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                👥 Danh Sách Người Dùng ({usersPagination.totalItems || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posts
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Không có user nào
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={
                                user.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${user.username}&background=random`
                              }
                              alt=""
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.fullName || user.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === "admin"
                                ? "bg-red-100 text-red-800"
                                : user.role === "moderator"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.postsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive ? "Active" : "Banned"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUserAction("view", user.id)}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserAction("edit", user.id)}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {user.isActive ? (
                              <button
                                onClick={() => handleUserAction("ban", user.id)}
                                className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded transition"
                                title="Ban User"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleUserAction("unban", user.id)
                                }
                                className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition"
                                title="Unban User"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleUserAction("delete", user.id)
                              }
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {usersPagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Page {usersPagination.currentPage} of{" "}
                    {usersPagination.totalPages} ({usersPagination.totalItems}{" "}
                    users)
                  </span>
                  <div className="flex space-x-2">
                    <button
                      disabled={usersPage === 1}
                      onClick={() => setUsersPage(usersPage - 1)}
                      className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={usersPage === usersPagination.totalPages}
                      onClick={() => setUsersPage(usersPage + 1)}
                      className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài viết..."
                    value={postsSearch}
                    onChange={(e) => {
                      setPostsSearch(e.target.value);
                      setPostsPage(1);
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  value={postsStatusFilter}
                  onChange={(e) => {
                    setPostsStatusFilter(e.target.value);
                    setPostsPage(1);
                  }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                </select>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  value={postsCategoryFilter}
                  onChange={(e) => {
                    setPostsCategoryFilter(e.target.value);
                    setPostsPage(1);
                  }}
                >
                  <option value="">Tất cả danh mục</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food</option>
                  <option value="culture">Culture</option>
                  <option value="adventure">Adventure</option>
                </select>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                📝 Danh Sách Bài Viết ({postsPagination.totalItems || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Bài Viết
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Tác Giả
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Trạng Thái
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Danh Mục
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Lượt Xem
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Ngày Tạo
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Không có bài viết nào
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {post.featuredImage && (
                              <img
                                src={post.featuredImage}
                                alt=""
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {post.title}
                              </div>
                              {post.featured && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {post.author && (
                            <div className="text-sm text-gray-900">
                              {post.author.username}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              post.status === "published"
                                ? "bg-green-100 text-green-800"
                                : post.status === "draft"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {post.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {post.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {post.viewsCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                window.open(`/posts/${post.slug}`, "_blank")
                              }
                              className="text-blue-600 hover:text-blue-900"
                              title="View Post"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {post.status === "draft" && (
                              <button
                                onClick={() =>
                                  handlePostAction("publish", post.id)
                                }
                                className="text-green-600 hover:text-green-900"
                                title="Publish"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handlePostAction("delete", post.id)
                              }
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {postsPagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Page {postsPagination.currentPage} of{" "}
                    {postsPagination.totalPages} ({postsPagination.totalItems}{" "}
                    posts)
                  </span>
                  <div className="flex space-x-2">
                    <button
                      disabled={postsPage === 1}
                      onClick={() => setPostsPage(postsPage - 1)}
                      className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={postsPage === postsPagination.totalPages}
                      onClick={() => setPostsPage(postsPage + 1)}
                      className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🚨 Báo Cáo & Khiếu Nại
        </h3>
        <div className="space-y-4">
          <p className="text-gray-600">
            Hệ thống quản lý báo cáo đã được hoàn thiện. Sử dụng filters bên
            dưới để lọc reports.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">
                    Spam Reports
                  </p>
                  <p className="text-2xl font-bold text-red-700">
                    {reportsStats.spamReports || 0}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">
                    Inappropriate Content
                  </p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {reportsStats.inappropriateContent || 0}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Resolved Today
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {reportsStats.todayResolved || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 pt-4">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2"
              value={reportsStatusFilter}
              onChange={(e) => {
                setReportsStatusFilter(e.target.value);
                setReportsPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2"
              value={reportsPriorityFilter}
              onChange={(e) => {
                setReportsPriorityFilter(e.target.value);
                setReportsPage(1);
              }}
            >
              <option value="">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : reports.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              📋 Reports List ({reportsPagination.totalItems || 0})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Reporter
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{report.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.reporter?.username || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {report.reportType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {report.reason.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : report.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : report.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {report.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleReportAction("resolve", report.id)
                              }
                              className="text-green-600 hover:text-green-900"
                              title="Resolve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleReportAction("dismiss", report.id)
                              }
                              className="text-red-600 hover:text-red-900"
                              title="Dismiss"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reportsPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Page {reportsPage} of {reportsPagination.totalPages}
                </span>
                <div className="flex space-x-2">
                  <button
                    disabled={reportsPage === 1}
                    onClick={() => setReportsPage(reportsPage - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={reportsPage === reportsPagination.totalPages}
                    onClick={() => setReportsPage(reportsPage + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
          Không có báo cáo nào
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Phân Tích Hệ Thống
            </h3>
            {analytics ? (
              <div className="space-y-6">
                {/* Top Authors */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    🏆 Top Tác Giả
                  </h4>
                  <div className="space-y-2">
                    {analytics.topAuthors && analytics.topAuthors.length > 0 ? (
                      analytics.topAuthors.map((author: any, index: number) => (
                        <div
                          key={author.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold text-gray-400">
                              #{index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {author.fullName || author.username}
                              </p>
                              <p className="text-xs text-gray-500">
                                @{author.username}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-blue-600">
                            {author.postCount} bài viết
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Chưa có dữ liệu
                      </p>
                    )}
                  </div>
                </div>

                {/* Top Posts */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    📈 Bài Viết Phổ Biến
                  </h4>
                  <div className="space-y-2">
                    {analytics.topPosts && analytics.topPosts.length > 0 ? (
                      analytics.topPosts.map((post: any, index: number) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold text-gray-400">
                              #{index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {post.title}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-600">
                              👁️ {post.viewsCount.toLocaleString()}
                            </span>
                            <span className="text-gray-600">
                              ❤️ {post.likesCount}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Chưa có dữ liệu
                      </p>
                    )}
                  </div>
                </div>

                {/* Category Distribution */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    📂 Phân Bố Danh Mục
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {analytics.categoryDistribution &&
                    analytics.categoryDistribution.length > 0 ? (
                      analytics.categoryDistribution.map((cat: any) => (
                        <div
                          key={cat.category}
                          className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                        >
                          <p className="text-sm text-gray-600 capitalize">
                            {cat.category}
                          </p>
                          <p className="text-2xl font-bold text-blue-700">
                            {cat.count}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4 col-span-3">
                        Chưa có dữ liệu
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                Đang tải dữ liệu phân tích...
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⚙️ Cài Đặt Hệ Thống
          </h3>
          {settings && (
            <div className="space-y-6">
              {/* Site Settings */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  🌐 Thông Tin Website
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên Website
                    </label>
                    <input
                      type="text"
                      value={settings.siteName || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, siteName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô Tả
                    </label>
                    <textarea
                      value={settings.siteDescription || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          siteDescription: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  🔧 Tính Năng
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Cho phép đăng ký
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.registrationEnabled || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          registrationEnabled: e.target.checked,
                        })
                      }
                      className="toggle"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Bật chế độ bảo trì
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maintenanceMode: e.target.checked,
                        })
                      }
                      className="toggle"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Cho phép comments
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.commentsEnabled || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          commentsEnabled: e.target.checked,
                        })
                      }
                      className="toggle"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Thông báo qua email
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          emailNotifications: e.target.checked,
                        })
                      }
                      className="toggle"
                    />
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSettingsSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💾 Lưu Cài Đặt
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderComments = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              💬 Danh Sách Comments ({commentsPagination.totalItems || 0})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Author
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Content
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Post
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Không có comment nào
                    </td>
                  </tr>
                ) : (
                  comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comment.author && (
                          <div className="text-sm text-gray-900">
                            {comment.author.username}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {comment.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comment.post && (
                          <div className="text-sm text-gray-900">
                            {comment.post.title}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            handleCommentAction("delete", comment.id)
                          }
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {commentsPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Page {commentsPage} of {commentsPagination.totalPages}
                </span>
                <div className="flex space-x-2">
                  <button
                    disabled={commentsPage === 1}
                    onClick={() => setCommentsPage(commentsPage - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={commentsPage === commentsPagination.totalPages}
                    onClick={() => setCommentsPage(commentsPage + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!confirmModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-900">
              {confirmModal.title}
            </h3>
          </div>
          <p className="text-gray-600 mb-6">{confirmModal.message}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmModal(null)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await confirmModal.action();
                setConfirmModal(null);
              }}
              className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Edit User Modal Component
  const EditUserModal = () => {
    if (!editUserModal) return null;

    const [formData, setFormData] = useState({
      fullName: editUserModal.fullName || "",
      email: editUserModal.email || "",
      bio: editUserModal.bio || "",
      location: editUserModal.location || "",
      role: editUserModal.role || "user",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleUpdateUser(editUserModal.id, formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 my-8"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Edit className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Edit User Profile
                </h3>
              </div>
              <button
                onClick={() => setEditUserModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <img
                src={
                  editUserModal.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${editUserModal.username}&background=random`
                }
                alt={editUserModal.username}
                className="w-20 h-20 rounded-full"
              />
              <div>
                <div className="font-semibold text-gray-900">
                  @{editUserModal.username}
                </div>
                <div className="text-sm text-gray-500">
                  User ID: {editUserModal.id}
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="User bio..."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter location"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="seller">Seller</option>
              </select>
              {formData.role !== editUserModal.originalRole && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ Warning: Changing user role will affect their permissions
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setEditUserModal(null)}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  // View User Details Modal Component
  const ViewUserModal = () => {
    if (!viewUserModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 my-8"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  User Details
                </h3>
              </div>
              <button
                onClick={() => setViewUserModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* User Profile Header */}
            <div className="flex items-start space-x-6">
              <img
                src={
                  viewUserModal.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${viewUserModal.username}&background=random`
                }
                alt={viewUserModal.username}
                className="w-24 h-24 rounded-full border-4 border-blue-100"
              />
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-gray-900">
                  {viewUserModal.fullName || viewUserModal.username}
                </h4>
                <p className="text-gray-600">@{viewUserModal.username}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      viewUserModal.role === "admin"
                        ? "bg-red-100 text-red-800"
                        : viewUserModal.role === "moderator"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {viewUserModal.role}
                  </span>
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      viewUserModal.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {viewUserModal.isActive ? "Active" : "Banned"}
                  </span>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Email</div>
                <div className="font-semibold text-gray-900">
                  {viewUserModal.email}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Location</div>
                <div className="font-semibold text-gray-900">
                  {viewUserModal.location || "Not set"}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Posts</div>
                <div className="font-semibold text-gray-900">
                  {viewUserModal.postsCount || 0}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Joined</div>
                <div className="font-semibold text-gray-900">
                  {new Date(viewUserModal.createdAt).toLocaleDateString(
                    "vi-VN"
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {viewUserModal.bio && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Bio</h5>
                <p className="text-gray-600">{viewUserModal.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex justify-around bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {viewUserModal.points || 0}
                </div>
                <div className="text-sm text-gray-600">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {viewUserModal.level || 1}
                </div>
                <div className="text-sm text-gray-600">Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {viewUserModal.postsCount || 0}
                </div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewUserModal(null);
                  handleUserAction("edit", viewUserModal.id);
                }}
                className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                <Edit className="w-4 h-4 inline mr-2" />
                Edit User
              </button>
              <button
                onClick={() => setViewUserModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modals */}
      <ConfirmationModal />
      <EditUserModal />
      <ViewUserModal />

      {/* Show loading screen while checking auth */}
      {!authChecked ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang kiểm tra xác thực...</p>
          </div>
        </div>
      ) : (
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-sm min-h-screen">
            <div className="p-6">
              <h1 className="text-xl font-bold text-gray-900">
                👑 Admin Panel
              </h1>
              <p className="text-sm text-gray-600 mt-1">VieGo Blog Dashboard</p>
            </div>

            <nav className="mt-6">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-md transform scale-105"
                      : "text-gray-700 hover:bg-gray-50 hover:transform hover:scale-102"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${
                      activeTab === item.id ? item.color : "text-gray-400"
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {sidebarItems.find((item) => item.id === activeTab)?.label ||
                    "Dashboard"}
                </h2>
                <p className="text-gray-600 mt-1">
                  Quản lý và điều hành hệ thống VieGo Blog
                </p>
              </div>

              {/* Content */}
              {activeTab === "overview" && renderOverview()}
              {activeTab === "users" && renderUsers()}
              {activeTab === "content" && renderContent()}
              {activeTab === "comments" && renderComments()}
              {activeTab === "reports" && renderReports()}
              {activeTab === "analytics" && renderAnalytics()}
              {activeTab === "settings" && renderSettings()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
