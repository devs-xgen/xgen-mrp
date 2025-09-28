import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import ExcelJS from "exceljs";
import { checkRateLimitForApi, logRateLimitViolation } from "@/lib/utils/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ExportSchema = z.object({
  tables: z.array(z.string()).optional(), // fully qualified: schema.table
});

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

function parseFqtn(fqtn: string): { schema: string; name: string } {
  const raw = fqtn.trim();
  const [s, t] = raw.includes(".") ? raw.split(".", 2) : ["public", raw];
  // Basic sanitization: allow alnum + underscore only to avoid injection via identifiers.
  const safe = (v: string) => v.replace(/[^a-zA-Z0-9_]/g, "_");
  return { schema: safe(s), name: safe(t) };
}

function sanitizeSheetName(name: string): string {
  // Excel sheet name max 31 chars and cannot contain: : \ / ? * [ ]
  const cleaned = name.replace(/[:\\/?*\[\]]/g, "_");
  return cleaned.slice(0, 31) || "Sheet";
}

function serializeCell(v: any): any {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return v.toString();
  if (v instanceof Date) return v.toISOString();
  if (Buffer.isBuffer(v)) return v.toString("base64");
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}

export async function POST(req: NextRequest) {
  // Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DEVELOPER") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit heavy export
  const ip = getClientIp(req);
  const rl = checkRateLimitForApi(ip, { windowMs: 60 * 1000, maxRequests: 3 });
  if (!rl.allowed) {
    logRateLimitViolation(ip, "/api/developer/database/export", req.headers.get("user-agent") || "", {
      userId: session.user.id,
      email: session.user.email,
      resetTime: rl.resetTime,
    });
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter || 60) },
    });
  }

  // Parse request
  let body: z.infer<typeof ExportSchema>;
  try {
    body = ExportSchema.parse(await req.json().catch(() => ({})));
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: (err as Error).message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    let targetTables: Array<{ schema: string; name: string; fqtn: string }> = [];

    if (body.tables && body.tables.length) {
      const seen = new Set<string>();
      for (const fqtn of body.tables) {
        const { schema, name } = parseFqtn(fqtn);
        const key = `${schema}.${name}`;
        if (!seen.has(key)) {
          seen.add(key);
          targetTables.push({ schema, name, fqtn: key });
        }
      }
    } else {
      const rows = await prisma.$queryRaw<Array<{ table_schema: string; table_name: string }>>`
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
          AND table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema, table_name
      `;
      targetTables = rows.map((r) => ({ schema: r.table_schema, name: r.table_name, fqtn: `${r.table_schema}.${r.table_name}` }));
    }

    // Prepare workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "XGEN-MRP";
    workbook.created = new Date();

    for (const t of targetTables) {
      // Fetch columns for deterministic ordering
      const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = ${t.schema} AND table_name = ${t.name}
        ORDER BY ordinal_position
      `;
      const headers = cols.map((c) => c.column_name);

      const sheetName = sanitizeSheetName(t.fqtn);
      const ws = workbook.addWorksheet(sheetName);
      ws.addRow(headers);

      // Fetch all rows
      const rows: Array<Record<string, any>> = await prisma.$queryRawUnsafe(
        `SELECT * FROM "${t.schema}"."${t.name}"`
      );

      for (const row of rows) {
        const values = headers.map((h) => serializeCell((row as any)[h]));
        ws.addRow(values);
      }

      // Basic styling for header
      ws.getRow(1).font = { bold: true };
      ws.columns?.forEach((col) => {
        // autosize rough
        let max = 10;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const len = String(cell.value ?? "").length;
          if (len > max) max = Math.min(len, 80);
        });
        col.width = max + 2;
      });
    }

    const scope = body.tables && body.tables.length ? "selected" : "full";
    const ts = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .replace("Z", "");
    const filename = `db-export-${scope}-${ts}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const bytes = new Uint8Array(buffer as ArrayBuffer);

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[DB_EXPORT] failed", {
      userId: session.user.id,
      email: session.user.email,
      ip,
      message: err?.message,
    });
    return new Response(
      JSON.stringify({ error: "Export failed", details: err?.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
