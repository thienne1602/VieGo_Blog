"use client";

import { motion } from "framer-motion";
import { MapPin, Star, Users, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

const popularDestinations = [
  {
    id: 1,
    name: "Hạ Long Bay",
    location: "Quảng Ninh",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
    rating: 4.9,
    reviews: 2850,
    tours: 45,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    name: "Phố Cổ Hội An",
    location: "Quảng Nam",
    image: "https://images.unsplash.com/photo-1578241561880-0a1d5db283cb?w=800",
    rating: 4.8,
    reviews: 1920,
    tours: 32,
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    id: 3,
    name: "Sa Pa",
    location: "Lào Cai",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    rating: 4.9,
    reviews: 2100,
    tours: 38,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: 4,
    name: "Phong Nha - Kẻ Bàng",
    location: "Quảng Bình",
    image: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800",
    rating: 4.8,
    reviews: 1580,
    tours: 25,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: 5,
    name: "Mũi Né",
    location: "Bình Thuận",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    rating: 4.7,
    reviews: 1750,
    tours: 28,
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    id: 6,
    name: "Đà Lạt",
    location: "Lâm Đồng",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    rating: 4.8,
    reviews: 2200,
    tours: 42,
    gradient: "from-indigo-500 to-purple-500",
  },
];

export default function PopularDestinations() {
  return (
    <div className="mb-16">
      {/* Section Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 bg-teal-100 dark:bg-teal-900/40 px-4 py-2 rounded-lg mb-4">
          <TrendingUp className="w-6 h-6 text-teal-700 dark:text-teal-400" />
          <span className="font-bold text-sm uppercase tracking-wide text-teal-700 dark:text-teal-300">
            Điểm Đến Phổ Biến
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 drop-shadow-sm">
          Điểm Đến Nổi Tiếng
        </h2>
        <p className="text-gray-700 dark:text-gray-200 max-w-2xl mx-auto font-medium">
          Khám phá những điểm đến được yêu thích nhất Việt Nam
        </p>
      </motion.div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {popularDestinations.map((destination, index) => (
          <motion.div
            key={destination.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative"
          >
            <Link href={`/tours?location=${encodeURIComponent(destination.name)}`}>
              <motion.div
                className="relative h-80 rounded-3xl overflow-hidden shadow-xl cursor-pointer"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Background Image */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${destination.image})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                  {/* Top Badge */}
                  <div className="flex justify-end">
                    <motion.div
                      className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2"
                      whileHover={{ scale: 1.1 }}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold text-sm">Phổ Biến</span>
                    </motion.div>
                  </div>

                  {/* Bottom Content */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm font-medium text-white/90">
                        {destination.location}
                      </span>
                    </div>
                    
                    <h3 className="text-3xl font-extrabold mb-4 group-hover:text-yellow-400 transition-colors">
                      {destination.name}
                    </h3>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{destination.rating}</span>
                        <span className="text-xs text-white/80">({destination.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-semibold">{destination.tours} Tours</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <motion.div
                      className="inline-flex items-center gap-2 text-sm font-semibold"
                      whileHover={{ x: 5 }}
                    >
                      <span>Khám Phá Ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>

                {/* Hover Gradient Overlay */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${destination.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                />
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      <motion.div
        className="text-center mt-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Link href="/tours">
          <motion.button
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Xem Tất Cả Điểm Đến</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
