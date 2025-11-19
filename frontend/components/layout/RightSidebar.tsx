"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Flame, Award, MessageCircle } from "lucide-react";

const RightSidebar = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { conversations, fetchConversations, loading: chatLoading } = useChat();
  const [hotTours, setHotTours] = useState<any[]>([]);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [loadingSellers, setLoadingSellers] = useState(true);

  // 获取热门旅游
  useEffect(() => {
    const fetchHotTours = async () => {
      try {
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const response = await fetch(
          `${API_BASE_URL}/tours?featured=true&limit=5&order_by=rating&order=desc`
        );
        if (response.ok) {
          const data = await response.json();
          setHotTours(data.tours || []);
        }
      } catch (error) {
        console.error("Error fetching hot tours:", error);
      } finally {
        setLoadingTours(false);
      }
    };
    fetchHotTours();
  }, []);

  // 获取顶级可信卖家
  useEffect(() => {
    const fetchTopSellers = async () => {
      try {
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const token = localStorage.getItem("access_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // 获取所有tours并计算卖家评分
        const toursResponse = await fetch(`${API_BASE_URL}/tours?limit=100`, {
          headers,
        });
        if (toursResponse.ok) {
          const toursData = await toursResponse.json();
          const tours = toursData.tours || [];

          // 按卖家分组并计算平均评分
          const sellerMap = new Map();
          tours.forEach((tour: any) => {
            if (tour.seller) {
              const sellerId = tour.seller.id;
              if (!sellerMap.has(sellerId)) {
                sellerMap.set(sellerId, {
                  ...tour.seller,
                  totalTours: 0,
                  totalRating: 0,
                  totalReviews: 0,
                  tours: [],
                });
              }
              const seller = sellerMap.get(sellerId);
              seller.totalTours += 1;
              seller.totalRating += tour.rating || 0;
              seller.totalReviews += tour.reviews_count || 0;
              seller.tours.push(tour);
            }
          });

          // 计算平均评分并排序
          const sellers = Array.from(sellerMap.values())
            .map((seller: any) => ({
              ...seller,
              avgRating:
                seller.totalTours > 0
                  ? seller.totalRating / seller.totalTours
                  : 0,
            }))
            .filter((seller: any) => seller.avgRating >= 4.0)
            .sort((a: any, b: any) => b.avgRating - a.avgRating)
            .slice(0, 5);

          setTopSellers(sellers);
        }
      } catch (error) {
        console.error("Error fetching top sellers:", error);
      } finally {
        setLoadingSellers(false);
      }
    };
    fetchTopSellers();
  }, []);

  // 获取聊天列表
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  const formatTimeAgo = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "Vừa xong";
      if (diffInSeconds < 3600)
        return `${Math.floor(diffInSeconds / 60)} phút`;
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)} giờ`;
      if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)} ngày`;

      return date.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "short",
      });
    } catch (error) {
      return "";
    }
  };

  const handleConversationClick = (otherUserId: number) => {
    router.push(`/messages/${otherUserId}`);
  };

  return (
    <motion.div
      className="hidden xl:block fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-80 bg-gradient-to-br from-white/80 via-blue-50/50 to-purple-50/50 dark:from-gray-900/80 dark:via-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm border-l border-white/20 dark:border-gray-700/30 overflow-y-auto scrollbar-hide transition-colors duration-300 pb-4"
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* 热门旅游 */}
      <div className="p-4 border-b border-white/20 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800 dark:text-gray-200 font-bold text-base flex items-center">
            <Flame className="w-5 h-5 mr-2 text-accent-500" />
            Tour đang hot
          </h3>
          <Link
            href="/tours?hot=true"
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            Xem tất cả
          </Link>
        </div>
        {loadingTours ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : hotTours.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            Chưa có tour nào
          </div>
        ) : (
          <div className="space-y-3">
            {hotTours.slice(0, 3).map((tour, index) => (
              <motion.div
                key={tour.id}
                className="group p-3 rounded-xl bg-gradient-to-br from-white/60 via-blue-50/40 to-purple-50/40 dark:from-gray-800/60 dark:via-gray-700/40 dark:to-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                whileHover={{ scale: 1.01, x: -2 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Link href={`/tours/${tour.id}`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      {tour.featured_image ? (
                        <img
                          src={tour.featured_image}
                          alt={tour.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <svg
                          className="w-8 h-8 text-primary-600 dark:text-primary-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M15 6a3 3 0 11-6 0 3 3 0 016 0zM17 21h4a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2">
                        {tour.title}
                      </h4>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="flex items-center space-x-1">
                          <svg
                            className="w-3 h-3 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {tour.rating?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          • {tour.reviews_count || 0} đánh giá
                        </span>
                      </div>
                      <div className="text-sm font-bold text-primary-600 dark:text-primary-400">
                        {tour.price_per_person
                          ? `${tour.price_per_person.toLocaleString("vi-VN")}₫`
                          : "Liên hệ"}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 顶级可信卖家 */}
      <div className="p-4 border-b border-white/20 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800 dark:text-gray-200 font-bold text-base flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            Seller top uy tín
          </h3>
          <Link
            href="/sellers"
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            Xem tất cả
          </Link>
        </div>
        {loadingSellers ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : topSellers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            Chưa có seller nào
          </div>
        ) : (
          <div className="space-y-3">
            {topSellers.map((seller, index) => (
              <motion.div
                key={seller.id}
                className="group p-3 rounded-xl bg-gradient-to-br from-white/60 via-blue-50/40 to-purple-50/40 dark:from-gray-800/60 dark:via-gray-700/40 dark:to-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                whileHover={{ scale: 1.01, x: -2 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Link href={`/profile/user?id=${seller.id}`}>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {seller.avatar_url ? (
                          <img
                            src={seller.avatar_url}
                            alt={seller.full_name || seller.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (seller.full_name || seller.username || "?")[0].toUpperCase()
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                          {seller.full_name || seller.username}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="flex items-center space-x-1">
                          <svg
                            className="w-3 h-3 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {seller.avgRating?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          • {seller.totalTours || 0} tours
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {seller.totalReviews || 0} đánh giá
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 聊天列表 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800 dark:text-gray-200 font-bold text-base flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-primary-500" />
            List trò chuyện
          </h3>
          <Link
            href="/messages"
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            Xem tất cả
          </Link>
        </div>
        {!user ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            Vui lòng đăng nhập để xem tin nhắn
          </div>
        ) : chatLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            Chưa có cuộc trò chuyện nào
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {conversations.slice(0, 5).map((conversation, index) => {
                if (!conversation.other_user) {
                  return null;
                }
                return (
                  <motion.div
                    key={conversation.id}
                    className="group p-3 rounded-xl bg-gradient-to-br from-white/60 via-blue-50/40 to-purple-50/40 dark:from-gray-800/60 dark:via-gray-700/40 dark:to-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:shadow-lg transition-all duration-300 cursor-pointer relative"
                    whileHover={{ scale: 1.01, x: -2 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => handleConversationClick(conversation.other_user.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                          {conversation.other_user.avatar_url ? (
                            <img
                              src={conversation.other_user.avatar_url}
                              alt={
                                conversation.other_user.full_name ||
                                conversation.other_user.username
                              }
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            (conversation.other_user.full_name ||
                              conversation.other_user.username ||
                              "?")[0].toUpperCase()
                          )}
                        </div>
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                            <span className="text-xs font-bold text-white">
                              {conversation.unread_count > 9
                                ? "9+"
                                : conversation.unread_count}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                            {conversation.other_user.full_name ||
                              conversation.other_user.username}
                          </h4>
                          {conversation.last_message && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                              {formatTimeAgo(conversation.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        {conversation.last_message && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {conversation.last_message.message_type === "image"
                              ? "📷 Đã gửi ảnh"
                              : conversation.last_message.message_type === "file"
                              ? "📎 Đã gửi file"
                              : conversation.last_message.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RightSidebar;
