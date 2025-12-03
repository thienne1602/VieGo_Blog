"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Settings,
  X,
  Menu,
  Printer,
  FileSpreadsheet,
} from "lucide-react";

import OverviewTab from "./components/OverviewTab";
import UsersTab from "./components/UsersTab";
import ContentTab from "./components/ContentTab";
import ReportsTab from "./components/ReportsTab";
import SettingsTab from "./components/SettingsTab";

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
const adminAPI = {
  getStats: async () => {
    const result = await api.get("/admin/stats/overview");
    if (!result.success)
      throw new Error(result.error || "Failed to fetch stats");
    return result.data;
  },
  getRecentActivity: async () => {
    const result = await api.get("/admin/activity/recent");
    if (!result.success)
      throw new Error(result.error || "Failed to fetch activity");
    return result.data;
  },
  getUsers: async (params: any = {}) => {
    const result = await api.get("/admin/users", params);
    if (!result.success)
      throw new Error(result.error || "Failed to fetch users");
    return result.data;
  },
  updateUser: async (userId: number, data: any) => {
    const result = await api.put(`/admin/users/${userId}`, data);
    if (!result.success)
      throw new Error(result.error || "Failed to update user");
    return result.data;
  },
  deleteUser: async (userId: number) => {
    const result = await api.delete(`/admin/users/${userId}`);
    if (!result.success)
      throw new Error(result.error || "Failed to delete user");
    return result.data;
  },
  banUser: async (userId: number) => {
    const result = await api.post(`/admin/users/${userId}/ban`, {});
    if (!result.success) throw new Error(result.error || "Failed to ban user");
    return result.data;
  },
  unbanUser: async (userId: number) => {
    const result = await api.post(`/admin/users/${userId}/unban`, {});
    if (!result.success)
      throw new Error(result.error || "Failed to unban user");
    return result.data;
  },
  getPosts: async (params: any = {}) => {
    const result = await api.get("/admin/posts", params);
    if (!result.success)
      throw new Error(result.error || "Failed to fetch posts");
    return result.data;
  },
  updatePost: async (postId: number, data: any) => {
    const result = await api.put(`/admin/posts/${postId}`, data);
    if (!result.success)
      throw new Error(result.error || "Failed to update post");
    return result.data;
  },
  deletePost: async (postId: number) => {
    const result = await api.delete(`/admin/posts/${postId}`);
    if (!result.success)
      throw new Error(result.error || "Failed to delete post");
    return result.data;
  },
  getComments: async (params: any = {}) => {
    const result = await api.get("/admin/comments", params);
    if (!result.success)
      throw new Error(result.error || "Failed to fetch comments");
    return result.data;
  },
  deleteComment: async (commentId: number) => {
    const result = await api.delete(`/admin/comments/${commentId}`);
    if (!result.success)
      throw new Error(result.error || "Failed to delete comment");
    return result.data;
  },
  getAnalytics: async (days: number = 30) => {
    const result = await api.get("/admin/analytics/overview", { days });
    if (!result.success)
      throw new Error(result.error || "Failed to fetch analytics");
    return result.data;
  },
  getReports: async (params: any = {}) => {
    const result = await api.get("/admin/reports", params);
    if (!result.success)
      throw new Error(result.error || "Failed to fetch reports");
    return result.data;
  },
  getReportsStats: async () => {
    const result = await api.get("/admin/reports/stats");
    if (!result.success)
      throw new Error(result.error || "Failed to fetch report stats");
    return result.data;
  },
  resolveReport: async (reportId: number, data: any) => {
    const result = await api.post(`/admin/reports/${reportId}/resolve`, data);
    if (!result.success)
      throw new Error(result.error || "Failed to resolve report");
    return result.data;
  },
  dismissReport: async (reportId: number, data: any) => {
    const result = await api.post(`/admin/reports/${reportId}/dismiss`, data);
    if (!result.success)
      throw new Error(result.error || "Failed to dismiss report");
    return result.data;
  },
  getSettings: async () => {
    const result = await api.get("/admin/settings");
    if (!result.success)
      throw new Error(result.error || "Failed to fetch settings");
    return result.data;
  },
  updateSettings: async (data: any) => {
    const result = await api.put("/admin/settings", data);
    if (!result.success)
      throw new Error(result.error || "Failed to update settings");
    return result.data;
  },
  exportExcel: async (days: number = 30) => {
    const filename = `admin_report_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    return await api.downloadFile(
      `/admin/analytics/export-excel?days=${days}`,
      filename
    );
  },
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const currentTabRef = useRef<string>("overview");

  // State
  const [stats, setStats] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [usersPagination, setUsersPagination] = useState<any>({});
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("");
  const [usersPage, setUsersPage] = useState(1);

  const [posts, setPosts] = useState<any[]>([]);
  const [postsPagination, setPostsPagination] = useState<any>({});
  const [postsSearch, setPostsSearch] = useState("");
  const [postsPage, setPostsPage] = useState(1);

  const [reports, setReports] = useState<any[]>([]);
  const [reportsPagination, setReportsPagination] = useState<any>({});
  const [reportsPage, setReportsPage] = useState(1);

  const [settings, setSettings] = useState<any>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      router.push("/");
      return;
    }
    loadData();
  }, [user, authLoading, activeTab]);

  // Effect for Users filter changes
  useEffect(() => {
    if (activeTab === "users") loadUsers();
  }, [usersPage, usersSearch, usersRoleFilter]);

  // Effect for Posts filter changes
  useEffect(() => {
    if (activeTab === "content") loadPosts();
  }, [postsPage, postsSearch]);

  // Effect for Reports filter changes
  useEffect(() => {
    if (activeTab === "reports") loadReports();
  }, [reportsPage]);

  const loadData = async () => {
    setLoading(true);
    currentTabRef.current = activeTab;
    try {
      if (activeTab === "overview") {
        const [statsData, activityData, analyticsData] = await Promise.all([
          adminAPI.getStats().catch(() => ({})),
          adminAPI.getRecentActivity().catch(() => []),
          adminAPI.getAnalytics(30).catch(() => null),
        ]);
        setStats(statsData);
        setRecentActivity(activityData);
        setAnalytics(analyticsData);
      } else if (activeTab === "users") {
        await loadUsers();
      } else if (activeTab === "content") {
        await loadPosts();
      } else if (activeTab === "reports") {
        await loadReports();
      } else if (activeTab === "settings") {
        const settingsData = await adminAPI.getSettings();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      showToast("Có lỗi xảy ra khi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params: any = { page: usersPage, per_page: 20 };
      if (usersSearch) params.search = usersSearch;
      if (usersRoleFilter) params.role = usersRoleFilter;
      const data = await adminAPI.getUsers(params);
      setUsers(data.users || []);
      setUsersPagination(data.pagination || {});
    } catch (error) {
      console.error(error);
    }
  };

  const loadPosts = async () => {
    try {
      const params: any = { page: postsPage, per_page: 20 };
      if (postsSearch) params.search = postsSearch;
      const data = await adminAPI.getPosts(params);
      setPosts(data.posts || []);
      setPostsPagination(data.pagination || {});
    } catch (error) {
      console.error(error);
    }
  };

  const loadReports = async () => {
    try {
      const params: any = { page: reportsPage, per_page: 20 };
      const data = await adminAPI.getReports(params);
      setReports(data.reports || []);
      setReportsPagination(data.pagination || {});
    } catch (error) {
      console.error(error);
    }
  };

  // Handlers
  const handleEditUser = (user: any) => {
    // Implement edit user modal logic here or navigate to edit page
    console.log("Edit user", user);
    showToast("Chức năng đang phát triển", "info");
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        await adminAPI.deleteUser(userId);
        showToast("Đã xóa người dùng", "success");
        loadUsers();
      } catch (error) {
        showToast("Xóa thất bại", "error");
      }
    }
  };

  const handleBanUser = async (userId: number) => {
    if (confirm("Bạn có chắc chắn muốn khóa người dùng này?")) {
      try {
        await adminAPI.banUser(userId);
        showToast("Đã khóa người dùng", "success");
        loadUsers();
      } catch (error) {
        showToast("Khóa thất bại", "error");
      }
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      await adminAPI.unbanUser(userId);
      showToast("Đã mở khóa người dùng", "success");
      loadUsers();
    } catch (error) {
      showToast("Mở khóa thất bại", "error");
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        await adminAPI.deletePost(postId);
        showToast("Đã xóa bài viết", "success");
        loadPosts();
      } catch (error) {
        showToast("Xóa thất bại", "error");
      }
    }
  };

  const handleResolveReport = async (reportId: number) => {
    try {
      await adminAPI.resolveReport(reportId, {});
      showToast("Đã xử lý báo cáo", "success");
      loadReports();
    } catch (error) {
      showToast("Xử lý thất bại", "error");
    }
  };

  const handleDismissReport = async (reportId: number) => {
    try {
      await adminAPI.dismissReport(reportId, {});
      showToast("Đã bỏ qua báo cáo", "success");
      loadReports();
    } catch (error) {
      showToast("Thao tác thất bại", "error");
    }
  };

  const handleSaveSettings = async (newSettings: any) => {
    try {
      await adminAPI.updateSettings(newSettings);
      setSettings(newSettings);
      showToast("Đã lưu cài đặt", "success");
    } catch (error) {
      showToast("Lưu thất bại", "error");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      await adminAPI.exportExcel(30);
      showToast("Đã tải xuống báo cáo Excel", "success");
    } catch (error) {
      showToast("Tải xuống thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { id: "users", label: "Người dùng", icon: Users },
    { id: "content", label: "Nội dung", icon: FileText },
    { id: "reports", label: "Báo cáo", icon: AlertTriangle },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Quản lý hệ thống và theo dõi hoạt động
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl shadow-sm hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span className="hidden sm:inline">In báo cáo</span>
            </button>
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="pr-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.full_name || user?.username}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <motion.div
          id="dashboard-content"
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              stats={stats}
              analytics={analytics}
              recentActivity={recentActivity}
            />
          )}
          {activeTab === "users" && (
            <UsersTab
              users={users}
              loading={loading}
              pagination={usersPagination}
              onSearch={setUsersSearch}
              onFilterRole={setUsersRoleFilter}
              onPageChange={setUsersPage}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onBan={handleBanUser}
              onUnban={handleUnbanUser}
            />
          )}
          {activeTab === "content" && (
            <ContentTab
              posts={posts}
              loading={loading}
              pagination={postsPagination}
              onSearch={setPostsSearch}
              onPageChange={setPostsPage}
              onDelete={handleDeletePost}
              onView={(post) => console.log("View post", post)}
            />
          )}
          {activeTab === "reports" && (
            <ReportsTab
              reports={reports}
              loading={loading}
              onResolve={handleResolveReport}
              onDismiss={handleDismissReport}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab settings={settings} onSave={handleSaveSettings} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
