"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Star,
  Users,
  TrendingUp,
  ArrowRight,
  Trophy,
  Search,
  Compass,
  Filter,
} from "lucide-react";
import Link from "next/link";
import api from "../../lib/api";

export default function PopularDestinations() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [exploreSearch, setExploreSearch] = useState("");

  useEffect(() => {
    async function loadDestinations() {
      try {
        const res = await api.getDestinationRanking();
        if (res.success && res.data && Array.isArray(res.data.data)) {
          setDestinations(res.data.data);
        }
      } catch (error) {
        console.error("Error loading destinations:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDestinations();
  }, []);

  const handleExploreSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (exploreSearch.trim()) {
      router.push(`/tours?search=${encodeURIComponent(exploreSearch)}`);
    } else {
      router.push("/tours");
    }
  };

  const handleCategoryClick = (category: string) => {
    router.push(`/tours?category=${category}`);
  };

  const topDestinations = destinations.slice(0, 5);
  const otherDestinations = destinations.slice(5);
  const filteredDestinations = otherDestinations.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="mb-16 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[400px]">
          <div className="md:col-span-2 md:row-span-2 bg-gray-200 dark:bg-gray-700 rounded-3xl"></div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl"></div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl"></div>
          <div className="md:col-span-2 bg-gray-200 dark:bg-gray-700 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      {/* Section Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 bg-teal-100 dark:bg-teal-900/40 px-4 py-2 rounded-lg mb-4">
          <TrendingUp className="w-6 h-6 text-teal-700 dark:text-teal-400" />
          <span className="font-bold text-sm uppercase tracking-wide text-teal-700 dark:text-teal-300">
            Bảng Xếp Hạng Du Lịch
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 drop-shadow-sm">
          Điểm Đến Hàng Đầu Việt Nam
        </h2>
        <p className="text-gray-700 dark:text-gray-200 max-w-2xl mx-auto font-medium">
          Khám phá những địa điểm được du khách yêu thích nhất, cập nhật liên
          tục dựa trên dữ liệu đặt tour thực tế.
        </p>
      </motion.div>

      {/* Top 5 Grid - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px] mb-16">
        {topDestinations.map((destination, index) => {
          let spanClass = "";
          if (index === 0) spanClass = "md:col-span-2 md:row-span-2";
          else if (index === 1 || index === 2)
            spanClass = "md:col-span-1 md:row-span-1";
          else if (index === 3) spanClass = "md:col-span-2 md:row-span-1";
          else spanClass = "md:col-span-2 md:row-span-1";

          return (
            <motion.div
              key={destination.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative rounded-3xl overflow-hidden shadow-lg cursor-pointer ${spanClass}`}
            >
              <Link
                href={`/tours?location=${encodeURIComponent(destination.name)}`}
                className="block w-full h-full"
              >
                <div className="absolute inset-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${
                        destination.image || "/images/backround_tour.jpg"
                      })`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                </div>

                {/* Rank Badge */}
                <div className="absolute top-4 left-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : index === 2
                        ? "bg-orange-600"
                        : "bg-white/20 backdrop-blur-md"
                    }`}
                  >
                    #{index + 1}
                  </div>
                </div>

                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3
                      className={`font-extrabold mb-2 group-hover:text-yellow-400 transition-colors ${
                        index === 0 ? "text-3xl" : "text-xl"
                      }`}
                    >
                      {destination.name}
                    </h3>

                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-bold">
                            {destination.avg_rating}
                          </span>
                        </div>
                        <span className="text-xs text-white/80">
                          ({destination.total_reviews} đánh giá)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm bg-primary-600/80 px-3 py-1 rounded-full backdrop-blur-sm">
                        <span className="font-semibold">
                          {destination.tour_count} Tours
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Ranking List & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Bảng Xếp Hạng Các Tỉnh Thành
            </h3>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tỉnh thành..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hạng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Điểm Đến
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Số Lượng Tour
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Đánh Giá
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredDestinations.map((dest, idx) => (
                <tr
                  key={dest.name}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-gray-500 dark:text-gray-400">
                      #{idx + 6}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={dest.image || "/images/backround_tour.jpg"}
                          alt={dest.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {dest.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {dest.tour_count} tours
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dest.avg_rating}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/tours?location=${encodeURIComponent(dest.name)}`}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Xem Tour <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explore All Banner - Redesigned */}
      <motion.div
        className="mt-16 relative rounded-3xl overflow-hidden shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-800/90 to-primary-900/95" />
        </div>
      </motion.div>
    </div>
  );
}
