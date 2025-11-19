"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Loader2,
  Navigation,
  User,
  Mail,
  Phone,
  Award,
  Edit3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import Toast from "@/components/common/Toast";

interface Assignment {
  id: number;
  booking_id: number;
  assignment_date: string;
  status: string;
  booking?: {
    id: number;
    date: string;
    adults: number;
    children: number;
    infants: number;
    full_name: string;
    email: string;
    phone: string;
    status: string;
    tour?: {
      id: number;
      title: string;
      starting_location: string;
      duration_days: number;
      featured_image: string;
    };
  };
}

export default function TourGuideDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.request("/tour-assignments/my-assignments");
      if (res.success) {
        setAssignments(res.data?.assignments || []);
      } else {
        setToast({
          message: res.error || "Lỗi khi tải danh sách tour",
          type: "error",
        });
      }
    } catch (err) {
      setToast({ message: "Lỗi khi tải danh sách tour", type: "error" });
    }
    setLoading(false);
  };

  const updateAssignmentStatus = async (
    assignmentId: number,
    status: string
  ) => {
    try {
      const res = await api.request(`/tour-assignments/${assignmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      if (res.success) {
        setToast({
          message: "Cập nhật trạng thái thành công!",
          type: "success",
        });
        loadAssignments();
      } else {
        setToast({ message: res.error || "Lỗi khi cập nhật", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Lỗi khi cập nhật trạng thái", type: "error" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "accepted":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400";
      case "assigned":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "in_progress":
        return "Đang thực hiện";
      case "accepted":
        return "Đã chấp nhận";
      case "assigned":
        return "Chờ xác nhận";
      default:
        return status;
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600 dark:text-green-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "cancelled":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (filterStatus === "all") return true;
    return assignment.status === filterStatus;
  });

  const stats = {
    total: assignments.length,
    assigned: assignments.filter((a) => a.status === "assigned").length,
    accepted: assignments.filter((a) => a.status === "accepted").length,
    in_progress: assignments.filter((a) => a.status === "in_progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Hướng dẫn viên
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Quản lý các tour được phân công và hành khách
          </p>
        </div>

        {/* Profile Section */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 mb-8 border border-white/50 dark:border-gray-700/50"
          >
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user.full_name?.charAt(0).toUpperCase() ||
                    user.username?.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.full_name || user.username}
                    </h3>
                    <Link
                      href="/profile/user"
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-white text-sm font-semibold transition-colors shadow-md"
                    >
                      <Edit3 className="w-4 h-4" />
                      Chỉnh sửa
                    </Link>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <User className="w-4 h-4" />
                      <span className="text-sm">@{user.username}</span>
                    </div>

                    {user.email && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    )}

                    {user.location && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{user.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Vai trò: Hướng Dẫn Viên
                    </span>
                  </div>

                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-lg p-4 mt-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Tour đang thực hiện
                    </div>
                    <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                      {stats.in_progress}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/50 dark:border-gray-700/50"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Tổng số tour
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/50 dark:border-gray-700/50"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Chờ xác nhận
            </div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.assigned}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/50 dark:border-gray-700/50"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Đã chấp nhận
            </div>
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
              {stats.accepted}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/50 dark:border-gray-700/50"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Đang thực hiện
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.in_progress}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/50 dark:border-gray-700/50"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Hoàn thành
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.completed}
            </div>
          </motion.div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Lọc theo trạng thái:
            </span>
            {[
              { value: "all", label: "Tất cả" },
              { value: "assigned", label: "Chờ xác nhận" },
              { value: "accepted", label: "Đã chấp nhận" },
              { value: "in_progress", label: "Đang thực hiện" },
              { value: "completed", label: "Hoàn thành" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filterStatus === filter.value
                    ? "bg-teal-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-700"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-12 text-center border border-white/50 dark:border-gray-700/50"
          >
            <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Không có tour nào
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filterStatus === "all"
                ? "Bạn chưa được phân công tour nào"
                : "Không có tour nào với trạng thái này"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/50 dark:border-gray-700/50 hover:shadow-2xl transition-shadow"
              >
                {/* Tour Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={
                      assignment.booking?.tour?.featured_image ||
                      "/images/tours/default.svg"
                    }
                    alt={assignment.booking?.tour?.title || "Tour"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        assignment.status
                      )}`}
                    >
                      {getStatusText(assignment.status)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {assignment.booking?.tour?.title || "Tour không xác định"}
                    </h3>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Khởi hành:{" "}
                        {assignment.booking?.date
                          ? new Date(assignment.booking.date).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {assignment.booking?.tour?.starting_location || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span>
                        {assignment.booking?.tour?.duration_days || "-"} ngày
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Users className="w-4 h-4" />
                      <span>
                        {assignment.booking?.adults || 0} người lớn
                        {(assignment.booking?.children || 0) > 0 &&
                          `, ${assignment.booking.children} trẻ em`}
                        {(assignment.booking?.infants || 0) > 0 &&
                          `, ${assignment.booking.infants} em bé`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm mb-3">
                      <span className="text-gray-600 dark:text-gray-400">
                        Người đặt:{" "}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {assignment.booking?.full_name || "N/A"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/tour-guide/bookings/${assignment.booking_id}`
                          )
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>

                      {assignment.status === "assigned" && (
                        <button
                          onClick={() =>
                            updateAssignmentStatus(assignment.id, "accepted")
                          }
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Chấp nhận
                        </button>
                      )}

                      {assignment.status === "accepted" && (
                        <button
                          onClick={() =>
                            updateAssignmentStatus(assignment.id, "in_progress")
                          }
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                        >
                          <Navigation className="w-4 h-4" />
                          Bắt đầu
                        </button>
                      )}

                      {assignment.status === "in_progress" && (
                        <button
                          onClick={() =>
                            router.push(
                              `/tour-journey/${assignment.booking_id}`
                            )
                          }
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                        >
                          <Navigation className="w-4 h-4" />
                          Hành trình
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
