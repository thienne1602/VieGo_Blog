"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../lib/AuthContext";
import AdminDashboard from "../dashboard/admin/page";
import ModeratorDashboard from "../dashboard/moderator/page";
import UserProfile from "../profile/user/page";
import SellerDashboard from "../dashboard/seller/page";
import TourGuideDashboard from "../dashboard/tour-guide/page";

export default function ProfileRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation("profile");
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Redirect to welcome if not authenticated
      setIsRedirecting(true);
      router.push("/welcome");
      return;
    }

    // Auto-redirect based on role
    const roleRoutes = {
      admin: "/dashboard/admin",
      moderator: "/dashboard/moderator",
      user: "/profile/user",
      seller: "/dashboard/seller",
      tour_guide: "/dashboard/tour-guide",
    };

    const targetRoute = roleRoutes[user.role as keyof typeof roleRoutes];

    if (targetRoute && window.location.pathname === "/profile") {
      setIsRedirecting(true);
      router.push(targetRoute);
    }
  }, [user, loading, router]);

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 dark:border-gray-700 border-t-primary-600 dark:border-t-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("loading")}</p>
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
    case "seller":
      return <SellerDashboard />;
    case "tour_guide":
      return <TourGuideDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t("accessError.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t("accessError.description")}
            </p>
            {user.role && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                {t("accessError.currentRole")} <strong>{user.role}</strong>
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              {t("accessError.helpText")}
            </p>
            <button
              onClick={() => {
                // Clear auth data before redirecting
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                router.push("/welcome");
              }}
              className="bg-primary-600 dark:bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              {t("accessError.loginAgain")}
            </button>
          </div>
        </div>
      );
  }
}
