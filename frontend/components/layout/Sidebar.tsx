"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/ThemeContext";
import { Tag, Clock, Calendar, ChevronDown, ChevronUp } from "lucide-react";

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation("home");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);

  // 实时时钟更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 促销旅游数据
  const promotionalTours = [
    {
      id: 1,
      title: "Tour Hạ Long Bay 2N1Đ",
      originalPrice: 2500000,
      discountPrice: 1999000,
      discount: 20,
      image: "🏝️",
      location: "Quảng Ninh",
      rating: 4.8,
      reviews: 1250,
    },
    {
      id: 2,
      title: "Đà Lạt - Mùa Hoa Anh Đào",
      originalPrice: 1800000,
      discountPrice: 1299000,
      discount: 28,
      image: "🌸",
      location: "Lâm Đồng",
      rating: 4.9,
      reviews: 890,
    },
    {
      id: 3,
      title: "Phú Quốc - Đảo Ngọc",
      originalPrice: 3500000,
      discountPrice: 2499000,
      discount: 29,
      image: "🏖️",
      location: "Kiên Giang",
      rating: 4.7,
      reviews: 2100,
    },
  ];

  // 日历相关函数
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // 填充前面的空白
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const daysInMonth = getDaysInMonth(selectedDate);
  const monthNames = t("sidebar.months", { returnObjects: true }) as string[];
  const weekDays = t("sidebar.weekdays", { returnObjects: true }) as string[];

  const navigateMonth = (direction: number) => {
    setSelectedDate(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + direction,
        1
      )
    );
  };

  return (
    <motion.div
      className="hidden lg:block fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-80 bg-gradient-to-br from-white/80 via-blue-50/50 to-purple-50/50 dark:from-gray-900/80 dark:via-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm border-r border-white/20 dark:border-gray-700/30 overflow-y-auto scrollbar-hide transition-colors duration-300 pb-4"
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* 促销旅游 */}
      <div className="p-4 border-b border-white/20 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800 dark:text-gray-200 font-bold text-base flex items-center">
            <Tag className="w-5 h-5 mr-2 text-primary-500" />
            {t("sidebar.promotionalTours")}
          </h3>
          <Link
            href="/tours?promotion=true"
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {t("sidebar.viewAll")}
          </Link>
        </div>
        <div className="space-y-3">
          {promotionalTours.map((tour, index) => (
            <motion.div
              key={tour.id}
              className="group p-3 rounded-xl bg-gradient-to-br from-white/60 via-blue-50/40 to-purple-50/40 dark:from-gray-800/60 dark:via-gray-700/40 dark:to-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link href={`/tours/${tour.id}`}>
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{tour.image}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                        {tour.title}
                      </h4>
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                        -{tour.discount}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {tour.discountPrice.toLocaleString("vi-VN")}₫
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                        {tour.originalPrice.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>⭐ {tour.rating}</span>
                      <span>•</span>
                      <span>{tour.reviews} {t("sidebar.reviews")}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 实时时钟 */}
      <div className="p-4 border-b border-white/20 dark:border-gray-700/30">
        <h3 className="text-gray-800 dark:text-gray-200 font-bold text-base flex items-center mb-3">
          <Clock className="w-5 h-5 mr-2 text-primary-500" />
          {t("sidebar.realtimeClock")}
        </h3>
        <motion.div
          className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl p-6 text-white shadow-lg"
          animate={{
            boxShadow: [
              "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
              "0 10px 30px -5px rgba(59, 130, 246, 0.4)",
              "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="text-center">
            <motion.div
              key={currentTime.getTime()}
              className="text-4xl font-bold mb-2 font-mono"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formatTime(currentTime)}
            </motion.div>
            <div className="text-sm opacity-90">{formatDate(currentTime)}</div>
          </div>
        </motion.div>
      </div>

      {/* 日历 */}
      <div className="p-4 border-b border-white/20 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800 dark:text-gray-200 font-bold text-base flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary-500" />
            {t("sidebar.calendar")}
          </h3>
          <motion.button
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isCalendarExpanded ? t("sidebar.collapse") : t("sidebar.expand")}
          >
            {isCalendarExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </motion.button>
        </div>
        
        <AnimatePresence initial={false}>
          {isCalendarExpanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-br from-white/60 via-blue-50/40 to-purple-50/40 dark:from-gray-800/60 dark:via-gray-700/40 dark:to-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-gray-700/30">
                {/* 月份导航 */}
                <div className="flex items-center justify-between mb-4">
                  <motion.button
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigateMonth(-1)}
                  >
                    <svg
                      className="w-5 h-5 text-gray-600 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </motion.button>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                  </h4>
                  <motion.button
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigateMonth(1)}
                  >
                    <svg
                      className="w-5 h-5 text-gray-600 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </motion.button>
                </div>

                {/* 星期标题 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 日期网格 */}
                <div className="grid grid-cols-7 gap-1">
                  {daysInMonth.map((day, index) => {
                    const isToday =
                      day === currentDate.getDate() &&
                      selectedDate.getMonth() === currentDate.getMonth() &&
                      selectedDate.getFullYear() === currentDate.getFullYear();
                    const isSelected =
                      day === selectedDate.getDate() &&
                      selectedDate.getMonth() === selectedDate.getMonth() &&
                      selectedDate.getFullYear() === selectedDate.getFullYear();

                    if (day === null) {
                      return <div key={index} className="aspect-square" />;
                    }

                    return (
                      <motion.button
                        key={index}
                        className={`aspect-square rounded-lg text-sm font-medium transition-all duration-200 ${
                          isToday
                            ? "bg-primary-500 text-white shadow-md"
                            : isSelected
                            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setSelectedDate(
                            new Date(
                              selectedDate.getFullYear(),
                              selectedDate.getMonth(),
                              day
                            )
                          )
                        }
                      >
                        {day}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-br from-white/60 via-blue-50/40 to-purple-50/40 dark:from-gray-800/60 dark:via-gray-700/40 dark:to-gray-800/40 backdrop-blur-sm rounded-xl p-3 border border-white/30 dark:border-gray-700/30">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Sidebar;
