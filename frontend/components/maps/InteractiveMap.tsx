"use client";

import { motion } from "framer-motion";

interface Location {
  id: number;
  name: string;
  type: string;
  description: string;
  coordinates: { lat: number; lng: number };
  images: string[];
  rating: number;
  reviews: number;
  tags: string[];
  address: string;
  openingHours?: string;
}

interface Props {
  preview?: boolean;
  locations?: Location[];
  onLocationSelect?: (location: Location | null) => void;
}

const InteractiveMap = ({
  preview = false,
  locations: propLocations,
  onLocationSelect,
}: Props) => {
  // Mock locations data (fallback)
  const defaultLocations = [
    {
      id: 1,
      name: "Hạ Long Bay",
      lat: 20.9101,
      lng: 107.1839,
      type: "attraction",
    },
    {
      id: 2,
      name: "Phở Hàng Trống",
      lat: 21.0285,
      lng: 105.8542,
      type: "restaurant",
    },
    {
      id: 3,
      name: "Hội An Ancient Town",
      lat: 15.8801,
      lng: 108.338,
      type: "culture",
    },
    {
      id: 4,
      name: "Sapa Terraces",
      lat: 22.3364,
      lng: 103.8438,
      type: "nature",
    },
  ];

  // Use prop locations or default locations
  const locations =
    propLocations ||
    defaultLocations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      description: `Địa điểm tuyệt vời tại ${loc.name}`,
      coordinates: { lat: loc.lat, lng: loc.lng },
      images: [],
      rating: 4.5,
      reviews: 100,
      tags: [loc.type],
      address: loc.name,
    }));

  const handleLocationClick = (location: any) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  return (
    <div
      className={`relative ${
        preview ? "h-96" : "h-screen"
      } bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl overflow-hidden`}
    >
      {/* Placeholder Map */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            🗺️
          </motion.div>
          <h3 className="text-2xl font-bold text-primary mb-2">
            Bản Đồ Tương Tác VieGo
          </h3>
          <p className="text-neutral-600 mb-4 max-w-md">
            Khám phá hàng ngàn địa điểm du lịch và ẩm thực trên khắp Việt Nam
          </p>
          {preview && (
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Xem Bản Đồ Đầy Đủ
            </motion.button>
          )}
        </div>
      </div>

      {/* Location Markers */}
      {locations.map((location, index) => (
        <motion.div
          key={location.id}
          className="absolute w-4 h-4 bg-accent rounded-full border-2 border-white shadow-lg cursor-pointer"
          style={{
            left: `${20 + index * 15}%`,
            top: `${30 + (index % 2) * 20}%`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.2 }}
          whileHover={{ scale: 1.5 }}
        >
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
            {location.name}
          </div>
        </motion.div>
      ))}

      {/* Controls */}
      {!preview && (
        <div className="absolute top-4 right-4 space-y-2">
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            ➕
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            ➖
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            🎯
          </button>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
