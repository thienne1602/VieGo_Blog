import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const RightSidebar = () => {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState({
    location: "Hà Nội",
    temp: 28,
    condition: "sunny",
    forecast: [
      { day: "Hôm nay", temp: "28°", condition: "☀️", desc: "Nắng đẹp" },
      { day: "Mai", temp: "26°", condition: "🌤️", desc: "Ít mây" },
      { day: "T3", temp: "24°", condition: "🌧️", desc: "Mưa nhỏ" },
    ],
  });
  const [aiMessages, setAiMessages] = useState([
    {
      type: "bot",
      message:
        "Chào bạn! Tôi là AI Travel Assistant của VieGo. Bạn muốn khám phá điều gì về Việt Nam hôm nay? 🇻🇳",
    },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const travelBuddies = [
    {
      name: "Minh Tuấn",
      avatar: "👨‍💼",
      status: "online",
      location: "Hà Nội",
      trip: "Đang ở Hội An",
      mutual: 12,
      verified: true,
    },
    {
      name: "Thu Hà",
      avatar: "👩‍🎨",
      status: "online",
      location: "TP.HCM",
      trip: "Planning Sapa trip",
      mutual: 8,
      verified: false,
    },
    {
      name: "Quang Đức",
      avatar: "🧑‍💻",
      status: "away",
      location: "Đà Nẵng",
      trip: "Phú Quốc next week",
      mutual: 15,
      verified: true,
    },
    {
      name: "Linh Chi",
      avatar: "👩‍🏫",
      status: "online",
      location: "Huế",
      trip: "Mekong Delta tour",
      mutual: 6,
      verified: false,
    },
  ];

  const localEvents = [
    {
      title: "Lễ hội Áo Dài Sài Gòn",
      date: "15-17 Mar",
      location: "TP. Hồ Chí Minh",
      attendees: "50K+",
      type: "culture",
      distance: "2.5km",
      price: "Free",
    },
    {
      title: "Vietnam Food Festival",
      date: "22-24 Mar",
      location: "Hà Nội",
      attendees: "30K+",
      type: "food",
      distance: "1.2km",
      price: "200K VNĐ",
    },
    {
      title: "Hội An Lantern Night",
      date: "Hàng tháng",
      location: "Hội An",
      attendees: "20K+",
      type: "tradition",
      distance: "650km",
      price: "Free",
    },
  ];

  const nearbyAttractions = [
    {
      name: "Hoàng Thành Thăng Long",
      rating: 4.8,
      distance: "2.1km",
      type: "Historical",
      price: "30K VNĐ",
      image: "🏛️",
      reviews: "2.1K",
      openNow: true,
    },
    {
      name: "Chợ Đồng Xuân",
      rating: 4.5,
      distance: "1.8km",
      type: "Shopping",
      price: "Free",
      image: "🏪",
      reviews: "1.5K",
      openNow: true,
    },
    {
      name: "Hồ Hoàn Kiếm",
      rating: 4.9,
      distance: "0.8km",
      type: "Nature",
      price: "Free",
      image: "🏞️",
      reviews: "3.2K",
      openNow: true,
    },
  ];

  const aiSuggestions = [
    {
      icon: "🍜",
      text: "Tìm phở ngon gần đây",
      action: "findFood",
      color: "from-orange-400 to-red-400",
    },
    {
      icon: "📍",
      text: "Lập kế hoạch 3 ngày ở Hà Nội",
      action: "planTrip",
      color: "from-blue-400 to-purple-400",
    },
    {
      icon: "🏨",
      text: "Khách sạn view đẹp Hạ Long",
      action: "findHotel",
      color: "from-green-400 to-teal-400",
    },
    {
      icon: "🎭",
      text: "Sự kiện văn hóa cuối tuần",
      action: "findEvents",
      color: "from-purple-400 to-pink-400",
    },
  ];

  return (
    <motion.div
      className="hidden xl:block fixed right-0 top-14 h-full w-80 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-md border-l border-white/20 overflow-y-auto scrollbar-hide"
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {/* AI Travel Assistant */}
      <div className="p-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-30"
          animate={{ x: [0, 40, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-xl">🤖</span>
              </motion.div>
              <div>
                <h3 className="text-white font-bold">AI Travel Companion</h3>
                <div className="flex items-center space-x-1 text-white/80 text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Always ready to help</span>
                </div>
              </div>
            </div>
            <motion.button
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(255,255,255,0.3)",
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setAiChatOpen(!aiChatOpen)}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    aiChatOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M8 12h.01M12 12h.01M16 12h.01"
                  }
                />
              </svg>
            </motion.button>
          </div>

          {/* Quick AI Suggestions */}
          <div className="grid grid-cols-2 gap-2">
            {aiSuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                className="flex flex-col items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white text-center hover:bg-white/20 transition-all duration-200"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="text-lg mb-1">{suggestion.icon}</span>
                <span className="text-xs leading-tight">{suggestion.text}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Chat Interface */}
      <AnimatePresence>
        {aiChatOpen && (
          <motion.div
            className="bg-gradient-to-br from-blue-50 to-purple-50 border-b border-white/20"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 max-h-60 overflow-y-auto">
              {aiMessages.map((msg, index) => (
                <motion.div
                  key={index}
                  className={`mb-3 flex ${
                    msg.type === "user" ? "justify-end" : "justify-start"
                  }`}
                  initial={{ opacity: 0, x: msg.type === "user" ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.type === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-800 shadow-md"
                    }`}
                  >
                    {msg.message}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-4 border-t border-white/20">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Hỏi AI về du lịch Việt Nam..."
                  className="flex-1 px-4 py-2 bg-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <motion.button
                  className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Weather Widget */}
      <div className="p-4 border-b border-gray-200/50">
        <motion.div
          className="bg-gradient-to-br from-blue-400/20 to-cyan-400/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">🌤️ Thời tiết</h3>
            <span className="text-xs text-gray-500">
              {currentTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {weatherData.temp}°C
              </div>
              <div className="text-sm text-gray-600">
                {weatherData.location}
              </div>
            </div>
            <motion.div
              className="text-5xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              ☀️
            </motion.div>
          </div>

          <div className="space-y-2">
            {weatherData.forecast.map((day, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between py-2 px-3 bg-white/50 rounded-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{day.condition}</span>
                  <div>
                    <div className="text-sm font-medium">{day.day}</div>
                    <div className="text-xs text-gray-500">{day.desc}</div>
                  </div>
                </div>
                <span className="font-semibold text-blue-600">{day.temp}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Travel Buddies Online */}
      <div className="p-4 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-600 font-semibold text-sm">
            Travel Buddies 🎒
          </h3>
          <span className="text-xs text-green-600 font-medium">
            {travelBuddies.filter((b) => b.status === "online").length} online
          </span>
        </div>

        <div className="space-y-3">
          {travelBuddies.map((buddy, index) => (
            <motion.div
              key={index}
              className="group flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-white hover:to-blue-50 cursor-pointer transition-all duration-200"
              whileHover={{ scale: 1.02, x: 5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-lg shadow-md">
                  {buddy.avatar}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                    buddy.status === "online"
                      ? "bg-green-500"
                      : buddy.status === "away"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                ></div>
                {buddy.verified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900 truncate">
                    {buddy.name}
                  </h4>
                  {buddy.mutual > 10 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {buddy.mutual} mutual
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {buddy.trip}
                </div>
                <div className="text-xs text-gray-400">📍 {buddy.location}</div>
              </div>

              <motion.button
                className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center transition-opacity"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01"
                  />
                </svg>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Nearby Attractions */}
      <div className="p-4 border-b border-gray-200/50">
        <h3 className="text-gray-600 font-semibold text-sm mb-3 flex items-center">
          <span className="mr-2">📍</span>
          Gần bạn
        </h3>

        <div className="space-y-3">
          {nearbyAttractions.map((place, index) => (
            <motion.div
              key={index}
              className="group p-3 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200 border border-gray-200/50"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-2xl shadow-md">
                  {place.image}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-800 text-sm">
                      {place.name}
                    </h4>
                    {place.openNow && (
                      <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                        Mở cửa
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                    <div className="flex items-center space-x-1">
                      <span>⭐</span>
                      <span>{place.rating}</span>
                      <span>({place.reviews})</span>
                    </div>
                    <span>•</span>
                    <span>{place.distance}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                      {place.type}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {place.price}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Local Events */}
      <div className="p-4">
        <h3 className="text-gray-600 font-semibold text-sm mb-3 flex items-center">
          <span className="mr-2">🎪</span>
          Sự kiện địa phương
        </h3>

        <div className="space-y-3">
          {localEvents.map((event, index) => (
            <motion.div
              key={index}
              className="p-4 rounded-2xl bg-gradient-to-br from-white to-purple-50 border border-purple-200/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    event.type === "culture"
                      ? "bg-gradient-to-br from-purple-400 to-pink-500"
                      : event.type === "food"
                      ? "bg-gradient-to-br from-orange-400 to-red-500"
                      : "bg-gradient-to-br from-green-400 to-teal-500"
                  }`}
                >
                  {event.type === "culture"
                    ? "🎭"
                    : event.type === "food"
                    ? "🍜"
                    : "🏮"}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">
                    {event.title}
                  </h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>📅 {event.date}</div>
                    <div>
                      📍 {event.location} • {event.distance}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>👥 {event.attendees}</span>
                      <span className="font-semibold text-purple-600">
                        {event.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default RightSidebar;
