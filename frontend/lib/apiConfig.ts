/**
 * API Configuration Helper for VieGo Blog
 * Handles dynamic URL resolution for tunnel mode (Demo Mode)
 */

// Check if running in tunnel mode
export function isTunnelMode(): boolean {
  if (typeof window === "undefined") return false;
  const currentHost = window.location.hostname;
  return (
    currentHost.includes("loca.lt") ||
    currentHost.includes("ngrok") ||
    currentHost.includes("trycloudflare.com")
  );
}

// Get base URL (without /api suffix) - useful for direct fetch calls
export function getBaseURL(): string {
  if (typeof window !== "undefined" && isTunnelMode()) {
    const tunnelBackendUrl = localStorage.getItem("viego_backend_tunnel_url");
    if (tunnelBackendUrl) {
      // Remove /api suffix if present
      return tunnelBackendUrl.replace(/\/api$/, "");
    }
    // In tunnel mode but no backend URL - warn user
    console.warn(
      "⚠️ [apiConfig] Tunnel mode detected but no backend URL configured!",
      "Please use the full share URL with ?backend= parameter"
    );
  }
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
    "http://localhost:5000"
  );
}

// Get API URL (with /api suffix)
export function getAPIURL(): string {
  const baseUrl = getBaseURL();
  return `${baseUrl}/api`;
}

// Get Socket URL
export function getSocketURL(): string {
  return getBaseURL();
}

// Build full URL for uploaded files/images
export function getUploadURL(path: string): string {
  if (!path) return "";
  // If already a full URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    // Replace localhost with tunnel URL if in tunnel mode
    if (isTunnelMode() && path.includes("localhost:5000")) {
      return path.replace("http://localhost:5000", getBaseURL());
    }
    return path;
  }
  // Build full URL
  const baseUrl = getBaseURL();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Fetch wrapper that uses correct base URL
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getAPIURL();
  const url = endpoint.startsWith("/")
    ? `${baseUrl}${endpoint}`
    : `${baseUrl}/${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

// Fetch wrapper with authentication
export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") ||
        localStorage.getItem(`access_token_${window.location.port || "3000"}`)
      : null;

  return apiFetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
