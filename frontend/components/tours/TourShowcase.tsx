"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const TourShowcase = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock tours data
  const tours = [
    {
      id: 1,
      title: "Hà Nội Street Food Adventure",
      description:
        "Khám phá ẩm thực đường phố Hà Nội với local guide chuyên nghiệp",
      image: "/images/tours/hanoi-street-food.jpg",
      price: 500000,
      duration: 1,
      difficulty: "easy",
      category: "food",
      rating: 4.8,
      reviews: 124,
      maxParticipants: 8,
      highlights: ["Phở authentic", "Bánh mì", "Cà phê vỉa hè", "Chè đậu đỏ"],
    },
    {
      id: 2,
      title: "Sapa Trekking Experience",
      description:
        "Trekking 2 ngày 1 đêm tại Sapa với homestay và văn hóa địa phương",
      image: "/images/tours/sapa-trekking.jpg",
      price: 1200000,
      duration: 2,
      difficulty: "moderate",
      category: "adventure",
      rating: 4.9,
      reviews: 89,
      maxParticipants: 12,
      highlights: ["Ruộng bậc thang", "Homestay", "Văn hóa H'Mong", "Sunrise"],
    },
    {
      id: 3,
      title: "Mekong Delta Discovery",
      description:
        "Khám phá đồng bằng sông Cửu Long với thuyền kayak và chợ nổi",
      image: "/images/tours/mekong-delta.jpg",
      price: 800000,
      duration: 1,
      difficulty: "easy",
      category: "nature",
      rating: 4.7,
      reviews: 156,
      maxParticipants: 15,
      highlights: [
        "Chợ nổi Cái Răng",
        "Vườn trái cây",
        "Làm bánh tráng",
        "Thuyền kayak",
      ],
    },
    {
      id: 4,
      title: "Hội An Lantern Festival",
      description: "Trải nghiệm lễ hội đèn lồng và văn hóa truyền thống Hội An",
      image: "/images/tours/hoi-an-lantern.jpg",
      price: 600000,
      duration: 1,
      difficulty: "easy",
      category: "cultural",
      rating: 4.6,
      reviews: 203,
      maxParticipants: 20,
      highlights: [
        "Đèn lồng đầy màu sắc",
        "Phố cổ ban đêm",
        "Thả đèn hoa đăng",
        "Ẩm thực địa phương",
      ],
    },
    {
      id: 5,
      title: "Ha Long Bay Luxury Cruise",
      description: "Du thuyền sang trọng 2 ngày 1 đêm khám phá vịnh Hạ Long",
      image: "/images/tours/halong-cruise.jpg",
      price: 2500000,
      duration: 2,
      difficulty: "easy",
      category: "luxury",
      rating: 4.9,
      reviews: 67,
      maxParticipants: 6,
      highlights: ["Suite cao cấp", "Hải sản tươi", "Kayak", "Hang Sung Sốt"],
    },
    {
      id: 6,
      title: "Phú Quốc Island Hopping",
      description: "Tour đảo hopping khám phá những bãi biển đẹp nhất Phú Quốc",
      image: "/images/tours/phu-quoc-island.jpg",
      price: 900000,
      duration: 1,
      difficulty: "easy",
      category: "nature",
      rating: 4.5,
      reviews: 98,
      maxParticipants: 10,
      highlights: ["Bãi Sao", "Hòn Thơm", "Snorkeling", "Hải sản BBQ"],
    },
  ];

  const categories = [
    { value: "all", label: "Tất Cả", icon: "🌟" },
    { value: "food", label: "Ẩm Thực", icon: "🍜" },
    { value: "adventure", label: "Phiêu Lưu", icon: "🏔️" },
    { value: "nature", label: "Thiên Nhiên", icon: "🌿" },
    { value: "cultural", label: "Văn Hóa", icon: "🏛️" },
    { value: "luxury", label: "Cao Cấp", icon: "✨" },
  ];

  const filteredTours =
    selectedCategory === "all"
      ? tours
      : tours.filter((tour) => tour.category === selectedCategory);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-600";
      case "moderate":
        return "bg-yellow-100 text-yellow-600";
      case "hard":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Dễ";
      case "moderate":
        return "Trung Bình";
      case "hard":
        return "Khó";
      default:
        return difficulty;
    }
  };

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((category) => (
          <motion.button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
              selectedCategory === category.value
                ? "bg-primary border-primary text-white"
                : "bg-white border-neutral-200 text-neutral-700 hover:border-primary hover:text-primary"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg">{category.icon}</span>
            <span className="font-medium">{category.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTours.map((tour, index) => (
          <motion.div
            key={tour.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-primary-100 to-accent-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />

              {/* Difficulty Badge */}
              <div className="absolute top-3 left-3 z-20">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                    tour.difficulty
                  )}`}
                >
                  {getDifficultyLabel(tour.difficulty)}
                </span>
              </div>

              {/* Rating */}
              <div className="absolute top-3 right-3 z-20 bg-white/90 px-2 py-1 rounded-full text-sm font-medium">
                ⭐ {tour.rating} ({tour.reviews})
              </div>

              {/* Duration */}
              <div className="absolute bottom-3 left-3 z-20 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {tour.duration} ngày
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="font-bold text-xl mb-2 text-neutral-800 group-hover:text-primary transition-colors">
                {tour.title}
              </h3>

              <p className="text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
                {tour.description}
              </p>

              {/* Highlights */}
              <div className="mb-4">
                <div className="text-xs font-medium text-neutral-700 mb-2">
                  Điểm nổi bật:
                </div>
                <div className="flex flex-wrap gap-1">
                  {tour.highlights.slice(0, 3).map((highlight, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-accent/10 text-accent text-xs rounded"
                    >
                      {highlight}
                    </span>
                  ))}
                  {tour.highlights.length > 3 && (
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                      +{tour.highlights.length - 3} khác
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Details */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(tour.price)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    /người · Tối đa {tour.maxParticipants} người
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <motion.button
                  className="flex-1 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Đặt Ngay
                </motion.button>
                <motion.button
                  className="px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Chi Tiết
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {filteredTours.length >= 6 && (
        <div className="text-center">
          <motion.button
            className="btn-primary text-lg px-8 py-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Xem Thêm Tours
          </motion.button>
        </div>
      )}

      {/* Stats */}
      <motion.div
        className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-primary mb-1">50+</div>
            <div className="text-sm text-neutral-600">Tours Có Sẵn</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent mb-1">1,200+</div>
            <div className="text-sm text-neutral-600">Khách Hài Lòng</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500 mb-1">4.8/5</div>
            <div className="text-sm text-neutral-600">Đánh Giá TB</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500 mb-1">24/7</div>
            <div className="text-sm text-neutral-600">Hỗ Trợ</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TourShowcase;
