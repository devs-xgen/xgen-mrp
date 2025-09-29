"use client";

import { useState, useMemo, useEffect } from "react";
import { Download, Loader2, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDatabaseTables, exportTableToExcel, type DatabaseTableInfo } from "@/lib/actions/superadmin/data-export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SuperAdminExportDataPage() {
  const [tables, setTables] = useState<DatabaseTableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [loadingTables, setLoadingTables] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadTables = async () => {
      setLoadingTables(true);
      try {
        const list = await getDatabaseTables();
        if (isMounted) {
          setTables(list);
        }
      } catch (error) {
        console.error("Failed to load tables", error);
        const message = error instanceof Error ? error.message : "Unexpected error";
        toast({
          title: "Unable to fetch tables",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoadingTables(false);
        }
      }
    };

    loadTables();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const tableOptions = useMemo(() => {
    return tables.map((table) => ({
      value: table.name,
      label: table.name,
      rowEstimate: table.rowEstimate,
    }));
  }, [tables]);

  const handleTableSelect = (value: string) => {
    setSelectedTable(value);
  };

  const handleExport = async () => {
    if (!selectedTable || isExporting) return;
    setIsExporting(true);
    try {
      const result = await exportTableToExcel(selectedTable);
      const byteChars = atob(result.base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 200);

      toast({
        title: "Export started",
        description: `${result.filename} downloaded successfully`,
      });
    } catch (error) {
      console.error("Export failed", error);
      const message = error instanceof Error ? error.message : "Unexpected error";
      toast({
        title: "Export failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const selectedDetails = useMemo(() => {
    if (!selectedTable) return null;
    return tables.find((table) => table.name === selectedTable) ?? null;
  }, [selectedTable, tables]);

  const isExportDisabled = !selectedTable || isExporting;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Data Export</h1>
        <p className="text-sm text-muted-foreground">
          Download an Excel snapshot of any database table. This operation exports all rows currently in the table.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Select Table
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose a database table below then click export to generate an Excel file.
            </p>
          </div>
          <Button onClick={handleExport} disabled={isExportDisabled}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export to Excel
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            <Select value={selectedTable} onValueChange={handleTableSelect} disabled={loadingTables}>
              <SelectTrigger>
                <SelectValue placeholder={loadingTables ? "Loading tables..." : "Select a table"} />
              </SelectTrigger>
              <SelectContent>
                {tableOptions.map((table) => (
                  <SelectItem key={table.value} value={table.value}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="truncate font-medium">{table.label}</span>
                      <Badge variant="secondary" className="ml-auto whitespace-nowrap">
                        {table.rowEstimate.toLocaleString()} rows
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-48 rounded-md border bg-muted/30 p-4">
            {loadingTables ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading table metadata...
              </div>
            ) : selectedDetails ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">Selected Table</p>
                  <p className="text-sm text-muted-foreground">{selectedDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Estimated Rows</p>
                  <p className="text-sm text-muted-foreground">{selectedDetails.rowEstimate.toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Excel export includes all columns and rows from this table. For very large tables the download may
                  take additional time.
                </p>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a table to view details.
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
