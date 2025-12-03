"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Tag,
  MapPin,
  Clock,
  Star,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import api from "../../lib/api";

interface PromotionalBanner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  discount: string;
  gradient: string;
  icon: React.ReactNode;
  buttonText: string;
  tour?: any;
  tourImage?: string;
}

export default function PromotionalBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [promotionalBanners, setPromotionalBanners] = useState<
    PromotionalBanner[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPromotionalTours() {
      try {
        // Load more tours to have a good pool for daily selection
        const res = await api.getTours({ per_page: 30 });
        if (res.success) {
          const tours = res.data?.tours || res.data?.data || res.data || [];

          if (Array.isArray(tours) && tours.length > 0) {
            // Filter active tours with images
            const validTours = tours.filter(
              (t) =>
                t.status === "active" &&
                (t.featured_image || t.gallery_images?.length > 0)
            );

            // Seeded random selection based on date
            const today = new Date();
            // Create a seed from YYYYMMDD
            const seed =
              today.getFullYear() * 10000 +
              (today.getMonth() + 1) * 100 +
              today.getDate();

            // Simple seeded random function
            const seededRandom = (s: number) => {
              let t = s + 0x6d2b79f5;
              t = Math.imul(t ^ (t >>> 15), t | 1);
              t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
              return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };

            // Shuffle and pick 3
            const shuffled = [...validTours];
            let currentSeed = seed;
            for (let i = shuffled.length - 1; i > 0; i--) {
              const r = seededRandom(currentSeed++);
              const j = Math.floor(r * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            const dailyTours = shuffled.slice(0, 3);

            // Create promotional banners with daily tours
            const banners: PromotionalBanner[] = [
              {
                id: 1,
                title: "🔥 Deal Hot Hôm Nay",
                subtitle: dailyTours[0]?.title || "Khám phá ngay",
                description:
                  dailyTours[0]?.description?.substring(0, 100) + "..." ||
                  "Ưu đãi đặc biệt chỉ trong hôm nay",
                discount: dailyTours[0]?.discount_percentage
                  ? `${dailyTours[0].discount_percentage}%`
                  : "HOT",
                gradient: "from-orange-500 to-red-600",
                icon: <Flame className="w-12 h-12" />,
                buttonText: "Săn Ngay",
                tour: dailyTours[0],
                tourImage:
                  dailyTours[0]?.featured_image ||
                  dailyTours[0]?.gallery_images?.[0],
              },
              {
                id: 2,
                title: "✨ Gợi Ý Cho Bạn",
                subtitle: dailyTours[1]?.title || "Trải nghiệm mới lạ",
                description:
                  dailyTours[1]?.description?.substring(0, 100) + "..." ||
                  "Điểm đến hấp dẫn đang chờ đón bạn",
                discount: dailyTours[1]?.discount_percentage
                  ? `${dailyTours[1].discount_percentage}%`
                  : "MỚI",
                gradient: "from-teal-500 to-emerald-600",
                icon: <Sparkles className="w-12 h-12" />,
                buttonText: "Khám Phá",
                tour: dailyTours[1],
                tourImage:
                  dailyTours[1]?.featured_image ||
                  dailyTours[1]?.gallery_images?.[0],
              },
              {
                id: 3,
                title: "💎 Tour Cao Cấp",
                subtitle: dailyTours[2]?.title || "Nghỉ dưỡng sang trọng",
                description:
                  dailyTours[2]?.description?.substring(0, 100) + "..." ||
                  "Tận hưởng dịch vụ đẳng cấp 5 sao",
                discount: dailyTours[2]?.discount_percentage
                  ? `${dailyTours[2].discount_percentage}%`
                  : "VIP",
                gradient: "from-purple-600 to-indigo-600",
                icon: <Tag className="w-12 h-12" />,
                buttonText: "Xem Chi Tiết",
                tour: dailyTours[2],
                tourImage:
                  dailyTours[2]?.featured_image ||
                  dailyTours[2]?.gallery_images?.[0],
              },
            ];

            setPromotionalBanners(banners);
          }
        }
      } catch (error) {
        console.error("Error loading promotional tours:", error);
        // Use default banners on error
        setPromotionalBanners([
          {
            id: 1,
            title: "Ưu Đãi Đặc Biệt",
            subtitle: "Giảm 30% cho tất cả tours",
            description: "Áp dụng cho đặt tour trong tháng này",
            discount: "30%",
            gradient: "from-primary-600 to-primary-700",
            icon: <Flame className="w-12 h-12" />,
            buttonText: "Đặt Ngay",
          },
          {
            id: 2,
            title: "Tour Mới Nhất",
            subtitle: "Khám phá Sapa mùa lúa chín",
            description: "Trải nghiệm vẻ đẹp thiên nhiên tuyệt vời",
            discount: "20%",
            gradient: "from-primary-600 to-accent-600",
            icon: <Sparkles className="w-12 h-12" />,
            buttonText: "Xem Tour",
          },
          {
            id: 3,
            title: "Combo Tiết Kiệm",
            subtitle: "Mua 2 tặng 1",
            description: "Áp dụng cho nhóm từ 3 người trở lên",
            discount: "33%",
            gradient: "from-accent-600 to-primary-600",
            icon: <Tag className="w-12 h-12" />,
            buttonText: "Tìm Hiểu",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadPromotionalTours();
  }, []);

  useEffect(() => {
    if (promotionalBanners.length === 0) return;

    const interval = setInterval(() => {
      setDirection((prevDir) => {
        // Reset direction and increment
        setCurrentIndex((prev) => (prev + 1) % promotionalBanners.length);
        return 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [promotionalBanners.length]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % promotionalBanners.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex(
      (prev) =>
        (prev - 1 + promotionalBanners.length) % promotionalBanners.length
    );
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  if (loading || promotionalBanners.length === 0) {
    return (
      <div className="relative w-full">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-8 md:p-12 shadow-2xl h-64 md:h-80 animate-pulse"></div>
      </div>
    );
  }

  const banner = promotionalBanners[currentIndex];
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const originalPrice =
    banner.tour?.price_per_person || banner.tour?.price || 0;
  const discountPrice = banner.tour?.discount_percentage
    ? originalPrice * (1 - banner.tour.discount_percentage / 100)
    : originalPrice;

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                banner.tourImage || "/images/banner-placeholder.jpg"
              })`,
            }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-end md:items-center">
        <div className="container mx-auto px-6 md:px-16 py-12">
          <div className="max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/90 backdrop-blur-md text-white mb-6 shadow-lg">
                  {banner.icon}
                  <span className="font-bold uppercase tracking-wider text-sm">
                    {banner.title}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                  {banner.subtitle}
                </h2>

                {/* Description */}
                <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed drop-shadow-md line-clamp-2 max-w-2xl">
                  {banner.description}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-6 mb-8 text-white/90">
                  {banner.tour && (
                    <>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="font-medium">
                          {banner.tour.duration_days} Ngày
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                        <MapPin className="w-5 h-5 text-green-400" />
                        <span className="font-medium">
                          {banner.tour.starting_location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                        <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
                        <span className="font-medium">
                          {banner.tour.rating || 5.0}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Price and CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {banner.tour ? (
                    <Link href={`/tours/${banner.tour.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-8 py-4 rounded-xl font-bold text-white text-lg shadow-xl flex items-center gap-3 bg-gradient-to-r ${banner.gradient} hover:shadow-2xl transition-all`}
                      >
                        {banner.buttonText}
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </Link>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                    >
                      {banner.buttonText}
                    </motion.button>
                  )}

                  {banner.tour && originalPrice > 0 && (
                    <div className="flex flex-col">
                      {banner.tour.discount_percentage > 0 ? (
                        <>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                              {formatPrice(discountPrice)}
                            </span>
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md">
                              -{banner.tour.discount_percentage}%
                            </span>
                          </div>
                          <span className="text-lg text-white/60 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                          {formatPrice(originalPrice)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute bottom-8 right-8 flex gap-4 z-20">
        <button
          onClick={prevSlide}
          className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {promotionalBanners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? "bg-white w-8"
                : "bg-white/30 w-4 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
