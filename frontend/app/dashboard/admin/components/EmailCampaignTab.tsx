"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Send,
  Users,
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  Eye,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  AlertCircle,
  Target,
  TrendingUp,
  MousePointer,
  Inbox,
} from "lucide-react";
import api from "@/lib/api";

interface EmailCampaignTabProps {
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function EmailCampaignTab({ showToast }: EmailCampaignTabProps) {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [stats, setStats] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [segmentUsers, setSegmentUsers] = useState<any[]>([]);
  const [loadingSegmentUsers, setLoadingSegmentUsers] = useState(false);

  // Create campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    campaignType: "weekly_personalized",
    targetSegment: "",
  });

  // Custom email form
  const [customEmail, setCustomEmail] = useState({
    subject: "",
    content: "",
    userIds: [] as number[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, statsRes, segmentsRes, templatesRes] =
        await Promise.all([
          api.get("/admin/email-campaigns/campaigns"),
          api.get("/admin/email-campaigns/stats"),
          api.get("/admin/user-analytics/segments"),
          api.get("/admin/email-campaigns/templates"),
        ]);

      if (campaignsRes.success) {
        setCampaigns(campaignsRes.data.campaigns || []);
        setPagination(campaignsRes.data.pagination || {});
      }
      if (statsRes.success) setStats(statsRes.data);
      if (segmentsRes.success) setSegments(segmentsRes.data.segments || []);
      if (templatesRes.success) setTemplates(templatesRes.data.templates || []);
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("Không thể tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadSegmentUsers = async (segmentId: string) => {
    if (!segmentId) {
      setSegmentUsers([]);
      return;
    }

    setLoadingSegmentUsers(true);
    try {
      const result = await api.get(
        `/admin/user-analytics/segments/${segmentId}/users`,
        { per_page: 100 }
      );
      if (result.success) {
        setSegmentUsers(result.data.users || []);
      }
    } catch (error) {
      console.error("Error loading segment users:", error);
    } finally {
      setLoadingSegmentUsers(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.targetSegment) {
      showToast("Vui lòng điền đầy đủ thông tin", "error");
      return;
    }

    try {
      const result = await api.post(
        "/admin/email-campaigns/campaigns",
        newCampaign
      );
      if (result.success) {
        showToast("Tạo chiến dịch thành công", "success");
        setShowCreateModal(false);
        setNewCampaign({
          name: "",
          description: "",
          campaignType: "weekly_personalized",
          targetSegment: "",
        });
        loadData();
      } else {
        showToast(result.error || "Tạo thất bại", "error");
      }
    } catch (error) {
      showToast("Có lỗi xảy ra", "error");
    }
  };

  const handleSendCampaign = async (
    campaignId: number,
    testMode: boolean = false
  ) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    if (
      !testMode &&
      !confirm(
        `Bạn có chắc muốn gửi chiến dịch "${campaign.name}" đến tất cả người dùng trong phân khúc?`
      )
    ) {
      return;
    }

    try {
      const payload: any = { testMode };
      if (testMode) {
        const testEmail = prompt("Nhập email để test:");
        if (!testEmail) return;
        payload.testEmail = testEmail;
      }

      const result = await api.post(
        `/admin/email-campaigns/campaigns/${campaignId}/send`,
        payload
      );
      if (result.success) {
        showToast(
          testMode
            ? "Đã gửi email test"
            : `Đang gửi đến ${result.data.targetUsers} người dùng`,
          "success"
        );
        loadData();
      } else {
        showToast(result.error || "Gửi thất bại", "error");
      }
    } catch (error) {
      showToast("Có lỗi xảy ra", "error");
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!confirm("Bạn có chắc muốn xóa chiến dịch này?")) return;

    try {
      const result = await api.delete(
        `/admin/email-campaigns/campaigns/${campaignId}`
      );
      if (result.success) {
        showToast("Đã xóa chiến dịch", "success");
        loadData();
      } else {
        showToast(result.error || "Xóa thất bại", "error");
      }
    } catch (error) {
      showToast("Có lỗi xảy ra", "error");
    }
  };

  const handleSendCustomEmail = async () => {
    if (!customEmail.subject || !customEmail.content) {
      showToast("Vui lòng nhập tiêu đề và nội dung", "error");
      return;
    }

    if (customEmail.userIds.length === 0 && !selectedSegment) {
      showToast("Vui lòng chọn nhóm người dùng", "error");
      return;
    }

    try {
      const userIds =
        customEmail.userIds.length > 0
          ? customEmail.userIds
          : segmentUsers.map((u) => u.id);

      const result = await api.post("/admin/email-campaigns/send-to-users", {
        userIds,
        subject: customEmail.subject,
        content: customEmail.content,
        campaignType: "custom",
      });

      if (result.success) {
        showToast(
          `Đang gửi email đến ${result.data.targetUsers} người dùng`,
          "success"
        );
        setShowSendModal(false);
        setCustomEmail({ subject: "", content: "", userIds: [] });
        setSelectedSegment("");
        setSegmentUsers([]);
        loadData();
      } else {
        showToast(result.error || "Gửi thất bại", "error");
      }
    } catch (error) {
      showToast("Có lỗi xảy ra", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { color: string; label: string; icon: any }
    > = {
      draft: { color: "gray", label: "Nháp", icon: Edit },
      active: { color: "green", label: "Hoạt động", icon: Play },
      paused: { color: "yellow", label: "Tạm dừng", icon: Pause },
      sending: { color: "blue", label: "Đang gửi", icon: RefreshCw },
      sent: { color: "purple", label: "Đã gửi", icon: CheckCircle },
      failed: { color: "red", label: "Thất bại", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${
          config.color === "green"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : config.color === "yellow"
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            : config.color === "blue"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            : config.color === "purple"
            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            : config.color === "red"
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
        }`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Marketing
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý chiến dịch email khuyến mãi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            <Send className="w-4 h-4" />
            Gửi email nhanh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Tạo chiến dịch
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email đã gửi</p>
                <p className="text-xl font-bold">
                  {stats.overview?.totalSent || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tỷ lệ mở</p>
                <p className="text-xl font-bold">
                  {stats.overview?.openRate || 0}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <MousePointer className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tỷ lệ click</p>
                <p className="text-xl font-bold">
                  {stats.overview?.clickRate || 0}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Chiến dịch</p>
                <p className="text-xl font-bold">
                  {stats.campaigns?.total || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Segments for Quick Send */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Gửi email theo nhóm người dùng
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => {
                setSelectedSegment(segment.id);
                loadSegmentUsers(segment.id);
                setShowSendModal(true);
              }}
              className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {segment.name}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {segment.userCount || 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {segment.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Danh sách chiến dịch</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Chiến dịch
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Phân khúc
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Thống kê
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {campaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có chiến dịch nào</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                      Tạo chiến dịch đầu tiên
                    </button>
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {campaign.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {campaign.description || campaign.campaignType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                        {segments.find((s) => s.id === campaign.targetSegment)
                          ?.name ||
                          campaign.targetSegment ||
                          "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 inline mr-1" />
                            {campaign.emailsSent || 0}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            <Inbox className="w-4 h-4 inline mr-1" />
                            {campaign.openRate || 0}%
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">
                            <MousePointer className="w-4 h-4 inline mr-1" />
                            {campaign.clickRate || 0}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {campaign.status === "draft" && (
                          <>
                            <button
                              onClick={() =>
                                handleSendCampaign(campaign.id, true)
                              }
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                              title="Test email"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSendCampaign(campaign.id)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                              title="Gửi ngay"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          title="Xóa"
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
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Tạo chiến dịch mới</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tên chiến dịch *
                  </label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, name: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Khuyến mãi tháng 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={newCampaign.description}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Mô tả chiến dịch..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Loại chiến dịch *
                  </label>
                  <select
                    value={newCampaign.campaignType}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        campaignType: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phân khúc mục tiêu *
                  </label>
                  <select
                    value={newCampaign.targetSegment}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        targetSegment: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn phân khúc...</option>
                    {segments.map((segment) => (
                      <option key={segment.id} value={segment.id}>
                        {segment.name} ({segment.userCount || 0} người)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateCampaign}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Tạo chiến dịch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Custom Email Modal */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowSendModal(false);
              setSelectedSegment("");
              setSegmentUsers([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Gửi email khuyến mãi</h3>
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSelectedSegment("");
                    setSegmentUsers([]);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Segment Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chọn nhóm người dùng
                  </label>
                  <select
                    value={selectedSegment}
                    onChange={(e) => {
                      setSelectedSegment(e.target.value);
                      loadSegmentUsers(e.target.value);
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn phân khúc...</option>
                    {segments.map((segment) => (
                      <option key={segment.id} value={segment.id}>
                        {segment.name} ({segment.userCount || 0} người)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Users Preview */}
                {selectedSegment && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Người nhận:</span>
                      <span className="text-sm text-gray-500">
                        {loadingSegmentUsers
                          ? "Đang tải..."
                          : `${segmentUsers.length} người`}
                      </span>
                    </div>
                    {!loadingSegmentUsers && segmentUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {segmentUsers.slice(0, 20).map((user) => (
                          <span
                            key={user.id}
                            className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-sm"
                          >
                            {user.email}
                          </span>
                        ))}
                        {segmentUsers.length > 20 && (
                          <span className="px-2 py-1 text-gray-500 text-sm">
                            +{segmentUsers.length - 20} người khác
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Email Content */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tiêu đề email *
                    <span className="text-gray-400 font-normal ml-2">
                      (dùng {"{name}"} để thêm tên người nhận)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={customEmail.subject}
                    onChange={(e) =>
                      setCustomEmail({
                        ...customEmail,
                        subject: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: 🎉 {name}, ưu đãi đặc biệt dành riêng cho bạn!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nội dung email *
                    <span className="text-gray-400 font-normal ml-2">
                      (HTML supported)
                    </span>
                  </label>
                  <textarea
                    value={customEmail.content}
                    onChange={(e) =>
                      setCustomEmail({
                        ...customEmail,
                        content: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={10}
                    placeholder={`<h2>Xin chào {name}!</h2>
<p>Cảm ơn bạn đã là khách hàng của VieGo.</p>
<p>Chúng tôi có một ưu đãi đặc biệt dành riêng cho bạn:</p>
<ul>
  <li>Giảm 20% cho tour mới</li>
  <li>Miễn phí dịch vụ VIP</li>
</ul>
<a href="https://viego.vn">Xem ngay →</a>`}
                  />
                </div>

                {/* Preview */}
                {customEmail.content && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Xem trước
                    </label>
                    <div
                      className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: customEmail.content.replace(
                          /\{name\}/g,
                          "Người dùng"
                        ),
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSelectedSegment("");
                    setSegmentUsers([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSendCustomEmail}
                  disabled={
                    !customEmail.subject ||
                    !customEmail.content ||
                    (!selectedSegment && customEmail.userIds.length === 0)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Gửi email ({segmentUsers.length || 0} người)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
