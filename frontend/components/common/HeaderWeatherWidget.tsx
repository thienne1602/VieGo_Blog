"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, MapPin, Search, X, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface WeatherData {
  location: {
    lat: number;
    lng: number;
    name?: string;
  };
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  };
}

const HeaderWeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user's current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Fetch weather when location changes
  useEffect(() => {
    if (selectedLocation) {
      fetchWeather(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocationSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.warn(
        "[Weather] Geolocation not supported, using default location"
      );
      // Default to Hanoi if geolocation not available
      const defaultLocation = { lat: 21.0285, lng: 105.8542, name: "Hà Nội" };
      setSelectedLocation(defaultLocation);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log("[Weather] Got position:", lat, lng);

        // Try to get location name using reverse geocoding
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`
          );
          const data = await response.json();
          const locationName =
            data.city ||
            data.locality ||
            `${lat.toFixed(2)}, ${lng.toFixed(2)}`;

          const location = { lat, lng, name: locationName };
          setUserLocation(location);
          setSelectedLocation(location);
          console.log("[Weather] Location name:", locationName);
        } catch (err) {
          console.warn("[Weather] Reverse geocoding failed, using coordinates");
          const location = {
            lat,
            lng,
            name: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
          };
          setUserLocation(location);
          setSelectedLocation(location);
        }
      },
      (err) => {
        console.error("[Weather] Geolocation error:", err);
        // Default to Hanoi on error
        const defaultLocation = { lat: 21.0285, lng: 105.8542, name: "Hà Nội" };
        setSelectedLocation(defaultLocation);
        setLoading(false);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const fetchWeather = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log("[Weather] Fetching weather for:", lat, lng);

      // Try backend API first
      const response = await api.getWeather(lat, lng);
      console.log("[Weather] Response:", response);

      if (response && response.success && response.data) {
        setWeather(response.data);
        console.log("[Weather] Weather data set:", response.data);
        setLoading(false);
        return;
      }

      // If backend fails, use mock data (backend should return mock data on error, but just in case)
      console.log("[Weather] Backend failed, using mock data");
      const mockTemp = 28 + Math.floor(Math.random() * 5) - 2; // 26-30°C
      const weatherConditions = [
        { main: "Clear", description: "trời quang", icon: "01d", emoji: "☀️" },
        { main: "Clouds", description: "có mây", icon: "02d", emoji: "☁️" },
        { main: "Rain", description: "có mưa", icon: "10d", emoji: "🌧️" },
        { main: "Clear", description: "trời quang", icon: "01d", emoji: "☀️" },
      ];
      const randomCondition =
        weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

      const mockData = {
        location: {
          lat,
          lng,
          name: selectedLocation?.name || "Vị trí",
        },
        current: {
          temp: mockTemp,
          feels_like: mockTemp + 2,
          humidity: 70 + Math.floor(Math.random() * 10),
          wind_speed: 5 + Math.floor(Math.random() * 5),
          weather: [randomCondition],
        },
      };

      setWeather(mockData);
      console.log("[Weather] Using mock data:", mockData);
    } catch (err: any) {
      console.error("[Weather] Exception:", err);

      // Even on error, show mock data so widget is always visible
      const mockData = {
        location: {
          lat,
          lng,
          name: selectedLocation?.name || "Vị trí",
        },
        current: {
          temp: 28,
          feels_like: 30,
          humidity: 75,
          wind_speed: 5,
          weather: [
            {
              main: "Clear",
              description: "trời quang",
              icon: "01d",
            },
          ],
        },
      };

      setWeather(mockData);
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Use OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&accept-language=vi`
      );
      const data = await response.json();

      const results = data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      setSearchResults(results);
    } catch (err) {
      console.error("Location search error:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleLocationSelect = (location: {
    lat: number;
    lng: number;
    name: string;
  }) => {
    setSelectedLocation(location);
    setShowLocationSelector(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const getWeatherIcon = (iconCode: string) => {
    // WeatherAPI.com returns full URLs, OpenWeatherMap returns icon codes
    if (iconCode.startsWith("http://") || iconCode.startsWith("https://")) {
      return iconCode;
    }
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const getWeatherEmoji = (main: string) => {
    switch (main.toLowerCase()) {
      case "clear":
        return "☀️";
      case "clouds":
        return "☁️";
      case "rain":
        return "🌧️";
      case "drizzle":
        return "🌦️";
      case "thunderstorm":
        return "⛈️";
      case "snow":
        return "❄️";
      case "mist":
      case "fog":
        return "🌫️";
      default:
        return "🌤️";
    }
  };

  const getCuteWeatherIcon = (main: string, description: string) => {
    const desc = description?.toLowerCase() || "";
    const mainLower = main?.toLowerCase() || "";

    // Cute emoji based on weather condition
    if (mainLower.includes("clear") || desc.includes("sun")) {
      return "☀️";
    } else if (mainLower.includes("cloud")) {
      if (desc.includes("few") || desc.includes("scattered")) {
        return "🌤️";
      }
      return "☁️";
    } else if (mainLower.includes("rain") || desc.includes("rain")) {
      if (desc.includes("light") || desc.includes("nhẹ")) {
        return "🌦️";
      }
      return "🌧️";
    } else if (mainLower.includes("drizzle")) {
      return "🌦️";
    } else if (mainLower.includes("thunder")) {
      return "⛈️";
    } else if (mainLower.includes("snow")) {
      return "❄️";
    } else if (mainLower.includes("mist") || mainLower.includes("fog")) {
      return "🌫️";
    }
    return "🌤️";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setShowLocationSelector(!showLocationSelector)}
        className="group flex items-center space-x-2.5 px-2 sm:px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        title="Thời tiết - Click để chọn địa điểm"
      >
        {loading ? (
          <>
            <motion.div
              className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-2xl sm:text-3xl">🌤️</span>
            </motion.div>
            <span className="hidden sm:inline text-sm font-medium text-gray-600 dark:text-gray-400">
              Đang tải...
            </span>
          </>
        ) : error ? (
          <>
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">😢</span>
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                Lỗi
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                {error.length > 20 ? error.substring(0, 20) + "..." : error}
              </span>
            </div>
          </>
        ) : weather && weather.current ? (
          <>
            {weather.current.weather && weather.current.weather[0] ? (
              <>
                <motion.div
                  className="relative flex-shrink-0"
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">
                      {getCuteWeatherIcon(
                        weather.current.weather[0].main,
                        weather.current.weather[0].description
                      )}
                    </span>
                  </div>
                </motion.div>
                <div className="flex flex-col items-start min-w-0">
                  <div className="flex items-baseline space-x-0.5">
                    <span className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-200 leading-none">
                      {Math.round(weather.current.temp)}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      °C
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 leading-tight truncate max-w-[90px] sm:max-w-[110px]">
                      {selectedLocation?.name ||
                        weather.location?.name ||
                        "Vị trí"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <motion.div
                  className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center"
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <span className="text-2xl sm:text-3xl">☁️</span>
                </motion.div>
                <div className="flex flex-col items-start">
                  <span className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-200">
                    {Math.round(weather.current.temp)}°C
                  </span>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300">
                    {selectedLocation?.name || "Vị trí"}
                  </span>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <motion.div
              className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <span className="text-2xl sm:text-3xl">🌤️</span>
            </motion.div>
            <span className="hidden sm:inline text-sm font-medium text-gray-600 dark:text-gray-400">
              Thời tiết
            </span>
          </>
        )}
      </motion.button>

      {/* Location Selector Dropdown */}
      <AnimatePresence>
        {showLocationSelector && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-sky-50/50 to-cyan-50/50 dark:from-slate-800/50 dark:to-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Chọn địa điểm</span>
                </h3>
                <button
                  onClick={() => setShowLocationSelector(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sky-500 dark:text-sky-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm địa điểm..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchLocation(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {/* Use Current Location */}
              {userLocation && (
                <button
                  onClick={() =>
                    handleLocationSelect({
                      lat: userLocation.lat,
                      lng: userLocation.lng,
                      name: userLocation.name ?? "Vị trí hiện tại",
                    })
                  }
                  className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-sky-50/50 hover:to-cyan-50/50 dark:hover:from-slate-700/50 dark:hover:to-slate-600/50 transition-all duration-200 border-b border-gray-100/50 dark:border-gray-700/50 ${
                    selectedLocation?.lat === userLocation.lat &&
                    selectedLocation?.lng === userLocation.lng
                      ? "bg-gradient-to-r from-sky-100/50 to-cyan-100/50 dark:from-sky-900/30 dark:to-cyan-900/30"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        selectedLocation?.lat === userLocation.lat &&
                        selectedLocation?.lng === userLocation.lng
                          ? "bg-sky-500 dark:bg-sky-600"
                          : "bg-sky-100 dark:bg-slate-700"
                      }`}
                    >
                      <MapPin
                        className={`w-4 h-4 ${
                          selectedLocation?.lat === userLocation.lat &&
                          selectedLocation?.lng === userLocation.lng
                            ? "text-white"
                            : "text-sky-600 dark:text-sky-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        Vị trí hiện tại
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {userLocation.name}
                      </div>
                    </div>
                    {selectedLocation?.lat === userLocation.lat &&
                      selectedLocation?.lng === userLocation.lng && (
                        <div className="w-2 h-2 bg-sky-600 dark:bg-sky-400 rounded-full animate-pulse" />
                      )}
                  </div>
                </button>
              )}

              {/* Search Results */}
              {searching && (
                <div className="px-4 py-8 text-center">
                  <Loader2 className="w-5 h-5 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Đang tìm kiếm...
                  </p>
                </div>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="py-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-sky-50/50 hover:to-cyan-50/50 dark:hover:from-slate-700/50 dark:hover:to-slate-600/50 transition-all duration-200 border-b border-gray-100/30 dark:border-gray-700/30 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-700">
                          <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.name.split(",")[0]}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!searching && searchQuery && searchResults.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Không tìm thấy địa điểm
                  </p>
                </div>
              )}

              {!searchQuery && searchResults.length === 0 && (
                <div className="px-4 py-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Nhập tên địa điểm để tìm kiếm
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeaderWeatherWidget;
