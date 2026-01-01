"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  UserCheck,
  UserPlus,
  Heart,
  Map,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  BarChart3,
  PieChart,
  LineChart,
  FileSpreadsheet,
} from "lucide-react";
import api from "@/lib/api";

interface UserAnalyticsTabProps {
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function UserAnalyticsTab({ showToast }: UserAnalyticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [demographics, setDemographics] = useState<any>(null);
  const [interests, setInterests] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        trendsRes,
        demographicsRes,
        interestsRes,
        segmentsRes,
      ] = await Promise.all([
        api.get("/admin/user-analytics/overview", { days }),
        api.get("/admin/user-analytics/trends", { days }),
        api.get("/admin/user-analytics/demographics"),
        api.get("/admin/user-analytics/interests-analysis"),
        api.get("/admin/user-analytics/segments"),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (demographicsRes.success) setDemographics(demographicsRes.data);
      if (interestsRes.success) setInterests(interestsRes.data);
      if (segmentsRes.success) setSegments(segmentsRes.data.segments || []);
    } catch (error) {
      console.error("Error loading analytics:", error);
      showToast("Không thể tải dữ liệu phân tích", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAllUsers = async () => {
    if (
      !confirm(
        "Phân tích AI cho tất cả người dùng có thể mất vài phút. Bạn có muốn tiếp tục?"
      )
    ) {
      return;
    }

    setAnalyzing(true);
    try {
      const result = await api.post("/admin/user-analytics/analyze-all-users", {
        days: 365,
      });
      if (result.success) {
        showToast(
          `Đã phân tích ${result.data.results.analyzed} người dùng`,
          "success"
        );
        loadData();
      } else {
        showToast(result.error || "Phân tích thất bại", "error");
      }
    } catch (error) {
      showToast("Có lỗi xảy ra khi phân tích", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper function to get storage key with port suffix
  const getStorageKey = (baseKey: string): string => {
    if (typeof window !== "undefined") {
      const port =
        window.location.port ||
        (window.location.protocol === "https:" ? "443" : "80");
      return `${baseKey}_${port}`;
    }
    return `${baseKey}_3000`; // Default fallback
  };

  const handleExportExcel = async (type: "users" | "analytics") => {
    setExporting(true);
    try {
      const endpoint =
        type === "users"
          ? `/admin/user-analytics/export/users`
          : `/admin/user-analytics/export/analytics?days=${days}`;

      // Get token from localStorage with port-specific key
      const token =
        localStorage.getItem(getStorageKey("access_token")) ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("viego_token") ||
        localStorage.getItem("token");

      console.log("Export token check:", {
        key: getStorageKey("access_token"),
        tokenExists: !!token,
        tokenLength: token?.length,
      });

      if (!token) {
        showToast("Vui lòng đăng nhập lại", "error");
        setExporting(false);
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Export response error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        if (response.status === 401) {
          showToast("Phiên đăng nhập hết hạn", "error");
          setExporting(false);
          return;
        }
        if (response.status === 403) {
          showToast("Bạn không có quyền xuất báo cáo", "error");
          setExporting(false);
          return;
        }
        showToast(`Lỗi xuất báo cáo: ${response.status}`, "error");
        setExporting(false);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "users"
          ? `users_export_${new Date().toISOString().slice(0, 10)}.xlsx`
          : `analytics_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      showToast("Xuất file Excel thành công!", "success");
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Export error details:", {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
      });

      if (
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError")
      ) {
        showToast(
          "Không thể kết nối đến server. Vui lòng kiểm tra backend.",
          "error"
        );
      } else {
        showToast(
          `Có lỗi khi xuất Excel: ${err?.message || "Unknown error"}`,
          "error"
        );
      }
    } finally {
      setExporting(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  const formatPercent = (num: number) => {
    return (num || 0).toFixed(1) + "%";
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
            Thống kê Người dùng
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Phân tích AI và xu hướng người dùng
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={90}>90 ngày</option>
            <option value={365}>1 năm</option>
          </select>
          <button
            onClick={handleAnalyzeAllUsers}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
          >
            {analyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            {analyzing ? "Đang phân tích..." : "Phân tích AI"}
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
            >
              {exporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Xuất Excel
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExportExcel("analytics")}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-xl flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Báo cáo phân tích
              </button>
              <button
                onClick={() => handleExportExcel("users")}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-xl flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Danh sách người dùng
              </button>
            </div>
          </div>

          <button
            onClick={loadData}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            title="Tổng người dùng"
            value={formatNumber(overview.overview.totalUsers)}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Người dùng mới"
            value={formatNumber(overview.overview.newUsers)}
            subtitle={`trong ${days} ngày`}
            icon={<UserPlus className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Hoạt động hàng ngày"
            value={formatNumber(overview.overview.dailyActiveUsers)}
            icon={<Activity className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Hoạt động hàng tuần"
            value={formatNumber(overview.overview.weeklyActiveUsers)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="indigo"
          />
          <StatCard
            title="Tỷ lệ chuyển đổi"
            value={formatPercent(overview.overview.conversionRate)}
            icon={<UserCheck className="w-6 h-6" />}
            color="emerald"
          />
          <StatCard
            title="Tỷ lệ giữ chân"
            value={formatPercent(overview.overview.retentionRate)}
            icon={<Heart className="w-6 h-6" />}
            color="pink"
          />
        </div>
      )}

      {/* Role Distribution */}
      {overview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-500" />
              Phân bố theo vai trò
            </h3>
            <div className="space-y-3">
              {Object.entries(overview.roleDistribution).map(
                ([role, count]: [string, any]) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium capitalize
                      ${
                        role === "admin"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : role === "moderator"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : role === "seller"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : role === "tour_guide"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                      >
                        {role === "tour_guide"
                          ? "Hướng dẫn viên"
                          : role === "seller"
                          ? "Người bán"
                          : role === "moderator"
                          ? "Kiểm duyệt"
                          : role === "admin"
                          ? "Quản trị"
                          : "Người dùng"}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {count} người
                      </span>
                    </div>
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          role === "admin"
                            ? "bg-red-500"
                            : role === "moderator"
                            ? "bg-orange-500"
                            : role === "seller"
                            ? "bg-purple-500"
                            : role === "tour_guide"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${
                            (count / overview.overview.totalUsers) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              Mức độ tương tác
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <span className="text-gray-600 dark:text-gray-400">
                  Có bài viết
                </span>
                <span className="font-semibold">
                  {formatNumber(overview.overview.usersWithPosts)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <span className="text-gray-600 dark:text-gray-400">
                  Có bình luận
                </span>
                <span className="font-semibold">
                  {formatNumber(overview.overview.usersWithComments)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <span className="text-gray-600 dark:text-gray-400">
                  Có đặt tour
                </span>
                <span className="font-semibold">
                  {formatNumber(overview.overview.usersWithBookings)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <span className="text-gray-600 dark:text-gray-400">
                  Xác thực email
                </span>
                <span className="font-semibold">
                  {formatNumber(overview.overview.verifiedUsers)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interest Analysis */}
      {interests && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Phân tích sở thích (AI)
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({interests.totalProfiles} hồ sơ đã phân tích)
            </span>
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Interests */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Điểm sở thích theo danh mục
              </h4>
              <div className="space-y-3">
                {interests.categoryInterests &&
                  Object.entries(interests.categoryInterests).map(
                    ([category, score]: [string, any]) => (
                      <div key={category} className="flex items-center gap-3">
                        <span className="w-24 text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {category === "adventure"
                            ? "Phiêu lưu"
                            : category === "cultural"
                            ? "Văn hóa"
                            : category === "food"
                            ? "Ẩm thực"
                            : category === "nature"
                            ? "Thiên nhiên"
                            : category === "urban"
                            ? "Đô thị"
                            : category === "spiritual"
                            ? "Tâm linh"
                            : category}
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              category === "adventure"
                                ? "bg-orange-500"
                                : category === "cultural"
                                ? "bg-purple-500"
                                : category === "food"
                                ? "bg-red-500"
                                : category === "nature"
                                ? "bg-green-500"
                                : category === "urban"
                                ? "bg-blue-500"
                                : "bg-indigo-500"
                            }`}
                            style={{ width: `${Math.min(score, 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-sm font-medium text-right">
                          {score.toFixed(1)}
                        </span>
                      </div>
                    )
                  )}
              </div>
            </div>

            {/* Engagement Distribution */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Phân bố mức độ tương tác
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {interests.engagementDistribution &&
                  Object.entries(interests.engagementDistribution).map(
                    ([level, count]: [string, any]) => (
                      <div
                        key={level}
                        className={`p-4 rounded-xl border-2 ${
                          level === "very_high"
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : level === "high"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : level === "medium"
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                            : "border-gray-500 bg-gray-50 dark:bg-gray-700/50"
                        }`}
                      >
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {level === "very_high"
                            ? "Rất cao"
                            : level === "high"
                            ? "Cao"
                            : level === "medium"
                            ? "Trung bình"
                            : "Thấp"}
                        </div>
                      </div>
                    )
                  )}
              </div>
            </div>
          </div>

          {/* Price & Duration Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Sở thích về giá
              </h4>
              <div className="text-lg font-semibold">
                {formatNumber(interests.pricePreferences?.averageMin || 0)} -{" "}
                {formatNumber(interests.pricePreferences?.averageMax || 0)} VND
              </div>
              <div className="text-sm text-gray-500">
                Độ nhạy giá:{" "}
                {(
                  (interests.pricePreferences?.averageSensitivity || 0) * 100
                ).toFixed(0)}
                %
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Sở thích về thời gian
              </h4>
              <div className="text-lg font-semibold">
                {interests.durationPreferences?.averageMin?.toFixed(0) || 1} -{" "}
                {interests.durationPreferences?.averageMax?.toFixed(0) || 7}{" "}
                ngày
              </div>
              <div className="text-sm text-gray-500">
                Thời gian tour trung bình yêu thích
              </div>
            </div>
          </div>

          {/* Top Tags */}
          {interests.topTags && interests.topTags.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Tags phổ biến
              </h4>
              <div className="flex flex-wrap gap-2">
                {interests.topTags
                  .slice(0, 15)
                  .map((item: any, index: number) => (
                    <span
                      key={item.tag}
                      className={`px-3 py-1 rounded-full text-sm ${
                        index < 3
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : index < 6
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.tag} ({item.count})
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Demographics */}
      {demographics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-500" />
              Thiết bị sử dụng
            </h3>
            <div className="flex items-center justify-around py-4">
              {demographics.deviceDistribution?.map((item: any) => (
                <div key={item.device} className="text-center">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-2 ${
                      item.device === "mobile"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : item.device === "tablet"
                        ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {item.device === "mobile" ? (
                      <Smartphone className="w-8 h-8" />
                    ) : item.device === "tablet" ? (
                      <Tablet className="w-8 h-8" />
                    ) : (
                      <Monitor className="w-8 h-8" />
                    )}
                  </div>
                  <div className="text-xl font-bold">{item.count}</div>
                  <div className="text-sm text-gray-500 capitalize">
                    {item.device}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-green-500" />
              Vị trí người dùng
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {demographics.locationDistribution
                ?.slice(0, 10)
                .map((item: any, index: number) => (
                  <div
                    key={item.location}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.location}
                      </span>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* User Segments */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Phân khúc người dùng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((segment) => (
            <motion.div
              key={segment.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {segment.name}
                </h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-sm font-medium">
                  {segment.userCount || 0}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {segment.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trends Chart Placeholder */}
      {trends && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-purple-500" />
            Xu hướng đăng ký
          </h3>
          <div className="h-64 flex items-end justify-between gap-1">
            {trends.registrationTrend
              ?.slice(-14)
              .map((item: any, index: number) => {
                const maxCount = Math.max(
                  ...trends.registrationTrend
                    .slice(-14)
                    .map((t: any) => t.count || 0),
                  1
                );
                const height = ((item.count || 0) / maxCount) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-blue-500 rounded-t-lg transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${item.date}: ${item.count} người`}
                    />
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                      {new Date(item.date).getDate()}/
                      {new Date(item.date).getMonth() + 1}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    indigo:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
