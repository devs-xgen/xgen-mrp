"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, FileJson, FileCode } from "lucide-react";
import { AuditReportData } from "@/lib/actions/superadmin/audit-reports";
import {
  exportAuditToCSV,
  exportAuditToExcel,
  exportAuditToJSON,
  exportAuditToPDF,
} from "@/lib/utils/audit-export";

interface ReportPreviewProps {
  data: AuditReportData;
}

export function ReportPreview({ data }: ReportPreviewProps) {
  const handleExport = (format: "csv" | "excel" | "pdf" | "json") => {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `audit-report-${timestamp}`;

    switch (format) {
      case "csv":
        exportAuditToCSV(data, `${filename}.csv`);
        break;
      case "excel":
        exportAuditToExcel(data, `${filename}.xlsx`);
        break;
      case "json":
        exportAuditToJSON(data, `${filename}.json`);
        break;
      case "pdf":
        exportAuditToPDF(data, `${filename}.pdf`);
        break;
    }
  };

  if (data.entries.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No Audit Logs Found</p>
          <p className="text-sm mt-1">Try adjusting your date range or filters.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{data.summary.reportType}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {data.summary.period} • {data.summary.totalEntries.toLocaleString()} entries •{" "}
              {data.summary.uniqueUsers} unique users
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
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
                JSON (Full Data)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Breakdown */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2">Action Breakdown:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.summary.actionBreakdown)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([action, count]) => (
                <Badge key={action} variant="outline">
                  {action}: {count}
                </Badge>
              ))}
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.entries.slice(0, 1000).map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(entry.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{entry.userName}</p>
                      <p className="text-xs text-muted-foreground">{entry.userEmail}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {entry.userRole}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {entry.actionType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.entityType ? (
                      <div>
                        <p className="text-sm font-medium">{entry.entityType}</p>
                        {entry.entityId && (
                          <p className="text-xs text-muted-foreground font-mono">{entry.entityId}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">
                    {entry.description ? (
                      <p className="text-sm truncate">{entry.description}</p>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.ipAddress || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data.entries.length > 1000 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950 border-t border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Showing first 1,000 of {data.entries.length.toLocaleString()}{" "}
              entries. Export to CSV/JSON for complete data.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
