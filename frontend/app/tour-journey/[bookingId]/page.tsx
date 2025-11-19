"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Navigation,
  Camera,
  Upload,
  Loader2,
  Calendar,
  Info,
  X,
  User,
  AlertCircle,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Toast from "@/components/common/Toast";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useAuth } from "@/lib/AuthContext";

interface TourProgress {
  id: number;
  checkpoint_order: number;
  checkpoint_name: string;
  checkpoint_description: string;
  status: string;
  arrival_time: string | null;
  departure_time: string | null;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

export default function TourJourneyPage({ params }: any) {
  const router = useRouter();
  const { user } = useAuth();
  // Use params.bookingId directly - it will be available from Next.js routing
  const bookingId = params?.bookingId;

  const [booking, setBooking] = useState<any>(null);
  const [progress, setProgress] = useState<TourProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [toast, setToast] = useState<any | null>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] =
    useState<TourProgress | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isGuide, setIsGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Convert old itinerary format {day1: {...}, day2: {...}} to new array format
  const convertItineraryFormat = (itinerary: any): any[] => {
    if (!itinerary) return [];

    // Already new format (array)
    if (Array.isArray(itinerary)) {
      return itinerary;
    }

    // Old format (object with day1, day2, etc.)
    if (typeof itinerary === "object") {
      const days: any[] = [];

      // Extract all day keys (day1, day2, day3, etc.)
      Object.keys(itinerary)
        .filter((key) => key.startsWith("day"))
        .sort((a, b) => {
          const numA = parseInt(a.replace("day", ""));
          const numB = parseInt(b.replace("day", ""));
          return numA - numB;
        })
        .forEach((dayKey, index) => {
          const dayData = itinerary[dayKey];
          const dayNumber = index + 1;

          // Convert old format to new format
          const activities: string[] = [];
          if (dayData.morning) activities.push(`Sáng: ${dayData.morning}`);
          if (dayData.afternoon) activities.push(`Chiều: ${dayData.afternoon}`);
          if (dayData.evening) activities.push(`Tối: ${dayData.evening}`);

          days.push({
            day: dayNumber,
            title: dayData.title || `Ngày ${dayNumber}`,
            description: dayData.description || "",
            activities: activities,
            accommodation: dayData.accommodation || "",
            meals: dayData.meals || "",
          });
        });

      return days;
    }

    return [];
  };

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("[TourJourney] Component mounted, bookingId:", bookingId);
    console.log("[TourJourney] User:", user);
    console.log("[TourJourney] User role:", user?.role);

    // Set isGuide based on user role from AuthContext
    if (user) {
      setIsGuide(user.role === "tour_guide");
      console.log("[TourJourney] isGuide set to:", user.role === "tour_guide");
    }

    if (mounted && bookingId && bookingId !== "page") {
      loadBookingAndProgress();
    } else if (mounted && (!bookingId || bookingId === "page")) {
      setError("Không tìm thấy ID booking");
      setLoading(false);
    }
  }, [bookingId, mounted, user]);

  const loadBookingAndProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("[TourJourney] Loading booking:", bookingId);

      // Load booking details
      const bookingRes = await api.request(`/bookings/${bookingId}`);
      console.log("[TourJourney] Booking response:", bookingRes);

      if (bookingRes.success || bookingRes.data) {
        const bookingData = bookingRes.data?.booking || bookingRes.data;
        setBooking(bookingData);
        console.log("[TourJourney] Booking loaded:", bookingData);
        console.log("[TourJourney] Tour data:", bookingData?.tour);
        console.log(
          "[TourJourney] Itinerary data:",
          bookingData?.tour?.itinerary
        );
        console.log(
          "[TourJourney] Itinerary type:",
          typeof bookingData?.tour?.itinerary
        );
        console.log(
          "[TourJourney] Is array:",
          Array.isArray(bookingData?.tour?.itinerary)
        );
      } else {
        throw new Error(bookingRes.error || "Không thể tải thông tin booking");
      }

      // Load tour progress
      console.log("[TourJourney] Loading progress for booking:", bookingId);
      const progressRes = await api.request(
        `/tour-progress?booking_id=${bookingId}`
      );
      console.log("[TourJourney] Progress response:", progressRes);

      if (progressRes.success || progressRes.data) {
        // Backend returns {checkpoints: [...], total: number}
        const progressData =
          progressRes.data?.checkpoints ||
          progressRes.data?.progress ||
          progressRes.data ||
          [];
        console.log("[TourJourney] Progress data:", progressData);

        // Sort by checkpoint_order
        if (Array.isArray(progressData)) {
          progressData.sort(
            (a: TourProgress, b: TourProgress) =>
              a.checkpoint_order - b.checkpoint_order
          );
          setProgress(progressData);
        } else {
          setProgress([]);
        }
      } else {
        console.log("[TourJourney] No progress data, setting empty array");
        setProgress([]);
      }
    } catch (err: any) {
      console.error("[TourJourney] Error loading data:", err);
      const errorMsg =
        err?.message || err?.error || "Lỗi khi tải thông tin hành trình";
      setError(errorMsg);
      setToast({ message: errorMsg, type: "error" });
    }
    setLoading(false);
  };

  const initializeFromItinerary = async () => {
    setUpdateLoading(true);
    try {
      const res = await api.request(
        `/tour-progress/booking/${bookingId}/init-from-itinerary`,
        {
          method: "POST",
          body: JSON.stringify({ booking_id: parseInt(bookingId) }),
        }
      );

      if (res.success) {
        setToast({
          message: "Khởi tạo hành trình thành công!",
          type: "success",
        });
        loadBookingAndProgress();
      } else {
        setToast({ message: res.error || "Lỗi khi khởi tạo", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Lỗi khi khởi tạo hành trình", type: "error" });
    }
    setUpdateLoading(false);
  };

  const updateCheckpointStatus = async (
    checkpointId: number,
    newStatus: string
  ) => {
    setUpdateLoading(true);
    try {
      console.log(
        `[Update] Updating checkpoint ${checkpointId} to ${newStatus}`
      );

      let endpoint = "";
      let method = "POST";
      let body: any = {};

      // Use specific endpoints for check-in and complete
      if (newStatus === "in_progress") {
        endpoint = `/tour-progress/${checkpointId}/check-in`;
        body = {
          notes: `Đã check-in lúc ${new Date().toLocaleString("vi-VN")}`,
        };
      } else if (newStatus === "completed") {
        endpoint = `/tour-progress/${checkpointId}/complete`;
        body = {
          notes: `Hoàn thành lúc ${new Date().toLocaleString("vi-VN")}`,
        };
      } else {
        // Use PATCH for other status changes
        endpoint = `/tour-progress/${checkpointId}`;
        method = "PATCH";
        body = { status: newStatus };
        // Auto-set timestamps
        if (newStatus === "in_progress") {
          body.arrival_time = new Date().toISOString();
        } else if (newStatus === "completed") {
          body.departure_time = new Date().toISOString();
        }
      }

      const res = await api.request(endpoint, {
        method: method,
        body: JSON.stringify(body),
      });

      console.log("[Update] Response:", res);

      if (res.success || res.data) {
        setToast({
          message: "Cập nhật trạng thái thành công!",
          type: "success",
        });
        await loadBookingAndProgress();
      } else {
        setToast({
          message: res.error || "Lỗi khi cập nhật trạng thái",
          type: "error",
        });
      }
    } catch (err: any) {
      console.error("[Update] Error:", err);
      setToast({
        message: err.message || "Lỗi khi cập nhật trạng thái",
        type: "error",
      });
    }
    setUpdateLoading(false);
  };

  const uploadImages = async (checkpointId: number, files: FileList) => {
    if (!files || files.length === 0) {
      setToast({ message: "Vui lòng chọn ảnh", type: "warning" });
      return;
    }

    if (files.length > 10) {
      setToast({
        message: "Chỉ được upload tối đa 10 ảnh mỗi lần",
        type: "warning",
      });
      return;
    }

    setUpdateLoading(true);
    const formData = new FormData();

    // Add all files to formData
    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    try {
      console.log(
        `[Upload] Uploading ${files.length} images to checkpoint ${checkpointId}`
      );
      const res = await api.request(
        `/tour-progress/${checkpointId}/upload-images`,
        {
          method: "POST",
          body: formData,
          headers: {
            // Don't set Content-Type, let browser set it with boundary
          },
        }
      );

      console.log("[Upload] Response:", res);

      if (res.success || res.data) {
        setToast({
          message: `Upload thành công ${files.length} ảnh!`,
          type: "success",
        });
        // Reload to show new images
        await loadBookingAndProgress();
      } else {
        setToast({
          message: res.error || "Lỗi khi upload ảnh",
          type: "error",
        });
      }
    } catch (err: any) {
      console.error("[Upload] Error:", err);
      setToast({
        message: err.message || "Lỗi khi upload ảnh",
        type: "error",
      });
    }
    setUpdateLoading(false);
  };

  const downloadAllImages = async () => {
    try {
      setToast({ message: "Đang chuẩn bị tải xuống...", type: "info" });

      // Get token from api client
      const token = api.getToken();
      if (!token) {
        setToast({ message: "Vui lòng đăng nhập lại", type: "error" });
        return;
      }

      // Don't add /api here because NEXT_PUBLIC_API_URL already includes it
      const baseURL =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
      const url = `${baseURL}/tour-progress/booking/${bookingId}/download-images`;

      // Fetch with authorization
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `tour_${bookingId}_images.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        setToast({ message: "Đã tải xuống tất cả ảnh!", type: "success" });
      } else {
        const errorData = await response.json();
        setToast({
          message: errorData.error || "Lỗi khi tải ảnh",
          type: "error",
        });
      }
    } catch (err: any) {
      console.error("[Download] Error:", err);
      setToast({
        message: err.message || "Lỗi khi tải ảnh",
        type: "error",
      });
    }
  };

  const downloadSingleImage = async (imageUrl: string, fileName: string) => {
    try {
      // Get token from api client
      const token = api.getToken();
      if (!token) {
        setToast({ message: "Vui lòng đăng nhập lại", type: "error" });
        return;
      }

      // Image URL is already served by backend at /uploads/...
      // Just make it absolute if it's relative
      const fullUrl = imageUrl.startsWith("http")
        ? imageUrl
        : `http://127.0.0.1:5000${imageUrl}`;

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        setToast({ message: `Đã tải xuống ${fileName}`, type: "success" });
      } else {
        setToast({ message: "Lỗi khi tải ảnh", type: "error" });
      }
    } catch (err: any) {
      console.error("[Download] Error:", err);
      setToast({ message: "Lỗi khi tải ảnh", type: "error" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "in_progress":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      case "pending":
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "in_progress":
        return <Navigation className="w-6 h-6 text-blue-600 animate-pulse" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "in_progress":
        return "Đang đi";
      case "pending":
        return "Chưa đến";
      default:
        return status;
    }
  };

  const completedCount = progress.filter(
    (p) => p.status === "completed"
  ).length;
  const totalCount = progress.length;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Đang tải hành trình...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Có lỗi xảy ra
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Quay lại
            </button>
            <button
              onClick={() => {
                setError(null);
                loadBookingAndProgress();
              }}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
            >
              Thử lại
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Không tìm thấy booking
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Booking này không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
          >
            Quay lại
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Quay lại</span>
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Hành trình Tour
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {booking?.tour?.title || "Đang tải..."}
              </p>
              {booking?.date && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Ngày khởi hành:{" "}
                  {new Date(booking.date).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
            {!isGuide && booking && (
              <button
                onClick={() => router.push(`/tours/${booking.tour?.id}`)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-semibold"
              >
                Xem chi tiết tour
              </button>
            )}
          </div>
        </div>

        {/* Tour Guide Info for Customers */}
        {!isGuide && booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl p-6 mb-8 border-2 border-blue-200 dark:border-blue-800"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Thông tin hướng dẫn viên
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Họ tên
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {booking.assignment?.tour_guide?.full_name ||
                    booking.assignment?.tour_guide?.username ||
                    "Chưa có thông tin"}
                </p>
              </div>
              {booking.assignment?.tour_guide?.email && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Email
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {booking.assignment.tour_guide.email}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 mb-8 border border-white/50 dark:border-gray-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Tiến độ hành trình
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {progress.length > 0 ? (
                  <>
                    {completedCount} / {totalCount} điểm đã hoàn thành
                    {progress.some((p) => p.images && p.images.length > 0) && (
                      <>
                        {" • "}
                        {progress.reduce(
                          (sum, p) => sum + (p.images?.length || 0),
                          0
                        )}{" "}
                        ảnh đã upload
                      </>
                    )}
                  </>
                ) : (
                  "Hành trình chưa được khởi tạo"
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isGuide &&
                progress.some((p) => p.images && p.images.length > 0) && (
                  <button
                    onClick={downloadAllImages}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Tải tất cả ảnh
                  </button>
                )}
              <div className="text-right">
                <div className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                  {progressPercentage.toFixed(0)}%
                </div>
                {progress.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {progress.filter((p) => p.status === "in_progress").length >
                    0
                      ? "Đang di chuyển"
                      : completedCount === totalCount
                      ? "Hoàn thành"
                      : "Chưa bắt đầu"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full flex items-center justify-center text-white text-sm font-semibold ${
                progressPercentage === 100
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : progressPercentage > 0
                  ? "bg-gradient-to-r from-teal-500 to-blue-500"
                  : "bg-gray-400"
              }`}
            >
              {progressPercentage > 10 && `${progressPercentage.toFixed(0)}%`}
            </motion.div>
          </div>

          {progress.length === 0 && isGuide && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={initializeFromItinerary}
                disabled={updateLoading}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-lg"
              >
                {updateLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang khởi tạo...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    Khởi tạo hành trình từ lịch trình tour
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Timeline */}
        {progress.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-12 text-center border border-white/50 dark:border-gray-700/50"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-blue-100 dark:from-teal-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Chưa có hành trình
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isGuide
                  ? "Tour chưa có lịch trình chi tiết. Bạn có thể khởi tạo hành trình từ lịch trình tour bên dưới."
                  : "Hướng dẫn viên sẽ cập nhật hành trình sớm nhất khi tour bắt đầu."}
              </p>

              {isGuide && booking?.tour?.id && (
                <div className="space-y-4">
                  <button
                    onClick={initializeFromItinerary}
                    disabled={updateLoading}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 transition-colors shadow-lg mx-auto"
                  >
                    {updateLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang khởi tạo...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5" />
                        Khởi tạo hành trình từ lịch trình tour
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hệ thống sẽ tự động tạo các điểm dừng chân dựa trên lịch
                    trình tour
                  </p>
                </div>
              )}

              {!isGuide && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💡 <strong>Mẹo:</strong> Bạn có thể theo dõi vị trí thời
                    gian thực của tour khi hành trình được cập nhật.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}

        {/* Tour Itinerary - Always show planned itinerary if available */}
        {booking?.tour?.itinerary &&
          (() => {
            const itineraryArray = convertItineraryFormat(
              booking.tour.itinerary
            );
            return (
              itineraryArray.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/50 dark:border-gray-700/50"
                >
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-teal-600" />
                    Lịch trình chi tiết tour
                  </h2>
                  <div className="space-y-6">
                    {itineraryArray.map((day: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800"
                      >
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          Ngày {day.day || index + 1}: {day.title}
                        </h3>
                        {day.description && (
                          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                            {day.description}
                          </p>
                        )}
                        {day.activities &&
                          Array.isArray(day.activities) &&
                          day.activities.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                Hoạt động:
                              </h4>
                              <ul className="space-y-2">
                                {day.activities.map(
                                  (activity: string, actIdx: number) => (
                                    <li
                                      key={actIdx}
                                      className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                                    >
                                      <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                      <span>{activity}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        {day.accommodation && (
                          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>
                              <strong>Chỗ ở:</strong> {day.accommodation}
                            </span>
                          </div>
                        )}
                        {day.meals && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Info className="w-4 h-4" />
                            <span>
                              <strong>Bữa ăn:</strong> {day.meals}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            );
          })()}

        {/* Progress Timeline */}
        {progress.length > 0 && (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 via-blue-500 to-purple-500 dark:from-teal-600 dark:via-blue-600 dark:to-purple-600" />

            {/* Checkpoints */}
            <div className="space-y-8">
              {progress.map((checkpoint, index) => (
                <motion.div
                  key={checkpoint.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-20"
                >
                  {/* Checkpoint Icon */}
                  <div className="absolute left-4 top-0 -translate-x-1/2 bg-white dark:bg-gray-800 p-2 rounded-full border-4 border-white dark:border-gray-800 shadow-lg">
                    {getStatusIcon(checkpoint.status)}
                  </div>

                  {/* Checkpoint Card */}
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50 hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 rounded-full text-sm font-bold">
                            Điểm {checkpoint.checkpoint_order}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                              checkpoint.status
                            )}`}
                          >
                            {getStatusText(checkpoint.status)}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {checkpoint.checkpoint_name}
                        </h3>
                        {checkpoint.checkpoint_description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {checkpoint.checkpoint_description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {checkpoint.arrival_time && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Đến:
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {new Date(checkpoint.arrival_time).toLocaleString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                      )}
                      {checkpoint.departure_time && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-red-600" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Rời:
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {new Date(checkpoint.departure_time).toLocaleString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* GPS */}
                    {(checkpoint.latitude || checkpoint.longitude) && (
                      <div className="mb-4 flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Tọa độ:
                        </span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {checkpoint.latitude?.toFixed(6)},{" "}
                          {checkpoint.longitude?.toFixed(6)}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {checkpoint.notes && (
                      <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                              Ghi chú:
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {checkpoint.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Images */}
                    {checkpoint.images && checkpoint.images.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Hình ảnh tại điểm này ({checkpoint.images.length}
                            /10)
                          </span>
                          {isGuide && checkpoint.images.length < 10 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Có thể thêm {10 - checkpoint.images.length} ảnh
                              nữa
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {checkpoint.images.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-lg overflow-hidden group"
                            >
                              <img
                                src={img}
                                alt={`Checkpoint ${
                                  checkpoint.checkpoint_order
                                } - Image ${idx + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  setSelectedImages(checkpoint.images);
                                  setShowImageModal(true);
                                }}
                              />
                              {/* Download button overlay */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadSingleImage(
                                    img,
                                    `checkpoint_${
                                      checkpoint.checkpoint_order
                                    }_image_${idx + 1}.jpg`
                                  );
                                }}
                                className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Tải ảnh này"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions for Tour Guide */}
                    {isGuide && (
                      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {checkpoint.status === "pending" && (
                          <button
                            onClick={() =>
                              updateCheckpointStatus(
                                checkpoint.id,
                                "in_progress"
                              )
                            }
                            disabled={updateLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-semibold"
                          >
                            <Navigation className="w-4 h-4" />
                            Bắt đầu
                          </button>
                        )}
                        {checkpoint.status === "in_progress" && (
                          <button
                            onClick={() =>
                              updateCheckpointStatus(checkpoint.id, "completed")
                            }
                            disabled={updateLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-semibold"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Hoàn thành
                          </button>
                        )}
                        <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors text-sm font-semibold">
                          <Camera className="w-4 h-4" />
                          Thêm ảnh
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files &&
                              uploadImages(checkpoint.id, e.target.files)
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="p-4 grid grid-cols-2 gap-4 max-h-[90vh] overflow-auto">
                {selectedImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-auto rounded-lg"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
