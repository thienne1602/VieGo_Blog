import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = () => {
  const [currentWeather, setCurrentWeather] = useState({
    location: "Hà Nội",
    temp: 28,
    condition: "sunny",
    humidity: 65,
    wind: "12 km/h",
  });
  const [expandedSection, setExpandedSection] = useState("");
  const [vietnamFacts, setVietnamFacts] = useState([
    "Việt Nam có 54 dân tộc khác nhau 🌈",
    "Phở được UNESCO công nhận là di sản văn hóa 🍜",
    "Vịnh Hà Long có hơn 1,600 hòn đảo 🏝️",
    "Áo dài là trang phục truyền thống Việt Nam 👘",
    "Cà phê Việt Nam đứng thứ 2 thế giới ☕",
  ]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  useEffect(() => {
    const factTimer = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % vietnamFacts.length);
    }, 5000);
    return () => clearInterval(factTimer);
  }, [vietnamFacts.length]);

  const vietnamDestinations = [
    {
      name: "Hạ Long Bay",
      icon: "🚢",
      type: "UNESCO",
      color: "from-blue-400 to-cyan-400",
      users: "2.1M",
    },
    {
      name: "Hội An",
      icon: "🏮",
      type: "Ancient Town",
      color: "from-yellow-400 to-orange-400",
      users: "1.8M",
    },
    {
      name: "Sapa",
      icon: "⛰️",
      type: "Mountain",
      color: "from-green-400 to-emerald-400",
      users: "1.2M",
    },
    {
      name: "Phú Quốc",
      icon: "🏖️",
      type: "Island",
      color: "from-pink-400 to-rose-400",
      users: "950K",
    },
    {
      name: "Đà Lạt",
      icon: "🌸",
      type: "Flower City",
      color: "from-purple-400 to-pink-400",
      users: "1.1M",
    },
    {
      name: "Ninh Bình",
      icon: "🦅",
      type: "Scenic",
      color: "from-indigo-400 to-blue-400",
      users: "800K",
    },
  ];

  const culturalActivities = [
    {
      name: "Lễ hội Tết Nguyên Đán",
      icon: "🧧",
      date: "Feb 10, 2025",
      participants: "90M+",
    },
    {
      name: "Festival Áo Dài",
      icon: "👘",
      date: "Mar 15, 2025",
      participants: "500K+",
    },
    {
      name: "Lễ hội Đèn lồng Hội An",
      icon: "🏮",
      date: "Every month",
      participants: "200K+",
    },
    {
      name: "Festival Huế",
      icon: "👑",
      date: "Apr 27-May 2",
      participants: "1M+",
    },
  ];

  const sidebarItems = [
    {
      name: "Trang cá nhân",
      href: "/profile",
      icon: (
        <motion.div
          className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 15 }}
        >
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      ),
    },
    {
      name: "Du lịch Việt Nam",
      href: "/travel",
      icon: (
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-lg"
        >
          🇻🇳
        </motion.div>
      ),
      isNew: true,
      count: "1.2M",
    },
    {
      name: "Ẩm thực địa phương",
      href: "/food",
      icon: (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg"
        >
          🍜
        </motion.div>
      ),
      count: "890K",
    },
    {
      name: "Bạn du lịch",
      href: "/travel-buddies",
      icon: (
        <div className="relative text-lg">
          👥
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
        </div>
      ),
      count: "45K online",
    },
    {
      name: "Chợ đồ lưu niệm",
      href: "/marketplace",
      icon: "🛍️",
      count: "2.5K items",
    },
    {
      name: "Video du lịch",
      href: "/videos",
      icon: "📹",
      isHot: true,
    },
    {
      name: "Kỷ niệm du lịch",
      href: "/memories",
      icon: "📸",
    },
  ];

  return (
    <motion.div
      className="hidden lg:block fixed left-0 top-14 h-full w-80 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-md border-r border-white/20 overflow-y-auto scrollbar-hide"
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {/* Vietnam Culture Header */}
      <div className="p-4 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNSIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-20"
          animate={{ x: [0, 60, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative z-10">
          <motion.div
            className="flex items-center space-x-3 mb-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="text-2xl">⭐</div>
            <h2 className="text-white font-bold text-lg">Discover Vietnam</h2>
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentFactIndex}
              className="text-white/90 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              💡 {vietnamFacts[currentFactIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Weather Widget */}
      <motion.div
        className="m-4 p-4 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 backdrop-blur-sm rounded-2xl border border-white/30"
        whileHover={{ scale: 1.02, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center">
              <span className="mr-2">🌤️</span>
              {currentWeather.location}
            </h3>
            <div className="text-2xl font-bold text-blue-600">
              {currentWeather.temp}°C
            </div>
            <div className="text-xs text-gray-600">
              💧 {currentWeather.humidity}% • 💨 {currentWeather.wind}
            </div>
          </div>
          <motion.div
            className="text-4xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            ☀️
          </motion.div>
        </div>
      </motion.div>

      {/* Main Navigation */}
      <div className="px-4">
        <h3 className="text-gray-600 font-semibold text-sm mb-3 flex items-center">
          <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2 animate-pulse"></span>
          Khám phá VieGo
        </h3>
        <div className="space-y-1">
          {sidebarItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className="group flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 relative overflow-hidden"
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 flex items-center space-x-3 flex-1">
                  <div className="text-gray-600 group-hover:scale-110 transition-transform duration-200">
                    {typeof item.icon === "string" ? (
                      <span className="text-lg">{item.icon}</span>
                    ) : (
                      item.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-800 font-medium group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </span>
                      {item.isNew && (
                        <motion.span
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-bold"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          NEW
                        </motion.span>
                      )}
                      {item.isHot && (
                        <motion.span
                          className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold"
                          animate={{ rotate: [-5, 5, -5] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🔥 HOT
                        </motion.span>
                      )}
                    </div>
                    {item.count && (
                      <div className="text-xs text-gray-500">{item.count}</div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Vietnam Destinations */}
      <div className="p-4 border-t border-gray-200/50 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-600 font-semibold text-sm">
            Điểm đến hot 🔥
          </h3>
          <motion.button
            className="text-xs text-blue-600 hover:text-blue-700"
            whileHover={{ scale: 1.05 }}
            onClick={() =>
              setExpandedSection(
                expandedSection === "destinations" ? "" : "destinations"
              )
            }
          >
            {expandedSection === "destinations" ? "Thu gọn" : "Xem tất cả"}
          </motion.button>
        </div>
        <div className="space-y-2">
          {vietnamDestinations
            .slice(
              0,
              expandedSection === "destinations"
                ? vietnamDestinations.length
                : 3
            )
            .map((destination, index) => (
              <motion.div
                key={destination.name}
                className="group flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-white hover:to-gray-50 cursor-pointer transition-all duration-300 border border-transparent hover:border-gray-200"
                whileHover={{ scale: 1.02, x: 5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${destination.color} rounded-xl flex items-center justify-center text-xl shadow-lg`}
                >
                  {destination.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                    {destination.name}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{destination.type}</span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">
                      {destination.users} người
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Cultural Events */}
      <div className="p-4 border-t border-gray-200/50">
        <h3 className="text-gray-600 font-semibold text-sm mb-3 flex items-center">
          <span className="mr-2">🎭</span>
          Sự kiện văn hóa
        </h3>
        <div className="space-y-2">
          {culturalActivities.slice(0, 2).map((activity, index) => (
            <motion.div
              key={activity.name}
              className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 hover:shadow-md transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{activity.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 text-sm leading-tight">
                    {activity.name}
                  </h4>
                  <div className="text-xs text-gray-600 mt-1">
                    {activity.date}
                  </div>
                  <div className="text-xs text-orange-600 font-medium mt-1">
                    {activity.participants} tham gia
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="text-xs text-gray-500 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/privacy"
              className="hover:text-blue-600 transition-colors"
            >
              Privacy
            </Link>
            <span>·</span>
            <Link
              href="/terms"
              className="hover:text-blue-600 transition-colors"
            >
              Terms
            </Link>
            <span>·</span>
            <Link
              href="/help"
              className="hover:text-blue-600 transition-colors"
            >
              Help
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="text-red-500"
            >
              ❤️
            </motion.div>
            <span className="text-gray-400">
              Made with love in Vietnam © 2025
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
