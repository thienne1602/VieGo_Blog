"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import AdminDashboard from "../dashboard/admin/page";
import ModeratorDashboard from "../dashboard/moderator/page";
import UserProfile from "../profile/user/page";

export default function ProfileRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Redirect to login if not authenticated
      setIsRedirecting(true);
      router.push("/login");
      return;
    }

    // Auto-redirect based on role
    const roleRoutes = {
      admin: "/dashboard/admin",
      moderator: "/dashboard/moderator",
      user: "/profile/user",
    };

    const targetRoute = roleRoutes[user.role as keyof typeof roleRoutes];

    if (targetRoute && window.location.pathname === "/profile") {
      setIsRedirecting(true);
      router.push(targetRoute);
    }
  }, [user, loading, router]);

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Render appropriate component based on role
  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "moderator":
      return <ModeratorDashboard />;
    case "user":
      return <UserProfile />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Lỗi Quyền Truy Cập
            </h1>
            <p className="text-gray-600 mb-6">
              Role không hợp lệ hoặc chưa được hỗ trợ.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đăng nhập lại
            </button>
          </div>
        </div>
      );
  }
}
