"use client";

import "./globals.css";
import { Poppins, Quicksand } from "next/font/google";
import Header from "@/components/layout/Header";
import { SocketProvider } from "@/lib/SocketContext";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import AuthGuard from "@/components/AuthGuard";
import NotificationPopup from "@/components/common/NotificationPopup";
import DevCacheNotice from "@/components/common/DevCacheNotice";
import Chatbot from "@/components/common/Chatbot";
import I18nProvider from "@/components/I18nProvider";
import ClientLayout from "@/components/ClientLayout";
import TunnelDetector from "@/components/common/TunnelDetector";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap", // Improve font loading performance
  preload: true, // Preload fonts
});

const quicksand = Quicksand({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap", // Improve font loading performance
  preload: true, // Preload fonts
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${poppins.variable} ${quicksand.variable}`}>
      <head>
        <title>VieGo - Blog Du Lịch & Ẩm Thực Sáng Tạo</title>
        <meta
          name="description"
          content="Khám phá Việt Nam qua những trải nghiệm du lịch và ẩm thực độc đáo. Kết nối cộng đồng yêu thích phiêu lưu và khám phá."
        />
        <meta
          name="keywords"
          content="du lịch việt nam, ẩm thực, blog du lịch, backpacker, foodie, khám phá"
        />
        {/* Development: Disable cache to ensure latest changes are always loaded */}
        {process.env.NODE_ENV === "development" && (
          <>
            <meta
              httpEquiv="Cache-Control"
              content="no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
            />
            <meta httpEquiv="Pragma" content="no-cache" />
            <meta httpEquiv="Expires" content="0" />
          </>
        )}
        {/* Use single svg favicon present in public to avoid 404s */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* Optional: keep manifest if present */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#008080" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Performance: Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="http://localhost:5000" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />
      </head>
      <body className="min-h-screen bg-neutral-100 dark:bg-gray-900 font-poppins transition-colors duration-300">
        <Suspense fallback={null}>
          <TunnelDetector />
        </Suspense>
        <I18nProvider>
          <ClientLayout>{children}</ClientLayout>
        </I18nProvider>
      </body>
    </html>
  );
}
