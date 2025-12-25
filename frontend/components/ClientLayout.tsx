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

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isWelcomePage = pathname === "/welcome";

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AuthGuard>
            <div className="flex flex-col min-h-screen">
              {!isWelcomePage && <Header />}
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
