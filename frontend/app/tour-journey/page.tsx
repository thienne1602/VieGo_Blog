"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  Navigation,
  Calendar,
  MapPin,
  Users,
  Loader2,
  AlertCircle,
  Pin,
  PinOff,
} from "lucide-react";
import api from "@/lib/api";
import Toast from "@/components/common/Toast";

interface Booking {
  id: number;
  booking_date: string;
  adults: number;
  children: number;
  infants: number;
  status: string;
  is_pinned?: boolean;
  pinned_at?: string;
  tour: {
    id: number;
    title: string;
    starting_location: string;
    duration_days: number;
    featured_image: string;
  };
  assignment?: {
    id: number;
    status: string;
    is_pinned?: boolean;
    pinned_at?: string;
  };
}

export default function TourJourneyListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinningId, setPinningId] = useState<number | null>(null);
  const [toast, setToast] = useState<any | null>(null);
  const backgroundImageUrl = "/images/backround_tour.jpg";

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;

    if (!user) {
      router.push("/welcome");
      return;
    }
    loadMyBookings();
  }, [user, authLoading]);

  const loadMyBookings = async () => {
    setLoading(true);
    try {
      let validBookings: any[] = [];

      // If user is tour guide, load assigned tours
      if (user?.role === "tour_guide") {
        console.log("🎯 Loading assignments for tour guide");
        const res = await api.request("/tour-assignments/my-assignments", {
          method: "GET",
          cache: false,
          params: { _t: Date.now() },
        });
        console.log("📦 Tour Guide Assignments Response:", res);

        if (res.success && res.data?.assignments) {
          // Convert assignments to booking format
          validBookings = res.data.assignments
            .filter((a: any) => a.booking && a.booking.tour)
            .map((a: any) => ({
              id: a.booking_id,
              booking_id: a.booking_id,
              booking_date: a.booking.date || a.booking.booking_date,
              adults: a.booking.adults || 0,
              children: a.booking.children || 0,
              infants: a.booking.infants || 0,
              status: a.booking.status,
              tour: a.booking.tour || a.tour,
              assignment: a,
              is_pinned: a.is_pinned || false,
              pinned_at: a.pinned_at,
            }));
          console.log("📦 Mapped tour guide bookings:", validBookings);
        }
      } else {
        // Customer view: load own bookings
        console.log("👤 Loading bookings for customer");
        const res = await api.request("/bookings/my-bookings", {
          method: "GET",
          cache: false,
          params: { _t: Date.now() },
        });
        console.log("📦 Customer Bookings Response:", res);

        if (res.success) {
          const allBookings = res.data?.bookings || [];
          // Show all bookings with assignment (tour guide assigned) or confirmed status
          validBookings = allBookings.filter(
            (b: any) => b.status === "confirmed" || b.assignment !== null
          );
          console.log("📦 Valid customer bookings:", validBookings);
        }
      }

      // Sort bookings: pinned first (by pinned_at desc), then by booking_date desc
      validBookings.sort((a: any, b: any) => {
        // Pinned items come first
        const aIsPinned = a.is_pinned || a.assignment?.is_pinned || false;
        const bIsPinned = b.is_pinned || b.assignment?.is_pinned || false;

        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;

        // If both pinned, sort by pinned_at (most recent first)
        if (aIsPinned && bIsPinned) {
          const aPinnedAt = a.pinned_at || a.assignment?.pinned_at || "";
          const bPinnedAt = b.pinned_at || b.assignment?.pinned_at || "";
          return new Date(bPinnedAt).getTime() - new Date(aPinnedAt).getTime();
        }

        // Not pinned: sort by booking_date desc
        return (
          new Date(b.booking_date).getTime() -
          new Date(a.booking_date).getTime()
        );
      });

      setBookings(validBookings);

      if (validBookings.length === 0) {
        setToast({
          message:
            user?.role === "tour_guide"
              ? "Bạn chưa được phân công tour nào"
              : "Bạn chưa có booking nào được xác nhận",
          type: "info",
        });
      }
    } catch (err) {
      console.error("❌ Error loading bookings:", err);
      setToast({ message: "Lỗi khi tải danh sách booking", type: "error" });
    }
    setLoading(false);
  };

  // Toggle pin/unpin tour
  const handleTogglePin = async (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to tour detail

    const isPinned =
      booking.is_pinned || booking.assignment?.is_pinned || false;
    setPinningId(booking.id);

    try {
      let res;
      if (user?.role === "tour_guide" && booking.assignment) {
        // Tour guide: pin assignment
        res = await api.request(
          `/tour-assignments/${booking.assignment.id}/pin`,
          {
            method: "POST",
          }
        );
      } else {
        // Customer: pin booking
        res = await api.request(`/bookings/${booking.id}/pin`, {
          method: "POST",
        });
      }

      if (res.success) {
        setToast({
          message: isPinned ? "Đã bỏ ghim tour" : "Đã ghim tour lên đầu",
          type: "success",
        });
        // Reload bookings to update the list
        await loadMyBookings();
      } else {
        setToast({
          message: res.error || "Không thể ghim tour",
          type: "error",
        });
      }
    } catch (err) {
      console.error("❌ Error toggling pin:", err);
      setToast({ message: "Lỗi khi ghim tour", type: "error" });
    }
    setPinningId(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-white">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50 dark:opacity-70"
          style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-slate-50/40 to-white/50 dark:from-slate-950/95 dark:via-slate-900/85 dark:to-slate-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_45%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_45%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-10 space-y-10">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-white/60">
                {user?.role === "tour_guide" ? "Planner" : "Timeline"}
              </p>
              <h1 className="text-4xl font-black tracking-tight mt-2 text-gray-900 dark:text-white">
                {user?.role === "tour_guide"
                  ? "Tour được phân công"
                  : "Hành trình của bạn"}
              </h1>
              <p className="text-gray-600 dark:text-white/70 mt-3 max-w-2xl">
                {user?.role === "tour_guide"
                  ? "Xem nhanh các tour đang chờ bạn cập nhật tiến độ."
                  : "Tiếp tục cuộc hành trình cùng VieGo với trải nghiệm mới hiện đại."}
              </p>
            </div>
            {user?.role !== "tour_guide" && (
              <button
                onClick={() => router.push("/tours")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-teal-600 dark:bg-white/10 text-white dark:text-white border border-teal-700 dark:border-white/20 hover:bg-teal-700 dark:hover:bg-white/20 transition"
              >
                Khám phá thêm tour
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg dark:shadow-none">
              <p className="text-sm text-gray-600 dark:text-white/70">
                Tổng tour
              </p>
              <p className="text-4xl font-bold mt-2 text-gray-900 dark:text-white">
                {bookings.length}
              </p>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-white/50 mt-2">
                Đang hoạt động
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg dark:shadow-none">
              <p className="text-sm text-gray-600 dark:text-white/70">
                {user?.role === "tour_guide" ? "Chờ cập nhật" : "Sắp khởi hành"}
              </p>
              <p className="text-4xl font-bold mt-2 text-gray-900 dark:text-white">
                {
                  bookings.filter((b) =>
                    user?.role === "tour_guide"
                      ? (b as any).assignment?.status !== "completed"
                      : new Date(b.booking_date) >= new Date()
                  ).length
                }
              </p>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-white/50 mt-2">
                Ưu tiên hôm nay
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg dark:shadow-none">
              <p className="text-sm text-gray-600 dark:text-white/70">
                Địa điểm nổi bật
              </p>
              <p className="text-4xl font-bold mt-2 text-gray-900 dark:text-white">
                {
                  new Set(
                    bookings.map((b) => b.tour.starting_location || "Khác")
                  ).size
                }
              </p>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-white/50 mt-2">
                Thành phố
              </p>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white/90 dark:bg-white/5 backdrop-blur-2xl shadow-xl dark:shadow-[0_20px_70px_rgba(15,23,42,0.45)] p-12 text-center"
          >
            <Navigation className="w-16 h-16 text-gray-400 dark:text-white/40 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
              {user?.role === "tour_guide"
                ? "Chưa có tour nào được phân công"
                : "Chưa có hành trình nào"}
            </h3>
            <p className="text-gray-600 dark:text-white/70 mb-6">
              {user?.role === "tour_guide"
                ? "Liên hệ điều phối để nhận tour đầu tiên của bạn."
                : "Hãy đặt tour để bắt đầu trải nghiệm hành trình sống động."}
            </p>
            {user?.role !== "tour_guide" && (
              <button
                onClick={() => router.push("/tours")}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:shadow-lg transition"
              >
                Đặt tour ngay
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/tour-journey/${booking.id}`)}
                className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-white/5 backdrop-blur-2xl shadow-xl dark:shadow-[0_20px_60px_rgba(15,23,42,0.35)] hover:-translate-y-1 hover:border-teal-300 dark:hover:border-white/30 transition cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={
                      booking.tour.featured_image || "/images/tours/default.svg"
                    }
                    alt={booking.tour.title}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent dark:from-slate-900/80 dark:via-slate-900/20" />

                  {/* Pin Button - Góc trên trái */}
                  <button
                    onClick={(e) => handleTogglePin(booking, e)}
                    disabled={pinningId === booking.id}
                    className={`absolute top-3 left-3 z-10 p-2 rounded-full transition-all duration-200 ${
                      booking.is_pinned || booking.assignment?.is_pinned
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                        : "bg-black/40 text-white/80 hover:bg-black/60 hover:text-white"
                    } ${
                      pinningId === booking.id
                        ? "opacity-50 cursor-wait"
                        : "hover:scale-110"
                    }`}
                    title={
                      booking.is_pinned || booking.assignment?.is_pinned
                        ? "Bỏ ghim"
                        : "Ghim lên đầu"
                    }
                  >
                    {pinningId === booking.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : booking.is_pinned || booking.assignment?.is_pinned ? (
                      <Pin className="w-4 h-4 fill-current" />
                    ) : (
                      <Pin className="w-4 h-4" />
                    )}
                  </button>

                  {/* Pinned Badge */}
                  {(booking.is_pinned || booking.assignment?.is_pinned) && (
                    <div className="absolute top-3 left-12 z-10">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-amber-100 bg-amber-500/90">
                        Đã ghim
                      </span>
                    </div>
                  )}

                  {user?.role === "tour_guide" &&
                    (booking as any).assignment && (
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide text-white ${
                            (booking as any).assignment.status === "in_progress"
                              ? "bg-blue-500/90"
                              : (booking as any).assignment.status ===
                                "completed"
                              ? "bg-green-500/90"
                              : (booking as any).assignment.status ===
                                "accepted"
                              ? "bg-purple-500/90"
                              : "bg-amber-500/90"
                          }`}
                        >
                          {(booking as any).assignment.status === "in_progress"
                            ? "Đang thực hiện"
                            : (booking as any).assignment.status === "completed"
                            ? "Hoàn thành"
                            : (booking as any).assignment.status === "accepted"
                            ? "Đã nhận"
                            : "Mới"}
                        </span>
                      </div>
                    )}

                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-semibold leading-tight text-white">
                      {booking.tour.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-3 text-gray-700 dark:text-white/80">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-teal-600 dark:text-emerald-300" />
                    <span>
                      {new Date(booking.booking_date).toLocaleDateString(
                        "vi-VN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-teal-600 dark:text-emerald-300" />
                    <span>
                      {booking.tour.starting_location || "Đang cập nhật"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-teal-600 dark:text-emerald-300" />
                    <span>
                      {booking.adults} người lớn
                      {booking.children > 0 && ` • ${booking.children} trẻ em`}
                      {booking.infants > 0 && ` • ${booking.infants} em bé`}
                    </span>
                  </div>

                  <div className="pt-4">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-teal-600 dark:border-white/20 px-4 py-2 text-sm font-semibold text-teal-700 dark:text-white transition group-hover:bg-teal-600 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900">
                      <Navigation className="w-4 h-4" />
                      Xem hành trình
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
