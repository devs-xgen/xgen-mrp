import { NextRequest, NextResponse } from "next/server";

// This should match the rate limit store from middleware
// In production, you'd use Redis or another shared store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function POST(req: NextRequest) {
  try {
    // Get IP address
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    // Clear rate limits for this IP
    rateLimitStore.delete(ip);

    return NextResponse.json({
      success: true,
      message: "Rate limits cleared",
      ip: process.env.NODE_ENV === "development" ? ip : "hidden",
    });
  } catch (error) {
    console.error("Error clearing rate limits:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear rate limits",
      },
      { status: 500 }
    );
  }
}
