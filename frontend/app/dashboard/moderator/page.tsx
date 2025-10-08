"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

export default function ModeratorDashboard() {
  const [activeTab, setActiveTab] = useState("profile");
  const [moderatorData, setModeratorData] = useState({
    name: "Nguyễn Văn Moderator",
    username: "moderator",
    email: "moderator@viego.com",
    phone: "0123-456-789",
    joinDate: "2024-01-01",
    totalReviews: 245,
    approvedPosts: 198,
    rejectedPosts: 47,
    pendingReports: 8,
  });

  const tabItems = [
    { id: "profile", icon: User, label: "Hồ Sơ Cá Nhân" },
    { id: "pending", icon: Clock, label: "Chờ Kiểm Duyệt" },
    { id: "reports", icon: AlertTriangle, label: "Báo Cáo" },
    { id: "history", icon: Activity, label: "Lịch Sử Kiểm Duyệt" },
  ];

  const renderProfile = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&crop=face"
              alt="Moderator Avatar"
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
            />
            <div className="absolute -top-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{moderatorData.name}</h1>
            <p className="text-blue-100 text-lg">@{moderatorData.username}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Moderator</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Gia nhập: {moderatorData.joinDate}
                </span>
              </div>
            </div>
          </div>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors">
            <Edit3 className="w-4 h-4 inline mr-2" />
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Tổng Kiểm Duyệt
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {moderatorData.totalReviews}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Bài Được Duyệt
              </p>
              <p className="text-2xl font-bold text-green-600">
                {moderatorData.approvedPosts}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Bài Bị Từ Chối
              </p>
              <p className="text-2xl font-bold text-red-600">
                {moderatorData.rejectedPosts}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Báo Cáo Chờ</p>
              <p className="text-2xl font-bold text-orange-600">
                {moderatorData.pendingReports}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Thông Tin Cá Nhân
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{moderatorData.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Điện thoại</p>
                <p className="font-medium">{moderatorData.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Địa điểm</p>
                <p className="font-medium">TP.HCM, Việt Nam</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 Thành Tích
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium">
                  Kiểm Duyệt Viên Xuất Sắc
                </span>
              </div>
              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                2024
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Bảo Vệ Cộng Đồng</span>
              </div>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                100+ Reports
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Nhanh Chóng</span>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                Avg 2h
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPending = () => (
    <div className="space-y-6">
      {/* Filter and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            ⏳ Nội Dung Chờ Kiểm Duyệt
          </h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
              <option>Tất cả loại</option>
              <option>Bài viết</option>
              <option>Bình luận</option>
              <option>Hình ảnh</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pending Items */}
      <div className="space-y-4">
        {[
          {
            id: 1,
            type: "post",
            title: "Hành trình khám phá Sapa mùa lúa chín",
            author: "blogger_hanoi",
            submitTime: "2 giờ trước",
            priority: "normal",
            content: "Sapa mùa lúa chín là thời điểm đẹp nhất trong năm...",
          },
          {
            id: 2,
            type: "comment",
            title: 'Bình luận về bài "Ẩm thực đường phố Sài Gòn"',
            author: "food_lover123",
            submitTime: "4 giờ trước",
            priority: "high",
            content: "Món này ngon thật, tôi đã thử rồi...",
          },
          {
            id: 3,
            type: "post",
            title: "Review homestay ở Đà Lạt - Trải nghiệm tuyệt vời",
            author: "travel_enthusiast",
            submitTime: "6 giờ trước",
            priority: "normal",
            content: "Homestay này nằm ở vị trí đẹp, view núi đồi...",
          },
        ].map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.type === "post"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {item.type === "post" ? "Bài viết" : "Bình luận"}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.priority === "high" ? "Ưu tiên cao" : "Bình thường"}
                  </span>
                  <span className="text-xs text-gray-500">
                    bởi @{item.author}
                  </span>
                  <span className="text-xs text-gray-500">
                    • {item.submitTime}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h4>
                <p className="text-gray-600 text-sm">{item.content}</p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Xem</span>
                </button>
                <button className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg transition-colors">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Duyệt</span>
                </button>
                <button className="flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg transition-colors">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">Từ chối</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          🚨 Báo Cáo Từ Cộng Đồng
        </h3>
        <p className="text-gray-600 mt-2">
          Xử lý các báo cáo và khiếu nại từ người dùng
        </p>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {[
          {
            id: 1,
            type: "spam",
            reporter: "user123",
            reported: "spammer_account",
            reason: "Spam liên tục trong comments",
            time: "1 giờ trước",
            status: "pending",
          },
          {
            id: 2,
            type: "inappropriate",
            reporter: "travel_lover",
            reported: "bad_content_user",
            reason: "Nội dung không phù hợp với cộng đồng",
            time: "3 giờ trước",
            status: "pending",
          },
        ].map((report) => (
          <motion.div
            key={report.id}
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      report.type === "spam"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {report.type === "spam" ? "Spam" : "Không phù hợp"}
                  </span>
                  <span className="text-xs text-gray-500">{report.time}</span>
                </div>
                <p className="text-gray-900 font-medium">
                  <span className="text-blue-600">@{report.reporter}</span> báo
                  cáo <span className="text-red-600">@{report.reported}</span>
                </p>
                <p className="text-gray-600 text-sm mt-1">{report.reason}</p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors">
                  Điều tra
                </button>
                <button className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg transition-colors">
                  Xử lý
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          📈 Lịch Sử Kiểm Duyệt
        </h3>
        <p className="text-gray-600 mt-2">
          Theo dõi tất cả hoạt động kiểm duyệt của bạn
        </p>
      </div>

      {/* History Timeline */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-4">
          {[
            {
              action: "Duyệt bài viết",
              item: "Hành trình Sapa",
              time: "10 phút trước",
              type: "approved",
            },
            {
              action: "Từ chối bình luận",
              item: "Spam comment",
              time: "30 phút trước",
              type: "rejected",
            },
            {
              action: "Xử lý báo cáo",
              item: "User vi phạm",
              time: "1 giờ trước",
              type: "resolved",
            },
            {
              action: "Duyệt bài viết",
              item: "Review homestay",
              time: "2 giờ trước",
              type: "approved",
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  activity.type === "approved"
                    ? "bg-green-500"
                    : activity.type === "rejected"
                    ? "bg-red-500"
                    : "bg-blue-500"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.action}</span>:{" "}
                  {activity.item}
                </p>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🛡️ Moderator Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý và kiểm duyệt nội dung VieGo Blog
          </p>
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
        {activeTab === "profile" && renderProfile()}
        {activeTab === "pending" && renderPending()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "history" && renderHistory()}
      </div>
    </div>
  );
}
