"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Flame, Tag, MapPin, Clock, Star, ArrowRight } from "lucide-react";
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
  const [promotionalBanners, setPromotionalBanners] = useState<PromotionalBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPromotionalTours() {
      try {
        // Load tours with discounts or high ratings
        const res = await api.getTours({ per_page: 6 });
        if (res.success) {
          const tours = res.data?.tours || res.data?.data || res.data || [];
          const sortedTours = Array.isArray(tours)
            ? tours
                .filter((tour: any) => tour.discount_percentage > 0 || (tour.rating && tour.rating >= 4.5))
                .sort((a: any, b: any) => (b.discount_percentage || 0) - (a.discount_percentage || 0))
                .slice(0, 3)
            : [];

          // Create promotional banners with tour data
          const banners: PromotionalBanner[] = [
            {
              id: 1,
              title: "Ưu Đãi Đặc Biệt",
              subtitle: sortedTours[0]?.title || "Giảm 30% cho tất cả tours",
              description: sortedTours[0]?.description || "Áp dụng cho đặt tour trong tháng này",
              discount: sortedTours[0]?.discount_percentage 
                ? `${sortedTours[0].discount_percentage}%` 
                : "30%",
              gradient: "from-primary-600 to-primary-700",
              icon: <Flame className="w-12 h-12" />,
              buttonText: "Đặt Ngay",
              tour: sortedTours[0],
              tourImage: sortedTours[0]?.featured_image || sortedTours[0]?.gallery_images?.[0],
            },
            {
              id: 2,
              title: "Tour Nổi Bật",
              subtitle: sortedTours[1]?.title || "Khám phá Sapa mùa lúa chín",
              description: sortedTours[1]?.description || "Trải nghiệm vẻ đẹp thiên nhiên tuyệt vời",
              discount: sortedTours[1]?.discount_percentage 
                ? `${sortedTours[1].discount_percentage}%` 
                : "20%",
              gradient: "from-primary-600 to-accent-600",
              icon: <Sparkles className="w-12 h-12" />,
              buttonText: "Xem Tour",
              tour: sortedTours[1],
              tourImage: sortedTours[1]?.featured_image || sortedTours[1]?.gallery_images?.[0],
            },
            {
              id: 3,
              title: "Combo Tiết Kiệm",
              subtitle: sortedTours[2]?.title || "Mua 2 tặng 1",
              description: sortedTours[2]?.description || "Áp dụng cho nhóm từ 3 người trở lên",
              discount: sortedTours[2]?.discount_percentage 
                ? `${sortedTours[2].discount_percentage}%` 
                : "33%",
              gradient: "from-accent-600 to-primary-600",
              icon: <Tag className="w-12 h-12" />,
              buttonText: "Tìm Hiểu",
              tour: sortedTours[2],
              tourImage: sortedTours[2]?.featured_image || sortedTours[2]?.gallery_images?.[0],
            },
          ];

          // If we don't have enough tours, use default banners
          if (sortedTours.length === 0) {
            banners[0].subtitle = "Giảm 30% cho tất cả tours";
            banners[0].description = "Áp dụng cho đặt tour trong tháng này";
            banners[1].subtitle = "Khám phá Sapa mùa lúa chín";
            banners[1].description = "Trải nghiệm vẻ đẹp thiên nhiên tuyệt vời";
            banners[2].subtitle = "Mua 2 tặng 1";
            banners[2].description = "Áp dụng cho nhóm từ 3 người trở lên";
          }

          setPromotionalBanners(banners);
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
    setCurrentIndex((prev) => (prev - 1 + promotionalBanners.length) % promotionalBanners.length);
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

  const originalPrice = banner.tour?.price_per_person || banner.tour?.price || 0;
  const discountPrice = banner.tour?.discount_percentage
    ? originalPrice * (1 - banner.tour.discount_percentage / 100)
    : originalPrice;

  return (
    <div className="relative w-full">
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.3 },
          }}
          className={`relative bg-gradient-to-r ${banner.gradient} dark:from-primary-700 dark:to-primary-800 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden`}
        >
          {/* Tour Image Background */}
          {banner.tourImage && (
            <div className="absolute inset-0 opacity-20">
              <img
                src={banner.tourImage}
                alt={banner.subtitle}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          {/* Floating Elements */}
          <motion.div
            className="absolute top-10 right-10 opacity-20"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {banner.icon}
          </motion.div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Content */}
            <div className="flex-1 text-white">
              <motion.div
                key={`badge-${currentIndex}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-block px-4 py-2 bg-white/25 backdrop-blur-md rounded-full mb-4 text-sm font-semibold border border-white/30"
              >
                🔥 Khuyến Mãi Hot
              </motion.div>
              
              <motion.h3
                key={`title-${currentIndex}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl md:text-5xl font-extrabold mb-2 drop-shadow-lg"
              >
                {banner.title}
              </motion.h3>
              
              <motion.p
                key={`subtitle-${currentIndex}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl md:text-2xl mb-2 text-white drop-shadow-md font-semibold"
              >
                {banner.subtitle}
              </motion.p>
              
              <motion.p
                key={`desc-${currentIndex}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base md:text-lg text-white/90 mb-4 line-clamp-2"
              >
                {banner.description}
              </motion.p>

              {/* Tour Info */}
              {banner.tour && (
                <motion.div
                  key={`info-${currentIndex}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="flex flex-wrap items-center gap-4 mb-6"
                >
                  {banner.tour.starting_location && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">{banner.tour.starting_location}</span>
                    </div>
                  )}
                  {banner.tour.duration_days && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{banner.tour.duration_days} ngày</span>
                    </div>
                  )}
                  {banner.tour.rating && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{banner.tour.rating.toFixed(1)}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Price and CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {banner.tour && originalPrice > 0 && (
                  <motion.div
                    key={`price-${currentIndex}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-col"
                  >
                    {banner.tour.discount_percentage > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                            {formatPrice(discountPrice)}
                          </span>
                          <span className="text-lg text-white/70 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        </div>
                        <span className="text-sm text-white/80">/người</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                          {formatPrice(originalPrice)}
                        </span>
                        <span className="text-sm text-white/80">/người</span>
                      </>
                    )}
                  </motion.div>
                )}
                
                {banner.tour ? (
                  <Link href={`/tours/${banner.tour.id}`}>
                    <motion.button
                      key={`btn-${currentIndex}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 group"
                    >
                      <span>{banner.buttonText}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </Link>
                ) : (
                  <motion.button
                    key={`btn-${currentIndex}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                  >
                    {banner.buttonText}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Discount Badge and Tour Image */}
            <motion.div
              key={`badge-icon-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
              className="relative"
            >
              {/* Tour Image Circle */}
              {banner.tourImage ? (
                <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl">
                  <img
                    src={banner.tourImage}
                    alt={banner.subtitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  {/* Discount Badge Overlay */}
                  <div className="absolute top-4 right-4 bg-accent-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-xl">
                    -{banner.discount}
                  </div>
                  {/* Price Badge */}
                  {banner.tour && originalPrice > 0 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-xl">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {banner.tour.discount_percentage > 0 
                            ? formatPrice(discountPrice)
                            : formatPrice(originalPrice)
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-48 h-48 md:w-64 md:h-64 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/40 shadow-2xl">
                  <div className="text-center">
                    <div className="text-5xl md:text-7xl font-extrabold mb-2 text-white drop-shadow-lg">
                      {banner.discount}
                    </div>
                    <div className="text-lg md:text-xl font-semibold uppercase text-white/90 drop-shadow-md">
                      OFF
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sparkle Effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                  style={{
                    top: `${20 + i * 15}%`,
                    left: `${30 + (i % 2) * 40}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl hover:bg-white transition-all hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl hover:bg-white transition-all hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {promotionalBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
