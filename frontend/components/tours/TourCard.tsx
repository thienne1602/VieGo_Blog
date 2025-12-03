"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, Star } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = { tour: any };

export default function TourCard({ tour }: Props) {
  const router = useRouter();
  const image =
    tour.featured_image ||
    (tour.gallery_images &&
      tour.gallery_images.length > 0 &&
      tour.gallery_images[0]) ||
    "/images/tours/default.svg";

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

  const getDifficultyColor = (difficulty: string) => {
    const colors: any = {
      easy: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700",
      moderate:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700",
      hard: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700",
    };
    return (
      colors[difficulty] ||
      "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
    );
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: any = {
      easy: "Dễ",
      moderate: "Trung Bình",
      hard: "Khó",
    };
    return labels[difficulty] || difficulty;
  };

  return (
    <motion.div
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-white/30 dark:border-gray-700/50"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => router.push(`/tours/${tour.id}`)}
    >
      <div className="block">
        <div className="relative h-64 w-full bg-gray-100 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={tour.title}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Featured Badge */}
          {tour.is_featured && (
            <div className="absolute top-4 left-4 z-20">
              <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                <span>Nổi bật</span>
              </div>
            </div>
          )}

          {/* Discount Badge */}
          {tour.discount_percentage && tour.discount_percentage > 0 && (
            <div
              className={`absolute top-4 ${
                tour.is_featured ? "left-28" : "left-4"
              } z-20`}
            >
              <div className="bg-accent-500 dark:bg-accent-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                -{tour.discount_percentage}%
              </div>
            </div>
          )}

          {/* Difficulty Badge */}
          <div className="absolute top-4 right-4 z-20">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(
                (
                  tour.difficulty_level ||
                  tour.difficulty ||
                  "easy"
                ).toLowerCase()
              )} backdrop-blur-sm bg-white/90 dark:bg-gray-800/90`}
            >
              {getDifficultyLabel(
                (
                  tour.difficulty_level ||
                  tour.difficulty ||
                  "easy"
                ).toLowerCase()
              )}
            </span>
          </div>

          {/* Rating */}
          {tour.rating && (
            <div className="absolute bottom-4 right-4 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <Star className="w-4 h-4 fill-yellow-400 dark:fill-yellow-500 text-yellow-400 dark:text-yellow-500" />
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                {tour.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({tour.reviews_count || 0})
              </span>
            </div>
          )}

          {/* Duration */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
              {tour.duration_days || tour.duration || "-"} ngày
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Category Tag */}
          {tour.category && (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-semibold">
                {tour.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
            {tour.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-sm leading-relaxed min-h-[40px]">
            {tour.description}
          </p>

          {/* Location */}
          {tour.starting_location && (
            <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400 text-sm">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{tour.starting_location}</span>
            </div>
          )}

          {/* Info Icons */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
            {tour.max_participants && (
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
                <Users className="w-4 h-4" />
                <span>Tối đa {tour.max_participants} người</span>
              </div>
            )}
          </div>

          {/* Price and CTA */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {tour.discount_percentage && tour.discount_percentage > 0 ? (
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {formatPrice(discountPrice)}
                    </div>
                    <div className="text-sm text-gray-400 dark:text-gray-500 line-through">
                      {formatPrice(originalPrice)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    /người
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {formatPrice(originalPrice)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    /người
                  </div>
                </div>
              )}
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href={`/tours/${tour.id}`}
                className="px-6 py-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-lg font-semibold text-sm hover:bg-primary-700 dark:hover:bg-primary-600 transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
                onClick={(e) => e.stopPropagation()} // Prevent card click when clicking button
              >
                Xem Chi Tiết
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
