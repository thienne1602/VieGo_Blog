"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import api from "../../lib/api";
import TourCard from "./TourCard";

const TourShowcase = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tours, setTours] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      // Fetch categories from backend
      const catRes = await api.getCategories();
      if (catRes.success && mounted) {
        setCategories([
          { value: "all", label: "Tất Cả", icon: "✨" },
          ...(catRes.data.categories || []),
        ]);
      }

      // Fetch tours
      const toursRes = await api.getTours({ per_page: 24 });
      if (toursRes.success && mounted) {
        // API returns { tours: [...] } shape from backend
        setTours(toursRes.data.tours || []);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTours =
    selectedCategory === "all"
      ? tours
      : tours.filter(
          (tour) =>
            tour.category === selectedCategory ||
            tour.category?.value === selectedCategory ||
            (tour.category == null && selectedCategory === "all")
        );

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
            <span className="text-lg">{category.icon || "🌟"}</span>
            <span className="font-medium">
              {category.label || category.value}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-64 bg-white rounded-xl shadow animate-pulse"
              />
            ))
          : filteredTours.map((tour, index) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                <TourCard tour={tour} />
              </motion.div>
            ))}
      </div>

      {/* Load More (placeholder) */}
      {tours.length > 0 && (
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
            <div className="text-2xl font-bold text-primary mb-1">
              {tours.length}+
            </div>
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
