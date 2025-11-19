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
  Clock,
  Navigation,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Toast from "@/components/common/Toast";

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

export default function TourGuideBookingDetailPage({ params }: any) {
  const router = useRouter();
  const bookingId =
    params?.id ||
    (typeof window !== "undefined"
      ? window.location.pathname.split("/").pop()
      : null);

  const [booking, setBooking] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any | null>(null);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
      loadParticipants();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      const res = await api.getBooking(bookingId);
      if (res.success) {
        setBooking(res.data?.booking || res.data);
      }
    } catch (err) {
      setToast({ message: "Lỗi khi tải thông tin booking", type: "error" });
    }
    setLoading(false);
  };

  const loadParticipants = async () => {
    try {
      const res = await api.request(
        `/booking-participants?booking_id=${bookingId}`
      );
      if (res.success) {
        setParticipants(res.data?.participants || []);
      }
    } catch (err) {
      console.error("Error loading participants:", err);
    }
  };

  const formatPrice = (price: number, currency: string = "VND") => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Không tìm thấy booking
          </h2>
          <button
            onClick={() => router.push("/dashboard/tour-guide")}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            Quay lại dashboard
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
            onClick={() => router.push("/dashboard/tour-guide")}
            className="flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Quay lại dashboard</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Thông tin Tour
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Chi tiết tour và danh sách hành khách
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tour & Booking Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tour Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-teal-600 pb-2">
                Thông tin Tour
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {booking.tour?.title || "N/A"}
                  </h3>
                  {booking.tour?.featured_image && (
                    <img
                      src={booking.tour.featured_image}
                      alt={booking.tour.title}
                      className="w-full h-64 object-cover rounded-xl mb-4"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Clock className="w-5 h-5 text-teal-600 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Thời gian
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {booking.tour?.duration_days || "-"} ngày
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-teal-600 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Điểm khởi hành
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {booking.tour?.starting_location || "N/A"}
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
                </div>
              </div>
            </motion.div>

            {/* Participants List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-teal-600 pb-2 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Danh sách Hành khách ({participants.length})
              </h2>

              {participants.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Chưa có thông tin hành khách</p>
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
                              <span className="text-red-600 dark:text-red-400 font-semibold">
                                ⚠️ Liên hệ khẩn cấp:
                              </span>
                              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                {emergencyContact.name}
                                {emergencyContact.phone &&
                                  ` - ${emergencyContact.phone}`}
                              </span>
                            </div>
                          )}
                          {participant.special_requirements && (
                            <div className="md:col-span-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
                              <span className="text-yellow-800 dark:text-yellow-400 font-semibold">
                                ⚠️ Yêu cầu đặc biệt:
                              </span>
                              <span className="ml-2 text-gray-900 dark:text-white">
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

          {/* Right: Contact Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50 sticky top-24"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-teal-600 pb-2">
                Thông tin Liên hệ
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Người đặt tour
                  </div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {booking.full_name}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-teal-600" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Email
                    </div>
                    <a
                      href={`mailto:${booking.email}`}
                      className="font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      {booking.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-teal-600" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Số điện thoại
                    </div>
                    <a
                      href={`tel:${booking.phone}`}
                      className="font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      {booking.phone}
                    </a>
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

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => router.push(`/tour-journey/${bookingId}`)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                >
                  <Navigation className="w-5 h-5" />
                  Xem hành trình tour
                </button>
              </div>
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
    </div>
  );
}
