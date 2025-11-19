"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Star, MapPin, Clock, Users, Calendar, 
  CheckCircle2, XCircle, Camera, Share2,
  ArrowLeft, Heart, Shield, Award, UserCircle,
  CreditCard, Building
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";

export default function TourDetailPage({ params }: any) {
  const router = useRouter();
  
  const handleBackToTours = () => {
    // Force a full navigation to refresh the tours page
    router.push("/tours");
    // Dispatch event after navigation completes to ensure TourShowcase reloads
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tours-refresh", { detail: { from: 'tour-detail' } }));
      }
    }, 200);
  };
  const id =
    params?.id ||
    (typeof window !== "undefined"
      ? window.location.pathname.split("/").pop()
      : null);
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tour không tìm thấy</h2>
          <p className="text-gray-600 mb-6">Tour bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
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

  const allImages = [
    tour.featured_image,
    ...(tour.gallery_images || [])
  ].filter(Boolean);

  const formatItinerary = (itinerary: any) => {
    if (!itinerary || typeof itinerary !== 'object') return null;
    
    return Object.entries(itinerary).map(([key, value]: [string, any], index: number) => (
      <motion.div
        key={key}
        className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-100"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
            {index + 1}
          </div>
          <h4 className="font-bold text-xl text-gray-900 capitalize">
            {key.replace('day', 'Ngày ')}
          </h4>
        </div>
        {typeof value === 'object' ? (
          <div className="space-y-3 ml-14">
            {value.morning && (
              <div className="flex items-start gap-3">
                <div className="text-2xl">🌅</div>
                <div>
                  <div className="font-semibold text-gray-800 mb-1">Buổi sáng</div>
                  <div className="text-gray-700">{value.morning}</div>
                </div>
              </div>
            )}
            {value.afternoon && (
              <div className="flex items-start gap-3">
                <div className="text-2xl">☀️</div>
                <div>
                  <div className="font-semibold text-gray-800 mb-1">Buổi chiều</div>
                  <div className="text-gray-700">{value.afternoon}</div>
                </div>
              </div>
            )}
            {value.evening && (
              <div className="flex items-start gap-3">
                <div className="text-2xl">🌙</div>
                <div>
                  <div className="font-semibold text-gray-800 mb-1">Buổi tối</div>
                  <div className="text-gray-700">{value.evening}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="ml-14 text-gray-700">{String(value)}</div>
        )}
      </motion.div>
    ));
  };

  const tabs = [
    { id: "overview", label: "Tổng Quan" },
    { id: "itinerary", label: "Lịch Trình" },
    { id: "includes", label: "Bao Gồm" },
    { id: "reviews", label: "Đánh Giá" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500"></div>
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Floating Back Button with Glass Effect */}
      <button
        onClick={handleBackToTours}
        className="fixed top-24 left-4 md:left-8 z-40 flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/50 dark:border-gray-700/50 rounded-full px-4 py-2.5 shadow-lg hover:bg-white/90 dark:hover:bg-gray-900/90 hover:shadow-xl transition-all text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400"
        aria-label="Quay lại trang tours"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium text-sm hidden sm:inline">Quay lại</span>
      </button>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery with Glass Effect */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/50 dark:border-gray-700/50">
              {allImages.length > 0 ? (
                <div className="relative">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={selectedImage || allImages[0]}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  {/* Image Thumbnails */}
                  {allImages.length > 1 && (
                    <div className="p-4 grid grid-cols-4 gap-2">
                      {allImages.slice(0, 4).map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(img)}
                          className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                            (selectedImage || allImages[0]) === img
                              ? "border-teal-600 shadow-lg"
                              : "border-transparent hover:border-teal-300"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${tour.title} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                      {allImages.length > 4 && (
                        <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                          <span className="text-gray-500 text-sm font-medium">
                            +{allImages.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={`p-3 rounded-full backdrop-blur-sm transition-all ${
                        isFavorite
                          ? "bg-red-500 text-white"
                          : "bg-white/90 text-gray-700 hover:bg-white"
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                    </button>
                    <button className="p-3 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-all">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                  <Camera className="w-20 h-20 text-white opacity-50" />
                </div>
              )}
            </div>

            {/* Tour Header */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/50 dark:border-gray-700/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{tour.title}</h1>
                  
                  {/* Rating and Views */}
                  <div className="flex items-center gap-6 mb-4">
                    {tour.rating && (
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-lg text-gray-900 dark:text-white">{tour.rating.toFixed(1)}</span>
                        <span className="text-gray-500 dark:text-gray-400">({tour.reviews_count || 0} đánh giá)</span>
                      </div>
                    )}
                    <div className="text-gray-500 dark:text-gray-400">👁️ {tour.views_count || 0} lượt xem</div>
                  </div>

                  {/* Category and Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tour.category && (
                      <span className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">
                        {tour.category}
                      </span>
                    )}
                    {tour.tags && tour.tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="text-gray-700 leading-relaxed mb-6 text-lg">
                {tour.description}
              </div>

              {/* Tour Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 text-center border border-teal-200">
                  <Clock className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <div className="font-bold text-gray-900">{tour.duration_days || tour.duration || '-'} ngày</div>
                  <div className="text-xs text-gray-600 mt-1">Thời lượng</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-bold text-gray-900">
                    {tour.min_participants || 1}-{tour.max_participants || 10}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Số người</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                  <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-bold text-gray-900 text-sm line-clamp-1">{tour.starting_location || '-'}</div>
                  <div className="text-xs text-gray-600 mt-1">Điểm xuất phát</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center border border-orange-200">
                  <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="font-bold text-gray-900 capitalize">{tour.difficulty_level || tour.difficulty || '-'}</div>
                  <div className="text-xs text-gray-600 mt-1">Độ khó</div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/50 dark:border-gray-700/50">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "text-teal-600 border-b-2 border-teal-600"
                          : "text-gray-600 hover:text-teal-600"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Mô Tả Tour</h3>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {tour.description}
                      </div>
                    </div>
                  </div>
                )}

                {/* Itinerary Tab */}
                {activeTab === "itinerary" && (
                  <div>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Lịch Trình Chi Tiết</h3>
                    {tour.itinerary && typeof tour.itinerary === 'object' ? (
                      formatItinerary(tour.itinerary)
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p>Đang cập nhật lịch trình...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Includes Tab */}
                {activeTab === "includes" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-6 h-6" />
                        Bao gồm
                      </h3>
                      <ul className="space-y-3">
                        {(tour.inclusions || []).length > 0 ? (
                          tour.inclusions.map((inc: string, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{inc}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500">Đang cập nhật...</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-700">
                        <XCircle className="w-6 h-6" />
                        Không bao gồm
                      </h3>
                      <ul className="space-y-3">
                        {(tour.exclusions || []).length > 0 ? (
                          tour.exclusions.map((ex: string, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{ex}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500">Đang cập nhật...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                  <div>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                      Đánh Giá ({tour.reviews_count || 0})
                    </h3>
                    <div className="text-center py-12 text-gray-500">
                      <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá tour này!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Info */}
            {tour.seller && (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <UserCircle className="w-6 h-6 text-teal-600" />
                  Nhà cung cấp tour
                </h3>
                <div className="flex items-center gap-4">
                  {tour.seller.avatar_url ? (
                    <img
                      src={tour.seller.avatar_url}
                      alt={tour.seller.full_name || tour.seller.username}
                      className="w-16 h-16 rounded-full object-cover border-2 border-teal-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                      <UserCircle className="w-8 h-8 text-teal-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {tour.seller.full_name || tour.seller.username}
                    </div>
                    {tour.seller.bio && (
                      <div className="text-gray-600 text-sm mt-1">{tour.seller.bio}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar - Tour Info & Book Button */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border-2 border-teal-100/50 dark:border-teal-900/50">
              {/* Price Display */}
              <div className="mb-6 pb-6 border-b-2 border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Giá:</div>
                {tour.discount_percentage && tour.discount_percentage > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-3xl font-bold text-red-600">
                        {formatPrice(discountPrice)}
                      </div>
                      <div className="text-lg text-gray-400 line-through">
                        {formatPrice(originalPrice)}
                      </div>
                    </div>
                    <div className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                      -{tour.discount_percentage}% OFF
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-teal-600">
                    {formatPrice(originalPrice)}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">/ người</div>
              </div>

              {/* Tour Quick Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>Thời gian: {tour.duration_days || tour.duration || '-'} ngày</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>Khởi hành: {tour.starting_location || '-'}</span>
                </div>
                {tour.max_participants && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>Tối đa: {tour.max_participants} người</span>
                  </div>
                )}
                {tour.min_participants && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>Tối thiểu: {tour.min_participants} người</span>
                  </div>
                )}
              </div>

              {/* Book Now Button */}
              <motion.button
                onClick={() => router.push(`/tours/${tour.id}/booking`)}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl mb-6"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ĐẶT NGAY
              </motion.button>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <span>Đảm bảo hoàn tiền 100% nếu hủy trước 24h</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Award className="w-5 h-5 text-teal-600" />
                  <span>Được đánh giá cao bởi khách hàng</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-5 h-5 text-teal-600" />
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
