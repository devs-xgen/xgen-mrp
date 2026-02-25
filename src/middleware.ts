import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define which roles belong to each portal
const PORTAL_ROLES = {
  ADMIN_PORTAL: ["ADMIN"],
  WORKER_PORTAL: ["WORKER"],
  INSPECTOR_PORTAL: ["INSPECTOR"],
  DELIVERY_PORTAL: ["DELIVERY"],
  DEVELOPER_PORTAL: ["DEVELOPER"],
  // superadmin portal is separate from admin
  SUPERADMIN_PORTAL: ["SUPER_ADMIN"],
};

// Portal path mappings
const PORTAL_PATHS = {
  ADMIN_PORTAL: "/admin",
  WORKER_PORTAL: "/worker",
  INSPECTOR_PORTAL: "/inspector",
  DELIVERY_PORTAL: "/delivery",
  DEVELOPER_PORTAL: "/developer",
  SUPERADMIN_PORTAL: "/superadmin",
};

// Rate limiting configuration (more reasonable limits)
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // Increased general request limit for normal usage
  loginMaxRequests: 50, // Increased login page visits (for legitimate portal switching)
};

// Simple in-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clear rate limits for an IP (useful for legitimate users after logout)
function clearRateLimit(ip: string) {
  rateLimitStore.delete(ip);
}

// Rate limiting function
function checkRateLimit(
  ip: string,
  maxRequests: number = RATE_LIMIT_CONFIG.maxRequests
): boolean {
  const now = Date.now();
  const windowMs = RATE_LIMIT_CONFIG.windowMs;

  const existing = rateLimitStore.get(ip);

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;
  return true;
}

// Robust client IP extraction (supports multiple proxy headers)
function getClientIp(req: NextRequest): string {
  try {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) {
      const first = xff.split(",")[0]?.trim();
      if (first) return first;
    }
    const cf = req.headers.get("cf-connecting-ip");
    if (cf) return cf;
    const xri = req.headers.get("x-real-ip");
    if (xri) return xri;
    // Next.js may expose ip on the request in some runtimes
    // @ts-expect-error - not always typed
    if (req.ip) return (req as any).ip as string;
  } catch {
    // no-op
  }
  return "unknown";
}

// Security headers configuration
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy (basic)
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  // Strict Transport Security (if HTTPS)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  return response;
}

// Validate role access to specific paths
function hasRoleAccess(userRole: string, pathname: string): boolean {
  // Extract portal from pathname
  const portalMatch = pathname.match(
    /^\/(admin|worker|inspector|delivery|developer|superadmin)/
  );
  if (!portalMatch) return true; // Allow access to non-portal routes

  const portal = portalMatch[1].toUpperCase() + "_PORTAL";
  const allowedRoles = PORTAL_ROLES[portal as keyof typeof PORTAL_ROLES] || [];

  return allowedRoles.includes(userRole);
}

function getDashboardPathForRole(userRole: string): string {
  switch (userRole) {
    case "DEVELOPER":
      return `${PORTAL_PATHS.DEVELOPER_PORTAL}/dashboard`;
    case "SUPER_ADMIN":
      return `${PORTAL_PATHS.SUPERADMIN_PORTAL}/dashboard`;
    case "ADMIN":
      return `${PORTAL_PATHS.ADMIN_PORTAL}/dashboard`;
    case "WORKER":
      return `${PORTAL_PATHS.WORKER_PORTAL}/dashboard`;
    case "INSPECTOR":
      return `${PORTAL_PATHS.INSPECTOR_PORTAL}/dashboard`;
    case "DELIVERY":
      return `${PORTAL_PATHS.DELIVERY_PORTAL}/dashboard`;
    default:
      return "/admin/dashboard";
  }
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const ip = getClientIp(req);

  // Skip API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Skip non-mutating or preflight requests
  if (req.method === "HEAD" || req.method === "OPTIONS") {
    return NextResponse.next();
  }

  // Check maintenance mode first - this will work immediately when env changes
  if (process.env.MAINTENANCE_MODE === "true") {
    // Allow access to maintenance page itself to avoid infinite redirects
    if (pathname !== "/maintenance") {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
    return NextResponse.next();
  }

  // Rate limiting check (more lenient in development)
  const isLoginPage = pathname.includes("/login");
  const maxRequests = isLoginPage
    ? RATE_LIMIT_CONFIG.loginMaxRequests
    : RATE_LIMIT_CONFIG.maxRequests;

  // Skip rate limiting in development for better developer experience
  if (process.env.NODE_ENV === "development") {
    // Only check rate limiting for actual login attempts (not just visiting login pages)
    if (req.method === "POST" && isLoginPage) {
      if (!checkRateLimit(ip, 10)) {
        // 10 actual login attempts per 15 minutes
        console.warn(`Login rate limit exceeded for IP: ${ip}`);
        return new NextResponse("Too Many Login Attempts", { status: 429 });
      }
    }
    // Skip general rate limiting in development
  } else {
    // Apply full rate limiting in production
    // Avoid over-limiting when IP cannot be determined (behind certain proxies)
    if (ip !== "unknown") {
      // Do NOT rate-limit login page views (GET). Only guard heavy navigation/general traffic.
      if (!isLoginPage) {
        if (!checkRateLimit(ip, maxRequests)) {
          console.warn(
            `Rate limit exceeded for IP: ${ip} on path: ${pathname}`
          );
          const retryAfter = Math.ceil(
            RATE_LIMIT_CONFIG.windowMs / 1000
          ).toString();
          const res = new NextResponse("Too Many Requests", { status: 429 });
          res.headers.set("Retry-After", retryAfter);
          return res;
        }
      }
    }
  }

  // Create response
  let response = NextResponse.next();

  // Add security headers to all responses
  response = addSecurityHeaders(response);

  // Public routes (allow access without authentication)
  // Include shareable document routes as public (handle both singular and plural forms)
  const shareableRoutePatterns = [
    /^\/(billing-statements?|sales-invoices?|delivery-receipts?)\/share\/[^\/]+$/,
    /^\/share\/(products|production)\/[^\/]+$/,
  ];

  const isShareableRoute = shareableRoutePatterns.some((pattern) =>
    pattern.test(pathname)
  );

  // Debug logging for shareable routes
  if (pathname.includes("/share/")) {
    console.log(`🔍 Checking shareable route: ${pathname}`);
    console.log(`🔍 Is shareable route: ${isShareableRoute}`);
  }

  if (
    pathname === "/" ||
    pathname === "/install-app" ||
    pathname === "/changelog" ||
    pathname === "/offline" ||
    pathname === "/forgot-password" ||
    pathname.includes("/login") ||
    isShareableRoute
  ) {
    try {
      // Check if user is already authenticated
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token) {
        const userRole = token.role as string;

        if (pathname === "/") {
          const dashboardPath = getDashboardPathForRole(userRole);
          return NextResponse.redirect(new URL(dashboardPath, req.url));
        }

        if (isLoginPage) {
          const portalMatch = pathname.match(
            /^\/(admin|worker|inspector|delivery|developer|superadmin)/
          );
          const portal = portalMatch ? portalMatch[1] : "admin";
          const requestedDashboard = `/${portal}/dashboard`;

          if (hasRoleAccess(userRole, requestedDashboard)) {
            return NextResponse.redirect(
              new URL(requestedDashboard, req.url)
            );
          }

          const dashboardPath = getDashboardPathForRole(userRole);
          return NextResponse.redirect(new URL(dashboardPath, req.url));
        }
      }

      return response;
    } catch (error) {
      console.error("Error checking authentication token:", error);
      // Continue to allow access to public routes even if token check fails
    }

    return response;
  }

  // Protected routes - require authentication and proper role access
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // No valid session - redirect to appropriate login
    if (!token) {
      const portalMatch = pathname.match(
        /^\/(admin|worker|inspector|delivery|developer|superadmin)/
      );
      const portal = portalMatch ? portalMatch[1] : "admin";

      console.info(
        `Unauthenticated access attempt to ${pathname}, redirecting to ${portal}/login`
      );
      return NextResponse.redirect(new URL(`/${portal}/login`, req.url));
    }

    // Check role-based access
    if (!hasRoleAccess(token.role as string, pathname)) {
      console.warn(
        `Unauthorized access attempt by ${token.email} (${token.role}) to ${pathname}`
      );

      const userRole = token.role as string;
      const dashboardPath = getDashboardPathForRole(userRole);
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }

    // Add user context to headers for server components
    response.headers.set("x-user-id", token.id as string);
    response.headers.set("x-user-role", token.role as string);
    response.headers.set("x-user-email", (token.email as string) || "");

    if (process.env.NODE_ENV === "development") {
      console.info(
        `✅ Authorized access: ${token.email} (${token.role}) → ${pathname}`
      );
    }
  } catch (error) {
    console.error("Middleware authentication error:", error);

    const portalMatch = pathname.match(
      /^\/(admin|worker|inspector|delivery|developer|superadmin)/
    );
    const portal = portalMatch ? portalMatch[1] : "admin";
    return NextResponse.redirect(new URL(`/${portal}/login`, req.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
