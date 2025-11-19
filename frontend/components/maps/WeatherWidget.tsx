"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../lib/api";
import { 
  Cloud, 
  X, 
  Droplets, 
  Wind, 
  Eye, 
  Gauge, 
  CloudRain, 
  AlertTriangle 
} from "lucide-react";

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
    pressure: number;
    wind_speed: number;
    wind_deg: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    visibility: number;
    clouds: number;
    uv_index?: number;
  };
  forecast: Array<{
    dt: number;
    temp: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    rain?: number;
    wind_speed: number;
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    icon: string;
  }>;
  warning?: string;
}

interface Props {
  lat: number;
  lng: number;
  onClose?: () => void;
}

const WeatherWidget = ({ lat, lng, onClose }: Props) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
  }, [lat, lng]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getWeather(lat, lng);
      
      if (response.success) {
        setWeather(response.data);
      } else {
        setError(response.error || "Không thể tải dữ liệu thời tiết");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải dữ liệu thời tiết");
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "danger":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-primary"></div>
          <span className="text-sm text-gray-600">Đang tải thời tiết...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </motion.div>
    );
  }

  if (!weather) return null;

  const currentWeather = weather.current.weather[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="bg-primary-600 dark:bg-primary-700 text-white p-5 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="font-black text-xl mb-1 flex items-center gap-2">
              <Cloud className="w-6 h-6" />
              Dự Báo Thời Tiết
            </h3>
            {weather.location.name && (
              <p className="text-sm opacity-90 font-medium">{weather.location.name}</p>
            )}
          </div>
          {onClose && (
            <motion.button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Current Weather */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {currentWeather && (
              <img
                src={getWeatherIcon(currentWeather.icon)}
                alt={currentWeather.description}
                className="w-16 h-16"
              />
            )}
            <div>
              <div className="text-4xl font-bold text-gray-800">
                {weather.current.temp}°C
              </div>
              <div className="text-sm text-gray-600">
                Cảm giác như {weather.current.feels_like}°C
              </div>
            </div>
          </div>
          {currentWeather && (
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-800 capitalize">
                {currentWeather.description}
              </div>
              <div className="text-sm text-gray-600">
                {currentWeather.main}
              </div>
            </div>
          )}
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: "Độ ẩm", value: `${weather.current.humidity}%`, icon: <Droplets className="w-5 h-5" /> },
            { label: "Gió", value: `${weather.current.wind_speed} km/h`, icon: <Wind className="w-5 h-5" /> },
            { label: "Tầm nhìn", value: `${weather.current.visibility} km`, icon: <Eye className="w-5 h-5" /> },
            { label: "Áp suất", value: `${weather.current.pressure} hPa`, icon: <Gauge className="w-5 h-5" /> },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">{item.label}</div>
              <div className="flex items-center gap-2">
                <span className="text-primary-600 dark:text-primary-400">{item.icon}</span>
                <div className="text-lg font-black text-gray-800 dark:text-white">
                  {item.value}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Weather Alerts */}
        {weather.alerts && weather.alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {weather.alerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${getSeverityColor(alert.severity)} text-white rounded-lg p-3 flex items-start space-x-2`}
              >
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold">{alert.title}</div>
                  <div className="text-sm opacity-90">{alert.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Forecast */}
        {weather.forecast && weather.forecast.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Dự báo 24h</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {weather.forecast.slice(0, 8).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={getWeatherIcon(item.weather[0]?.icon || "01d")}
                      alt={item.weather[0]?.description}
                      className="w-8 h-8"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {new Date(item.dt * 1000).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-xs text-gray-600 capitalize">
                        {item.weather[0]?.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-800">
                      {item.temp}°C
                    </div>
                    {item.rain && item.rain > 0 && (
                      <div className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1">
                        <CloudRain className="w-4 h-4" />
                        {item.rain}mm
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning */}
        {weather.warning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600/50 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold mb-1">Lưu ý</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">{weather.warning}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                  Để hiển thị dữ liệu thời tiết thực tế, vui lòng thêm OPENWEATHER_API_KEY vào file run_backend.bat
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default WeatherWidget;

