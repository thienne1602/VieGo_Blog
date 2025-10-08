import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token =
    request.cookies.get("access_token")?.value ||
    request.cookies.get("viego_token")?.value;

  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Define public routes (no auth required)
  // Home page "/" is NOT public - requires authentication (handled by page.tsx)
  const publicRoutes = ["/welcome", "/api", "/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Define routes that MUST have authentication (admin, dashboard, etc.)
  const protectedRoutes = ["/dashboard/admin", "/dashboard/moderator"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Only redirect if trying to access truly protected routes without token
  if (isProtectedRoute && !token) {
    const welcomeUrl = new URL("/welcome", request.url);
    return NextResponse.redirect(welcomeUrl);
  }

  // If authenticated and trying to access welcome page, redirect to home
  if (token && pathname === "/welcome") {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)",
  ],
};
