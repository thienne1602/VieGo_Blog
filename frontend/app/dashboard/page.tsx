"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    if (!user) {
      // No user, redirect to welcome
      router.push("/welcome");
      return;
    }

    // Redirect based on role
    switch (user.role) {
      case "admin":
        router.push("/dashboard/admin");
        break;
      case "moderator":
        router.push("/dashboard/moderator");
        break;
      case "seller":
        router.push("/dashboard/seller");
        break;
      case "tour_guide":
        router.push("/dashboard/tour-guide");
        break;
      case "user":
        router.push("/profile/user");
        break;
      default:
        // Unknown role, go to home
        router.push("/");
        break;
    }
  }, [router, user, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
