"use client";

import { useAuth } from "../lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Shield,
  LogOut,
  Settings,
  Bell,
  Search,
  Home,
  Crown,
  Store,
  Navigation,
} from "lucide-react";
import Link from "next/link";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/welcome");
  };

  const navigationItems = [
    {
      label: "Trang chủ",
      href: "/",
      icon: Home,
      roles: ["admin", "moderator", "user", "seller", "tour_guide"],
    },
    {
      label: "Dashboard Seller",
      href: "/dashboard/seller",
      icon: Store,
      roles: ["seller"],
    },
    {
      label: "Dashboard Admin",
      href: "/dashboard/admin",
      icon: Crown,
      roles: ["admin"],
    },
    {
      label: "Dashboard Moderator",
      href: "/dashboard/moderator",
      icon: Shield,
      roles: ["moderator"],
    },
    {
      label: "Dashboard HDV",
      href: "/dashboard/tour-guide",
      icon: Navigation,
      roles: ["tour_guide"],
    },
    {
      label: "Hồ sơ cá nhân",
      href: "/profile/user",
      icon: User,
      roles: ["user"],
    },
  ];

  const visibleItems = navigationItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile-Specific Header */}
      <header className="bg-primary-600 dark:bg-primary-700 shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Breadcrumb */}
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-white/20 dark:bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/30 dark:group-hover:bg-white/20 transition-all duration-300">
                  <span className="text-2xl font-bold text-white">V</span>
                </div>
                <div className="text-white">
                  <div className="text-xl font-bold">VieGo</div>
                  <div className="text-xs text-blue-100 opacity-80">
                    {user?.role === "admin" && "Admin Panel"}
                    {user?.role === "moderator" && "Moderator Dashboard"}
                    {user?.role === "seller" && "Seller Dashboard"}
                    {user?.role === "tour_guide" && "Tour Guide Dashboard"}
                    {user?.role === "user" && "My Profile"}
                  </div>
                </div>
              </Link>

              {/* Quick Navigation Pills */}
              <nav className="hidden lg:flex space-x-2">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-white/25 dark:bg-white/20 text-white shadow-lg"
                          : "text-blue-100 dark:text-blue-200 hover:text-white hover:bg-white/15 dark:hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Profile Section */}
            <div className="flex items-center space-x-4">
              {/* Search - Enhanced for profile context */}
              {(user?.role === "admin" || user?.role === "moderator") && (
                <div className="relative hidden xl:block">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm trong hệ thống..."
                    className="pl-12 pr-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-full focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/60 dark:placeholder-white/40 w-80"
                  />
                </div>
              )}

              {/* Notifications with Badge */}
              <div className="relative">
                <button className="relative p-3 text-white/80 dark:text-white/70 hover:text-white hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-all duration-300">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 dark:bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg">
                    3
                  </span>
                </button>
              </div>

              {/* Enhanced User Profile Card */}
              <div className="flex items-center space-x-4 bg-white/10 dark:bg-white/5 rounded-2xl px-4 py-2 border border-white/20 dark:border-white/10">
                <img
                  src={
                    user?.role === "admin"
                      ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face"
                      : user?.role === "moderator"
                      ? "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=48&h=48&fit=crop&crop=face"
                      : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face"
                  }
                  alt={user?.full_name || "User"}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30"
                />
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-white">
                    {user?.full_name}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-blue-100 dark:text-blue-200 flex items-center gap-1">
                      {user?.role === "admin" && (
                        <>
                          <Crown className="w-3 h-3" />
                          Admin
                        </>
                      )}
                      {user?.role === "moderator" && (
                        <>
                          <Shield className="w-3 h-3" />
                          Moderator
                        </>
                      )}
                      {user?.role === "user" && (
                        <>
                          <User className="w-3 h-3" />
                          User
                        </>
                      )}
                      {user?.role === "seller" && (
                        <>
                          <Store className="w-3 h-3" />
                          Seller
                        </>
                      )}
                      {user?.role === "tour_guide" && (
                        <>
                          <Navigation className="w-3 h-3" />
                          Tour Guide
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1">
                  <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-white/70 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Stats Bar */}
        <div className="border-t border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between text-sm text-white/80 dark:text-white/70">
              <div className="flex items-center space-x-6">
                <span>
                  Hoạt động gần đây: {new Date().toLocaleDateString("vi-VN")}
                </span>
                <span className="hidden sm:block">•</span>
                <span className="hidden sm:block">Trạng thái: Online</span>
              </div>
              <div className="flex items-center space-x-4">
                {user?.role !== "user" && (
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
                    {user?.role === "admin"
                      ? "Quản trị viên"
                      : user?.role === "moderator"
                      ? "Kiểm duyệt viên"
                      : user?.role === "seller"
                      ? "Người bán (Seller)"
                      : user?.role === "tour_guide"
                      ? "Hướng dẫn viên"
                      : "Nhân viên"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Enhanced Design */}
      <div className="lg:hidden bg-primary-600 dark:bg-primary-700 border-t border-white/10 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-2 py-3 overflow-x-auto scrollbar-hide">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? "bg-white/30 dark:bg-white/20 text-white shadow-lg"
                      : "text-blue-100 dark:text-blue-200 hover:text-white hover:bg-white/20 dark:hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content with Enhanced Styling */}
      <main className="relative z-10">
        <div className="min-h-screen">{children}</div>
      </main>

      {/* Enhanced Floating Role Badge */}
      <div className="fixed bottom-6 left-6 z-30">
        <div
          className={`inline-flex items-center px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl border transition-all duration-300 hover:scale-105 ${
            user?.role === "admin"
              ? "bg-red-500 dark:bg-red-600 text-white border-red-300 dark:border-red-400"
              : user?.role === "moderator"
              ? "bg-yellow-500 dark:bg-yellow-600 text-white border-yellow-300 dark:border-yellow-400"
              : user?.role === "seller"
              ? "bg-green-500 dark:bg-green-600 text-white border-green-300 dark:border-green-400"
              : user?.role === "tour_guide"
              ? "bg-purple-500 dark:bg-purple-600 text-white border-purple-300 dark:border-purple-400"
              : "bg-blue-500 dark:bg-blue-600 text-white border-blue-300 dark:border-blue-400"
          }`}
        >
          <div className="flex items-center space-x-2">
            {user?.role === "admin" && <Crown className="w-4 h-4" />}
            {user?.role === "moderator" && <Shield className="w-4 h-4" />}
            {user?.role === "user" && <User className="w-4 h-4" />}
            {user?.role === "seller" && <Store className="w-4 h-4" />}
            {user?.role === "tour_guide" && <Navigation className="w-4 h-4" />}
            <span className="font-medium capitalize">
              {user?.role === "tour_guide" ? "Tour Guide" : user?.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
