"use client";

import "./globals.css";
import { Poppins, Quicksand } from "next/font/google";
import Header from "@/components/layout/Header";
import { SocketProvider } from "@/lib/SocketContext";
import { AuthProvider } from "@/lib/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { usePathname } from "next/navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWelcomePage = pathname === "/welcome";

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
        {/* Use single svg favicon present in public to avoid 404s */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* Optional: keep manifest if present */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#008080" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-neutral-100 font-poppins">
        <AuthProvider>
          <SocketProvider>
            <AuthGuard>
              <div className="flex flex-col min-h-screen">
                {!isWelcomePage && <Header />}
                <main className="flex-grow">{children}</main>
              </div>
            </AuthGuard>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
