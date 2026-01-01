"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Users,
  DollarSign,
  Download,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../../../lib/api";
import Toast from "../../../../../components/common/Toast";
import ConfirmModal from "../../../../../components/common/ConfirmModal";
import AssignmentSuccessModal from "../../../../../components/common/AssignmentSuccessModal";

interface Participant {
  id: number;
  full_name: string;
  gender: string;
  date_of_birth: string;
  id_number: string;
  passport_number: string;
  phone: string;
  email: string;
  participant_type: string;
  special_requirements: string;
  emergency_contact: any;
}

interface TourGuide {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
}

interface TourAssignment {
  id: number;
  tour_guide_id: number;
  assignment_date: string;
  status: string;
  tour_guide: TourGuide;
}

export default function SellerBookingDetailPage({ params }: any) {
  const router = useRouter();
  const bookingId =
    params?.id ||
    (typeof window !== "undefined"
      ? window.location.pathname.split("/").pop()
      : null);

  const [booking, setBooking] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tourGuides, setTourGuides] = useState<TourGuide[]>([]);
  const [assignment, setAssignment] = useState<TourAssignment | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState<any | null>(null);
  const [showAssignConfirm, setShowAssignConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<{
    tourTitle?: string;
    guideName?: string;
    guideEmail?: string;
    bookingDate?: string;
    emailSent?: boolean;
  } | null>(null);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
      loadParticipants();
      loadTourGuides();
      loadAssignment();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      const res = await api.getBooking(bookingId);
      if (res.success) {
        const bookingData = res.data?.booking || res.data;
        setBooking(bookingData);
        
        // Also set assignment from booking data if available
        if (bookingData?.assignment) {
          setAssignment(bookingData.assignment);
          if (bookingData.assignment.tour_guide_id) {
            setSelectedGuideId(bookingData.assignment.tour_guide_id);
          }
        }
      }
    } catch (err) {
      setToast({ message: "Lỗi khi tải thông tin booking", type: "error" });
    }
  };

  const loadParticipants = async () => {
    try {
      console.log("Loading participants for booking:", bookingId);
      const res = await api.request(
        `/booking-participants/booking/${bookingId}`
      );
      console.log("Participants full response:", JSON.stringify(res, null, 2));

      // Handle multiple possible response formats
      // API wrapper returns: { success: true, data: { participants: [...], total: ... } }
      // Backend returns: { participants: [...], total: ... }
      let participantsData: Participant[] = [];
      
      if (res && res.success !== false) {
        // API wrapper format: res.data = { participants: [...], total: ... }
        if (res.data && res.data.participants && Array.isArray(res.data.participants)) {
          participantsData = res.data.participants;
        } 
        // Direct backend format (if not wrapped)
        else if (res.participants && Array.isArray(res.participants)) {
          participantsData = res.participants;
        }
        // Nested data format
        else if (res.data?.data?.participants && Array.isArray(res.data.data.participants)) {
          participantsData = res.data.data.participants;
        }
        // If data is directly an array
        else if (Array.isArray(res.data)) {
          participantsData = res.data;
        }
      }
      
      console.log(
        "Setting participants:",
        participantsData.length,
        "items",
        participantsData
      );
      setParticipants(participantsData);
    } catch (err: any) {
      console.error("Error loading participants:", err);
      console.error("Error details:", err.response?.data || err.message);
      setParticipants([]);
    }
  };

  const loadTourGuides = async () => {
    try {
      const res = await api.request("/users?role=tour_guide");
      if (res.success) {
        // Ensure we always get an array
        let guides: TourGuide[] = [];
        if (Array.isArray(res.data?.users)) {
          guides = res.data.users;
        } else if (Array.isArray(res.data)) {
          guides = res.data;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          guides = res.data.data;
        }
        setTourGuides(guides);
        
        // If we have an assignment but selectedGuideId is not set, set it
        if (assignment && assignment.tour_guide_id && !selectedGuideId) {
          setSelectedGuideId(assignment.tour_guide_id);
        }
      } else {
        // If request failed, ensure tourGuides is still an array
        setTourGuides([]);
      }
    } catch (err) {
      console.error("Error loading tour guides:", err);
      // Ensure tourGuides is always an array even on error
      setTourGuides([]);
    }
    setLoading(false);
  };

  const loadAssignment = async () => {
    try {
      const res = await api.request(`/tour-assignments/booking/${bookingId}`);
      if (res.success && res.data?.assignment) {
        const assignmentData = res.data.assignment;
        setAssignment(assignmentData);
        if (assignmentData.tour_guide_id) {
          setSelectedGuideId(assignmentData.tour_guide_id);
        }
      }
    } catch (err: any) {
      // 404 is expected when no assignment exists yet, don't log as error
      if (err?.message?.includes('404') || err?.message?.includes('No assignment') || err?.status === 404) {
        // No assignment yet, this is normal
        setAssignment(null);
        // Don't reset selectedGuideId if it was manually selected
      } else {
        console.error("Error loading assignment:", err);
      }
    }
  };

  const handleAssignGuide = () => {
    if (!selectedGuideId) {
      setToast({ message: "Vui lòng chọn hướng dẫn viên", type: "error" });
      return;
    }
    setShowAssignConfirm(true);
  };

  const confirmAssignGuide = async () => {
    setShowAssignConfirm(false);
    setAssignLoading(true);
    try {
      const res = await api.request("/tour-assignments", {
        method: "POST",
        body: JSON.stringify({
          booking_id: parseInt(bookingId),
          tour_guide_id: selectedGuideId,
        }),
      });

      if (res.success) {
        // Load assignment to get full details
        await loadAssignment();
        
        // Get selected guide info
        const selectedGuide = tourGuides.find(g => g.id === selectedGuideId);
        
        // Show success modal with details
        setAssignmentResult({
          tourTitle: booking?.tour?.title || "N/A",
          guideName: selectedGuide?.full_name || selectedGuide?.username || "N/A",
          guideEmail: selectedGuide?.email || "",
          bookingDate: booking?.date ? new Date(booking.date).toLocaleDateString("vi-VN") : "",
          emailSent: res.data?.email_sent || false,
        });
        setShowSuccessModal(true);
        
        // Reload booking details to refresh assignment status
        await loadBookingDetails();
      } else {
        setToast({ message: res.error || "Lỗi khi phân công", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Lỗi khi phân công hướng dẫn viên", type: "error" });
    }
    setAssignLoading(false);
  };

  const handleExport = async (format: "excel" | "csv") => {
    setExportLoading(true);
    try {
      const token = api.getToken();
      const API_BASE_URL = getAPIURL();
      const url = `${API_BASE_URL}/booking-participants/booking/${bookingId}/export?format=${format}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `participants_booking_${bookingId}.${format === "excel" ? "xlsx" : "csv"}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setToast({
        message: `Xuất file ${format.toUpperCase()} thành công!`,
        type: "success",
      });
    } catch (err: any) {
      console.error("Export error:", err);
      setToast({ 
        message: err.message || "Lỗi khi xuất file", 
        type: "error" 
      });
    }
    setExportLoading(false);
  };

  const formatPrice = (price: number, currency: string = "VND") => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Đã xác nhận";
      case "pending":
        return "Chờ xác nhận";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-teal-100 text-teal-800";
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAssignmentStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "in_progress":
        return "Đang thực hiện";
      case "accepted":
        return "Đã chấp nhận";
      case "assigned":
        return "Đã phân công";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Không tìm thấy booking
          </h2>
          <button
            onClick={() => router.push("/dashboard/seller/bookings")}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/seller/bookings")}
            className="flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Quay lại danh sách booking</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Chi tiết Booking #{booking.id}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Quản lý thông tin booking và người tham gia
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Booking Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-teal-600 pb-2">
                Thông tin Booking
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-teal-600 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tour
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {booking.tour?.title || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-teal-600 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Ngày khởi hành
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {new Date(booking.booking_date).toLocaleDateString(
                        "vi-VN"
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-teal-600 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Số người
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {booking.adults} người lớn
                      {booking.children > 0 && `, ${booking.children} trẻ em`}
                      {booking.infants > 0 && `, ${booking.infants} em bé`}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-teal-600 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tổng tiền
                    </div>
                    <div className="font-bold text-2xl text-red-600 dark:text-red-400">
                      {formatPrice(booking.total_price, booking.tour?.currency)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Trạng thái
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-teal-600 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Người đặt
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {booking.full_name}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-teal-600 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Email
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {booking.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-teal-600 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Số điện thoại
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {booking.phone}
                    </div>
                  </div>
                </div>

                {booking.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-teal-600 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Địa chỉ
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {booking.address}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Participants List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-teal-600">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Danh sách người tham gia ({participants.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport("excel")}
                    disabled={exportLoading || participants.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {exportLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    disabled={exportLoading || participants.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {exportLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    CSV
                  </button>
                </div>
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">
                    Chưa có thông tin người tham gia
                  </p>
                  <p className="text-sm">
                    Khách hàng chưa điền thông tin người tham gia cho booking
                    này.
                    <br />
                    Thông tin sẽ hiển thị sau khi khách hàng hoàn tất.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {participants.map((participant, index) => {
                    let emergencyContact = null;
                    try {
                      emergencyContact =
                        typeof participant.emergency_contact === "string"
                          ? JSON.parse(participant.emergency_contact)
                          : participant.emergency_contact;
                    } catch (e) {
                      // Ignore parse error
                    }

                    return (
                      <motion.div
                        key={participant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-4 border-2 border-teal-200 dark:border-teal-800"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-5 h-5 text-teal-600" />
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {index + 1}. {participant.full_name}
                          </h3>
                          <span className="ml-auto px-2 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 rounded text-xs font-semibold">
                            {participant.participant_type === "adult"
                              ? "Người lớn"
                              : participant.participant_type === "child"
                              ? "Trẻ em"
                              : "Em bé"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Giới tính:
                            </span>
                            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                              {participant.gender === "male"
                                ? "Nam"
                                : participant.gender === "female"
                                ? "Nữ"
                                : "Khác"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Ngày sinh:
                            </span>
                            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                              {new Date(
                                participant.date_of_birth
                              ).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          {participant.id_number && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                CMND/CCCD:
                              </span>
                              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                {participant.id_number}
                              </span>
                            </div>
                          )}
                          {participant.passport_number && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                Hộ chiếu:
                              </span>
                              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                {participant.passport_number}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Điện thoại:
                            </span>
                            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                              {participant.phone}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Email:
                            </span>
                            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                              {participant.email}
                            </span>
                          </div>
                          {emergencyContact?.name && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">
                                Liên hệ khẩn cấp:
                              </span>
                              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                {emergencyContact.name}
                                {emergencyContact.phone &&
                                  ` - ${emergencyContact.phone}`}
                              </span>
                            </div>
                          )}
                          {participant.special_requirements && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">
                                Yêu cầu đặc biệt:
                              </span>
                              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                {participant.special_requirements}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Tour Guide Assignment */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50 sticky top-24"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-teal-600 pb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Phân công Hướng dẫn viên
              </h2>

              {assignment ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900 dark:text-green-300">
                        Đã phân công
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          HDV:
                        </span>
                        <span className="ml-2 font-bold text-gray-900 dark:text-white">
                          {assignment.tour_guide?.full_name ||
                            assignment.tour_guide?.username}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Email:
                        </span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                          {assignment.tour_guide?.email}
                        </span>
                      </div>
                      {assignment.tour_guide?.phone && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            SĐT:
                          </span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                            {assignment.tour_guide.phone}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Ngày phân công:
                        </span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                          {new Date(
                            assignment.assignment_date
                          ).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Trạng thái:
                        </span>
                        <span
                          className={`ml-2 inline-block px-2 py-1 rounded text-xs font-semibold ${getAssignmentStatusColor(
                            assignment.status
                          )}`}
                        >
                          {getAssignmentStatusText(assignment.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Email thông báo đã được gửi tới hướng dẫn viên và khách hàng
                  </div>

                  {booking && (
                    <button
                      onClick={() => router.push(`/tour-journey/${booking.id}`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors mt-3"
                    >
                      <Calendar className="w-5 h-5" />
                      Xem lịch trình tour
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Chọn Hướng dẫn viên
                    </label>
                    <select
                      value={selectedGuideId || ""}
                      onChange={(e) =>
                        setSelectedGuideId(parseInt(e.target.value) || null)
                      }
                      disabled={!!assignment}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Chọn hướng dẫn viên --</option>
                      {Array.isArray(tourGuides) && tourGuides.map((guide) => (
                        <option key={guide.id} value={guide.id}>
                          {guide.full_name || guide.username} ({guide.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAssignGuide}
                    disabled={!selectedGuideId || assignLoading || !!assignment}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {assignLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang phân công...
                      </>
                    ) : assignment ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Đã phân công
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Phân công
                      </>
                    )}
                  </button>

                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Email thông báo sẽ được gửi tự động sau khi phân công
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        open={showAssignConfirm}
        title="Xác nhận phân công"
        message={`Bạn có chắc muốn phân công tour này cho hướng dẫn viên đã chọn? Email thông báo sẽ được gửi tự động.`}
        onCancel={() => setShowAssignConfirm(false)}
        onConfirm={confirmAssignGuide}
        confirmText="Xác nhận"
        cancelText="Hủy"
      />

      <AssignmentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setAssignmentResult(null);
        }}
        tourTitle={assignmentResult?.tourTitle}
        guideName={assignmentResult?.guideName}
        guideEmail={assignmentResult?.guideEmail}
        bookingDate={assignmentResult?.bookingDate}
        emailSent={assignmentResult?.emailSent}
      />
    </div>
  );
}
