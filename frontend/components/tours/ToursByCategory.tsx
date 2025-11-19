"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import api from "../../lib/api";
import TourCard from "./TourCard";

const categoryConfig: any = {
  adventure: { icon: "🏔️", label: "Khám Phá", gradient: "from-orange-500 to-red-500" },
  cultural: { icon: "🏛️", label: "Văn Hóa", gradient: "from-purple-500 to-pink-500" },
  food: { icon: "🍜", label: "Ẩm Thực", gradient: "from-yellow-500 to-orange-500" },
  nature: { icon: "🌿", label: "Thiên Nhiên", gradient: "from-green-500 to-teal-500" },
  urban: { icon: "🏙️", label: "Thành Phố", gradient: "from-blue-500 to-indigo-500" },
  spiritual: { icon: "🕉️", label: "Tâm Linh", gradient: "from-indigo-500 to-purple-500" },
};

export default function ToursByCategory() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getTourCategories();
        if (res.success) {
          const cats = res.data.categories || [];
          setCategories([
            { value: "all", label: "Tất Cả", icon: "✨" },
            ...cats,
          ]);
          
          // Load initial tours
          if (cats.length > 0) {
            setSelectedCategory(cats[0].value);
            await loadToursByCategory(cats[0].value);
          }
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  const loadToursByCategory = async (categoryValue: string) => {
    setLoading(true);
    try {
      const res = await api.getTours({ 
        category: categoryValue === "all" ? undefined : categoryValue,
        per_page: 6 
      });
      if (res.success) {
        const toursData = res.data?.tours || res.data?.data || res.data || [];
        setTours(Array.isArray(toursData) ? toursData : []);
      }
    } catch (error) {
      console.error("Error loading tours:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    await loadToursByCategory(categoryValue);
  };

  if (loading && categories.length === 0) {
    return (
      <div className="mb-16">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      {/* Section Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 bg-teal-100 dark:bg-teal-900/40 px-4 py-2 rounded-lg mb-4">
          <MapPin className="w-6 h-6 text-teal-700 dark:text-teal-400" />
          <span className="font-bold text-sm uppercase tracking-wide text-teal-700 dark:text-teal-300">
            Khám Phá Theo Danh Mục
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 drop-shadow-sm">
          Tours Theo Loại Hình
        </h2>
        <p className="text-gray-700 dark:text-gray-200 max-w-2xl mx-auto font-medium">
          Chọn loại hình du lịch phù hợp với sở thích của bạn
        </p>
      </motion.div>

      {/* Category Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-4 pb-4 min-w-max">
          {categories.map((category) => {
            const config = categoryConfig[category.value] || { icon: category.icon || "🌟", label: category.label || category.value, gradient: "from-gray-500 to-gray-600" };
            const isActive = selectedCategory === category.value;
            
            return (
              <motion.button
                key={category.value}
                onClick={() => handleCategoryClick(category.value)}
                className={`relative px-6 py-4 rounded-2xl font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-xl scale-105`
                    : "bg-white/70 dark:bg-gray-800/70 backdrop-blur-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-white/50 dark:border-gray-700/50"
                }`}
                whileHover={{ scale: isActive ? 1.05 : 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <span>{config.label}</span>
                </div>
                
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-2xl"
                    layoutId="activeCategory"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tours Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-96 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-lg animate-pulse"
            >
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-t-2xl"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : tours.length === 0 ? (
        <motion.div
          className="text-center py-16 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Chưa có tours trong danh mục này
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Vui lòng chọn danh mục khác hoặc quay lại sau
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {tours.map((tour, index) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TourCard tour={tour} />
            </motion.div>
          ))}
        </div>
      )}

      {/* View More Button */}
      {tours.length > 0 && (
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/tours">
            <motion.button
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Xem Tất Cả Tours Trong Danh Mục</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
