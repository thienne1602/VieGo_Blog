"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Toast from "../../components/common/Toast";
import { 
  Map, 
  Zap, 
  Search, 
  Circle, 
  Pencil, 
  Ruler, 
  Flame, 
  Building, 
  Train, 
  MapPin, 
  Lightbulb,
  Landmark,
  Building2,
  Droplets,
  Plane,
  Ship
} from "lucide-react";

interface SelectedLocation {
  name: string;
  coordinates: { lat: number; lng: number };
  [key: string]: any;
}

type LucideIcon = React.ComponentType<{ className?: string }>;

// Lazy load AdvancedMap - ensure proper default export handling
const AdvancedMap = dynamic(
  () => import("../../components/maps/AdvancedMap"),
  {
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl">
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-spin" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-white font-medium text-lg">Đang khởi tạo bản đồ...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
) as React.ComponentType<{
  onLocationSelect?: (location: SelectedLocation | null) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}>;

const MapsPage = () => {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocationSelect = (location: SelectedLocation | null) => {
    setSelectedLocation(location);
    if (location) {
      setToast({
        message: `Đã chọn: ${location.name}`,
        type: "info",
      });
    }
  };

  const popularPlaces: Array<{
    name: string;
    coordinates: { lat: number; lng: number };
    IconComponent: LucideIcon;
  }> = [
    { name: "Hà Nội", coordinates: { lat: 21.028511, lng: 105.854167 }, IconComponent: Landmark },
    { name: "Hồ Chí Minh", coordinates: { lat: 10.762622, lng: 106.660172 }, IconComponent: Building2 },
    { name: "Đà Nẵng", coordinates: { lat: 16.054407, lng: 108.202167 }, IconComponent: Droplets },
    { name: "Nha Trang", coordinates: { lat: 12.238791, lng: 109.196749 }, IconComponent: Droplets },
    { name: "Phú Quốc", coordinates: { lat: 10.315699, lng: 103.984314 }, IconComponent: Plane },
    { name: "Hạ Long", coordinates: { lat: 20.910051, lng: 107.183902 }, IconComponent: Ship },
    { name: "Huế", coordinates: { lat: 16.463713, lng: 107.590866 }, IconComponent: Landmark },
    { name: "Hội An", coordinates: { lat: 15.880058, lng: 108.338047 }, IconComponent: Lightbulb },
  ];

  const quickNavigate = (place: typeof popularPlaces[0]) => {
    handleLocationSelect({
      name: place.name,
      coordinates: place.coordinates,
    });
    // Map will be controlled by AdvancedMap component
    setToast({
      message: `Đang điều hướng đến ${place.name}`,
      type: "info",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 relative overflow-hidden">
      {/* Animated Background - Client-only to prevent hydration mismatch */}
      {mounted && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"
              style={{
                left: `${(i * 3.33) % 100}%`,
                top: `${(i * 4.76) % 100}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: `${2 + (i % 3)}s`,
              }}
            />
          ))}
        </div>
      )}


      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="space-y-3">
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 dark:text-white leading-tight flex items-center gap-4">
                <Map className="w-12 h-12 lg:w-16 lg:h-16 text-primary-600 dark:text-primary-400" />
                Bản Đồ Thông Minh
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-xl lg:text-2xl font-light">
                Khám phá Việt Nam với công nghệ bản đồ tiên tiến
              </p>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="mb-6">
            <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Điểm đến nổi bật
            </h3>
            <div className="flex flex-wrap gap-3">
              {mounted && popularPlaces.map((place) => {
                const IconComponent = place.IconComponent;
                if (!IconComponent || typeof IconComponent !== 'function') return null;
                return (
                  <button
                    key={place.name}
                    onClick={() => quickNavigate(place)}
                    className="px-5 py-3 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-gray-900 dark:text-white"
                  >
                    <span className="text-primary-600 dark:text-primary-400">
                      <IconComponent className="w-5 h-5" />
                    </span>
                    <span className="font-semibold">{place.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Features Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { icon: <Search className="w-6 h-6" />, title: "Tìm kiếm thông minh", desc: "Tìm địa điểm với Places API" },
              { icon: <Circle className="w-6 h-6" />, title: "Giao thông", desc: "Xem tình trạng giao thông real-time" },
              { icon: <Pencil className="w-6 h-6" />, title: "Công cụ vẽ", desc: "Vẽ, đánh dấu trên bản đồ" },
              { icon: <Ruler className="w-6 h-6" />, title: "Đo khoảng cách", desc: "Tính toán khoảng cách chính xác" },
              { icon: <Flame className="w-6 h-6" />, title: "Heat Map", desc: "Xem mật độ địa điểm" },
              { icon: <Building className="w-6 h-6" />, title: "3D Buildings", desc: "Xem tòa nhà 3D" },
              { icon: <Train className="w-6 h-6" />, title: "Giao thông công cộng", desc: "Tuyến đường xe buýt, tàu" },
              { icon: <MapPin className="w-6 h-6" />, title: "Vị trí của tôi", desc: "Tự động định vị GPS" },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 transition-all hover:scale-105 shadow-sm hover:shadow-md"
              >
                <div className="text-primary-600 dark:text-primary-400 mb-2">{feature.icon}</div>
                <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-1">{feature.title}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-xs">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Map */}
        <div className="relative rounded-3xl overflow-hidden shadow-lg border-2 border-gray-200 dark:border-gray-700">
          <div className="h-[600px] lg:h-[800px] relative w-full">
            {mounted && (
              <AdvancedMap
                onLocationSelect={handleLocationSelect}
                initialCenter={{ lat: 10.762622, lng: 106.660172 }}
                initialZoom={13}
              />
            )}
          </div>
        </div>

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border-2 border-primary-300 dark:border-primary-600 shadow-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  {selectedLocation.name}
                </h3>
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  <p>Vĩ độ: {selectedLocation.coordinates.lat.toFixed(6)}</p>
                  <p>Kinh độ: {selectedLocation.coordinates.lng.toFixed(6)}</p>
                </div>
                {selectedLocation.formatted_address && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                    <span className="font-semibold">Địa chỉ:</span> {selectedLocation.formatted_address}
                  </p>
                )}
                {selectedLocation.rating && (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <span className="text-lg">⭐</span>
                    <span className="font-bold">{selectedLocation.rating}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      ({selectedLocation.user_ratings_total || 0} đánh giá)
                    </span>
                  </div>
                )}
                {selectedLocation.website && (
                  <a
                    href={selectedLocation.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 shadow-lg hover:shadow-xl transition-all"
                  >
                    🌐 Xem website →
                  </a>
                )}
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="ml-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Hướng dẫn sử dụng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 dark:text-gray-400 text-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                Tìm kiếm:
              </p>
              <p>Nhập tên địa điểm vào ô tìm kiếm ở trên bản đồ để tìm và xem thông tin chi tiết.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                Vẽ trên bản đồ:
              </p>
              <p>Click vào "Công cụ vẽ" và sử dụng thanh công cụ để vẽ marker, đường, hình tròn, đa giác.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                Đo khoảng cách:
              </p>
              <p>Bật "Đo khoảng cách" và click vào 2 điểm trên bản đồ để xem khoảng cách.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Circle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                Xem giao thông:
              </p>
              <p>Bật "Giao thông" để xem tình trạng giao thông real-time trên các tuyến đường.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MapsPage;

