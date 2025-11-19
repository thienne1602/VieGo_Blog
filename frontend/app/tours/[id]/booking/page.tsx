"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Shield,
  Award,
  Clock,
  CheckCircle2,
  CreditCard,
  Building,
  AlertCircle,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import Toast from "../../../../components/common/Toast";
import ConfirmModal from "../../../../components/common/ConfirmModal";
import BookingSuccessModal from "../../../../components/common/BookingSuccessModal";

export default function BookingPage({ params }: any) {
  const router = useRouter();
  const id =
    params?.id ||
    (typeof window !== "undefined"
      ? window.location.pathname.split("/")[2]
      : null);
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.getTour(id);
        if (res.success && mounted) {
          setTour(res.data?.data || res.data);
        } else if (mounted) {
          setTour(null);
        }
      } catch (error) {
        console.error("Error loading tour:", error);
        if (mounted) setTour(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải tour...</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Tour không tìm thấy
          </h2>
          <p className="text-gray-600 mb-6">
            Tour bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <button
            onClick={() => router.push("/tours")}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
          >
            Quay lại danh sách tours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500"></div>
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 -right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Floating Back Button with Glass Effect */}
      <button
        onClick={() => router.push(`/tours/${id}`)}
        className="fixed top-24 left-4 md:left-8 z-40 flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/50 dark:border-gray-700/50 rounded-full px-4 py-2.5 shadow-lg hover:bg-white/90 dark:hover:bg-gray-900/90 hover:shadow-xl transition-all text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400"
        aria-label="Quay lại trang chi tiết tour"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium text-sm hidden sm:inline">Quay lại</span>
      </button>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            BOOKING
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Đặt tour {tour.title}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/50 dark:border-gray-700/50">
              <BookingForm tour={tour} />
            </div>
          </div>

          {/* Right Column: Tour Info with Glass Effect */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border-2 border-teal-100/50 dark:border-teal-900/50">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white border-b-2 border-teal-600 dark:border-teal-400 pb-2">
                THÔNG TIN SẢN PHẨM
              </h3>

              <div className="space-y-4">
                {/* Tour Image */}
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={tour.featured_image || "/images/tours/default.svg"}
                    alt={tour.title}
                    className="w-full h-48 object-cover"
                  />
                </div>

                {/* Tour Title */}
                <div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                    {tour.title}
                  </h4>
                  {tour.category && (
                    <span className="inline-block px-3 py-1 bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full text-xs font-semibold mb-2">
                      {tour.category}
                    </span>
                  )}
                </div>

                {/* Tour Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Thời gian: {tour.duration_days || tour.duration || "-"}{" "}
                      ngày
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span>Điểm khởi hành: {tour.starting_location || "-"}</span>
                  </div>
                  {tour.max_participants && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span>👥</span>
                      <span>Số chỗ còn nhận: {tour.max_participants}</span>
                    </div>
                  )}
                </div>

                {/* Price Display */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Giá:
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: tour.currency || "VND",
                      maximumFractionDigits: 0,
                    }).format(tour.price_per_person || tour.price || 0)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    / người
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Đảm bảo hoàn tiền 100% nếu hủy trước 24h</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Được đánh giá cao bởi khách hàng</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Xác nhận ngay lập tức</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Participant interface
interface Participant {
  full_name: string;
  gender: string;
  date_of_birth: string;
  id_number: string;
  passport_number: string;
  phone: string;
  email: string;
  participant_type: "adult" | "child" | "infant";
  special_requirements: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

function BookingForm({ tour }: any) {
  const router = useRouter();
  const [date, setDate] = useState<string>("");
  const [adults, setAdults] = useState<number>(0);
  const [children, setChildren] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [discountCode, setDiscountCode] = useState<string>("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "office" | "bank_transfer"
  >("office");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<any | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);

  // Participant details state
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Initialize participants array when counts change
  React.useEffect(() => {
    const totalCount = adults + children + infants;
    const newParticipants: Participant[] = [];

    // Add adults
    for (let i = 0; i < adults; i++) {
      newParticipants.push({
        full_name: participants[i]?.full_name || "",
        gender: participants[i]?.gender || "male",
        date_of_birth: participants[i]?.date_of_birth || "",
        id_number: participants[i]?.id_number || "",
        passport_number: participants[i]?.passport_number || "",
        phone: participants[i]?.phone || "",
        email: participants[i]?.email || "",
        participant_type: "adult",
        special_requirements: participants[i]?.special_requirements || "",
        emergency_contact_name: participants[i]?.emergency_contact_name || "",
        emergency_contact_phone: participants[i]?.emergency_contact_phone || "",
      });
    }

    // Add children
    for (let i = 0; i < children; i++) {
      const idx = adults + i;
      newParticipants.push({
        full_name: participants[idx]?.full_name || "",
        gender: participants[idx]?.gender || "male",
        date_of_birth: participants[idx]?.date_of_birth || "",
        id_number: participants[idx]?.id_number || "",
        passport_number: participants[idx]?.passport_number || "",
        phone: participants[idx]?.phone || "",
        email: participants[idx]?.email || "",
        participant_type: "child",
        special_requirements: participants[idx]?.special_requirements || "",
        emergency_contact_name: participants[idx]?.emergency_contact_name || "",
        emergency_contact_phone:
          participants[idx]?.emergency_contact_phone || "",
      });
    }

    // Add infants
    for (let i = 0; i < infants; i++) {
      const idx = adults + children + i;
      newParticipants.push({
        full_name: participants[idx]?.full_name || "",
        gender: participants[idx]?.gender || "male",
        date_of_birth: participants[idx]?.date_of_birth || "",
        id_number: participants[idx]?.id_number || "",
        passport_number: participants[idx]?.passport_number || "",
        phone: participants[idx]?.phone || "",
        email: participants[idx]?.email || "",
        participant_type: "infant",
        special_requirements: participants[idx]?.special_requirements || "",
        emergency_contact_name: participants[idx]?.emergency_contact_name || "",
        emergency_contact_phone:
          participants[idx]?.emergency_contact_phone || "",
      });
    }

    setParticipants(newParticipants);
  }, [adults, children, infants]);

  const updateParticipant = (
    index: number,
    field: keyof Participant,
    value: string
  ) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: tour.currency || "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const originalPrice = tour.price_per_person || tour.price || 0;
  const discountPrice = tour.discount_percentage
    ? originalPrice * (1 - tour.discount_percentage / 100)
    : originalPrice;

  // Calculate prices for different participant types
  const adultPrice = discountPrice;
  const childPrice = discountPrice * 0.8; // 80% of adult price
  const infantPrice = discountPrice * 0.5; // 50% of adult price

  const adultSubtotal = adultPrice * adults;
  const childSubtotal = childPrice * children;
  const infantSubtotal = infantPrice * infants;

  let baseTotal = adultSubtotal + childSubtotal + infantSubtotal;
  let discountAmount = 0;

  // Apply discount code if any
  if (discountApplied && discountCode) {
    const discountCodes: { [key: string]: number } = {
      GIAM10: 0.1,
      GIAM20: 0.2,
      GIAM30: 0.3,
    };
    const discountPercent = discountCodes[discountCode.toUpperCase()] || 0;
    discountAmount = baseTotal * discountPercent;
  }

  const totalPrice = baseTotal - discountAmount;
  const totalParticipants = adults + children + infants;
  const minParticipants = tour.min_participants || 1;

  // Check if form is valid for payment
  const isFormValid =
    date &&
    fullName &&
    email &&
    phone &&
    totalParticipants >= minParticipants &&
    totalParticipants > 0;

  const handleApplyDiscount = () => {
    const validCodes = ["GIAM10", "GIAM20", "GIAM30"];
    if (validCodes.includes(discountCode.toUpperCase())) {
      setDiscountApplied(true);
      setToast({ message: "Áp dụng mã giảm giá thành công!", type: "success" });
    } else {
      setToast({ message: "Mã giảm giá không hợp lệ", type: "error" });
    }
  };

  const handleSubmitClick = (e: any) => {
    e.preventDefault();
    // Validate before showing confirmation
    if (!date) {
      setToast({ message: "Vui lòng chọn ngày khởi hành", type: "error" });
      return;
    }

    if (totalParticipants < minParticipants) {
      setToast({
        message: `Số người tối thiểu là ${minParticipants}`,
        type: "error",
      });
      return;
    }

    if (!fullName || !email || !phone) {
      setToast({
        message: "Vui lòng điền đầy đủ thông tin liên hệ",
        type: "error",
      });
      return;
    }

    // Validate participant information
    if (totalParticipants > 0) {
      const missingInfo = participants.some(
        (p, idx) =>
          !p.full_name || !p.gender || !p.date_of_birth || !p.phone || !p.email
      );

      if (missingInfo) {
        setToast({
          message:
            "Vui lòng điền đầy đủ thông tin bắt buộc (*) cho tất cả người tham gia",
          type: "error",
        });
        return;
      }
    }

    // Show confirmation modal
    setShowConfirm(true);
  };

  const submit = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      // Step 1: Create booking
      const res = await api.bookTour(tour.id, {
        date,
        adults,
        children,
        infants,
        full_name: fullName,
        email,
        phone,
        address,
        discount_code: discountApplied ? discountCode : "",
        payment_method: paymentMethod,
      });

      if (res.success) {
        const booking = res.data?.booking || res.data;
        const bookingId = booking?.id;

        // Step 2: Save participant information if there are participants
        if (bookingId && participants.length > 0) {
          try {
            console.log(`Saving ${participants.length} participants for booking ${bookingId}`);
            const participantsData = participants.map((p) => ({
              full_name: p.full_name,
              gender: p.gender,
              date_of_birth: p.date_of_birth,
              id_number: p.id_number || null,
              passport_number: p.passport_number || null,
              phone: p.phone,
              email: p.email,
              participant_type: p.participant_type,
              special_requirements: p.special_requirements || null,
              emergency_contact_name: p.emergency_contact_name || null,
              emergency_contact_phone: p.emergency_contact_phone || null,
            }));

            console.log("Participants data to save:", participantsData);

            const participantRes = await api.request(
              `/booking-participants/booking/${bookingId}/batch`,
              {
                method: "POST",
                body: JSON.stringify({
                  participants: participantsData,
                  replace: true,
                }),
              }
            );

            console.log("Participant save response:", participantRes);

            if (!participantRes.success) {
              console.error(
                "Failed to save participant information:",
                participantRes.error || participantRes.data?.error || participantRes
              );
              setToast({ 
                message: "Đặt tour thành công nhưng có lỗi khi lưu thông tin người tham gia. Vui lòng liên hệ admin.", 
                type: "warning" 
              });
            } else {
              const message = participantRes.data?.message || participantRes.message;
              const savedCount = participantRes.data?.participants?.length || participantsData.length;
              console.log(`Participants saved successfully: ${savedCount} participants`, message);
            }
          } catch (participantErr: any) {
            console.error("Error saving participants:", participantErr);
            setToast({ 
              message: "Đặt tour thành công nhưng có lỗi khi lưu thông tin người tham gia. Vui lòng liên hệ admin.", 
              type: "warning" 
            });
          }
        } else {
          console.log("No participants to save or bookingId is missing", { bookingId, participantsCount: participants.length });
        }

        setBookingData({
          bookingId: booking?.id,
          tourTitle: tour.title,
          bookingDate: date,
          totalPrice: totalPrice,
          currency: tour.currency || "VND",
        });
        setShowSuccessModal(true);
        // Don't redirect automatically - let user close modal first
      } else {
        setToast({ message: res.error || "Lỗi khi đặt chỗ", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Lỗi khi đặt chỗ", type: "error" });
    }
    setLoading(false);
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Thông Tin Đặt Hàng */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 border-b-2 border-teal-600 pb-2">
                THÔNG TIN ĐẶT HÀNG
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    HỌ TÊN *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập Họ Tên"
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    EMAIL *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập Email"
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    SỐ ĐIỆN THOẠI *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập Số điện thoại"
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    ĐỊA CHỈ
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nhập Địa Chỉ"
                    rows={3}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    MÃ GIẢM GIÁ
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value);
                        setDiscountApplied(false);
                      }}
                      placeholder="Nhập mã giảm giá"
                      className="flex-1 border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
                    >
                      Áp Dụng
                    </button>
                  </div>
                  {discountApplied && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Mã giảm giá đã được áp dụng
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Phương Thức Thanh Toán */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 border-b-2 border-teal-600 pb-2">
                THANH TOÁN
              </h3>
              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "office"
                      ? "border-teal-600 bg-teal-50"
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="office"
                    checked={paymentMethod === "office"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "office")
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      THANH TOÁN TẠI VĂN PHÒNG
                    </div>
                    {paymentMethod === "office" && tour?.seller && (
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        {tour.seller.company_name && (
                          <p className="font-semibold">
                            {tour.seller.company_name}
                          </p>
                        )}
                        {tour.seller.company_address && (
                          <p>Trụ sở: {tour.seller.company_address}</p>
                        )}
                        {tour.seller.company_phone && (
                          <p>Tel: {tour.seller.company_phone}</p>
                        )}
                        {tour.seller.company_email && (
                          <p>Email: {tour.seller.company_email}</p>
                        )}
                        {!tour.seller.company_name &&
                          !tour.seller.company_address &&
                          !tour.seller.company_phone && (
                            <p className="text-gray-500 italic">
                              Thông tin công ty chưa được cập nhật
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "bank_transfer"
                      ? "border-teal-600 bg-teal-50"
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="bank_transfer"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "bank_transfer")
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      CHUYỂN KHOẢN NGÂN HÀNG
                    </div>
                    {paymentMethod === "bank_transfer" && tour?.seller && (
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        {tour.seller.bank_name && (
                          <p className="font-semibold">
                            Ngân hàng: {tour.seller.bank_name}
                          </p>
                        )}
                        {tour.seller.bank_account_number && (
                          <p>Số tài khoản: {tour.seller.bank_account_number}</p>
                        )}
                        {tour.seller.bank_account_holder && (
                          <p>
                            Chủ tài khoản: {tour.seller.bank_account_holder}
                          </p>
                        )}
                        {tour.seller.company_name && (
                          <p className="text-xs text-gray-500 mt-1">
                            Tên công ty: {tour.seller.company_name}
                          </p>
                        )}
                        {!tour.seller.bank_name &&
                          !tour.seller.bank_account_number &&
                          !tour.seller.bank_account_holder && (
                            <p className="text-gray-500 italic">
                              Thông tin tài khoản ngân hàng chưa được cập nhật
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Thông Tin Sản Phẩm */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 border-b-2 border-teal-600 pb-2">
                CHỌN SỐ LƯỢNG VÀ GIÁ
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    NGÀY KHỞI HÀNH *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-teal-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Participant Selection */}
                <div className="space-y-3">
                  {minParticipants >= 2 &&
                    totalParticipants < minParticipants && (
                      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-semibold text-sm">
                            ⚠️ Tour này yêu cầu tối thiểu {minParticipants}{" "}
                            người tham gia
                          </span>
                        </div>
                      </div>
                    )}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          Người lớn
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatPrice(adultPrice)} / người
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(0, adults - 1))}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold text-lg">
                          {adults}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdults(adults + 1)}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-gray-700 border-t border-gray-200 pt-2">
                      {formatPrice(adultSubtotal)}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          Trẻ Em
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatPrice(childPrice)} / người
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold text-lg">
                          {children}
                        </span>
                        <button
                          type="button"
                          onClick={() => setChildren(children + 1)}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-gray-700 border-t border-gray-200 pt-2">
                      {formatPrice(childSubtotal)}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">Em bé</div>
                        <div className="text-sm text-gray-600">
                          {formatPrice(infantPrice)} / người
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setInfants(Math.max(0, infants - 1))}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold text-lg">
                          {infants}
                        </span>
                        <button
                          type="button"
                          onClick={() => setInfants(infants + 1)}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-gray-700 border-t border-gray-200 pt-2">
                      {formatPrice(infantSubtotal)}
                    </div>
                  </div>
                </div>

                {/* Participant Information Forms */}
                {participants.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-bold text-gray-900 border-b-2 border-teal-600 pb-2 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      THÔNG TIN NGƯỜI THAM GIA ({participants.length})
                    </h4>

                    {participants.map((participant, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-teal-200 dark:border-teal-800"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <User className="w-5 h-5 text-teal-600" />
                          <h5 className="font-bold text-gray-900 dark:text-white">
                            Người {index + 1} -{" "}
                            {participant.participant_type === "adult"
                              ? "Người lớn"
                              : participant.participant_type === "child"
                              ? "Trẻ em"
                              : "Em bé"}
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              Họ và tên *
                            </label>
                            <input
                              type="text"
                              value={participant.full_name}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "full_name",
                                  e.target.value
                                )
                              }
                              placeholder="Nhập họ và tên"
                              className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              Giới tính *
                            </label>
                            <select
                              value={participant.gender}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "gender",
                                  e.target.value
                                )
                              }
                              className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white"
                              required
                            >
                              <option value="male">Nam</option>
                              <option value="female">Nữ</option>
                              <option value="other">Khác</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              Ngày sinh *
                            </label>
                            <input
                              type="date"
                              value={participant.date_of_birth}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "date_of_birth",
                                  e.target.value
                                )
                              }
                              className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              Số CMND/CCCD
                            </label>
                            <input
                              type="text"
                              value={participant.id_number}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "id_number",
                                  e.target.value
                                )
                              }
                              placeholder="Số CMND/CCCD"
                              className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              Số hộ chiếu
                            </label>
                            <input
                              type="text"
                              value={participant.passport_number}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "passport_number",
                                  e.target.value
                                )
                              }
                              placeholder="Số hộ chiếu"
                              className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              Số điện thoại *
                            </label>
                            <input
                              type="tel"
                              value={participant.phone}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "phone",
                                  e.target.value
                                )
                              }
                              placeholder="Số điện thoại"
                              className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              Email *
                            </label>
                            <input
                              type="email"
                              value={participant.email}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "email",
                                  e.target.value
                                )
                              }
                              placeholder="Email"
                              className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              Người liên hệ khẩn cấp
                            </label>
                            <input
                              type="text"
                              value={participant.emergency_contact_name}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "emergency_contact_name",
                                  e.target.value
                                )
                              }
                              placeholder="Tên người liên hệ"
                              className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              SĐT liên hệ khẩn cấp
                            </label>
                            <input
                              type="tel"
                              value={participant.emergency_contact_phone}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "emergency_contact_phone",
                                  e.target.value
                                )
                              }
                              placeholder="Số điện thoại khẩn cấp"
                              className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              Yêu cầu đặc biệt
                            </label>
                            <textarea
                              value={participant.special_requirements}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "special_requirements",
                                  e.target.value
                                )
                              }
                              placeholder="Ví dụ: Ăn chay, dị ứng, khuyết tật..."
                              rows={2}
                              className="w-full border-2 border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:border-teal-600 focus:outline-none transition-colors dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Price Summary */}
                <div className="border-t-2 border-gray-300 pt-4 space-y-3 bg-red-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">
                      TỔNG CHI PHÍ:
                    </span>
                    <span className="text-xl font-bold text-red-600">
                      {formatPrice(baseTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">GIẢM GIÁ:</span>
                    <span className="text-gray-700 font-semibold">
                      {discountAmount > 0
                        ? `-${formatPrice(discountAmount)}`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                    <span className="font-bold text-lg text-gray-900">
                      SỐ TIỀN CẦN THANH TOÁN:
                    </span>
                    <span className="text-2xl font-bold text-teal-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button - Full Width */}
        <div className="pt-4 border-t-2 border-gray-200">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-gray-900">
              Tổng tiền:{" "}
              <span className="text-red-600 text-3xl">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={handleSubmitClick}
            disabled={loading || !isFormValid}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: loading || !isFormValid ? 1 : 1.02 }}
            whileTap={{ scale: loading || !isFormValid ? 1 : 0.98 }}
          >
            {loading ? "Đang xử lý..." : "THANH TOÁN"}
          </motion.button>
        </div>
      </form>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ConfirmModal
        open={showConfirm}
        title="Xác nhận thông tin đặt chỗ"
        message={
          <div className="space-y-3 text-left">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-gray-900 mb-3">
                Thông tin đặt chỗ:
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tour:</span>
                  <span className="font-semibold text-gray-900">
                    {tour.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày khởi hành:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Người lớn:</span>
                  <span className="font-semibold text-gray-900">
                    {adults} người
                  </span>
                </div>
                {children > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trẻ em:</span>
                    <span className="font-semibold text-gray-900">
                      {children} người
                    </span>
                  </div>
                )}
                {infants > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Em bé:</span>
                    <span className="font-semibold text-gray-900">
                      {infants} người
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Tổng số người:</span>
                  <span className="font-semibold text-gray-900">
                    {totalParticipants} người
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-gray-900 mb-3">
                Thông tin liên hệ:
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Họ tên:</span>
                  <span className="font-semibold text-gray-900">
                    {fullName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-gray-900">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số điện thoại:</span>
                  <span className="font-semibold text-gray-900">{phone}</span>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">
                  Tổng tiền thanh toán:
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Phương thức:{" "}
                {paymentMethod === "office"
                  ? "Thanh toán tại văn phòng"
                  : "Chuyển khoản ngân hàng"}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Vui lòng kiểm tra lại thông tin trước khi xác nhận đặt chỗ.
            </p>
          </div>
        }
        onCancel={() => setShowConfirm(false)}
        onConfirm={submit}
        confirmText="Xác nhận đặt chỗ"
        cancelText="Quay lại"
      />
      <BookingSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push(`/tours/${tour.id}`);
        }}
        bookingId={bookingData?.bookingId}
        tourTitle={bookingData?.tourTitle}
        bookingDate={bookingData?.bookingDate}
        totalPrice={bookingData?.totalPrice}
        currency={bookingData?.currency}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
