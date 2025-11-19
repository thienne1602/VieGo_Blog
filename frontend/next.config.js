/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeServerReact: true,
    // Optimize package imports
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  compress: true,
  poweredByHeader: false,

  // Output optimization
  swcMinify: true, // Use SWC minification for faster builds

  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production for faster load

  // React strict mode (can disable for performance if needed)
  reactStrictMode: true,

  // Webpack optimizations for faster dev builds
  webpack: (config, { dev, isServer }) => {
    // Optimize webpack cache for faster rebuilds
    if (dev && !isServer) {
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
        // Fix case sensitivity issues on Windows
        compression: "gzip",
        // Normalize paths to fix Windows case sensitivity warnings
        hashAlgorithm: "xxhash64",
      };

      // Reduce module resolution time
      config.resolve.symlinks = false;

      // Fix Windows case sensitivity warnings
      config.snapshot = {
        ...config.snapshot,
        resolveBuildDependencies: {
          ...config.snapshot?.resolveBuildDependencies,
          timestamp: true,
        },
      };
    }

    // Normalize paths for Windows case sensitivity
    config.infrastructureLogging = {
      level: "error", // Suppress warnings about case sensitivity
    };

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "viego-blog.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year cache for images
    dangerouslyAllowSVG: true,
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_SOCKET_URL:
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Development: Disable cache for HTML pages to always get fresh content
          // Production: Enable cache for better performance
          {
            key: "Cache-Control",
            value:
              process.env.NODE_ENV === "production"
                ? "public, max-age=3600, must-revalidate"
                : "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },
      {
        // Cache static assets longer
        source: "/:all*(svg|jpg|png|webp|avif|ico|woff|woff2|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache _next/static files but allow revalidation in development
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              process.env.NODE_ENV === "production"
                ? "public, max-age=31536000, immutable"
                : "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        // Disable cache for API routes and dynamic data
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://localhost:5000/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5000/uploads/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
