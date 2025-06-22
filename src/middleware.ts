import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define which roles belong to each portal
const PORTAL_ROLES = {
  ADMIN_PORTAL: ["ADMIN"],
  WORKER_PORTAL: ["WORKER"],
  INSPECTOR_PORTAL: ["INSPECTOR"],
  DELIVERY_PORTAL: ["DELIVERY"],
};

// Portal path mappings
const PORTAL_PATHS = {
  ADMIN_PORTAL: "/admin",
  WORKER_PORTAL: "/worker",
  INSPECTOR_PORTAL: "/inspector",
  DELIVERY_PORTAL: "/delivery",
};

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get session token from cookies
  const sessionToken =
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");

  // Public routes
  if (pathname === "/" || pathname.includes("/login")) {
    // If authenticated and trying to access login, redirect to dashboard
    if (sessionToken && pathname.includes("/login")) {
      const portalMatch = pathname.match(
        /^\/(admin|worker|inspector|delivery)/
      );
      const portal = portalMatch ? portalMatch[1] : "admin";
      return NextResponse.redirect(new URL(`/${portal}/dashboard`, req.url));
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!sessionToken) {
    // Determine which login page to redirect to based on the URL path
    const portalMatch = pathname.match(/^\/(admin|worker|inspector|delivery)/);
    const portal = portalMatch ? portalMatch[1] : "admin";
    return NextResponse.redirect(new URL(`/${portal}/login`, req.url));
  }

  // For now, allow all authenticated users to access any protected route
  // In a production environment, you might want to decode the JWT to check roles
  // but this avoids the jose library issues in Edge Runtime
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
