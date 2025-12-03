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
  // NOTE: routing for unauthenticated users is handled by AuthGuard.
  // Do not perform client-side redirect here to avoid conflicting navigation.

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="relative min-h-screen pt-20 flex items-center justify-center transition-colors duration-300">
        {/* Background Image */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0"
          style={{
            backgroundImage: "url(/images/backround.jpg)",
          }}
        >
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50"></div>
        </div>

        {/* Loading Content with GIF */}
        <div className="relative z-10 text-center">
          <img
            src="/assets/stickers/đang tải 2.gif"
            alt="Loading"
            className="w-32 h-32 mx-auto mb-4 object-contain"
          />
          <p className="text-white dark:text-gray-200 text-lg font-semibold">
            Đang tải...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated after loading, AuthGuard should have redirected to /tours.
  // Render a fallback empty container to avoid flashing content.
  if (!isAuthenticated) {
    return <div className="min-h-screen pt-20" />;
  }

  return (
    <div className="relative min-h-screen pt-20 transition-colors duration-300">
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0"
        style={{
          backgroundImage: "url(/images/ha-long-bay-copy.jpg)",
        }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex">
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
