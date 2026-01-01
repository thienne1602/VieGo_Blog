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
  // Gallery removed — show default grid

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {featuredTours.map((tour, index) => (
          <motion.div
            key={tour.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="relative group"
          >
            <div className="relative h-full bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 group-hover:shadow-xl transition-all duration-300">
              <TourCard tour={tour} />
            </div>
          </motion.div>
        ))}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `(function () {
  const wrapper = document.getElementById('ft-cards-wrapper');
  if (!wrapper) return;
  const cards = Array.from(wrapper.querySelectorAll('.ft-card'));
  if (!cards.length) return;

  const topOffsetPx = Math.round(window.innerHeight * 0.08); // 8vh fallback

  function unset(inner, image) {
    inner.style.position = '';
    inner.style.top = '';
    inner.style.left = '';
    inner.style.width = '';
    inner.style.zIndex = '';
    inner.style.transform = '';
    inner.style.filter = '';
    if (image) image.style.transform = '';
  }

  function setFixedFor(inner, index) {
    const rect = wrapper.getBoundingClientRect();
    inner.style.position = 'fixed';
    inner.style.top = topOffsetPx + 'px';
    inner.style.left = rect.left + 'px';
    inner.style.width = rect.width + 'px';
    inner.style.zIndex = 1000 + (cards.length - index);
  }

  function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const inner = card.querySelector('.ft-card-inner');
      const image = card.querySelector('.ft-card-image');
      if (!inner) continue;
      const rect = card.getBoundingClientRect();
      const absTop = rect.top + scrollY;
      const start = absTop - topOffsetPx;
      const next = cards[i + 1];
      const nextTopAbs = next ? (next.getBoundingClientRect().top + scrollY) : Infinity;

      if (scrollY >= start && scrollY < nextTopAbs - topOffsetPx) {
        // fix this inner
        setFixedFor(inner, i);
      } else {
        unset(inner, image);
      }

      // visual overlap effect
      if (next) {
        const nextRect = next.getBoundingClientRect();
        const nextTop = nextRect.top;
        if (nextTop <= window.innerHeight && nextTop >= 0) {
          const ratio = Math.max(0, Math.min(1, nextTop / window.innerHeight));
          const scale = 0.92 + 0.08 * ratio;
          const bright = 0.6 + 0.4 * ratio;
          inner.style.transform = 'scale(' + scale + ')';
          inner.style.filter = 'brightness(' + bright + ')';
          if (image) image.style.transform = 'translateX(' + (-10 * (1 - ratio)) + 'px)';
        } else {
          inner.style.transform = '';
          inner.style.filter = '';
          if (image) image.style.transform = '';
        }
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // initial
  onScroll();
})();`,
        }}
      />

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
