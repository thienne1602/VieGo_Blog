"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const AIRecommendations = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Mock recommendations data
  const recommendations = [
    {
      id: 1,
      type: "destination",
      title: "Đà Nẵng - Thành Phố Đáng Sống",
      description: "Dựa trên sở thích về biển và ẩm thực của bạn",
      image: "/images/recommendations/danang.jpg",
      confidence: 95,
      reasons: ["Gần biển", "Ẩm thực đa dạng", "Chi phí hợp lý"],
    },
    {
      id: 2,
      type: "food",
      title: "Bún Chả Hà Nội",
      description: "Món ăn phù hợp với khẩu vị của bạn",
      image: "/images/recommendations/buncha.jpg",
      confidence: 88,
      reasons: ["Vị chua ngọt", "Giá bình dân", "Dễ tìm"],
    },
    {
      id: 3,
      type: "activity",
      title: "Trekking Fansipan",
      description: "Thử thách phù hợp với level của bạn",
      image: "/images/recommendations/fansipan.jpg",
      confidence: 82,
      reasons: ["Moderate difficulty", "Cảnh đẹp", "Trải nghiệm độc đáo"],
    },
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "destination":
        return "🏞️";
      case "food":
        return "🍜";
      case "activity":
        return "🏔️";
      default:
        return "✨";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "destination":
        return "bg-primary";
      case "food":
        return "bg-accent";
      case "activity":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-primary mb-2">
            🤖 Gợi Ý Từ AI
          </h3>
          <p className="text-neutral-600">
            Được cá nhân hóa dựa trên sở thích và hoạt động của bạn
          </p>
        </div>

        <motion.button
          onClick={handleRefresh}
          className="btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isLoading}
        >
          <motion.span
            animate={isLoading ? { rotate: 360 } : {}}
            transition={{
              duration: 1,
              repeat: isLoading ? Infinity : 0,
              ease: "linear",
            }}
          >
            🔄
          </motion.span>
          <span>{isLoading ? "Đang tải..." : "Làm mới"}</span>
        </motion.button>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((item, index) => (
          <motion.div
            key={item.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-primary-100 to-accent-100">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

              {/* Type Badge */}
              <div className="absolute top-3 left-3">
                <div
                  className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getTypeColor(
                    item.type
                  )}`}
                >
                  {getTypeIcon(item.type)}
                </div>
              </div>

              {/* Confidence Score */}
              <div className="absolute top-3 right-3 bg-white/90 text-primary px-2 py-1 rounded-full text-sm font-bold">
                {item.confidence}% match
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h4 className="font-bold text-lg mb-2 text-neutral-800 group-hover:text-primary transition-colors">
                {item.title}
              </h4>

              <p className="text-neutral-600 mb-4 text-sm leading-relaxed">
                {item.description}
              </p>

              {/* Reasons */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-neutral-700 mb-2">
                  Lý do gợi ý:
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="px-6 pb-6">
              <button className="w-full py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300">
                Xem Chi Tiết
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Stats */}
      <motion.div
        className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-primary mb-1">1,247</div>
            <div className="text-sm text-neutral-600">Gợi ý đã tạo</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent mb-1">94%</div>
            <div className="text-sm text-neutral-600">Độ chính xác</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500 mb-1">8.9/10</div>
            <div className="text-sm text-neutral-600">Đánh giá trung bình</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AIRecommendations;
