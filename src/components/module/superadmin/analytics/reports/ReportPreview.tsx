"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ReportConfig } from "@/lib/actions/superadmin/analytics/reports";

interface ReportPreviewProps {
  data: any[];
  config: ReportConfig;
}

export function ReportPreview({ data, config }: ReportPreviewProps) {
  if (data.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No Results Found</p>
          <p className="text-sm mt-1">Try adjusting your filters or selecting different fields.</p>
        </div>
      </Card>
    );
  }

  const headers = Object.keys(data[0]);

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "object" && value instanceof Date) {
      return new Date(value).toLocaleDateString();
    }
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      // ISO date string
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Report Results</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Showing {data.length.toLocaleString()} rows
              {config.limit && data.length >= config.limit && " (limited)"}
            </p>
          </div>
          <div className="flex gap-2">
            {config.entities.map(entity => (
              <Badge key={entity} variant="outline">
                {entity}
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
                <TableHead className="w-12">#</TableHead>
                {headers.map(header => (
                  <TableHead key={header} className="whitespace-nowrap">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  {headers.map(header => (
                    <TableCell key={header} className="whitespace-nowrap">
                      {formatCellValue(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Footer Note */}
      {config.limit && data.length >= config.limit && (
        <Card className="p-3 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Results are limited to {config.limit.toLocaleString()} rows.
            Use filters to refine your results if needed.
          </p>
        </Card>
      )}
    </div>
  );
}
