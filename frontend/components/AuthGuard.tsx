"use client";

import React, { ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
}

/**
 * Small client-side guard that enforces the app behavior:
 * - Unauthenticated users: start page -> /tours. Only /tours (and its children) + /welcome are accessible.
 * - If unauthenticated and trying to visit any other page -> redirect to /welcome.
 * - After successful login (isAuthenticated becomes true): if user is on /welcome or /tours, redirect to /
 */
const AuthGuard: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth initialization finished
    if (loading) return;

    // Normalize pathname (treat root as '/')
    const path = pathname || "/";

    // Helper to check if path is under /tours
    const isToursPath =
      path === "/tours" ||
      path.startsWith("/tours/") ||
      path.startsWith("/tours?");

    if (!isAuthenticated) {
      // If on root, send to /tours
      if (path === "/" || path === "") {
        router.replace("/tours");
        return;
      }

      // Allow access to welcome and tours pages
      if (path === "/welcome" || isToursPath) {
        return;
      }

      // Any other page requires login -> redirect to welcome
      router.replace("/welcome");
      return;
    } else {
      // If authenticated and currently on welcome, send to home (blog)
      // Allow authenticated users to visit /tours (listings) and its children.
      if (path === "/welcome") {
        router.replace("/");
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  return <>{children}</>;
};

export default AuthGuard;
