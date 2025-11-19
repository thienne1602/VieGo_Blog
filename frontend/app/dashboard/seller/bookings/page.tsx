"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Mail as MailIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import Toast from "../../../../components/common/Toast";
import ConfirmModal from "../../../../components/common/ConfirmModal";

export default function SellerBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    bookingId: number | null;
    status: string | null;
    booking: any | null;
  }>({ open: false, bookingId: null, status: null, booking: null });
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    bookingId: number | null;
    booking: any | null;
  }>({ open: false, bookingId: null, booking: null });
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [assignments, setAssignments] = useState<Map<number, any>>(new Map());

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.getSellerBookings();
        if (res.success && mounted) {
          const bookingsData = res.data.bookings || [];
          setBookings(bookingsData);
          
          // Build assignments map
          const assignmentsMap = new Map();
          bookingsData.forEach((booking: any) => {
            if (booking.assignment) {
              assignmentsMap.set(booking.id, booking.assignment);
            }
          });
          setAssignments(assignmentsMap);
        }
      } catch (err) {
        setToast({ message: "Lỗi khi tải đặt chỗ", type: "error" });
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateStatus = async (bookingId: number, status: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setConfirmModal({
      open: true,
      bookingId,
      status,
      booking,
    });
  };

  const confirmUpdateStatus = async () => {
    if (!confirmModal.bookingId || !confirmModal.status) return;

    try {
      console.log('🔵 [Booking Update] Updating booking:', {
        bookingId: confirmModal.bookingId,
        status: confirmModal.status
      });
      
      const res = await api.updateBooking(confirmModal.bookingId, {
        status: confirmModal.status,
      });
      
      console.log('🔵 [Booking Update] Response:', res);
      
      if (res.success || res.data) {
        // ✅ UPDATE STATE IMMEDIATELY - Don't wait for reload
        const updatedBooking = res.data?.booking;
        if (updatedBooking) {
          setBookings((prevBookings) =>
            prevBookings.map((b) =>
              b.id === confirmModal.bookingId ? { ...b, ...updatedBooking, status: confirmModal.status } : b
            )
          );
        }

        // Build success message
        let successMessage = `✅ Đã ${confirmModal.status === "confirmed" ? "xác nhận" : "hủy"} đặt chỗ thành công!`;
        
        // ✅ ALWAYS show email notification if booking was confirmed
        if (confirmModal.status === "confirmed") {
          // Backend always returns email info in response if status is confirmed
          if (res.data?.email_attempted || res.data?.email_sent !== undefined) {
            // Use the email_message from backend (it's already formatted)
            const emailMessage = res.data?.email_message || res.data?.email_error;
            if (emailMessage) {
              successMessage += `\n\n${emailMessage}`;
            } else if (res.data?.email_sent) {
              successMessage += `\n\n📧 Email xác nhận đã được gửi đến ${confirmModal.booking?.email || "khách hàng"}`;
            } else {
              successMessage += `\n\n⚠️ Lưu ý: Không thể gửi email xác nhận. Vui lòng kiểm tra cấu hình email trong phần Hồ Sơ.`;
            }
          } else {
            // Fallback if backend doesn't return email info (shouldn't happen)
            successMessage += `\n\n📧 Đang kiểm tra việc gửi email xác nhận...`;
          }
        }
        
        console.log('🟢 [Booking Update] Showing success toast:', successMessage);
        setToast({
          message: successMessage,
          type: "success",
        });
        
        // Auto-close toast after 6 seconds (longer for booking confirmations)
        setTimeout(() => {
          setToast(null);
        }, 6000);

        // Reload bookings list in background to ensure data consistency (but state is already updated)
        setTimeout(async () => {
          try {
            const bookingsRes = await api.getSellerBookings();
            if (bookingsRes.success) {
              setBookings(bookingsRes.data.bookings || []);
            }
          } catch (err) {
            console.error("Error reloading bookings:", err);
          }
        }, 500);
      } else {
        const errorMsg = res.error || "Lỗi cập nhật đặt chỗ";
        console.log('🔴 [Booking Update] Error:', errorMsg);
        setToast({
          message: errorMsg,
          type: "error",
        });
        setTimeout(() => {
          setToast(null);
        }, 5000);
      }
    } catch (err) {
      console.error('🔴 [Booking Update] Exception:', err);
      setToast({ message: "Lỗi khi cập nhật đặt chỗ", type: "error" });
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }

    setConfirmModal({ open: false, bookingId: null, status: null, booking: null });
  };

  const viewBookingDetail = async (bookingId: number) => {
    setDetailLoading(true);
    try {
      const res = await api.getBooking(bookingId);
      if (res.success && res.data.booking) {
        setDetailModal({ open: true, bookingId, booking: res.data.booking });
      } else {
        setToast({
          message: res.error || "Lỗi khi tải chi tiết đặt chỗ",
          type: "error",
        });
      }
    } catch (err) {
      setToast({ message: "Lỗi khi tải chi tiết đặt chỗ", type: "error" });
    }
    setDetailLoading(false);
  };

  const formatPrice = (price: number, currency: string = "VND") => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      confirmed: "bg-green-100 text-green-800 border-green-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
    };

    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle2 className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };

    const labels = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      cancelled: "Đã hủy",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}
      >
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "assigned") {
      // Show bookings that have an assignment
      return !!b.assignment || assignments.has(b.id);
    }
    return b.status === filterStatus;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải đặt chỗ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý đặt chỗ</h1>
              <p className="text-gray-600">Xem và quản lý tất cả đặt chỗ từ khách hàng</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/seller")}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Quay lại Dashboard
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tổng đặt chỗ</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Chờ xác nhận</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã xác nhận</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã hủy</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </motion.div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chờ xác nhận" },
              { value: "confirmed", label: "Đã xác nhận" },
              { value: "assigned", label: "Đã phân công" },
              { value: "cancelled", label: "Đã hủy" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  filterStatus === filter.value
                    ? "bg-teal-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có đặt chỗ nào</h3>
            <p className="text-gray-600">
              {filterStatus === "all"
                ? "Chưa có khách hàng nào đặt chỗ tour của bạn."
                : `Không có đặt chỗ nào ở trạng thái "${filterStatus}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left: Booking Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {booking.tour?.title || "—"}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(booking.status)}
                          {(booking.assignment || assignments.has(booking.id)) && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border bg-blue-100 text-blue-800 border-blue-300">
                              <CheckCircle2 className="w-4 h-4" />
                              Đã phân công
                            </span>
                          )}
                        </div>
                      </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>
                              <strong>Khách hàng:</strong>{" "}
                              {booking.user?.full_name || booking.user?.username || booking.full_name || "—"}
                            </span>
                          </div>
                          {booking.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{booking.email}</span>
                            </div>
                          )}
                          {booking.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{booking.phone}</span>
                            </div>
                          )}
                          {booking.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{booking.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              <strong>Ngày khởi hành:</strong> {formatDate(booking.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>
                              <strong>Số người:</strong> {booking.participants}
                              {booking.adults > 0 && ` (${booking.adults} người lớn`}
                              {booking.children > 0 && `, ${booking.children} trẻ em`}
                              {booking.infants > 0 && `, ${booking.infants} em bé`}
                              {booking.adults > 0 && ")"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              <strong>Tổng tiền:</strong>{" "}
                              {formatPrice(booking.total_price, booking.currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CreditCard className="w-4 h-4" />
                            <span>
                              <strong>Thanh toán:</strong>{" "}
                              {booking.payment_method === "office"
                                ? "Tại văn phòng"
                                : booking.payment_method === "bank_transfer"
                                ? "Chuyển khoản"
                                : booking.payment_method}
                            </span>
                          </div>
                        </div>
                      </div>

                      {booking.created_at && (
                        <div className="text-xs text-gray-500">
                          Đặt chỗ lúc: {new Date(booking.created_at).toLocaleString("vi-VN")}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      {booking.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(booking.id, "confirmed")}
                            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Xác nhận
                          </button>
                          <button
                            onClick={() => updateStatus(booking.id, "cancelled")}
                            className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Hủy đặt chỗ
                          </button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <>
                          <div className="px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-center font-semibold">
                            Đã xác nhận
                          </div>
                          {booking.payment_status !== "paid" && booking.email && (
                            <button
                              onClick={async () => {
                                try {
                                  const res = await api.sendPaymentReminder(booking.id);
                                  if (res.success || res.data) {
                                    setToast({
                                      message: res.data?.message || res.message || `Đã gửi email nhắc nhở thanh toán đến ${booking.email}`,
                                      type: "success",
                                    });
                                  } else {
                                    setToast({
                                      message: res.error || "Lỗi khi gửi email nhắc nhở",
                                      type: "error",
                                    });
                                  }
                                } catch (err: any) {
                                  setToast({
                                    message: err?.message || "Lỗi khi gửi email nhắc nhở",
                                    type: "error",
                                  });
                                }
                                setTimeout(() => setToast(null), 5000);
                              }}
                              className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <MailIcon className="w-4 h-4" />
                              Gửi nhắc thanh toán
                            </button>
                          )}
                        </>
                      )}
                      {booking.status === "cancelled" && (
                        <div className="px-4 py-2.5 bg-red-50 text-red-700 rounded-lg text-center font-semibold">
                          Đã hủy
                        </div>
                      )}
                      <button
                        onClick={() => viewBookingDetail(booking.id)}
                        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                      {booking.tour && (
                        <a
                          href={`/tours/${booking.tour.id}`}
                          className="w-full px-4 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Xem Tour
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={
          confirmModal.status === "confirmed"
            ? "Xác nhận đặt chỗ"
            : "Hủy đặt chỗ"
        }
        message={
          confirmModal.status === "confirmed"
            ? `Bạn có chắc muốn xác nhận đặt chỗ này? Email xác nhận sẽ được gửi đến khách hàng.`
            : `Bạn có chắc muốn hủy đặt chỗ này? Hành động này không thể hoàn tác.`
        }
        onCancel={() =>
          setConfirmModal({ open: false, bookingId: null, status: null, booking: null })
        }
        onConfirm={confirmUpdateStatus}
        confirmText={confirmModal.status === "confirmed" ? "Xác nhận" : "Hủy đặt chỗ"}
        cancelText="Quay lại"
      />

      {/* Booking Detail Modal */}
      {detailModal.open && detailModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết đặt chỗ</h2>
              <button
                onClick={() => setDetailModal({ open: false, bookingId: null, booking: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải chi tiết...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {detailModal.booking.tour?.title || "—"}
                    </h3>
                    {getStatusBadge(detailModal.booking.status)}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Mã đặt chỗ</div>
                    <div className="text-lg font-bold text-gray-900">#{detailModal.booking.id}</div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Thông tin khách hàng
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Họ tên</div>
                        <div className="font-semibold text-gray-900">
                          {detailModal.booking.user?.full_name || detailModal.booking.full_name || "—"}
                        </div>
                      </div>
                    </div>
                    {detailModal.booking.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Email</div>
                          <div className="font-semibold text-gray-900">{detailModal.booking.email}</div>
                        </div>
                      </div>
                    )}
                    {detailModal.booking.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Số điện thoại</div>
                          <div className="font-semibold text-gray-900">{detailModal.booking.phone}</div>
                        </div>
                      </div>
                    )}
                    {detailModal.booking.address && (
                      <div className="flex items-start gap-3 md:col-span-2">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <div className="text-sm text-gray-600">Địa chỉ</div>
                          <div className="font-semibold text-gray-900">{detailModal.booking.address}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Thông tin đặt chỗ
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Ngày khởi hành</div>
                        <div className="font-semibold text-gray-900">
                          {formatDate(detailModal.booking.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Số người tham gia</div>
                        <div className="font-semibold text-gray-900">
                          {detailModal.booking.participants} người
                          {detailModal.booking.adults > 0 && ` (${detailModal.booking.adults} người lớn`}
                          {detailModal.booking.children > 0 && `, ${detailModal.booking.children} trẻ em`}
                          {detailModal.booking.infants > 0 && `, ${detailModal.booking.infants} em bé`}
                          {detailModal.booking.adults > 0 && ")"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Phương thức thanh toán</div>
                        <div className="font-semibold text-gray-900">
                          {detailModal.booking.payment_method === "office"
                            ? "Tại văn phòng"
                            : detailModal.booking.payment_method === "bank_transfer"
                            ? "Chuyển khoản"
                            : detailModal.booking.payment_method}
                        </div>
                      </div>
                    </div>
                    {detailModal.booking.created_at && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Ngày đặt chỗ</div>
                          <div className="font-semibold text-gray-900">
                            {new Date(detailModal.booking.created_at).toLocaleString("vi-VN")}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="bg-blue-50 rounded-xl p-6 space-y-3">
                  <h4 className="text-lg font-bold text-gray-900 border-b border-blue-200 pb-2">
                    Chi tiết thanh toán
                  </h4>
                  {detailModal.booking.discount_code && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Mã giảm giá:</span>
                      <span className="font-semibold text-gray-900">{detailModal.booking.discount_code}</span>
                    </div>
                  )}
                  {detailModal.booking.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Giảm giá:</span>
                      <span className="font-semibold text-green-600">
                        -{formatPrice(detailModal.booking.discount_amount, detailModal.booking.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t-2 border-blue-200">
                    <span className="text-lg font-bold text-gray-900">Tổng tiền:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(detailModal.booking.total_price, detailModal.booking.currency)}
                    </span>
                  </div>
                </div>

                {detailModal.booking.notes && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Ghi chú</h4>
                    <p className="text-gray-700">{detailModal.booking.notes}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
