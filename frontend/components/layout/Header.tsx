"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

interface Notification {
  id: number;
  type: string;
  message: string;
  time: string;
  avatar: string;
  unread: boolean;
}

interface Message {
  id: number;
  name: string;
  message: string;
  time: string;
  avatar: string;
  online: boolean;
  unread: boolean;
}

const Header = () => {
  const [searchValue, setSearchValue] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "like",
      message: "Minh Tuấn đã thích bài viết Khám phá Hà Long",
      time: "5 phút",
      avatar: "👨‍💼",
      unread: true,
    },
    {
      id: 2,
      type: "comment",
      message: "Thu Hà đã bình luận về chuyến đi Sapa",
      time: "10 phút",
      avatar: "👩‍🎨",
      unread: true,
    },
    {
      id: 3,
      type: "follow",
      message: "Quang Đức đã theo dõi bạn",
      time: "1 giờ",
      avatar: "🧑‍💻",
      unread: false,
    },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      name: "Linh Chi",
      message: "Bạn có kế hoạch đi Phú Quốc không?",
      time: "2 phút",
      avatar: "👩‍🏫",
      online: true,
      unread: true,
    },
    {
      id: 2,
      name: "Minh Tuấn",
      message: "Chùa Một Cột rất đẹp!",
      time: "15 phút",
      avatar: "👨‍💼",
      online: false,
      unread: true,
    },
  ]);

  const searchSuggestions = [
    {
      icon: "🏖️",
      text: "Bãi biển Nha Trang",
      type: "destination",
      trending: true,
    },
    { icon: "🍜", text: "Phở Hà Nội ngon", type: "food", trending: false },
    { icon: "🏔️", text: "Leo núi Fansipan", type: "activity", trending: true },
  ];

  const handleSearch = () => {
    if (searchValue.trim()) {
      console.log("Searching for:", searchValue);
      setShowSearchSuggestions(false);
    }
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
  };

  const markMessageAsRead = (id: number) => {
    setMessages(
      messages.map((msg) => (msg.id === id ? { ...msg, unread: false } : msg))
    );
  };

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;
  const unreadMessagesCount = messages.filter((m) => m.unread).length;

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200"
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        <div className="h-full px-3 sm:px-4 lg:px-6">
          <div className="h-full flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 max-w-[1400px] mx-auto">
            {/* Logo - Fixed width */}
            <Link
              href="/"
              className="flex items-center space-x-2 flex-shrink-0"
            >
              <motion.div
                className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-white font-bold text-lg sm:text-xl">
                  V
                </span>
              </motion.div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VieGo
                </span>
                <span className="text-[10px] text-gray-500">
                  Travel Vietnam
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center space-x-1">
              {[
                { name: "Trang chủ", href: "/", icon: "🏠" },
                { name: "Tours", href: "/tours", icon: "🎒" },
                { name: "Bản đồ", href: "/maps", icon: "🗺️" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center space-x-2 px-3 xl:px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all text-sm xl:text-base"
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Search Bar - Flexible width */}
            <div className="relative flex-1 max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pl-9 sm:pl-11 bg-gray-100 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setShowSearchSuggestions(true)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* Create Post Button */}
              <Link href="/posts/create">
                <motion.button
                  className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg hover:from-teal-600 hover:to-blue-600 transition-all shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="font-medium">Đăng bài</span>
                </motion.button>
              </Link>

              {/* Mobile Create Post Button */}
              <Link href="/posts/create" className="sm:hidden">
                <motion.button
                  className="p-2 text-teal-600 hover:bg-teal-50 rounded-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </motion.button>
              </Link>

              {/* Notifications */}
              <motion.button
                className="relative p-2 sm:p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                    {unreadNotificationsCount}
                  </span>
                )}
              </motion.button>

              {/* Messages */}
              <motion.button
                className="relative p-2 sm:p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMessages(!showMessages)}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 bg-green-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                    {unreadMessagesCount}
                  </span>
                )}
              </motion.button>

              {/* User Profile/Auth */}
              {user ? (
                <Link href="/profile">
                  <motion.div
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-white text-xs sm:text-sm font-bold">
                      {user.full_name?.charAt(0).toUpperCase() ||
                        user.username?.charAt(0).toUpperCase() ||
                        "U"}
                    </span>
                  </motion.div>
                </Link>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link href="/login">
                    <motion.button
                      className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Đăng nhập
                    </motion.button>
                  </Link>
                  <Link href="/register">
                    <motion.button
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium shadow-lg text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Đăng ký
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      showMobileMenu
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg lg:hidden"
          >
            <nav className="px-4 py-3 space-y-1">
              {[
                { name: "Trang chủ", href: "/", icon: "🏠" },
                { name: "Tours", href: "/tours", icon: "🎒" },
                { name: "Bản đồ", href: "/maps", icon: "🗺️" },
              ].map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
              {!user && (
                <div className="pt-2 border-t border-gray-200 space-y-2 md:hidden">
                  <Link href="/login" onClick={() => setShowMobileMenu(false)}>
                    <button className="w-full px-4 py-2.5 text-gray-700 hover:text-blue-600 font-medium text-left rounded-lg hover:bg-blue-50">
                      Đăng nhập
                    </button>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg">
                      Đăng ký
                    </button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {(showNotifications ||
        showMessages ||
        showSearchSuggestions ||
        showUserMenu) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowNotifications(false);
            setShowMessages(false);
            setShowSearchSuggestions(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </>
  );
};

export default Header;
