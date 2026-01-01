"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/lib/AuthContext";
import { SocketProvider } from "@/lib/SocketContext";
import AuthGuard from "@/components/AuthGuard";
import NotificationPopup from "@/components/common/NotificationPopup";
import DevCacheNotice from "@/components/common/DevCacheNotice";
import Chatbot from "@/components/common/Chatbot";
import Header from "@/components/layout/Header";
import TopBarMarquee from "@/components/common/TopBarMarquee";
import LuckyEnvelope from "@/components/common/LuckyEnvelope";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isWelcomePage = pathname === "/welcome";
  const isDashboardPage = pathname?.startsWith("/dashboard");

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AuthGuard>
            <div
              className="flex flex-col min-h-screen"
              style={{
                // Reserve space for marquee + header so fixed elements don't overlap content
                paddingTop: !isWelcomePage
                  ? "calc(var(--marquee-height, 0px) + 64px)"
                  : undefined,
              }}
            >
              {!isWelcomePage && <TopBarMarquee />}
              {!isWelcomePage && <Header />}
              {!isWelcomePage && !isDashboardPage && <LuckyEnvelope />}
              <main className="flex-grow">{children}</main>
              <NotificationPopup />
              <DevCacheNotice />
              <Chatbot />
            </div>
          </AuthGuard>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
