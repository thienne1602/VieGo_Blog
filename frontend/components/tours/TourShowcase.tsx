"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X, MapPin, DollarSign, TrendingUp, Mountain, Landmark, Utensils, Leaf, Building, Sparkles, Star } from "lucide-react";
import api from "../../lib/api";
import TourCard from "./TourCard";

const TourShowcase = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tours, setTours] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showSidebar, setShowSidebar] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const reloadKeyRef = useRef(0);

  const getCategoryIcon = (category: string) => {
    const icons: any = {
      adventure: <Mountain className="w-5 h-5" />,
      cultural: <Landmark className="w-5 h-5" />,
      food: <Utensils className="w-5 h-5" />,
      nature: <Leaf className="w-5 h-5" />,
      urban: <Building className="w-5 h-5" />,
      spiritual: <Sparkles className="w-5 h-5" />,
    };
    return icons[category] || <Star className="w-5 h-5" />;
  };

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Initialize categories and load tours on mount
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const catRes = await api.getTourCategories();
      if (catRes.success && mounted) {
        setCategories([
          { value: "all", label: "Tất Cả", icon: <Sparkles className="w-5 h-5" /> },
          ...(catRes.data.categories || []).map((cat: any) => ({
            ...cat,
            icon: getCategoryIcon(cat.value),
          })),
        ]);
      }

      await loadTours(mounted);
      if (mounted) {
        setLoading(false);
        hasInitializedRef.current = true;
      }
    }

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track pathname changes to detect navigation to/from tour detail
  // Use sessionStorage to persist across remounts
  useEffect(() => {
    const currentPathname = pathname;
    
    // Get previous pathname from sessionStorage (persists across remounts)
    const storedPrevPath = typeof window !== 'undefined' 
      ? sessionStorage.getItem('tours_prev_pathname') 
      : null;
    const prevPathname = prevPathnameRef.current || storedPrevPath;
    
    // Log pathname changes with full details
    if (prevPathname !== currentPathname && prevPathname) {
      console.log('[TourShowcase] 🔄 Pathname changed', 
        '\n  FROM:', prevPathname,
        '\n  TO:', currentPathname,
        '\n  Initialized:', hasInitializedRef.current,
        '\n  Categories:', categories.length,
        '\n  Stored:', storedPrevPath
      );
    }
    
    // Skip processing if not initialized yet - just track the pathname
    if (!hasInitializedRef.current || categories.length === 0) {
      prevPathnameRef.current = currentPathname;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tours_prev_pathname', currentPathname);
      }
      return;
    }

    // Only process if pathname actually changed
    if (prevPathname === currentPathname) {
      return;
    }

    const isOnToursPage = currentPathname === '/tours';
    const wasOnTourDetail = prevPathname && 
      /^\/tours\/\d+$/.test(prevPathname);
    
    console.log('[TourShowcase] 🔍 Navigation check', {
      isOnToursPage,
      wasOnTourDetail,
      prevPathname,
      currentPathname,
      patternMatch: prevPathname ? /^\/tours\/\d+$/.test(prevPathname) : false,
      stored: storedPrevPath
    });
    
    // Case 1: Navigated from tour detail to /tours - ALWAYS reload
    if (isOnToursPage && wasOnTourDetail) {
      console.log('[TourShowcase] ✅ Detected navigation back from tour detail - force reloading tours', {
        from: prevPathname,
        to: currentPathname,
        toursCount: tours.length
      });
      
      // Update both ref and sessionStorage immediately
      prevPathnameRef.current = currentPathname;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tours_prev_pathname', currentPathname);
      }
      
      // Force reload after a short delay to ensure navigation is complete
      setTimeout(() => {
        console.log('[TourShowcase] 🚀 Executing force reload now...');
        forceReloadTours();
      }, 300);
      return;
    }

    // Case 2: Just navigated to /tours from another page - reload if no tours
    if (isOnToursPage && prevPathname && prevPathname !== '/tours') {
      if (tours.length === 0) {
        console.log('[TourShowcase] Navigated to /tours with no tours - reloading');
        prevPathnameRef.current = currentPathname;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tours_prev_pathname', currentPathname);
        }
        setTimeout(() => {
          forceReloadTours();
        }, 300);
        return;
      }
    }
    
    // Update both ref and sessionStorage after processing all cases
    prevPathnameRef.current = currentPathname;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tours_prev_pathname', currentPathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, categories.length]);

  const loadTours = async (mounted?: boolean, bypassCache = false): Promise<void> => {
    const filters: any = { per_page: 24 };
    if (selectedCategory !== "all") filters.category = selectedCategory;
    if (difficultyFilter !== "all") filters.difficulty = difficultyFilter;
    if (debouncedSearchQuery) filters.search = debouncedSearchQuery;
    if (priceRange.min) filters.min_price = parseFloat(priceRange.min);
    if (priceRange.max) filters.max_price = parseFloat(priceRange.max);

    try {
      console.log('[TourShowcase] 🔍 Loading tours with filters:', filters, 'bypassCache:', bypassCache);
      
      // Use bypassCache option to force fresh data
      const toursRes = await api.getTours(filters, { bypassCache });
      
      console.log('[TourShowcase] 📦 API Response:', {
        success: toursRes.success,
        hasData: !!toursRes.data,
        dataKeys: toursRes.data ? Object.keys(toursRes.data) : [],
        dataType: typeof toursRes.data,
        error: toursRes.error,
        fullResponse: toursRes
      });
      
      if (toursRes.success && (mounted !== false)) {
        // Parse response: backend returns { tours: [...], pagination: {...} }
        const toursData = toursRes.data?.tours || toursRes.data?.data || toursRes.data || [];
        
        console.log('[TourShowcase] 📊 Parsed tours data:', {
          isArray: Array.isArray(toursData),
          length: Array.isArray(toursData) ? toursData.length : 'N/A',
          type: typeof toursData,
          sample: Array.isArray(toursData) && toursData.length > 0 ? toursData[0] : null
        });
        
        if (Array.isArray(toursData)) {
          setTours(toursData);
          console.log(`[TourShowcase] ✅ Loaded ${toursData.length} tours successfully`);
        } else {
          console.error('[TourShowcase] ❌ Tours data is not an array:', {
            toursData,
            type: typeof toursData,
            value: toursData
          });
          if (mounted !== false) {
            setTours([]);
          }
        }
      } else {
        const errorMsg = toursRes.error || toursRes.data?.error || 'Unknown error';
        console.error('[TourShowcase] ❌ Failed to load tours:', {
          error: errorMsg,
          success: toursRes.success,
          mounted: mounted,
          response: toursRes
        });
        if (mounted !== false) {
          setTours([]);
        }
      }
    } catch (error: any) {
      console.error('[TourShowcase] 💥 Exception loading tours:', {
        error: error,
        message: error?.message,
        stack: error?.stack
      });
      if (mounted !== false) {
        setTours([]);
      }
    }
  };

  // Centralized reload function
  const forceReloadTours = () => {
    console.log('[TourShowcase] 🔄 Force reloading tours (bypassing cache)');
    reloadKeyRef.current += 1;
    setTours([]);
    setLoading(true);
    loadTours(true, true).finally(() => {
      setLoading(false);
    });
  };

  // Listen for manual refresh event
  useEffect(() => {
    const handleRefresh = (event?: any) => {
      if (pathname === '/tours' && categories.length > 0 && hasInitializedRef.current) {
        console.log('[TourShowcase] 🔄 Manual refresh event received', {
          pathname,
          categoriesCount: categories.length,
          from: event?.detail?.from || 'unknown'
        });
        setTimeout(() => {
          forceReloadTours();
        }, 100);
      } else {
        console.log('[TourShowcase] ⏭️ Ignoring refresh event', {
          pathname,
          categoriesLength: categories.length,
          initialized: hasInitializedRef.current
        });
      }
    };

    window.addEventListener('tours-refresh', handleRefresh);
    return () => {
      window.removeEventListener('tours-refresh', handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, categories.length]);

  useEffect(() => {
    if (!loading) {
      setLoading(true);
      loadTours().finally(() => {
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, difficultyFilter, debouncedSearchQuery, priceRange.min, priceRange.max]);

  // Fallback: Reload tours if we're on /tours page but have no tours (safety net)
  useEffect(() => {
    const hasNoActiveFilters = 
      selectedCategory === "all" && 
      difficultyFilter === "all" && 
      !debouncedSearchQuery && 
      !priceRange.min && 
      !priceRange.max;

    if (
      !loading &&
      categories.length > 0 &&
      tours.length === 0 &&
      hasNoActiveFilters &&
      pathname === '/tours' &&
      hasInitializedRef.current
    ) {
      // Safety net: if we're on tours page with no filters but no tours, reload
      console.log('[TourShowcase] Safety reload: on /tours with no tours and no filters');
      const timer = setTimeout(() => {
        forceReloadTours();
      }, 300);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, categories.length, tours.length, selectedCategory, difficultyFilter, debouncedSearchQuery, priceRange.min, priceRange.max, pathname]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setDifficultyFilter("all");
    setPriceRange({ min: "", max: "" });
    setSearchQuery("");
  };

  const activeFiltersCount = [
    selectedCategory !== "all",
    difficultyFilter !== "all",
    priceRange.min || priceRange.max,
    searchQuery,
  ].filter(Boolean).length;

  return (
    <div className="flex gap-6">
      {/* Filter Sidebar - Desktop with Glass Effect */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-24 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <SlidersHorizontal className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Bộ Lọc
            </motion.h2>
            {activeFiltersCount > 0 && (
              <motion.button
                onClick={clearFilters}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Xóa tất cả
              </motion.button>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Tên tour, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border-2 border-white/50 dark:border-gray-600/50 rounded-xl focus:border-teal-600 dark:focus:border-teal-400 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              Danh mục
            </label>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <motion.button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden ${
                    selectedCategory === category.value
                      ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-semibold border-2 border-primary-600 dark:border-primary-400"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                <motion.div
                  className="text-gray-700 dark:text-gray-300"
                  animate={selectedCategory === category.value ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {category.icon || <Star className="w-5 h-5" />}
                </motion.div>
                  <span>{category.label || category.value}</span>
                  {selectedCategory === category.value && (
                    <motion.div
                      className="absolute inset-0 bg-primary-600/10"
                      layoutId="activeCategoryIndicator"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              Độ khó
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-primary-600 dark:focus:border-primary-400 focus:outline-none transition-colors text-gray-900 dark:text-white"
            >
              <option value="all">Tất cả độ khó</option>
              <option value="easy">Dễ</option>
              <option value="moderate">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              Khoảng giá
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Từ (VND)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="number"
                    placeholder="0"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange({ ...priceRange, min: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-primary-600 dark:focus:border-primary-400 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Đến (VND)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="number"
                    placeholder="Không giới hạn"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange({ ...priceRange, max: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-primary-600 dark:focus:border-primary-400 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <motion.div
            className="pt-6 border-t border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center">
              <motion.div
                className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1"
                key={tours.length}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {tours.length}
              </motion.div>
              <div className="text-sm text-gray-600 dark:text-gray-400">tours tìm thấy</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Search Bar - Mobile */}
        <div className="lg:hidden mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm tour..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-primary-600 dark:focus:border-primary-400 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg"
            />
          </div>
        </div>

        {/* Category Pills with Glass Effect */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <motion.button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 transition-all relative overflow-hidden ${
                  selectedCategory === category.value
                    ? "bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 shadow-lg"
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className={selectedCategory === category.value ? "text-white" : "text-gray-700 dark:text-gray-300"}
                  animate={selectedCategory === category.value ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {category.icon || <Star className="w-5 h-5" />}
                </motion.div>
                <span className="font-medium text-sm">
                  {category.label || category.value}
                </span>
                {selectedCategory === category.value && (
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-full"
                    layoutId="activeCategoryPill"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tours Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-96 bg-white rounded-2xl shadow-md animate-pulse"
              >
                <div className="h-64 bg-gray-200 rounded-t-2xl"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Không tìm thấy tour nào
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tours.map((tour, index) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <TourCard tour={tour} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More */}
        {tours.length > 0 && tours.length >= 24 && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.button
              className="px-8 py-4 bg-primary-600 dark:bg-primary-500 text-white rounded-xl font-bold text-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              Xem Thêm Tours
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TourShowcase;
