import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { spawn } from "child_process";
import { checkRateLimitForApi, logRateLimitViolation } from "@/lib/utils/rate-limiter";

export const runtime = "nodejs"; // ensure Node runtime
export const dynamic = "force-dynamic"; // do not cache

const BackupSchema = z.object({
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

function parseDatabaseUrl(databaseUrl?: string) {
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  // Support postgres:// and postgresql:// schemes
  const url = new URL(databaseUrl);
  const host = url.hostname;
  const port = url.port || "5432";
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.replace(/^\//, "");
  return { host, port, user, password, database };
}

export async function POST(req: NextRequest) {
  // AuthN/AuthZ
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "DEVELOPER") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit backups (heavy operation)
  const ip = getClientIp(req);
  const rl = checkRateLimitForApi(ip, { windowMs: 60 * 1000, maxRequests: 5 });
  if (!rl.allowed) {
    logRateLimitViolation(ip, "/api/developer/database/backup", req.headers.get("user-agent") || "", {
      userId: session.user.id,
      email: session.user.email,
      resetTime: rl.resetTime,
    });
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter || 60) },
    });
  }

  let body: z.infer<typeof BackupSchema>;
  try {
    body = BackupSchema.parse(await req.json().catch(() => ({})));
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: (err as Error).message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { tables } = body;

  // Prepare pg_dump invocation
  let dbConfig;
  try {
    const conn = process.env.PG_BACKUP_URL || process.env.DATABASE_URL;
    dbConfig = parseDatabaseUrl(conn);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const pgDumpPath = process.env.PG_DUMP_PATH || "pg_dump"; // allow override

  const args: string[] = [
    "-h",
    dbConfig.host,
    "-p",
    dbConfig.port,
    "-U",
    dbConfig.user,
    "-d",
    dbConfig.database,
    "-F",
    "p", // plain SQL
    "--no-owner",
    "--no-privileges",
  ];

  if (tables && tables.length > 0) {
    for (const t of tables) {
      // ensure fully qualified
      const [schema, table] = t.includes(".") ? t.split(".") : ["public", t];
      args.push(`--table=${schema}.${table}`);
    }
  }

  // Create a web ReadableStream bridged from child stdout
  return await new Promise<Response>((resolve) => {
    let stderr = "";

    const child = spawn(pgDumpPath, args, {
      env: {
        ...process.env,
        PGPASSWORD: dbConfig.password,
      },
      windowsHide: true,
    });

    child.on("error", (error) => {
      console.error("[DB_BACKUP] spawn error", {
        userId: session.user.id,
        email: session.user.email,
        ip,
        error: error.message,
      });
      resolve(
        new Response(
          JSON.stringify({
            error:
              "Failed to execute pg_dump. Ensure PostgreSQL client tools (pg_dump) are installed or configure PG_DUMP_PATH.",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      );
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        child.stdout.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        child.stdout.on("end", () => controller.close());
        child.stdout.on("error", (err: Error) => controller.error(err));
      },
      cancel() {
        try {
          child.kill("SIGTERM");
        } catch {}
      },
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.info("[DB_BACKUP] completed", {
          userId: session.user.id,
          email: session.user.email,
          ip,
          scope: tables && tables.length > 0 ? "selected" : "full",
        });
      } else {
        console.error("[DB_BACKUP] failed", {
          userId: session.user.id,
          email: session.user.email,
          ip,
          code,
          stderr,
        });
      }
      if (code !== 0 && !stderr) {
        // If failed very early and no stream started, return error
        resolve(
          new Response(
            JSON.stringify({ error: `pg_dump exited with code ${code}` }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      // Otherwise, we already resolved with the stream response below
    });

    const now = new Date();
    const ts = now
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .replace("Z", "");
    const scope = tables && tables.length > 0 ? "selected" : "full";
    const filename = `db-backup-${scope}-${ts}.sql`;

    resolve(
      new Response(stream, {
        headers: {
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Accel-Buffering": "no",
          "Cache-Control": "no-store",
        },
      })
    );
  });
}
