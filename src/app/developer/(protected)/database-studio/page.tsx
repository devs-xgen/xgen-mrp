"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Download, Filter, RefreshCcw, AlertTriangle, FileSpreadsheet, FileArchive } from "lucide-react";
import { toast } from "sonner";

interface DbTable {
  schema: string;
  name: string;
  fqtn: string; // schema.name
}

export default function DatabaseStudioPage() {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return tables;
    const s = search.toLowerCase();
    return tables.filter((t) =>
      t.fqtn.toLowerCase().includes(s) || t.name.toLowerCase().includes(s) || t.schema.toLowerCase().includes(s)
    );
  }, [tables, search]);

  const allSelected = useMemo(() => {
    if (filtered.length === 0) return false;
    return filtered.every((t) => selected[t.fqtn]);
  }, [filtered, selected]);

  const anySelected = useMemo(() => Object.values(selected).some(Boolean), [selected]);

  useEffect(() => {
    loadTables();
  }, []);

  async function loadTables() {
    setLoading(true);
    try {
      const res = await fetch("/api/developer/database/tables", { cache: "no-store" });
      if (!res.ok) {
        const msg = await safeParseError(res);
        throw new Error(msg || "Failed to load tables");
      }
      const data = await res.json();
      setTables(data.tables || []);
    } catch (e: any) {
      console.error("Failed to fetch tables", e);
      toast.error("Failed to load tables", { description: e?.message || "Please try again" });
    } finally {
      setLoading(false);
    }
  }

  function toggleAll(value: boolean) {
    const next = { ...selected };
    for (const t of filtered) next[t.fqtn] = value;
    setSelected(next);
  }

  function toggleOne(fqtn: string, value: boolean) {
    setSelected((prev) => ({ ...prev, [fqtn]: value }));
  }

  async function downloadBackup(tablesArg?: string[]) {
    setDownloading(true);
    try {
      const res = await fetch("/api/developer/database/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: tablesArg && tablesArg.length ? tablesArg : undefined }),
      });

      if (!res.ok) {
        const msg = await safeParseError(res);
        throw new Error(msg || "Backup failed");
      }

      const filename = parseContentDisposition(res.headers.get("content-disposition")) ||
        (tablesArg && tablesArg.length ? "db-backup-selected.sql" : "db-backup-full.sql");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      toast.success("Backup started", { description: filename });
    } catch (e: any) {
      console.error("Backup failed", e);
      toast.error("Backup failed", { description: e?.message || "Please check server logs" });
    } finally {
      setDownloading(false);
    }
  }

  async function downloadExport(tablesArg?: string[]) {
    setExporting(true);
    try {
      const res = await fetch("/api/developer/database/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: tablesArg && tablesArg.length ? tablesArg : undefined }),
      });

      if (!res.ok) {
        const msg = await safeParseError(res);
        throw new Error(msg || "Export failed");
      }

      const filename = parseContentDisposition(res.headers.get("content-disposition")) ||
        (tablesArg && tablesArg.length ? "db-export-selected.xlsx" : "db-export-full.xlsx");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      toast.success("Export ready", { description: filename });
    } catch (e: any) {
      console.error("Export failed", e);
      toast.error("Export failed", { description: e?.message || "Please check server logs" });
    } finally {
      setExporting(false);
    }
  }

  async function downloadExportCsv(tablesArg?: string[]) {
    setExporting(true);
    try {
      const res = await fetch("/api/developer/database/export-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: tablesArg && tablesArg.length ? tablesArg : undefined }),
      });

      if (!res.ok) {
        const msg = await safeParseError(res);
        throw new Error(msg || "CSV export failed");
      }

      const filename = parseContentDisposition(res.headers.get("content-disposition")) ||
        (tablesArg && tablesArg.length ? "db-export-selected.zip" : "db-export-full.zip");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      toast.success("CSV export ready", { description: filename });
    } catch (e: any) {
      console.error("CSV export failed", e);
      toast.error("CSV export failed", { description: e?.message || "Please check server logs" });
    } finally {
      setExporting(false);
    }
  }

  function handleFullBackup() {
    downloadBackup();
  }

  function handleSelectedBackup() {
    const selectedTables = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selectedTables.length === 0) {
      toast.message("No tables selected", { description: "Select one or more tables first" });
      return;
    }
    downloadBackup(selectedTables);
  }

  function handleFullExport() {
    downloadExport();
  }

  function handleSelectedExport() {
    const selectedTables = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selectedTables.length === 0) {
      toast.message("No tables selected", { description: "Select one or more tables first" });
      return;
    }
    downloadExport(selectedTables);
  }

  function handleFullExportCsv() {
    downloadExportCsv();
  }

  function handleSelectedExportCsv() {
    const selectedTables = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selectedTables.length === 0) {
      toast.message("No tables selected", { description: "Select one or more tables first" });
      return;
    }
    downloadExportCsv(selectedTables);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="w-7 h-7 text-blue-600" /> Database Studio
        </h1>
        <p className="text-gray-600 mt-1">Create on-demand PostgreSQL backups. Download full or selective table backups.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Backup Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleFullBackup} disabled={downloading}>
                <Download className="w-4 h-4 mr-2" /> Download Full Backup
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSelectedBackup} disabled={!anySelected || downloading}>
                <Download className="w-4 h-4 mr-2" /> Download Selected Tables
              </Button>
              <Separator />
              <Button variant="secondary" className="w-full" onClick={handleFullExport} disabled={exporting}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export All Tables (Excel)
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSelectedExport} disabled={!anySelected || exporting}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Selected (Excel)
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleFullExportCsv} disabled={exporting}>
                <FileArchive className="w-4 h-4 mr-2" /> Export All Tables (CSV Zip)
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSelectedExportCsv} disabled={!anySelected || exporting}>
                <FileArchive className="w-4 h-4 mr-2" /> Export Selected (CSV Zip)
              </Button>
              <Separator />
              <div className="text-xs text-gray-600 space-y-2">
                <p className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                  <span>
                    Server must have PostgreSQL client tools installed (pg_dump). Configure environment variable <code>PG_DUMP_PATH</code> if pg_dump is not on PATH.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                  <span>
                    If you use Prisma Accelerate/Data Proxy, set a direct Postgres connection in <code>PG_BACKUP_URL</code>. Backups cannot run against the Prisma proxy URL.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                  <span>
                    Excel export runs in-app using Prisma and may be slower for very large datasets. Prefer provider snapshots or CI backups for production-scale databases.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" /> Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <Input
                  placeholder="Search tables (schema or name)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button variant="outline" onClick={loadTables} disabled={loading}>
                  <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Checkbox id="selectAll" checked={allSelected} onCheckedChange={(v) => toggleAll(Boolean(v))} />
                <Label htmlFor="selectAll">Select all in view ({filtered.length})</Label>
              </div>

              <div className="border rounded-md h-[420px]">
                <ScrollArea className="h-[420px]">
                  <div className="divide-y">
                    {loading ? (
                      <div className="p-4 text-sm text-gray-600">Loading tables…</div>
                    ) : filtered.length === 0 ? (
                      <div className="p-4 text-sm text-gray-600">No tables found</div>
                    ) : (
                      filtered.map((t) => (
                        <div key={t.fqtn} className="flex items-center gap-2 p-2">
                          <Checkbox id={t.fqtn} checked={!!selected[t.fqtn]} onCheckedChange={(v) => toggleOne(t.fqtn, Boolean(v))} />
                          <Label htmlFor={t.fqtn} className="cursor-pointer">
                            <span className="font-mono text-sm">{t.schema}</span>
                            <span className="mx-1 text-gray-400">.</span>
                            <span className="font-mono text-sm">{t.name}</span>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="mt-3 text-xs text-gray-500">Showing {filtered.length} of {tables.length} tables</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function parseContentDisposition(header: string | null): string | null {
  if (!header) return null;
  // Example: attachment; filename="db-backup-full-2025-09-07.sql"
  const match = /filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i.exec(header);
  const name = decodeURIComponent(match?.[1] || match?.[2] || "");
  return name || null;
}

async function safeParseError(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    const err = data?.error || null;
    const details = data?.details || data?.message || null;
    if (err && details) return `${err}: ${details}`;
    return err || details || null;
  } catch {
    return res.statusText || null;
  }
}
