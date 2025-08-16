/**
 * Utility to determine the logout callback URL based on environment variables
 * and deployment context
 */

/**
 * Get the logout callback URL with proper fallback chain
 * Priority:
 * 1. NEXTAUTH_URL (existing auth URL - most common)
 * 2. NEXT_PUBLIC_APP_URL (general app URL)
 * 3. Dynamic detection (client-side only)
 * 4. "/" (fallback)
 */
export function getLogoutCallbackUrl(): string {
  // Priority 1: NextAuth URL (but only take the base)
  if (process.env.NEXTAUTH_URL) {
    try {
      const url = new URL(process.env.NEXTAUTH_URL);
      return url.origin;
    } catch {
      // If NEXTAUTH_URL is malformed, continue to next fallback
    }
  }

  // Priority 2: General app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Priority 3: Dynamic detection (client-side only)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Priority 4: Fallback to relative path
  return "/";
}

/**
 * Get logout callback URL with custom path
 * @param path - Custom path to append (default: "/")
 */
export function getLogoutCallbackUrlWithPath(path: string = "/"): string {
  const baseUrl = getLogoutCallbackUrl();

  // If we got a relative path fallback, just return the path
  if (baseUrl === "/") {
    return path;
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  try {
    const url = new URL(normalizedPath, baseUrl);
    return url.toString();
  } catch {
    // If URL construction fails, return the path
    return normalizedPath;
  }
}

/**
 * Environment variable configuration for different deployment scenarios
 */
export const LOGOUT_URL_CONFIG = {
  // Development
  development: {
    NEXTAUTH_URL: "http://localhost:3001",
    // or leave undefined to use dynamic detection
  },

  // Production examples
  production: {
    NEXTAUTH_URL: "https://yourdomain.com",
    // or NEXT_PUBLIC_APP_URL: "https://yourdomain.com"
  },

  // Docker/Container deployments
  docker: {
    NEXTAUTH_URL: "${NEXTAUTH_URL}",
    // Uses your existing NextAuth configuration
  },

  // Vercel/Netlify deployments
  vercel: {
    NEXTAUTH_URL: "https://your-app.vercel.app",
    // Uses the same URL as your NextAuth setup
  },
} as const;
