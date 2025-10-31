"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Calendar,
  Edit3,
  PlusSquare,
  CreditCard,
  List,
  Eye,
  Trash2,
} from "lucide-react";
import api from "../../../lib/api";
import Toast from "../../../components/common/Toast";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { CreateTourForm } from "./create";

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState("profile");
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any | null>(null);
  const [confirm, setConfirm] = useState<any>({
    open: false,
    tourId: null,
    title: "",
    message: "",
  });
  const [profile, setProfile] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [stats, setStats] = useState<any>({
    bookings: 0,
    income: null,
    rating: null,
  });

  useEffect(() => {
    // mark as client-side after mount to avoid hydration mismatches
    setIsClient(true);
    const me = api.getCurrentUser();
    if (me) setProfile(me);

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
              income: s.data.income_sum ?? prev.income,
              rating: s.data.average_rating ?? prev.rating,
              total_tours: s.data.total_tours ?? tours.length,
            }));
          }
        } catch (e) {
          // ignore stats errors
        }
        // if we don't have profile yet and user is logged in, try to fetch server profile
        const me = api.getCurrentUser();
        if (me && !profile) {
          try {
            const p = await api.getProfile(me.id);
            if (p.success) setProfile(p.data.user || p.data);
          } catch (e) {}
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

  const tabItems = [
    { id: "profile", icon: User, label: "Hồ Sơ" },
    { id: "tours", icon: List, label: "Tour của tôi" },
    { id: "create", icon: PlusSquare, label: "Tạo Tour" },
    { id: "bookings", icon: CreditCard, label: "Đặt chỗ" },
  ];

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={`https://ui-avatars.com/api/?name=seller&background=random`}
              alt="Seller Avatar"
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
            />
            <div className="absolute -top-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {profile?.fullName || profile?.username || "Người bán Tour"}
            </h1>
            <p className="text-blue-100 text-lg">
              @{profile?.username || "seller"}
            </p>
            <div className="flex items-center space-x-6 mt-2">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Gia nhập:{" "}
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="text-xs text-white/80">Đặt chỗ</div>
                  <div className="font-semibold">{stats.bookings}</div>
                </div>
                <div className="text-sm">
                  <div className="text-xs text-white/80">Thu nhập</div>
                  <div className="font-semibold">
                    {stats.income
                      ? new Intl.NumberFormat("vi-VN").format(stats.income) +
                        " VND"
                      : "—"}
                  </div>
                </div>
              </div>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors">
                <Edit3 className="w-4 h-4 inline mr-2" /> Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tổng Tour</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tours.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <List className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Đặt chỗ</p>
                <p className="text-2xl font-bold text-gray-900">—</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Thu nhập</p>
                <p className="text-2xl font-bold text-gray-900">—</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100">
                <PlusSquare className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Đánh giá</p>
                <p className="text-2xl font-bold text-gray-900">—</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );

  const renderTours = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tour của tôi</h1>
        <a
          href="/dashboard/seller/create"
          className="btn-primary px-4 py-2 rounded"
        >
          Tạo Tour Mới
        </a>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : tours.length === 0 ? (
        <div>Chưa có tour nào. Hãy tạo tour đầu tiên của bạn.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tours.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{t.title}</h3>
                  <div className="text-sm text-neutral-600">
                    {t.starting_location} • {t.duration_days} ngày
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <a
                    className="px-3 py-1 border rounded text-sm"
                    href={`/tours/${t.id}`}
                  >
                    Xem
                  </a>
                  <a
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
                    href={`/dashboard/seller/edit/${t.id}`}
                  >
                    Sửa
                  </a>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                    onClick={() => {
                      setConfirm({
                        open: true,
                        tourId: t.id,
                        title: "Xóa tour",
                        message: `Bạn có chắc muốn xóa tour "${t.title}"?`,
                      });
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
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
                <a href="/login" className="text-blue-600 underline">
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

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Đặt chỗ của tôi</h3>
        <p className="text-gray-600 mt-2">
          Xem và quản lý các booking từ khách hàng.
        </p>
        <div className="mt-4">
          <a
            href="/dashboard/seller/bookings"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Mở Quản lý Đặt chỗ
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🧭 Seller Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Quản lý tour và đặt chỗ của bạn</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === "profile" && renderProfile()}
        {activeTab === "tours" && renderTours()}
        {activeTab === "create" && renderCreate()}
        {activeTab === "bookings" && renderBookings()}
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
          onCancel={() => setConfirm({ open: false })}
          onConfirm={async () => {
            // perform delete
            try {
              const res = await api.delete(`/tours/${confirm.tourId}`);
              if (res.success) {
                setTours((prev) => prev.filter((x) => x.id !== confirm.tourId));
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
            setConfirm({ open: false });
          }}
        />
      </div>
    </div>
  );
}
