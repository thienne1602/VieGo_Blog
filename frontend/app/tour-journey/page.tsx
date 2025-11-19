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
  tour: {
    id: number;
    title: string;
    starting_location: string;
    duration_days: number;
    featured_image: string;
  };
}

export default function TourJourneyListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any | null>(null);

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

  if (authLoading || loading) {
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
            {user?.role === "tour_guide"
              ? "Hành Trình Tour Được Phân Công"
              : "Hành Trình Du Lịch"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {user?.role === "tour_guide"
              ? "Quản lý và cập nhật tiến trình các tour bạn được phân công"
              : "Theo dõi hành trình các tour bạn đã đặt"}
          </p>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-12 text-center border border-white/50 dark:border-gray-700/50"
          >
            <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {user?.role === "tour_guide"
                ? "Chưa có tour nào được phân công"
                : "Chưa có hành trình nào"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {user?.role === "tour_guide"
                ? "Bạn chưa được phân công tour nào. Vui lòng liên hệ người bán để được phân công."
                : "Bạn chưa có booking nào được xác nhận"}
            </p>
            {user?.role !== "tour_guide" && (
              <button
                onClick={() => router.push("/tours")}
                className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold"
              >
                Khám phá Tours
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
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(`/tour-journey/${booking.id}`)}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/50 dark:border-gray-700/50 hover:shadow-2xl transition-all cursor-pointer group"
              >
                {/* Tour Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={
                      booking.tour.featured_image || "/images/tours/default.svg"
                    }
                    alt={booking.tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Status Badge for Tour Guide */}
                  {user?.role === "tour_guide" && booking.assignment && (
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.assignment.status === "in_progress"
                            ? "bg-blue-500 text-white"
                            : booking.assignment.status === "completed"
                            ? "bg-green-500 text-white"
                            : booking.assignment.status === "accepted"
                            ? "bg-purple-500 text-white"
                            : "bg-yellow-500 text-white"
                        }`}
                      >
                        {booking.assignment.status === "in_progress"
                          ? "Đang thực hiện"
                          : booking.assignment.status === "completed"
                          ? "Hoàn thành"
                          : booking.assignment.status === "accepted"
                          ? "Đã chấp nhận"
                          : "Mới"}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-lg line-clamp-2">
                      {booking.tour.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Khởi hành:{" "}
                      {new Date(booking.booking_date).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{booking.tour.starting_location || "N/A"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                    <Users className="w-4 h-4" />
                    <span>
                      {booking.adults} người lớn
                      {booking.children > 0 && `, ${booking.children} trẻ em`}
                      {booking.infants > 0 && `, ${booking.infants} em bé`}
                    </span>
                  </div>

                  <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold">
                    <Navigation className="w-5 h-5" />
                    Xem Hành Trình
                  </button>
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
