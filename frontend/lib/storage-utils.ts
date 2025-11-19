/**
 * Storage Utilities with Port-Specific Keys
 * Ensures isolation between multiple clients running on different ports
 */

// Get current port from window.location
export function getCurrentPort(): string {
  if (typeof window !== 'undefined') {
    const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    return port;
  }
  return '3000'; // Default fallback
}

// Get storage key with port suffix to ensure isolation between clients
export function getStorageKey(baseKey: string): string {
  const port = getCurrentPort();
  return `${baseKey}_${port}`;
}

// Get cookie name with port suffix
export function getCookieName(baseName: string): string {
  const port = getCurrentPort();
  return `${baseName}_${port}`;
}

/**
 * Get access token from localStorage (with port-specific key)
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(getStorageKey("access_token"));
}

/**
 * Set access token to localStorage (with port-specific key)
 */
export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey("access_token"), token);
}

/**
 * Remove access token from localStorage (with port-specific key)
 */
export function removeAccessToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getStorageKey("access_token"));
}

/**
 * Get user data from localStorage (with port-specific key)
 */
export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem(getStorageKey("user"));
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

/**
 * Set user data to localStorage (with port-specific key)
 */
export function setUser(user: any): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey("user"), JSON.stringify(user));
}

/**
 * Remove user data from localStorage (with port-specific key)
 */
export function removeUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getStorageKey("user"));
}

/**
 * Clear all authentication data (with port-specific keys)
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  removeAccessToken();
  removeUser();
}

