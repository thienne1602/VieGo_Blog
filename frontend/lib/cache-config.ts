/**
 * Cache Configuration Utility
 *
 * This utility helps prevent aggressive browser caching during development
 * while maintaining good cache behavior in production.
 */

/**
 * Gets the current cache mode based on environment
 */
export const getCacheMode = (): "development" | "production" => {
  return process.env.NODE_ENV === "production" ? "production" : "development";
};

/**
 * Returns fetch options with appropriate cache settings
 */
export const getFetchOptions = (customOptions?: RequestInit): RequestInit => {
  const isDev = getCacheMode() === "development";

  const cacheOptions: RequestInit = isDev
    ? {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    : {
        cache: "default",
        next: { revalidate: 60 }, // Revalidate every 60 seconds in production
      };

  return {
    ...cacheOptions,
    ...customOptions,
    headers: {
      ...(cacheOptions.headers || {}),
      ...(customOptions?.headers || {}),
    },
  };
};

/**
 * Adds a timestamp to URLs to bust cache (useful for dynamic pages)
 */
export const addCacheBuster = (url: string): string => {
  const isDev = getCacheMode() === "development";
  if (!isDev) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_t=${Date.now()}`;
};

/**
 * Clears all browser caches (localStorage, sessionStorage, etc.)
 * Use with caution - this will log out users
 */
export const clearAllCache = () => {
  if (typeof window !== "undefined") {
    // Clear service worker caches if any
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }

    // Note: Don't clear localStorage/sessionStorage as it will log out users
    console.log("[Cache] Browser cache cleared");
  }
};

/**
 * Force reload the page without cache
 */
export const hardReload = () => {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
};

/**
 * Returns meta tags for HTML head to prevent caching
 */
export const getNoStoreMeta = () => {
  const isDev = getCacheMode() === "development";
  if (!isDev) return null;

  return {
    httpEquiv: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  };
};

/**
 * Utility to check if content is stale and needs refresh
 * @param lastUpdated - timestamp of last update
 * @param maxAge - maximum age in seconds before considering stale
 */
export const isContentStale = (
  lastUpdated: number,
  maxAge: number = 300
): boolean => {
  const now = Date.now();
  const age = (now - lastUpdated) / 1000; // Convert to seconds
  return age > maxAge;
};

/**
 * Development helper: Add version query param to force fresh CSS/JS loads
 */
export const getVersionedAssetUrl = (url: string): string => {
  const isDev = getCacheMode() === "development";
  if (!isDev) return url;

  // Use build time or deployment time as version
  const version = process.env.NEXT_PUBLIC_BUILD_ID || Date.now();
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
};
