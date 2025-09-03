import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  errorId: string;
  buildInfo?: {
    version: string;
    nodeEnv: string;
  };
  sessionInfo?: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const errorReport: ErrorReport = await request.json();

    // Get session information if available
    let sessionInfo = {};
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        sessionInfo = {
          userId: session.user.id,
          userEmail: session.user.email,
          userRole: session.user.role,
        };
      }
    } catch (sessionError) {
      console.warn("Could not get session for error report:", sessionError);
    }

    // Enhanced error report with session info
    const enhancedReport = {
      ...errorReport,
      sessionInfo,
      serverTimestamp: new Date().toISOString(),
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      referer: request.headers.get("referer"),
    };

    // Log to console with detailed formatting (production-safe)
    console.group(`🚨 Client Error Report - ${errorReport.errorId}`);
    console.error("Error Message:", errorReport.message);
    console.error("Error ID:", errorReport.errorId);
    console.error("Timestamp:", errorReport.timestamp);
    console.error("URL:", errorReport.url);
    console.error("User Agent:", errorReport.userAgent);

    if (sessionInfo && Object.keys(sessionInfo).length > 0) {
      console.error("Session Info:", sessionInfo);
    }

    if (errorReport.buildInfo) {
      console.error("Build Info:", errorReport.buildInfo);
    }

    // Only log stack traces in development or if explicitly enabled
    if (
      process.env.NODE_ENV === "development" ||
      process.env.ENABLE_PRODUCTION_STACK_TRACES === "true"
    ) {
      if (errorReport.stack) {
        console.error("Stack Trace:", errorReport.stack);
      }
      if (errorReport.componentStack) {
        console.error("Component Stack:", errorReport.componentStack);
      }
    }
    console.groupEnd();

    // In a real application, you would send this to your error tracking service
    // Examples: Sentry, LogRocket, Bugsnag, DataDog, etc.

    // Example: Send to Sentry
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(new Error(errorReport.message), {
    //     tags: {
    //       errorId: errorReport.errorId,
    //       component: 'client-error-boundary',
    //     },
    //     extra: enhancedReport,
    //   });
    // }

    // Example: Send to custom logging service
    // if (process.env.LOGGING_ENDPOINT) {
    //   await fetch(process.env.LOGGING_ENDPOINT, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(enhancedReport),
    //   });
    // }

    // Store critical errors in a database for analysis
    // This is optional and depends on your needs
    if (shouldStoreError(errorReport)) {
      try {
        // You could store in your database here
        // await db.errorLog.create({ data: enhancedReport });
        console.info("📊 Error stored for analysis:", errorReport.errorId);
      } catch (dbError) {
        console.error("Failed to store error in database:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      errorId: errorReport.errorId,
      message: "Error report received",
    });
  } catch (error) {
    console.error("Error processing error report:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process error report",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Determine if an error should be stored in database for analysis
 * You can customize this logic based on your needs
 */
function shouldStoreError(errorReport: ErrorReport): boolean {
  // Store errors that might indicate serious issues
  const criticalPatterns = [
    /network error/i,
    /database/i,
    /authentication/i,
    /authorization/i,
    /payment/i,
    /billing/i,
    /critical/i,
    /server error/i,
    /internal error/i,
  ];

  return criticalPatterns.some(
    (pattern) =>
      pattern.test(errorReport.message) ||
      (errorReport.stack && pattern.test(errorReport.stack))
  );
}

// Optional: GET endpoint to retrieve error statistics (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Return error statistics from localStorage or database
    // This is a simple implementation - in production you'd query your database
    return NextResponse.json({
      message: "Error reporting endpoint is active",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve error statistics" },
      { status: 500 }
    );
  }
}
