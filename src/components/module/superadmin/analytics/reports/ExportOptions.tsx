"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, FileJson, FileCode } from "lucide-react";
import { ReportConfig } from "@/lib/actions/superadmin/analytics/reports";
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToPDF,
} from "@/lib/utils/report-export";

interface ExportOptionsProps {
  data: any[];
  config: ReportConfig;
}

export function ExportOptions({ data, config }: ExportOptionsProps) {
  const handleExport = (format: "csv" | "excel" | "pdf" | "json") => {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }

    const filename = (config.name || "report").replace(/[^a-z0-9]/gi, "_").toLowerCase();

    switch (format) {
      case "csv":
        exportToCSV(data, `${filename}.csv`);
        break;
      case "excel":
        exportToExcel(data, `${filename}.xlsx`);
        break;
      case "json":
        exportToJSON(data, config, `${filename}.json`);
        break;
      case "pdf":
        exportToPDF(data, config, `${filename}.pdf`);
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={!data || data.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          CSV (Excel Compatible)
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileText className="h-4 w-4 mr-2" />
          Excel (.xlsx)
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileCode className="h-4 w-4 mr-2" />
          PDF (Print)
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="h-4 w-4 mr-2" />
          JSON (with metadata)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
