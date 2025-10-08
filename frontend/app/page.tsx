"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import NewsFeed from "@/components/layout/NewsFeed";
import { useAuth } from "@/lib/AuthContext";

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to welcome if not authenticated (after loading is done)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("❌ Not authenticated, redirecting to /welcome");
      router.push("/welcome");
    }
  }, [loading, isAuthenticated, router]);

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading (will redirect via useEffect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-20">
      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-80 xl:mr-80">
          <div className="max-w-2xl mx-auto p-4">
            <NewsFeed />
          </div>
        </div>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}
