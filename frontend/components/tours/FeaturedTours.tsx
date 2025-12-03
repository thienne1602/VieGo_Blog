"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Flame, TrendingUp, ArrowRight, Crown } from "lucide-react";
import Link from "next/link";
import api from "../../lib/api";
import TourCard from "./TourCard";

export default function FeaturedTours() {
  const [featuredTours, setFeaturedTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeaturedTours() {
      try {
        // Load tours with high ratings or featured flag
        const res = await api.getTours({ per_page: 6, featured: true });
        if (res.success) {
          const tours = res.data?.tours || res.data?.data || res.data || [];
          // Sort by rating if available, otherwise take first 6
          const sorted = Array.isArray(tours)
            ? tours
                .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 6)
            : [];
          setFeaturedTours(sorted);
        }
      } catch (error) {
        console.error("Error loading featured tours:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedTours();
  }, []);

  if (loading) {
    return (
      <div className="mb-16">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Crown className="w-6 h-6 text-yellow-500" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Tours Nổi Bật
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-pulse"
            >
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-t-2xl"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (featuredTours.length === 0) {
    return null;
  }

  return (
    <div className="mb-16">
      {/* Section Header */}
      <motion.div
        className="flex flex-col md:flex-row items-center justify-between mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <motion.div
            className="relative"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-bold text-sm uppercase tracking-wide px-3 py-1 rounded-lg">
                Được Yêu Thích
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 drop-shadow-sm">
              Tours Nổi Bật
            </h2>
            <p className="text-gray-700 dark:text-gray-200 mt-2 font-medium">
              Những tour được đánh giá cao và yêu thích nhất
            </p>
          </div>
        </div>
      </motion.div>

      {/* Featured Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {featuredTours.map((tour, index) => (
          <motion.div
            key={tour.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative group"
          >
            {/* Featured Badge */}
            <div className="absolute -top-3 -right-3 z-20">
              <motion.div
                className="bg-accent-500 dark:bg-accent-600 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                <Star className="w-4 h-4 fill-white" />
                Nổi Bật
              </motion.div>
            </div>

            {/* Enhanced Tour Card with 3D Effect */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="h-full"
            >
              <div className="relative h-full bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 group-hover:shadow-xl transition-all duration-300">
                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>

                <TourCard tour={tour} />
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Stats Bar */}
      <motion.div
        className="mt-12 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          {[
            {
              icon: <Star className="w-6 h-6" />,
              label: "Đánh Giá Trung Bình",
              value: "4.9/5",
            },
            {
              icon: <TrendingUp className="w-6 h-6" />,
              label: "Tours Được Đặt",
              value: "2,500+",
            },
            {
              icon: <Flame className="w-6 h-6" />,
              label: "Khách Hài Lòng",
              value: "98%",
            },
            {
              icon: <Crown className="w-6 h-6" />,
              label: "Tours Nổi Bật",
              value: featuredTours.length.toString(),
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <div className="text-primary-600 dark:text-primary-400 mb-2">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
