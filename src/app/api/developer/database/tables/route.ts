import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimitForApi, logRateLimitViolation } from "@/lib/utils/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  try {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0]?.trim() || "unknown";
    const cf = req.headers.get("cf-connecting-ip");
    if (cf) return cf;
    const xri = req.headers.get("x-real-ip");
    if (xri) return xri;
  } catch {}
  return "unknown";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DEVELOPER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Light rate limit
  const ip = getClientIp(req);
  const rl = checkRateLimitForApi(ip, { windowMs: 60 * 1000, maxRequests: 30 }); // 30 req/min per IP
  if (!rl.allowed) {
    logRateLimitViolation(ip, "/api/developer/database/tables", req.headers.get("user-agent") || "", {
      resetTime: rl.resetTime,
    });
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter || 60) },
    });
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ table_schema: string; table_name: string }>>`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `;

    const tables = rows.map((r) => ({
      schema: r.table_schema,
      name: r.table_name,
      fqtn: `${r.table_schema}.${r.table_name}`,
    }));

    return NextResponse.json({ tables });
  } catch (error) {
    console.error("Error listing tables:", error);
    return NextResponse.json({ error: "Failed to list tables" }, { status: 500 });
  }
}
