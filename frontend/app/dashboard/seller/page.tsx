"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Calendar,
  Edit3,
  PlusSquare,
  CreditCard,
  List,
  Eye,
  Trash2,
  MapPin,
  Clock,
  Star,
  DollarSign,
  UserCheck,
  Search,
  UserPlus,
  CheckCircle,
  Users,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../../../lib/api";
import Toast from "../../../components/common/Toast";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { CreateTourForm } from "./create";
import { useAuth } from "../../../lib/AuthContext";

export default function SellerDashboard() {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any | null>(null);
  const [confirm, setConfirm] = useState<any>({
    open: false,
    tourId: null,
    title: "",
    message: "",
    action: null,
  });
  const [profile, setProfile] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [stats, setStats] = useState<any>({
    bookings: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    cancelled_bookings: 0,
    income: null,
    total_income: null,
    rating: null,
    total_tours: 0,
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [tourGuides, setTourGuides] = useState<any[]>([]);
  const [tourGuidesLoading, setTourGuidesLoading] = useState(false);
  const [guideSearchQuery, setGuideSearchQuery] = useState("");
  const [allUsersSearchQuery, setAllUsersSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [confirmedBookings, setConfirmedBookings] = useState<any[]>([]);
  const [confirmedBookingsLoading, setConfirmedBookingsLoading] =
    useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    bookingId: number | null;
    booking: any | null;
  }>({ open: false, bookingId: null, booking: null });
  const [detailLoading, setDetailLoading] = useState(false);
  const [revenueStats, setRevenueStats] = useState<any[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<string>("month");
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [sellerEmailForm, setSellerEmailForm] = useState({
    seller_email: "",
    seller_email_password: "",
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_tax_id: "",
    bank_account_number: "",
    bank_name: "",
    bank_account_holder: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  // Load profile data whenever activeTab changes or component mounts
  useEffect(() => {
    // mark as client-side after mount to avoid hydration mismatches
    setIsClient(true);

    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/tours/mine");
        if (res.success && mounted) {
          setTours(res.data.tours || []);
        }
        // fetch server-side seller stats (aggregated)
        try {
          const s = await api.getSellerStats();
          if (s.success && s.data) {
            setStats((prev: any) => ({
              ...prev,
              bookings:
                s.data.bookings_count || s.data.bookings || prev.bookings,
              pending_bookings: s.data.pending_bookings_count || 0,
              confirmed_bookings: s.data.confirmed_bookings_count || 0,
              cancelled_bookings: s.data.cancelled_bookings_count || 0,
              income:
                s.data.confirmed_income_sum ?? s.data.income_sum ?? prev.income,
              total_income: s.data.income_sum ?? prev.income,
              rating: s.data.average_rating ?? prev.rating,
              total_tours: s.data.total_tours ?? tours.length,
            }));
          }
        } catch (e) {
          // ignore stats errors
        }

        // Always load full profile data from API (especially when activeTab is "profile")
        // Use getCurrentProfile to get full profile with company info for sellers
        const me = api.getCurrentUser();
        if (me) {
          try {
            // Use getCurrentProfile instead of getProfile to get full profile with company info
            const p = await api.getCurrentProfile();
            if (p.success && mounted) {
              // Backend returns { user: {...} }, so access via p.data.user
              const profileData = p.data?.user || p.data;
              if (profileData) {
                setProfile(profileData);
                // Update cached user data with full profile
                localStorage.setItem("user", JSON.stringify(profileData));

                // Load seller email configuration
                if (profileData?.seller_email) {
                  setSellerEmailForm({
                    seller_email: profileData.seller_email || "",
                    seller_email_password: "", // Don't show password for security
                  });
                }
                // Load company information - always update from API
                setCompanyForm({
                  company_name: profileData.company_name || "",
                  company_address: profileData.company_address || "",
                  company_phone: profileData.company_phone || "",
                  company_email: profileData.company_email || "",
                  company_tax_id: profileData.company_tax_id || "",
                  bank_account_number: profileData.bank_account_number || "",
                  bank_name: profileData.bank_name || "",
                  bank_account_holder: profileData.bank_account_holder || "",
                });
              }
            }
          } catch (e) {
            console.error("Error loading profile:", e);
            // Fallback to cached user data if API fails
            const cachedUser = localStorage.getItem("user");
            if (cachedUser && mounted) {
              try {
                const cachedData = JSON.parse(cachedUser);
                setProfile(cachedData);
                setCompanyForm({
                  company_name: cachedData.company_name || "",
                  company_address: cachedData.company_address || "",
                  company_phone: cachedData.company_phone || "",
                  company_email: cachedData.company_email || "",
                  company_tax_id: cachedData.company_tax_id || "",
                  bank_account_number: cachedData.bank_account_number || "",
                  bank_name: cachedData.bank_name || "",
                  bank_account_holder: cachedData.bank_account_holder || "",
                });
              } catch (parseError) {
                // ignore
              }
            }
          }
        }
      } catch (err) {
        // ignore
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  // Load bookings when bookings tab is active
  useEffect(() => {
    if (activeTab === "bookings") {
      let mounted = true;
      async function loadBookings() {
        setBookingsLoading(true);
        try {
          const res = await api.getSellerBookings();
          if (res.success && mounted) {
            setBookings(res.data.bookings || []);
          }
        } catch (err) {
          // ignore
        }
        setBookingsLoading(false);
      }
      loadBookings();
      return () => {
        mounted = false;
      };
    }
  }, [activeTab]);

  // Load revenue stats when profile tab is active
  useEffect(() => {
    if (activeTab === "profile") {
      let mounted = true;
      async function loadRevenueStats() {
        setRevenueLoading(true);
        try {
          const res = await api.getRevenueStats(revenuePeriod);
          if (res.success && mounted) {
            setRevenueStats(res.data.stats || []);
          }
        } catch (err) {
          // ignore
        }
        setRevenueLoading(false);
      }
      loadRevenueStats();
      return () => {
        mounted = false;
      };
    }
  }, [activeTab, revenuePeriod]);

  // Load tour guides when assignments tab is active
  useEffect(() => {
    if (activeTab === "assignments") {
      let mounted = true;
      async function loadTourGuides() {
        setTourGuidesLoading(true);
        try {
          // Load tour guides from seller's saved list
          const res = await api.request("/seller/tour-guides");
          if (res.success && mounted) {
            setTourGuides(res.data?.tour_guides || []);
          }
        } catch (err) {
          // ignore
        }
        setTourGuidesLoading(false);
      }
      loadTourGuides();
      return () => {
        mounted = false;
      };
    }
  }, [activeTab]);

  // Load confirmed bookings for assignments tab
  useEffect(() => {
    if (activeTab === "assignments") {
      let mounted = true;
      async function loadConfirmedBookings() {
        setConfirmedBookingsLoading(true);
        try {
          const res = await api.getSellerBookings();
          if (res.success && mounted) {
            const confirmed = (res.data.bookings || []).filter(
              (b: any) => b.status === "confirmed"
            );
            setConfirmedBookings(confirmed);
          }
        } catch (err) {
          // ignore
        }
        setConfirmedBookingsLoading(false);
      }
      loadConfirmedBookings();
      return () => {
        mounted = false;
      };
    }
  }, [activeTab]);

  // Search for tour guides from all users
  const handleSearchTourGuides = async () => {
    if (!allUsersSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Get tour guides with search filter
      const res = await api.request(
        `/users?role=tour_guide&search=${encodeURIComponent(
          allUsersSearchQuery
        )}&per_page=100`
      );
      console.log("Search full response:", JSON.stringify(res, null, 2));

      if (res && res.success && res.data) {
        // API wrapper nests data: res.data.data contains the actual array
        const guides = res.data.data || res.data || [];
        console.log(
          "res.data type:",
          typeof res.data,
          "isArray:",
          Array.isArray(res.data)
        );
        console.log("Extracted guides:", guides);
        console.log(
          "Found",
          Array.isArray(guides) ? guides.length : 0,
          "tour guides"
        );
        setSearchResults(Array.isArray(guides) ? guides : []);
      } else if (res && res.error) {
        console.error("Search API error:", res.error);
        setSearchResults([]);
      } else {
        console.log("No results or unexpected format");
        setSearchResults([]);
      }
    } catch (err: any) {
      console.error("Search error:", err);
      console.error("Error details:", err.response?.data || err.message);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const tabItems = [
    { id: "profile", icon: User, label: "Hồ Sơ" },
    { id: "tours", icon: List, label: "Tour của tôi" },
    { id: "create", icon: PlusSquare, label: "Tạo Tour" },
    { id: "bookings", icon: CreditCard, label: "Đặt chỗ" },
    { id: "assignments", icon: UserCheck, label: "Phân công HDV" },
  ];

  const renderProfile = () => (
    <div className="space-y-6">
      {/* Profile Header - Business Card Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 dark:from-teal-800 dark:via-teal-900 dark:to-emerald-900 rounded-3xl p-8 text-white shadow-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-32 h-32 rounded-3xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md p-1.5 shadow-2xl border-2 border-white/30"
            >
              <div className="w-full h-full rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profile?.fullName || profile?.username || "seller"
                  )}&size=200&background=14b8a6&color=fff&bold=true`}
                  alt="Seller Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=Seller&size=200&background=14b8a6&color=fff&bold=true`;
                  }}
                />
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 w-10 h-10 rounded-full border-2 border-white shadow-xl flex items-center justify-center"
            >
              <User className="w-5 h-5 text-white" />
            </motion.div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {profile?.fullName || profile?.username || "Người bán Tour"}
            </h1>
            <p className="text-teal-100 text-lg mb-4 font-medium">
              @{profile?.username || "seller"}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Gia nhập:{" "}
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("vi-VN")
                    : "—"}
                </span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30"
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {stats.bookings} đặt chỗ
                </span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30"
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {stats.income
                    ? new Intl.NumberFormat("vi-VN").format(stats.income) +
                      " VND"
                    : "—"}
                </span>
              </motion.div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl transition-all font-semibold border border-white/30 shadow-lg"
            >
              <Edit3 className="w-4 h-4 inline mr-2" /> Chỉnh sửa
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards - Business Dashboard Style */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-1">
                  Tổng Tour
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                  {stats.total_tours || tours.length || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  Tour của bạn
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 shadow-lg">
                <List className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-lg border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-1">
                  Tổng đặt chỗ
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
                  {stats.bookings || 0}
                </p>
                {stats.pending_bookings > 0 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-medium">
                    {stats.pending_bookings} chờ xác nhận
                  </p>
                )}
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 shadow-lg">
                <CreditCard className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-lg border-2 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-1">
                  Thu nhập
                </p>
                <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 dark:from-yellow-400 dark:to-yellow-500 bg-clip-text text-transparent">
                  {stats.income != null
                    ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }).format(stats.income)
                    : "—"}
                </p>
                {stats.confirmed_bookings > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                    {stats.confirmed_bookings} đã xác nhận
                  </p>
                )}
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 shadow-lg">
                <DollarSign className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-lg border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-1">
                  Đánh giá TB
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent">
                  {stats.rating != null && stats.rating > 0
                    ? stats.rating.toFixed(1)
                    : "—"}
                </p>
                {stats.rating != null && stats.rating > 0 && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">
                    Đánh giá trung bình
                  </p>
                )}
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 shadow-lg">
                <Star className="w-7 h-7 text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed Revenue Statistics */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-lg border-2 border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-teal-600" />
                Thống kê doanh thu chi tiết
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Xem doanh thu theo ngày, tháng, năm
              </p>
            </div>
            <div className="flex gap-2">
              {["day", "month", "year"].map((period) => (
                <button
                  key={period}
                  onClick={() => setRevenuePeriod(period)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    revenuePeriod === period
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {period === "day"
                    ? "Ngày"
                    : period === "month"
                    ? "Tháng"
                    : "Năm"}
                </button>
              ))}
            </div>
          </div>

          {revenueLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          ) : revenueStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Chưa có dữ liệu doanh thu</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart - Doanh thu tổng */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Biểu đồ cột - Tổng doanh thu
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[...revenueStats].reverse()}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        tickFormatter={(value) => {
                          if (value >= 1000000)
                            return `${(value / 1000000).toFixed(1)}M`;
                          if (value >= 1000)
                            return `${(value / 1000).toFixed(0)}K`;
                          return value.toString();
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) =>
                          new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(value)
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="total_revenue"
                        fill="#14b8a6"
                        name="Tổng doanh thu"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="confirmed_revenue"
                        fill="#10b981"
                        name="Đã xác nhận"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Line Chart - Xu hướng doanh thu */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Biểu đồ đường - Xu hướng doanh thu
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[...revenueStats].reverse()}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        tickFormatter={(value) => {
                          if (value >= 1000000)
                            return `${(value / 1000000).toFixed(1)}M`;
                          if (value >= 1000)
                            return `${(value / 1000).toFixed(0)}K`;
                          return value.toString();
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) =>
                          new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(value)
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total_revenue"
                        stroke="#14b8a6"
                        strokeWidth={3}
                        name="Tổng doanh thu"
                        dot={{ fill: "#14b8a6", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="confirmed_revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Đã xác nhận"
                        dot={{ fill: "#10b981", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Chi tiết theo{" "}
                  {revenuePeriod === "day"
                    ? "ngày"
                    : revenuePeriod === "month"
                    ? "tháng"
                    : "năm"}
                </h4>
                {revenueStats.map((stat: any, index: number) => (
                  <motion.div
                    key={stat.period}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-teal-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                          {stat.label}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>{stat.bookings_count} đặt chỗ</span>
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            Đã xác nhận:{" "}
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                              maximumFractionDigits: 0,
                            }).format(stat.confirmed_revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(stat.total_revenue)}
                        </p>
                        <p className="text-xs text-gray-500">Tổng doanh thu</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Reports */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-lg border-2 border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-teal-600" />
                Xuất báo cáo
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Xuất báo cáo doanh thu và danh sách tour theo định dạng Excel
                hoặc CSV
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Báo cáo doanh thu
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Xuất báo cáo chi tiết về doanh thu và đặt chỗ
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setExportLoading(true);
                    try {
                      const res = await api.exportRevenue(
                        revenuePeriod,
                        null,
                        null,
                        "excel"
                      );
                      if (res.success) {
                        setToast({
                          message: "✅ Đã xuất báo cáo doanh thu thành công!",
                          type: "success",
                        });
                      } else {
                        setToast({
                          message: res.error || "Lỗi khi xuất báo cáo",
                          type: "error",
                        });
                      }
                    } catch (err) {
                      setToast({
                        message: "Lỗi khi xuất báo cáo",
                        type: "error",
                      });
                    }
                    setExportLoading(false);
                  }}
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={async () => {
                    setExportLoading(true);
                    try {
                      const res = await api.exportRevenue(
                        revenuePeriod,
                        null,
                        null,
                        "csv"
                      );
                      if (res.success) {
                        setToast({
                          message: "✅ Đã xuất báo cáo doanh thu thành công!",
                          type: "success",
                        });
                      } else {
                        setToast({
                          message: res.error || "Lỗi khi xuất báo cáo",
                          type: "error",
                        });
                      }
                    } catch (err) {
                      setToast({
                        message: "Lỗi khi xuất báo cáo",
                        type: "error",
                      });
                    }
                    setExportLoading(false);
                  }}
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Danh sách đặt tour
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Xuất danh sách tất cả đặt tour của bạn
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setExportLoading(true);
                    try {
                      const res = await api.exportBookings(null, null, "excel");
                      if (res.success) {
                        setToast({
                          message: "✅ Đã xuất danh sách đặt tour thành công!",
                          type: "success",
                        });
                      } else {
                        setToast({
                          message: res.error || "Lỗi khi xuất danh sách",
                          type: "error",
                        });
                      }
                    } catch (err) {
                      setToast({
                        message: "Lỗi khi xuất danh sách",
                        type: "error",
                      });
                    }
                    setExportLoading(false);
                  }}
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={async () => {
                    setExportLoading(true);
                    try {
                      const res = await api.exportBookings(null, null, "csv");
                      if (res.success) {
                        setToast({
                          message: "✅ Đã xuất danh sách đặt tour thành công!",
                          type: "success",
                        });
                      } else {
                        setToast({
                          message: res.error || "Lỗi khi xuất danh sách",
                          type: "error",
                        });
                      }
                    } catch (err) {
                      setToast({
                        message: "Lỗi khi xuất danh sách",
                        type: "error",
                      });
                    }
                    setExportLoading(false);
                  }}
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Information - Enhanced */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-lg border-2 border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              Thông Tin Công Ty
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              {isEditingCompany
                ? "Cập nhật thông tin công ty để hiển thị trong email xác nhận đặt chỗ và hóa đơn"
                : "Thông tin công ty của bạn sẽ được hiển thị trong email xác nhận đặt chỗ và hóa đơn"}
            </p>
          </div>
          {!isEditingCompany && (
            <button
              onClick={() => setIsEditingCompany(true)}
              className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-all font-semibold text-sm flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Chỉnh sửa thông tin
            </button>
          )}
        </div>

        {!isEditingCompany ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Tên công ty</p>
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.company_name || companyForm.company_name ? (
                    profile?.company_name || companyForm.company_name
                  ) : (
                    <span className="text-gray-400 italic">Chưa cập nhật</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Mã số thuế</p>
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.company_tax_id || companyForm.company_tax_id ? (
                    profile?.company_tax_id || companyForm.company_tax_id
                  ) : (
                    <span className="text-gray-400 italic">Chưa cập nhật</span>
                  )}
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm font-medium text-gray-500">
                  Địa chỉ công ty
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.company_address || companyForm.company_address ? (
                    profile?.company_address || companyForm.company_address
                  ) : (
                    <span className="text-gray-400 italic">Chưa cập nhật</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">
                  Số điện thoại
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.company_phone || companyForm.company_phone ? (
                    profile?.company_phone || companyForm.company_phone
                  ) : (
                    <span className="text-gray-400 italic">Chưa cập nhật</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">
                  Email công ty
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.company_email || companyForm.company_email ? (
                    profile?.company_email || companyForm.company_email
                  ) : (
                    <span className="text-gray-400 italic">Chưa cập nhật</span>
                  )}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin ngân hàng
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Tên ngân hàng
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.bank_name || companyForm.bank_name ? (
                      profile?.bank_name || companyForm.bank_name
                    ) : (
                      <span className="text-gray-400 italic">
                        Chưa cập nhật
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Số tài khoản
                  </p>
                  <p className="text-lg font-semibold text-gray-900 font-mono">
                    {profile?.bank_account_number ||
                    companyForm.bank_account_number ? (
                      profile?.bank_account_number ||
                      companyForm.bank_account_number
                    ) : (
                      <span className="text-gray-400 italic">
                        Chưa cập nhật
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">
                    Chủ tài khoản
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.bank_account_holder ||
                    companyForm.bank_account_holder ? (
                      profile?.bank_account_holder ||
                      companyForm.bank_account_holder
                    ) : (
                      <span className="text-gray-400 italic">
                        Chưa cập nhật
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="company_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tên công ty
                </label>
                <input
                  type="text"
                  id="company_name"
                  value={companyForm.company_name}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      company_name: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: Công ty TNHH Du lịch ABC"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="company_address"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Địa chỉ công ty
                </label>
                <input
                  type="text"
                  id="company_address"
                  value={companyForm.company_address}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      company_address: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: 123 Đường ABC, Quận XYZ, TP.HCM"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="company_phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Số điện thoại công ty
                </label>
                <input
                  type="tel"
                  id="company_phone"
                  value={companyForm.company_phone}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      company_phone: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: 0123456789"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="company_email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email công ty
                </label>
                <input
                  type="email"
                  id="company_email"
                  value={companyForm.company_email}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      company_email: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: contact@company.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="company_tax_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mã số thuế
                </label>
                <input
                  type="text"
                  id="company_tax_id"
                  value={companyForm.company_tax_id}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      company_tax_id: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: 0123456789"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="bank_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tên ngân hàng
                </label>
                <input
                  type="text"
                  id="bank_name"
                  value={companyForm.bank_name}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      bank_name: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: Ngân hàng TMCP ABC"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="bank_account_number"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Số tài khoản ngân hàng
                </label>
                <input
                  type="text"
                  id="bank_account_number"
                  value={companyForm.bank_account_number}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      bank_account_number: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: 1234567890"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="bank_account_holder"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Chủ tài khoản
                </label>
                <input
                  type="text"
                  id="bank_account_holder"
                  value={companyForm.bank_account_holder}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      bank_account_holder: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: NGUYEN VAN A"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={async () => {
                  setSavingCompany(true);
                  try {
                    const res = await api.updateProfile(companyForm);
                    const responseData = res.data || res;
                    if (
                      responseData?.user ||
                      responseData?.message ||
                      res.success
                    ) {
                      // Reload profile data to get updated company info
                      try {
                        const me = api.getCurrentUser();
                        if (me) {
                          const p = await api.getCurrentProfile();
                          if (p.success) {
                            // Backend returns { user: {...} }, so access via p.data.user
                            const profileData = p.data?.user || p.data;
                            if (profileData) {
                              setProfile(profileData);
                              // Update cached user data
                              localStorage.setItem(
                                "user",
                                JSON.stringify(profileData)
                              );
                              // Update company form with fresh data
                              setCompanyForm({
                                company_name: profileData.company_name || "",
                                company_address:
                                  profileData.company_address || "",
                                company_phone: profileData.company_phone || "",
                                company_email: profileData.company_email || "",
                                company_tax_id:
                                  profileData.company_tax_id || "",
                                bank_account_number:
                                  profileData.bank_account_number || "",
                                bank_name: profileData.bank_name || "",
                                bank_account_holder:
                                  profileData.bank_account_holder || "",
                              });
                            }
                          }
                        }
                      } catch (reloadErr) {
                        console.warn("Could not reload profile:", reloadErr);
                      }
                      setToast({
                        message: "✅ Cập nhật thông tin công ty thành công!",
                        type: "success",
                      });
                      setTimeout(() => {
                        setToast(null);
                      }, 5000);
                      // Switch to view mode after saving
                      setIsEditingCompany(false);
                    } else {
                      const errorMsg =
                        responseData?.error ||
                        res.error ||
                        "Lỗi khi cập nhật thông tin công ty";
                      setToast({ message: errorMsg, type: "error" });
                      setTimeout(() => {
                        setToast(null);
                      }, 5000);
                    }
                  } catch (err: any) {
                    const errorMsg =
                      err?.message || "Lỗi khi cập nhật thông tin công ty";
                    setToast({ message: errorMsg, type: "error" });
                    setTimeout(() => {
                      setToast(null);
                    }, 5000);
                  } finally {
                    setSavingCompany(false);
                  }
                }}
                disabled={savingCompany}
                className="px-6 py-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingCompany ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                onClick={() => {
                  // Reset form to profile data when canceling
                  if (profile) {
                    setCompanyForm({
                      company_name: profile.company_name || "",
                      company_address: profile.company_address || "",
                      company_phone: profile.company_phone || "",
                      company_email: profile.company_email || "",
                      company_tax_id: profile.company_tax_id || "",
                      bank_account_number: profile.bank_account_number || "",
                      bank_name: profile.bank_name || "",
                      bank_account_holder: profile.bank_account_holder || "",
                    });
                  }
                  setIsEditingCompany(false);
                }}
                disabled={savingCompany}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Seller Email Configuration - Enhanced */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-lg border-2 border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              Cấu hình Email Seller
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Cấu hình email và mật khẩu để gửi email xác nhận đặt chỗ cho khách
              hàng
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="seller_email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Seller *
            </label>
            <input
              type="email"
              id="seller_email"
              value={sellerEmailForm.seller_email}
              onChange={(e) =>
                setSellerEmailForm({
                  ...sellerEmailForm,
                  seller_email: e.target.value,
                })
              }
              placeholder="seller@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email này sẽ được sử dụng để gửi email xác nhận đơn hàng cho khách
              hàng
            </p>
          </div>

          <div>
            <label
              htmlFor="seller_email_password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mật khẩu Email *
            </label>
            <input
              type="password"
              id="seller_email_password"
              value={sellerEmailForm.seller_email_password}
              onChange={(e) =>
                setSellerEmailForm({
                  ...sellerEmailForm,
                  seller_email_password: e.target.value,
                })
              }
              placeholder="Nhập mật khẩu email của bạn"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              {sellerEmailForm.seller_email_password ? (
                <>Mật khẩu sẽ được cập nhật khi bạn lưu</>
              ) : (
                <>Để trống nếu không muốn thay đổi mật khẩu hiện tại</>
              )}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> Với Gmail, bạn cần sử dụng{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Mật khẩu ứng dụng
              </a>{" "}
              thay vì mật khẩu tài khoản chính để bảo mật hơn.
            </p>
          </div>

          <button
            onClick={async () => {
              if (!sellerEmailForm.seller_email) {
                setToast({ message: "Vui lòng nhập email", type: "error" });
                return;
              }

              // ✅ VALIDATION: Kiểm tra nếu có email nhưng không có password
              // - Nếu là email MỚI (thay đổi email) → YÊU CẦU password
              // - Nếu giữ nguyên email cũ → Cho phép không nhập password (giữ password cũ)
              const isNewEmail =
                !profile?.seller_email ||
                profile.seller_email !== sellerEmailForm.seller_email;

              // Nếu là email mới hoặc thay đổi email và không có password → yêu cầu nhập password
              if (isNewEmail && !sellerEmailForm.seller_email_password) {
                setToast({
                  message:
                    "⚠️ Vui lòng nhập mật khẩu email!\n\nKhi cấu hình email MỚI, bạn cần nhập mật khẩu (hoặc App Password nếu dùng Gmail) để hệ thống có thể gửi email tự động cho khách hàng.\n\nLưu ý: Nếu bạn đang cập nhật email đã có sẵn, bạn có thể để trống mật khẩu để giữ nguyên mật khẩu cũ.",
                  type: "error",
                });
                return;
              }

              setSavingEmail(true);
              try {
                const updateData: any = {
                  seller_email: sellerEmailForm.seller_email,
                };

                // Only include password if it's provided
                if (sellerEmailForm.seller_email_password) {
                  updateData.seller_email_password =
                    sellerEmailForm.seller_email_password;
                }

                console.log("🔵 [Email Config] Sending update:", {
                  email: updateData.seller_email,
                  hasPassword: !!updateData.seller_email_password,
                });

                const res = await api.updateProfile(updateData);
                console.log("🔵 [Email Config] Response:", res);
                console.log("🔵 [Email Config] Response data:", res.data);

                // API client wraps response: { success: true, data: { message, user } }
                // Backend returns: { message, user } or { error }
                const responseData = res.data || res;
                if (
                  responseData?.user ||
                  responseData?.message ||
                  res.success
                ) {
                  // Kiểm tra xem đã có đủ email và password chưa
                  // Note: Backend không trả về password trong response (bảo mật)
                  // Nên nếu user nhập password trong form, coi như đã cấu hình đủ
                  // Nếu không nhập password nhưng email không đổi → có thể password đã được lưu trước đó
                  const configuredUser = responseData?.user || profile;
                  const passwordProvided =
                    !!sellerEmailForm.seller_email_password;
                  const emailNotChanged =
                    profile?.seller_email === sellerEmailForm.seller_email;

                  // Nếu có password trong form HOẶC email không đổi (giữ nguyên password cũ) → coi như đủ
                  const isFullyConfigured =
                    configuredUser?.seller_email &&
                    (passwordProvided || emailNotChanged);

                  let successMessage = `✅ Cấu hình email seller thành công!\n\nEmail: ${sellerEmailForm.seller_email}`;

                  if (isFullyConfigured) {
                    successMessage += `\n\n📧 Email này sẽ được sử dụng để tự động gửi email xác nhận đặt chỗ cho khách hàng khi bạn xác nhận đơn đặt tour.`;
                  } else {
                    successMessage += `\n\n⚠️ Lưu ý: Bạn chưa cấu hình mật khẩu email. Hệ thống sẽ không thể gửi email tự động cho khách hàng. Vui lòng cập nhật mật khẩu để sử dụng tính năng này.`;
                  }

                  console.log(
                    "🟢 [Email Config] Showing success toast:",
                    successMessage
                  );
                  setToast({
                    message: successMessage,
                    type: isFullyConfigured ? "success" : "warning",
                  });
                  setProfile(responseData?.user || profile);
                  // Clear password field after saving
                  setSellerEmailForm({
                    ...sellerEmailForm,
                    seller_email_password: "",
                  });

                  // Auto-close toast after 5 seconds
                  setTimeout(() => {
                    setToast(null);
                  }, 5000);
                } else {
                  const errorMsg =
                    responseData?.error ||
                    res.error ||
                    "Lỗi khi cập nhật email";
                  console.log("🔴 [Email Config] Error:", errorMsg);
                  setToast({ message: errorMsg, type: "error" });
                  setTimeout(() => {
                    setToast(null);
                  }, 5000);
                }
              } catch (err: any) {
                const errorMsg = err?.message || "Lỗi khi cập nhật email";
                console.error("🔴 [Email Config] Exception:", err);
                setToast({ message: errorMsg, type: "error" });
                setTimeout(() => {
                  setToast(null);
                }, 5000);
              } finally {
                setSavingEmail(false);
              }
            }}
            disabled={savingEmail || !sellerEmailForm.seller_email}
            className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingEmail ? "Đang lưu..." : "Lưu cấu hình Email"}
          </button>
        </div>
      </div>
    </div>
  );

  const handleAssignAllTours = async () => {
    if (!confirm("Bạn có chắc muốn gán tất cả tours vào tài khoản của bạn?")) {
      return;
    }

    try {
      const res = await api.assignAllTours();
      if (res.success) {
        setToast({
          message: res.message || "Đã gán tours thành công!",
          type: "success",
        });
        // Reload tours
        const toursRes = await api.get("/tours/mine");
        if (toursRes.success) {
          setTours(toursRes.data.tours || []);
        }
      } else {
        setToast({ message: res.error || "Lỗi khi gán tours", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Lỗi khi gán tours", type: "error" });
    }
  };

  const renderTours = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tour của tôi</h1>
          <p className="text-gray-600 mt-1">
            Quản lý và theo dõi các tour của bạn
          </p>
        </div>
        <div className="flex gap-3">
          {tours.length === 0 && (
            <button
              onClick={handleAssignAllTours}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold text-sm shadow-md"
            >
              Gán Tất Cả Tours
            </button>
          )}
          <a
            href="/dashboard/seller/create"
            className="px-5 py-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-xl hover:bg-primary-700 dark:hover:bg-primary-600 transition-all font-semibold text-sm shadow-lg flex items-center gap-2"
          >
            <PlusSquare className="w-4 h-4" />
            Tạo Tour Mới
          </a>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-md p-6 animate-pulse"
            >
              <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : tours.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <List className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Chưa có tour nào
          </h3>
          <p className="text-gray-600 mb-6">
            Bắt đầu bằng cách tạo tour mới hoặc gán tours hiện có vào tài khoản
            của bạn
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handleAssignAllTours}
              className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold shadow-lg"
            >
              Gán Tất Cả Tours Vào Tài Khoản
            </button>
            <a
              href="/dashboard/seller/create"
              className="px-6 py-3 bg-white text-teal-600 border-2 border-teal-600 rounded-xl hover:bg-teal-50 transition-colors font-semibold"
            >
              Tạo Tour Mới
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((t) => {
            const image =
              t.featured_image ||
              (t.gallery_images && t.gallery_images[0]) ||
              null;
            const price = t.price_per_person || t.price || 0;
            const formatPrice = (p: number) => {
              return new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: t.currency || "VND",
                maximumFractionDigits: 0,
              }).format(p);
            };

            return (
              <motion.div
                key={t.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
              >
                {image ? (
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={image}
                      alt={t.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      quality={80}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900">
                        {t.category || "Tour"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2 text-gray-900 line-clamp-2 min-h-[56px]">
                    {t.title}
                  </h3>

                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    {t.starting_location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">
                          {t.starting_location}
                        </span>
                      </div>
                    )}
                    {t.duration_days && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{t.duration_days} ngày</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <div className="text-2xl font-bold text-teal-600">
                        {formatPrice(price)}
                      </div>
                      <div className="text-xs text-gray-500">/người</div>
                    </div>
                    {t.rating && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">
                          {t.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <a
                      className="flex-1 px-4 py-2.5 border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold text-sm text-center"
                      href={`/tours/${t.id}`}
                    >
                      Xem
                    </a>
                    <a
                      className="flex-1 px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold text-sm text-center"
                      href={`/dashboard/seller/edit/${t.id}`}
                    >
                      <Edit3 className="w-4 h-4 inline mr-1" />
                      Sửa
                    </a>
                    <button
                      className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm"
                      onClick={() => {
                        setConfirm({
                          open: true,
                          tourId: t.id,
                          title: "Xóa tour",
                          message: `Bạn có chắc muốn xóa tour "${t.title}"? Hành động này không thể hoàn tác.`,
                        });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCreate = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Tạo Tour Mới</h3>
        <p className="text-gray-600 mt-2">
          Tạo và quản lý tour trực tiếp trong dashboard.
        </p>
        <div className="mt-4">
          {!api.getToken() ? (
            <div className="p-4 bg-yellow-50 rounded">
              <p className="text-sm text-yellow-800">
                Bạn chưa đăng nhập. Vui lòng{" "}
                <a href="/welcome" className="text-blue-600 underline">
                  đăng nhập
                </a>{" "}
                để tạo tour.
              </p>
            </div>
          ) : (
            <CreateTourForm
              onSuccess={(data: any, err?: any) => {
                if (err) {
                  setToast({
                    message: err || "Lỗi khi tạo tour",
                    type: "error",
                  });
                  return;
                }
                setToast({ message: "Tạo tour thành công", type: "success" });
                // switch to tours tab which triggers reload via useEffect
                setActiveTab("tours");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  const updateBookingStatus = async (bookingId: number, status: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setConfirm({
      open: true,
      tourId: bookingId,
      title: status === "confirmed" ? "Xác nhận đặt chỗ" : "Hủy đặt chỗ",
      message:
        status === "confirmed"
          ? `Bạn có chắc muốn xác nhận đặt chỗ này? Email xác nhận sẽ được gửi đến khách hàng.`
          : `Bạn có chắc muốn hủy đặt chỗ này? Hành động này không thể hoàn tác.`,
      action: async () => {
        try {
          const res = await api.updateBooking(bookingId, { status });
          if (res.success || res.data) {
            const updatedBooking = res.data?.booking;
            if (updatedBooking) {
              setBookings((prevBookings) =>
                prevBookings.map((b) =>
                  b.id === bookingId ? { ...b, ...updatedBooking, status } : b
                )
              );
            }
            let successMessage = `✅ Đã ${
              status === "confirmed" ? "xác nhận" : "hủy"
            } đặt chỗ thành công!`;
            if (status === "confirmed" && res.data?.email_message) {
              successMessage += `\n\n${res.data.email_message}`;
            }
            setToast({ message: successMessage, type: "success" });
            setTimeout(() => setToast(null), 6000);
          } else {
            setToast({
              message: res.error || "Lỗi cập nhật đặt chỗ",
              type: "error",
            });
            setTimeout(() => setToast(null), 5000);
          }
        } catch (err) {
          setToast({ message: "Lỗi khi cập nhật đặt chỗ", type: "error" });
          setTimeout(() => setToast(null), 5000);
        }
        setConfirm({
          open: false,
          tourId: null,
          title: "",
          message: "",
          action: null,
        });
      },
    });
  };

  const viewBookingDetail = async (bookingId: number) => {
    setDetailLoading(true);
    try {
      const res = await api.getBooking(bookingId);
      if (res.success && res.data.booking) {
        setDetailModal({ open: true, bookingId, booking: res.data.booking });
      } else {
        setToast({
          message: res.error || "Lỗi khi tải chi tiết đặt chỗ",
          type: "error",
        });
      }
    } catch (err) {
      setToast({ message: "Lỗi khi tải chi tiết đặt chỗ", type: "error" });
    }
    setDetailLoading(false);
  };

  const formatPrice = (price: number, currency: string = "VND") => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      confirmed: "bg-green-100 text-green-800 border-green-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
    };

    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle2 className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };

    const labels = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      cancelled: "Đã hủy",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
          styles[status as keyof typeof styles]
        }`}
      >
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === "all") return true;
    return b.status === filterStatus;
  });

  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const renderBookings = () => {
    return (
      <div className="space-y-6">
        <div className="bg-primary-600 dark:bg-primary-700 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Quản lý đặt chỗ</h2>
              <p className="text-blue-100">
                Xem và quản lý tất cả đặt chỗ từ khách hàng
              </p>
            </div>
            <CreditCard className="w-12 h-12 text-white opacity-80" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-blue-100 mb-1">Tổng đặt chỗ</p>
              <p className="text-3xl font-bold">{bookingStats.total}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-blue-100 mb-1">Chờ xác nhận</p>
              <p className="text-3xl font-bold">{bookingStats.pending}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-blue-100 mb-1">Đã xác nhận</p>
              <p className="text-3xl font-bold">{bookingStats.confirmed}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-blue-100 mb-1">Đã hủy</p>
              <p className="text-3xl font-bold">{bookingStats.cancelled}</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {["all", "pending", "confirmed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                filterStatus === status
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              {status === "all"
                ? "Tất cả"
                : status === "pending"
                ? "Chờ xác nhận"
                : status === "confirmed"
                ? "Đã xác nhận"
                : "Đã hủy"}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {bookingsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-100 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Chưa có đặt chỗ nào
            </h3>
            <p className="text-gray-600">
              {filterStatus === "all"
                ? "Chưa có khách hàng nào đặt chỗ tour của bạn."
                : `Không có đặt chỗ nào ở trạng thái "${filterStatus}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left: Booking Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {booking.tour?.title || "—"}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>
                              <strong>Khách hàng:</strong>{" "}
                              {booking.user?.full_name ||
                                booking.user?.username ||
                                booking.full_name ||
                                "—"}
                            </span>
                          </div>
                          {booking.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{booking.email}</span>
                            </div>
                          )}
                          {booking.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{booking.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              <strong>Ngày khởi hành:</strong>{" "}
                              {formatDate(booking.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>
                              <strong>Số người:</strong> {booking.participants}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              <strong>Tổng tiền:</strong>{" "}
                              {formatPrice(
                                booking.total_price,
                                booking.currency
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      {booking.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              updateBookingStatus(booking.id, "confirmed")
                            }
                            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Xác nhận
                          </button>
                          <button
                            onClick={() =>
                              updateBookingStatus(booking.id, "cancelled")
                            }
                            className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Hủy đặt chỗ
                          </button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <>
                          <div className="px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-center font-semibold">
                            ✓ Đã xác nhận
                          </div>
                          {!booking.assignment && (
                            <Link
                              href={`/dashboard/seller/bookings/${booking.id}`}
                              className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <UserCheck className="w-4 h-4" />
                              Phân công HDV
                            </Link>
                          )}
                          {booking.assignment && (
                            <div className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-center font-semibold text-sm">
                              ✓ Đã phân công HDV
                            </div>
                          )}
                        </>
                      )}
                      {booking.status === "cancelled" && (
                        <div className="px-4 py-2.5 bg-red-50 text-red-700 rounded-lg text-center font-semibold">
                          ✗ Đã hủy
                        </div>
                      )}
                      <button
                        onClick={() => viewBookingDetail(booking.id)}
                        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                      {booking.tour && (
                        <Link
                          href={`/tours/${booking.tour.id}`}
                          className="w-full px-4 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <MapPin className="w-4 h-4" />
                          Xem Tour
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Booking Detail Modal */}
        {detailModal.open && detailModal.booking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chi tiết đặt chỗ
                </h2>
                <button
                  onClick={() =>
                    setDetailModal({
                      open: false,
                      bookingId: null,
                      booking: null,
                    })
                  }
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {detailLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-teal-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải chi tiết...</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {detailModal.booking.tour?.title || "—"}
                      </h3>
                      {getStatusBadge(detailModal.booking.status)}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Mã đặt chỗ</div>
                      <div className="text-lg font-bold text-gray-900">
                        #{detailModal.booking.id}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <h4 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                      Thông tin khách hàng
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Họ tên</div>
                          <div className="font-semibold text-gray-900">
                            {detailModal.booking.user?.full_name ||
                              detailModal.booking.full_name ||
                              "—"}
                          </div>
                        </div>
                      </div>
                      {detailModal.booking.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-600">Email</div>
                            <div className="font-semibold text-gray-900">
                              {detailModal.booking.email}
                            </div>
                          </div>
                        </div>
                      )}
                      {detailModal.booking.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-600">
                              Số điện thoại
                            </div>
                            <div className="font-semibold text-gray-900">
                              {detailModal.booking.phone}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <h4 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                      Thông tin đặt chỗ
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">
                            Ngày khởi hành
                          </div>
                          <div className="font-semibold text-gray-900">
                            {formatDate(detailModal.booking.date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">
                            Số người tham gia
                          </div>
                          <div className="font-semibold text-gray-900">
                            {detailModal.booking.participants} người
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-6 space-y-3">
                    <h4 className="text-lg font-bold text-gray-900 border-b border-blue-200 pb-2">
                      Chi tiết thanh toán
                    </h4>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-blue-200">
                      <span className="text-lg font-bold text-gray-900">
                        Tổng tiền:
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(
                          detailModal.booking.total_price,
                          detailModal.booking.currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  const [assignmentSubTab, setAssignmentSubTab] = useState<
    "guides" | "assigned-tours"
  >("guides");

  const renderAssignments = () => {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-800 dark:via-indigo-800 dark:to-blue-800 rounded-3xl p-8 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Phân Công Hướng Dẫn Viên
              </h2>
              <p className="text-blue-100 text-lg">
                Quản lý việc phân công hướng dẫn viên cho các booking
              </p>
            </div>
            <UserCheck className="w-12 h-12 text-white opacity-80" />
          </div>

          {/* Sub tabs */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setAssignmentSubTab("guides")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                assignmentSubTab === "guides"
                  ? "bg-white text-purple-600 shadow-lg"
                  : "bg-purple-500/30 text-white hover:bg-purple-500/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                <span>Danh Sách HDV</span>
              </div>
            </button>
            <button
              onClick={() => setAssignmentSubTab("assigned-tours")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                assignmentSubTab === "assigned-tours"
                  ? "bg-white text-purple-600 shadow-lg"
                  : "bg-purple-500/30 text-white hover:bg-purple-500/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Tour Đã Phân Công</span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Search for new tour guides */}
        {assignmentSubTab === "guides" && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-800 p-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tìm Kiếm Hướng Dẫn Viên Mới
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Tìm kiếm người dùng có vai trò "Hướng dẫn viên" để xem thông tin
                và phân công
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={allUsersSearchQuery}
                    onChange={(e) => setAllUsersSearchQuery(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSearchTourGuides()
                    }
                    placeholder="Nhập tên, email hoặc username để tìm hướng dẫn viên..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  onClick={handleSearchTourGuides}
                  disabled={searchLoading || !allUsersSearchQuery.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {searchLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang tìm...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Tìm kiếm
                    </>
                  )}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Kết quả tìm kiếm ({searchResults.length} hướng dẫn viên)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                            {user.full_name?.charAt(0).toUpperCase() ||
                              user.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1 truncate">
                              {user.full_name || user.username}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              @{user.username}
                            </p>
                            {user.email && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                {user.email}
                              </p>
                            )}
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                Hướng Dẫn Viên
                              </span>
                              <div className="flex items-center gap-2">
                                {authUser?.role === "seller" && (
                                  <button
                                    onClick={async () => {
                                      // Check if guide already exists in tourGuides list
                                      const exists = tourGuides.some(
                                        (g) => g.id === user.id
                                      );
                                      if (exists) {
                                        setToast({
                                          message:
                                            "Hướng dẫn viên này đã có trong danh sách",
                                          type: "warning",
                                        });
                                        setTimeout(() => setToast(null), 3000);
                                        return;
                                      }

                                      try {
                                        // Call API to save to database
                                        const res = await api.request(
                                          "/seller/tour-guides",
                                          {
                                            method: "POST",
                                            body: JSON.stringify({
                                              tour_guide_id: user.id,
                                            }),
                                          }
                                        );

                                        if (res.success) {
                                          // Add to tourGuides list
                                          setTourGuides((prev) => [
                                            ...prev,
                                            res.data?.tour_guide || user,
                                          ]);
                                          setToast({
                                            message: `Đã thêm "${
                                              user.full_name || user.username
                                            }" vào danh sách hướng dẫn viên`,
                                            type: "success",
                                          });
                                          setTimeout(
                                            () => setToast(null),
                                            3000
                                          );
                                        } else {
                                          setToast({
                                            message:
                                              res.error ||
                                              "Có lỗi xảy ra khi thêm hướng dẫn viên",
                                            type: "error",
                                          });
                                          setTimeout(
                                            () => setToast(null),
                                            3000
                                          );
                                        }
                                      } catch (err: any) {
                                        console.error(
                                          "Error adding tour guide:",
                                          err
                                        );
                                        setToast({
                                          message:
                                            err.response?.data?.error ||
                                            "Có lỗi xảy ra khi thêm hướng dẫn viên",
                                          type: "error",
                                        });
                                        setTimeout(() => setToast(null), 3000);
                                      }
                                    }}
                                    className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    Thêm HDV
                                  </button>
                                )}
                                <Link
                                  href={`/profile/${user.username}`}
                                  className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                                >
                                  <Eye className="w-3 h-3" />
                                  Xem hồ sơ
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allUsersSearchQuery &&
                searchResults.length === 0 &&
                !searchLoading && (
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800 text-center py-6">
                    <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Không tìm thấy hướng dẫn viên nào với từ khóa "
                      {allUsersSearchQuery}"
                    </p>
                  </div>
                )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Danh Sách Hướng Dẫn Viên Hiện Có
              </h3>

              <div className="mb-6">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                  <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Lưu ý về Hướng Dẫn Viên
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      • Tìm kiếm và xem thông tin các hướng dẫn viên trong hệ
                      thống
                      <br />
                      {authUser?.role === "seller" ? (
                        <>
                          • Bạn có quyền người bán, có thể thêm hướng dẫn viên
                          mới
                          <br />
                        </>
                      ) : (
                        <>
                          • Để thêm hướng dẫn viên mới, liên hệ quản trị viên để
                          tạo tài khoản
                          <br />
                        </>
                      )}
                      • Click "Xem hồ sơ" để xem chi tiết thông tin của từng
                      hướng dẫn viên
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={guideSearchQuery}
                      onChange={(e) => setGuideSearchQuery(e.target.value)}
                      placeholder="Lọc danh sách theo tên, username, email..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {tourGuidesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : tourGuides.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg">
                    Chưa có hướng dẫn viên nào trong hệ thống
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tourGuides
                    .filter((guide) => {
                      if (!guideSearchQuery.trim()) return true;
                      const q = guideSearchQuery.toLowerCase();
                      return (
                        guide.full_name?.toLowerCase().includes(q) ||
                        guide.username?.toLowerCase().includes(q) ||
                        guide.email?.toLowerCase().includes(q)
                      );
                    })
                    .map((guide) => (
                      <div
                        key={guide.id}
                        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                            {guide.full_name?.charAt(0).toUpperCase() ||
                              guide.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1 truncate">
                              {guide.full_name || guide.username}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              @{guide.username}
                            </p>
                            {guide.email && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                {guide.email}
                              </p>
                            )}
                            <div className="mt-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                Hướng Dẫn Viên
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Booking Đã Xác Nhận - Cần Phân Công HDV
                </h3>
              </div>

              {confirmedBookingsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : confirmedBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg mb-2">
                    Chưa có booking đã xác nhận nào
                  </p>
                  <p className="text-sm">
                    Các booking đã xác nhận sẽ hiển thị tại đây để phân công
                    hướng dẫn viên
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {confirmedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                              {booking.tour?.title || "Tour"}
                            </h4>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Đã xác nhận
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {booking.booking_date
                                  ? new Date(
                                      booking.booking_date
                                    ).toLocaleDateString("vi-VN")
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>
                                {(booking.adults || 0) +
                                  (booking.children || 0)}{" "}
                                người
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">
                                {booking.tour?.location || "Chưa có thông tin"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/seller/bookings/${booking.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors whitespace-nowrap"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Phân công</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-gray-600 dark:text-gray-400 text-center py-4 mt-6 text-sm border-t border-gray-200 dark:border-gray-700">
                Hoặc vào tab{" "}
                <button
                  onClick={() => setActiveTab("bookings")}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                >
                  Đặt chỗ
                </button>{" "}
                để xem tất cả booking và phân công
              </p>
            </motion.div>
          </>
        )}

        {/* Assigned Tours Tab */}
        {assignmentSubTab === "assigned-tours" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Tour Đã Phân Công Hướng Dẫn Viên
              </h3>
            </div>

            {bookingsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            ) : bookings.filter((b) => b.status === "confirmed" && b.assignment)
                .length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg mb-2">
                  Chưa có tour nào được phân công HDV
                </p>
                <p className="text-sm">
                  Các tour đã xác nhận và phân công HDV sẽ hiển thị tại đây
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings
                  .filter((b) => b.status === "confirmed" && b.assignment)
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                              {booking.tour?.title || "Tour"}
                            </h4>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Đã xác nhận
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Đã phân công
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Ngày khởi hành:{" "}
                                  {booking.date
                                    ? new Date(booking.date).toLocaleDateString(
                                        "vi-VN"
                                      )
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Users className="w-4 h-4" />
                                <span>
                                  Số người:{" "}
                                  {(booking.adults || 0) +
                                    (booking.children || 0)}{" "}
                                  người
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <User className="w-4 h-4" />
                                <span>
                                  Khách hàng:{" "}
                                  {booking.user?.full_name ||
                                    booking.full_name ||
                                    "N/A"}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2 mb-2">
                                  <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                      Hướng Dẫn Viên
                                    </p>
                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                      {booking.assignment?.tour_guide
                                        ?.full_name ||
                                        booking.assignment?.tour_guide
                                          ?.username ||
                                        "Đang cập nhật"}
                                    </p>
                                    {booking.assignment?.tour_guide?.email && (
                                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate">
                                        {booking.assignment.tour_guide.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {booking.assignment?.assignment_date && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                    Phân công lúc:{" "}
                                    {new Date(
                                      booking.assignment.assignment_date
                                    ).toLocaleString("vi-VN")}
                                  </p>
                                )}
                                {booking.assignment?.status && (
                                  <div className="mt-2">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                        booking.assignment.status === "accepted"
                                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                          : booking.assignment.status ===
                                            "in_progress"
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                          : booking.assignment.status ===
                                            "completed"
                                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                      }`}
                                    >
                                      {booking.assignment.status ===
                                        "accepted" && "Đã chấp nhận"}
                                      {booking.assignment.status ===
                                        "in_progress" && "Đang thực hiện"}
                                      {booking.assignment.status ===
                                        "completed" && "Hoàn thành"}
                                      {booking.assignment.status ===
                                        "assigned" && "Chờ xác nhận"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[150px]">
                          <Link
                            href={`/dashboard/seller/bookings/${booking.id}`}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
                          >
                            <Eye className="w-4 h-4" />
                            Xem chi tiết
                          </Link>
                          {booking.assignment?.tour_guide && (
                            <Link
                              href={`/profile/${booking.assignment.tour_guide.username}`}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold"
                            >
                              <User className="w-4 h-4" />
                              Hồ sơ HDV
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header - Business Style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-emerald-600 dark:from-teal-700 dark:to-emerald-700 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Seller Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
                Quản lý tour và đặt chỗ của bạn
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs - Professional Design */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2">
            <nav className="flex space-x-2">
              {tabItems.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center space-x-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all relative ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeSellerTab"
                      className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 rounded-xl -z-10"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === "profile" && renderProfile()}
        {activeTab === "tours" && renderTours()}
        {activeTab === "create" && renderCreate()}
        {activeTab === "bookings" && renderBookings()}
        {activeTab === "assignments" && renderAssignments()}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <ConfirmModal
          open={confirm.open}
          title={confirm.title}
          message={confirm.message}
          onCancel={() =>
            setConfirm({
              open: false,
              tourId: null,
              title: "",
              message: "",
              action: null,
            })
          }
          onConfirm={async () => {
            if (confirm.action) {
              await confirm.action();
            } else {
              // Default delete tour action
              try {
                const res = await api.delete(`/tours/${confirm.tourId}`);
                if (res.success) {
                  setTours((prev) =>
                    prev.filter((x) => x.id !== confirm.tourId)
                  );
                  setToast({ message: "Đã xóa tour", type: "success" });
                } else {
                  setToast({
                    message: res.error || "Lỗi khi xóa tour",
                    type: "error",
                  });
                }
              } catch (err) {
                setToast({ message: "Lỗi khi xóa tour", type: "error" });
              }
              setConfirm({
                open: false,
                tourId: null,
                title: "",
                message: "",
                action: null,
              });
            }
          }}
        />
      </div>
    </div>
  );
}
