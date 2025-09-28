import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import archiver from "archiver";
import { Readable, PassThrough } from "stream";
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
  // Basic sanitization: allow alnum + underscore only
  const safe = (v: string) => v.replace(/[^a-zA-Z0-9_]/g, "_");
  return { schema: safe(s), name: safe(t) };
}

function serializeCell(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "bigint") return v.toString();
  if (v instanceof Date) return v.toISOString();
  if (Buffer.isBuffer(v)) return v.toString("base64");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function csvEscape(s: string): string {
  const needs = /[",\n\r,]/.test(s);
  const esc = s.replace(/"/g, '""');
  return needs ? `"${esc}"` : esc;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DEVELOPER") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ip = getClientIp(req);
  const rl = checkRateLimitForApi(ip, { windowMs: 60 * 1000, maxRequests: 3 });
  if (!rl.allowed) {
    logRateLimitViolation(ip, "/api/developer/database/export-csv", req.headers.get("user-agent") || "", {
      userId: session.user.id,
      email: session.user.email,
      resetTime: rl.resetTime,
    });
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter || 60) },
    });
  }

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

    // Prepare archiver (zip)
    const out = new PassThrough();
    const zip = archiver("zip", { zlib: { level: 9 } });

    zip.on("warning", (err) => {
      console.warn("[CSV_EXPORT][warn]", err.message);
    });
    zip.on("error", (err) => {
      out.destroy(err);
    });

    // Append each table as a CSV entry using a streaming source
    for (const t of targetTables) {
      const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = ${t.schema} AND table_name = ${t.name}
        ORDER BY ordinal_position
      `;
      const headers = cols.map((c) => c.column_name);

      const rows: Array<Record<string, any>> = await prisma.$queryRawUnsafe(
        `SELECT * FROM "${t.schema}"."${t.name}"`
      );

      const src = Readable.from((async function* () {
        // header
        yield headers.map((h) => csvEscape(h)).join(",") + "\r\n";
        for (const row of rows) {
          const line = headers.map((h) => csvEscape(serializeCell((row as any)[h]))).join(",");
          yield line + "\r\n";
        }
      })());

      zip.append(src, { name: `${t.fqtn}.csv` });
    }

    // Finalize archive once all entries appended
    const finalizePromise = zip.finalize();

    // Pipe to PassThrough
    zip.pipe(out);

    const ts = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .replace("Z", "");
    const scope = body.tables && body.tables.length ? "selected" : "full";
    const filename = `db-export-${scope}-${ts}.zip`;

    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        out.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        out.on("end", () => controller.close());
        out.on("error", (err: Error) => controller.error(err));
      },
      cancel() {
        try { out.destroy(); } catch {}
      },
    });

    // Ensure finalize runs (errors propagate via 'error' listener above)
    void finalizePromise.catch(() => {});

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[CSV_EXPORT] failed", {
      userId: session.user.id,
      email: session.user.email,
      ip,
      message: err?.message,
    });
    return new Response(
      JSON.stringify({ error: "CSV export failed", details: err?.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
