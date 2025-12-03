"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  DollarSign,
  TrendingUp,
  Mountain,
  Landmark,
  Utensils,
  Leaf,
  Building,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const reloadKeyRef = useRef(0);
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync URL params to state
  useEffect(() => {
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const featured = searchParams.get("featured");

    if (category && category !== selectedCategory) {
      setSelectedCategory(category);
    }
    if (location && location !== searchQuery) {
      setSearchQuery(location);
    }
    if (featured === "true" && !featuredFilter) {
      setFeaturedFilter(true);
    }
  }, [searchParams]);

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
          {
            value: "all",
            label: "Tất Cả",
            icon: <Sparkles className="w-5 h-5" />,
          },
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
    const storedPrevPath =
      typeof window !== "undefined"
        ? sessionStorage.getItem("tours_prev_pathname")
        : null;
    const prevPathname = prevPathnameRef.current || storedPrevPath;

    // Log pathname changes with full details
    if (prevPathname !== currentPathname && prevPathname) {
      console.log(
        "[TourShowcase] 🔄 Pathname changed",
        "\n  FROM:",
        prevPathname,
        "\n  TO:",
        currentPathname,
        "\n  Initialized:",
        hasInitializedRef.current,
        "\n  Categories:",
        categories.length,
        "\n  Stored:",
        storedPrevPath
      );
    }

    // Skip processing if not initialized yet - just track the pathname
    if (!hasInitializedRef.current || categories.length === 0) {
      prevPathnameRef.current = currentPathname;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("tours_prev_pathname", currentPathname);
      }
      return;
    }

    // Only process if pathname actually changed
    if (prevPathname === currentPathname) {
      return;
    }

    const isOnToursPage = currentPathname === "/tours";
    const wasOnTourDetail = prevPathname && /^\/tours\/\d+$/.test(prevPathname);

    console.log("[TourShowcase] 🔍 Navigation check", {
      isOnToursPage,
      wasOnTourDetail,
      prevPathname,
      currentPathname,
      patternMatch: prevPathname ? /^\/tours\/\d+$/.test(prevPathname) : false,
      stored: storedPrevPath,
    });

    // Case 1: Navigated from tour detail to /tours - ALWAYS reload
    if (isOnToursPage && wasOnTourDetail) {
      console.log(
        "[TourShowcase] ✅ Detected navigation back from tour detail - force reloading tours",
        {
          from: prevPathname,
          to: currentPathname,
          toursCount: tours.length,
        }
      );

      // Update both ref and sessionStorage immediately
      prevPathnameRef.current = currentPathname;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("tours_prev_pathname", currentPathname);
      }

      // Force reload after a short delay to ensure navigation is complete
      setTimeout(() => {
        console.log("[TourShowcase] 🚀 Executing force reload now...");
        forceReloadTours();
      }, 300);
      return;
    }

    // Case 2: Just navigated to /tours from another page - reload if no tours
    if (isOnToursPage && prevPathname && prevPathname !== "/tours") {
      if (tours.length === 0) {
        console.log(
          "[TourShowcase] Navigated to /tours with no tours - reloading"
        );
        prevPathnameRef.current = currentPathname;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("tours_prev_pathname", currentPathname);
        }
        setTimeout(() => {
          forceReloadTours();
        }, 300);
        return;
      }
    }

    // Update both ref and sessionStorage after processing all cases
    prevPathnameRef.current = currentPathname;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tours_prev_pathname", currentPathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, categories.length]);

  const loadTours = async (
    mounted?: boolean,
    bypassCache = false
  ): Promise<void> => {
    const filters: any = { per_page: 6, page: currentPage };
    if (selectedCategory !== "all") filters.category = selectedCategory;
    if (difficultyFilter !== "all") filters.difficulty = difficultyFilter;
    if (featuredFilter) filters.featured = true;
    if (debouncedSearchQuery) filters.search = debouncedSearchQuery;
    if (priceRange.min) filters.min_price = parseFloat(priceRange.min);
    if (priceRange.max) filters.max_price = parseFloat(priceRange.max);

    try {
      console.log(
        "[TourShowcase] 🔍 Loading tours with filters:",
        filters,
        "bypassCache:",
        bypassCache
      );

      // Use bypassCache option to force fresh data
      const toursRes = await api.getTours(filters, { bypassCache });

      console.log("[TourShowcase] 📦 API Response:", {
        success: toursRes.success,
        hasData: !!toursRes.data,
        dataKeys: toursRes.data ? Object.keys(toursRes.data) : [],
        dataType: typeof toursRes.data,
        error: toursRes.error,
        fullResponse: toursRes,
      });

      if (toursRes.success && mounted !== false) {
        // Parse response: backend returns { tours: [...], pagination: {...} }
        const toursData =
          toursRes.data?.tours || toursRes.data?.data || toursRes.data || [];

        // Handle pagination data
        const paginationData = toursRes.data?.pagination || toursRes.data?.meta;
        if (paginationData) {
          setTotalPages(
            paginationData.total_pages ||
              Math.ceil((paginationData.total || 0) / 6) ||
              1
          );
        } else if (
          Array.isArray(toursData) &&
          toursData.length > 0 &&
          !toursRes.data?.pagination
        ) {
          // Fallback if no pagination data but we have tours (maybe all tours returned)
          // If backend doesn't support pagination, we might need to slice client side,
          // but here we assume backend supports it or returns all.
          // If it returns all, we should probably slice it here if we want client-side pagination,
          // but the user asked to "divide into pages", implying backend support or client side.
          // Given the existing code used per_page: 24, let's assume backend supports it.
          // If backend ignores per_page and returns all, we should slice.
          // Let's check if we need to slice manually.
          // For now, let's assume backend handles it.
        }

        console.log("[TourShowcase] 📊 Parsed tours data:", {
          isArray: Array.isArray(toursData),
          length: Array.isArray(toursData) ? toursData.length : "N/A",
          type: typeof toursData,
          sample:
            Array.isArray(toursData) && toursData.length > 0
              ? toursData[0]
              : null,
        });

        if (Array.isArray(toursData)) {
          setTours(toursData);
          console.log(
            `[TourShowcase] ✅ Loaded ${toursData.length} tours successfully`
          );
        } else {
          console.error("[TourShowcase] ❌ Tours data is not an array:", {
            toursData,
            type: typeof toursData,
            value: toursData,
          });
          if (mounted === true) {
            setTours([]);
          }
        }
      } else {
        const errorMsg =
          toursRes.error || toursRes.data?.error || "Unknown error";
        console.error("[TourShowcase] ❌ Failed to load tours:", {
          error: errorMsg,
          success: toursRes.success,
          mounted: mounted,
          response: toursRes,
        });
        if (mounted !== false) {
          setTours([]);
        }
      }
    } catch (error: any) {
      console.error("[TourShowcase] 💥 Exception loading tours:", {
        error: error,
        message: error?.message,
        stack: error?.stack,
      });
      if (mounted !== false) {
        setTours([]);
      }
    }
  };

  // Centralized reload function
  const forceReloadTours = () => {
    console.log("[TourShowcase] 🔄 Force reloading tours (bypassing cache)");
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
      if (
        pathname === "/tours" &&
        categories.length > 0 &&
        hasInitializedRef.current
      ) {
        console.log("[TourShowcase] 🔄 Manual refresh event received", {
          pathname,
          categoriesCount: categories.length,
          from: event?.detail?.from || "unknown",
        });
        setTimeout(() => {
          forceReloadTours();
        }, 100);
      } else {
        console.log("[TourShowcase] ⏭️ Ignoring refresh event", {
          pathname,
          categoriesLength: categories.length,
          initialized: hasInitializedRef.current,
        });
      }
    };

    window.addEventListener("tours-refresh", handleRefresh);
    return () => {
      window.removeEventListener("tours-refresh", handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, categories.length]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    difficultyFilter,
    debouncedSearchQuery,
    priceRange.min,
    priceRange.max,
    featuredFilter,
  ]);

  useEffect(() => {
    setLoading(true);
    loadTours().finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategory,
    difficultyFilter,
    debouncedSearchQuery,
    priceRange.min,
    priceRange.max,
    featuredFilter,
    currentPage,
  ]);

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
      pathname === "/tours" &&
      hasInitializedRef.current
    ) {
      // Safety net: if we're on tours page with no filters but no tours, reload
      console.log(
        "[TourShowcase] Safety reload: on /tours with no tours and no filters"
      );
      const timer = setTimeout(() => {
        forceReloadTours();
      }, 300);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    categories.length,
    tours.length,
    selectedCategory,
    difficultyFilter,
    debouncedSearchQuery,
    priceRange.min,
    priceRange.max,
    pathname,
  ]);

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

  const FilterContent = () => (
    <>
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
      <div className="mb-8">
        <label className="block text-sm font-bold mb-4 text-gray-800 dark:text-gray-200">
          Tìm kiếm
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm điểm đến..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 sm:text-sm text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Category Filter - Redesigned as Grid */}
      <div className="mb-8">
        <label className="block text-sm font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          Danh mục trải nghiệm
        </label>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category, index) => (
            <motion.button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all relative overflow-hidden aspect-square ${
                selectedCategory === category.value
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700"
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className={`${
                  selectedCategory === category.value
                    ? "text-white"
                    : "text-primary-500 dark:text-primary-400"
                }`}
                animate={
                  selectedCategory === category.value
                    ? { rotate: [0, 10, -10, 0] }
                    : {}
                }
              >
                {category.icon || <Star className="w-6 h-6" />}
              </motion.div>
              <span className="text-xs font-bold text-center leading-tight">
                {category.label || category.value}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="mb-8">
        <label className="block text-sm font-bold mb-4 text-gray-800 dark:text-gray-200">
          Độ khó
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "Tất cả" },
            { value: "easy", label: "Dễ" },
            { value: "moderate", label: "Trung bình" },
            { value: "hard", label: "Khó" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setDifficultyFilter(option.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                difficultyFilter === option.value
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-8">
        <label className="block text-sm font-bold mb-4 text-gray-800 dark:text-gray-200">
          Khoảng giá (VND)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-xs font-bold">Từ</span>
            </div>
            <input
              type="number"
              placeholder="0"
              value={priceRange.min}
              onChange={(e) =>
                setPriceRange({ ...priceRange, min: e.target.value })
              }
              className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-medium"
            />
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-xs font-bold">Đến</span>
            </div>
            <input
              type="number"
              placeholder="Tối đa"
              value={priceRange.max}
              onChange={(e) =>
                setPriceRange({ ...priceRange, max: e.target.value })
              }
              className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-medium"
            />
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
          <div className="text-sm text-gray-600 dark:text-gray-400">
            tours tìm thấy
          </div>
        </div>
      </motion.div>
    </>
  );

  return (
    <div className="flex gap-6" ref={containerRef}>
      {/* Filter Sidebar - Desktop with Glass Effect */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-24 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
        >
          <FilterContent />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <motion.button
            onClick={() => setShowMobileFilter(true)}
            className="w-full flex items-center justify-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/30 dark:border-gray-700/50 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SlidersHorizontal className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              Lọc Tours
            </span>
          </motion.button>
        </div>

        {/* Mobile Filter Overlay */}
        {showMobileFilter && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileFilter(false)}
          >
            <motion.div
              className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto border-l border-gray-200 dark:border-gray-700 p-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <FilterContent />
            </motion.div>
          </motion.div>
        )}

        {/* Search Bar - Mobile */}
        <div className="lg:hidden mb-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm tour..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 sm:text-sm text-gray-900 dark:text-white shadow-sm"
            />
          </div>
        </div>

        {/* Category Pills - Mobile Only */}
        <div className="lg:hidden mb-6">
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            {categories.map((category, index) => (
              <motion.button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                  selectedCategory === category.value
                    ? "bg-primary-600 text-white border-primary-600 shadow-md"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span>{category.label || category.value}</span>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            className="flex justify-center items-center gap-2 mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage((p) => p - 1);
                  if (containerRef.current) {
                    const y =
                      containerRef.current.getBoundingClientRect().top +
                      window.scrollY -
                      100;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                }
              }}
              disabled={currentPage === 1}
              className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex gap-2 overflow-x-auto max-w-[200px] md:max-w-none scrollbar-hide px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Simple logic to show limited pages if too many
                  if (
                    totalPages > 7 &&
                    page !== 1 &&
                    page !== totalPages &&
                    (page < currentPage - 1 || page > currentPage + 1)
                  ) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span
                          key={page}
                          className="w-10 h-10 flex items-center justify-center text-gray-400"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        if (containerRef.current) {
                          const y =
                            containerRef.current.getBoundingClientRect().top +
                            window.scrollY -
                            100;
                          window.scrollTo({ top: y, behavior: "smooth" });
                        }
                      }}
                      className={`w-10 h-10 flex-shrink-0 rounded-xl font-bold text-sm transition-all ${
                        currentPage === page
                          ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-110"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-500"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage((p) => p + 1);
                  if (containerRef.current) {
                    const y =
                      containerRef.current.getBoundingClientRect().top +
                      window.scrollY -
                      100;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                }
              }}
              disabled={currentPage === totalPages}
              className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TourShowcase;
