"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import InteractiveMap from "../../components/maps/InteractiveMap";

interface Location {
  id: number;
  name: string;
  type: string;
  description: string;
  coordinates: { lat: number; lng: number };
  images: string[];
  rating: number;
  reviews: number;
  tags: string[];
  address: string;
  openingHours?: string;
}

const MapsPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  // Mock locations data
  const mockLocations: Location[] = [
    {
      id: 1,
      name: "Vịnh Hạ Long",
      type: "attraction",
      description:
        "Di sản thiên nhiên thế giới với những hang động tuyệt đẹp và núi đá vôi kỳ bí.",
      coordinates: { lat: 20.9101, lng: 107.1839 },
      images: ["/images/locations/halong-bay.jpg"],
      rating: 4.8,
      reviews: 2543,
      tags: ["thiên nhiên", "di sản", "du thuyền"],
      address: "Vịnh Hạ Long, Quảng Ninh, Việt Nam",
      openingHours: "24/7",
    },
    {
      id: 2,
      name: "Phố cổ Hội An",
      type: "culture",
      description:
        "Khu phố cổ được UNESCO công nhận với kiến trúc độc đáo và văn hóa đặc sắc.",
      coordinates: { lat: 15.8801, lng: 108.338 },
      images: ["/images/locations/hoi-an.jpg"],
      rating: 4.7,
      reviews: 1876,
      tags: ["lịch sử", "kiến trúc", "văn hóa"],
      address: "Hội An, Quảng Nam, Việt Nam",
      openingHours: "Cả ngày",
    },
    {
      id: 3,
      name: "Ruộng bậc thang Sapa",
      type: "nature",
      description: "Ruộng bậc thang tuyệt đẹp của đồng bào dân tộc thiểu số.",
      coordinates: { lat: 22.338, lng: 103.8442 },
      images: ["/images/locations/sapa.jpg"],
      rating: 4.6,
      reviews: 1234,
      tags: ["thiên nhiên", "văn hóa dân tộc", "trekking"],
      address: "Sapa, Lào Cai, Việt Nam",
    },
    {
      id: 4,
      name: "Chợ Bến Thành",
      type: "food",
      description:
        "Chợ truyền thống nổi tiếng với đa dạng món ăn đường phố Sài Gòn.",
      coordinates: { lat: 10.772, lng: 106.698 },
      images: ["/images/locations/ben-thanh.jpg"],
      rating: 4.3,
      reviews: 987,
      tags: ["ẩm thực", "chợ truyền thống", "văn hóa"],
      address: "Quận 1, TP.HCM, Việt Nam",
      openingHours: "6:00 - 18:00",
    },
    {
      id: 5,
      name: "Đảo Phú Quốc",
      type: "beach",
      description: "Đảo ngọc với bãi biển tuyệt đẹp và hải sản tươi ngon.",
      coordinates: { lat: 10.2899, lng: 103.984 },
      images: ["/images/locations/phu-quoc.jpg"],
      rating: 4.5,
      reviews: 1654,
      tags: ["biển", "resort", "hải sản"],
      address: "Phú Quốc, Kiên Giang, Việt Nam",
    },
  ];

  const categories = [
    { value: "all", label: "Tất cả", icon: "🌟", count: mockLocations.length },
    {
      value: "attraction",
      label: "Danh lam",
      icon: "🏞️",
      count: mockLocations.filter((l) => l.type === "attraction").length,
    },
    {
      value: "culture",
      label: "Văn hóa",
      icon: "🏛️",
      count: mockLocations.filter((l) => l.type === "culture").length,
    },
    {
      value: "nature",
      label: "Thiên nhiên",
      icon: "🌿",
      count: mockLocations.filter((l) => l.type === "nature").length,
    },
    {
      value: "food",
      label: "Ẩm thực",
      icon: "🍜",
      count: mockLocations.filter((l) => l.type === "food").length,
    },
    {
      value: "beach",
      label: "Biển",
      icon: "🏖️",
      count: mockLocations.filter((l) => l.type === "beach").length,
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLocations(mockLocations);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLocations =
    selectedCategory === "all"
      ? locations
      : locations.filter((location) => location.type === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary mx-auto mb-4"></div>
            <p className="text-neutral-600">Đang tải bản đồ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-800 mb-4">
            Bản Đồ Du Lịch Việt Nam
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Khám phá những địa điểm tuyệt vời trên khắp Việt Nam
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
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
                <span className="font-medium">
                  {category.label} ({category.count})
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Map and Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interactive Map */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-96 lg:h-[500px]">
                <InteractiveMap
                  locations={filteredLocations}
                  onLocationSelect={setSelectedLocation}
                />
              </div>
            </div>
          </motion.div>

          {/* Location Details */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {selectedLocation ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-primary-100 to-accent-100 relative">
                  <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-full text-sm font-medium">
                    ⭐ {selectedLocation.rating} ({selectedLocation.reviews})
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2 text-neutral-800">
                    {selectedLocation.name}
                  </h3>

                  <p className="text-neutral-600 mb-4 leading-relaxed">
                    {selectedLocation.description}
                  </p>

                  {/* Address */}
                  <div className="flex items-start space-x-2 mb-3">
                    <span className="text-neutral-500 mt-1">📍</span>
                    <span className="text-sm text-neutral-600">
                      {selectedLocation.address}
                    </span>
                  </div>

                  {/* Opening Hours */}
                  {selectedLocation.openingHours && (
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-neutral-500">🕒</span>
                      <span className="text-sm text-neutral-600">
                        {selectedLocation.openingHours}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {selectedLocation.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-accent/10 text-accent text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button className="flex-1 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300">
                      Xem Chi Tiết
                    </button>
                    <button className="px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300">
                      ❤️
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                  Chọn địa điểm trên bản đồ
                </h3>
                <p className="text-neutral-600">
                  Nhấn vào các điểm trên bản đồ để xem thông tin chi tiết
                </p>
              </div>
            )}

            {/* Statistics */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6">
              <h4 className="font-semibold text-neutral-800 mb-4">Thống kê</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Tổng địa điểm</span>
                  <span className="font-semibold text-primary">
                    {locations.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Danh mục hiển thị</span>
                  <span className="font-semibold text-accent">
                    {filteredLocations.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Đánh giá trung bình</span>
                  <span className="font-semibold text-green-600">
                    {(
                      locations.reduce((sum, loc) => sum + loc.rating, 0) /
                      locations.length
                    ).toFixed(1)}
                    ⭐
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Location Grid */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-neutral-800 mb-6 text-center">
            Danh sách địa điểm
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location, index) => (
              <motion.div
                key={location.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedLocation(location)}
              >
                {/* Image */}
                <div className="h-32 bg-gradient-to-br from-primary-100 to-accent-100 relative">
                  <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full text-xs font-medium">
                    ⭐ {location.rating}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 text-neutral-800">
                    {location.name}
                  </h3>

                  <p className="text-neutral-600 text-sm mb-2 line-clamp-2">
                    {location.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>📍 {location.address.split(",")[1]}</span>
                    <span>👥 {location.reviews} reviews</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MapsPage;
