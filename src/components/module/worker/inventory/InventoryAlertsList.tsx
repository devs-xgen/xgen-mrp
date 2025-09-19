"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  InventoryIssueReport,
  InventoryPagination,
} from "@/types/worker/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/global/table";
import { createActionsColumn } from "@/components/global/table";
import { ColumnDef } from "@tanstack/react-table";

interface InventoryAlertsListProps {
  issues: InventoryIssueReport[];
  pagination: InventoryPagination;
  viewOnly?: boolean;
}

export function InventoryAlertsList({
  issues,
  pagination,
  viewOnly = false,
}: InventoryAlertsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all"
  );
  const [selectedIssue, setSelectedIssue] =
    useState<InventoryIssueReport | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState<boolean>(false);

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            High
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge variant="default" className="flex items-center space-x-1">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Medium
          </Badge>
        );
      case "LOW":
        return (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Low
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center space-x-1">
            {severity}
          </Badge>
        );
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge
            variant="outline"
            className="flex items-center space-x-1 border-red-500 text-red-500"
          >
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Open
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            variant="outline"
            className="flex items-center space-x-1 border-blue-500 text-blue-500"
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            In Progress
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge
            variant="outline"
            className="flex items-center space-x-1 border-green-500 text-green-500"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Resolved
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get report type badge
  const getReportTypeBadge = (reportType: string) => {
    switch (reportType) {
      case "LOW_STOCK":
        return <Badge>Low Stock</Badge>;
      case "DISCREPANCY":
        return <Badge variant="secondary">Discrepancy</Badge>;
      case "DAMAGE":
        return <Badge variant="destructive">Damage</Badge>;
      case "QUALITY":
        return <Badge variant="outline">Quality Issue</Badge>;
      case "OTHER":
        return <Badge variant="outline">Other</Badge>;
      default:
        return <Badge variant="outline">{reportType}</Badge>;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM dd, yyyy HH:mm");
  };

  // Define DataTable columns
  const columns: ColumnDef<InventoryIssueReport>[] = [
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => getReportTypeBadge(row.original.reportType),
    },
    {
      accessorKey: "inventoryItemName",
      header: "Item",
      cell: ({ row }) => <div className="font-medium">{row.original.inventoryItemName}</div>,
    },
    {
      id: "severity",
      header: "Severity",
      cell: ({ row }) => getSeverityBadge(row.original.severity),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "reported",
      header: "Reported",
      cell: ({ row }) => formatDate(row.original.reportDate),
    },
    {
      accessorKey: "reportedByName",
      header: "Reported By",
    },
    createActionsColumn<InventoryIssueReport>([
      {
        label: "View Details",
        onClick: (issue) => {
          setSelectedIssue(issue);
          setShowDetailsDialog(true);
        },
      },
    ]),
  ];

  // Generate pagination items
  const getPaginationItems = () => {
    const { page, totalPages } = pagination;
    const items = [];

    // Create a range of pages to show
    const range = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    // Show ellipsis at the beginning if needed
    if (startPage > 1) {
      items.push(
        <Button
          key="start"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(1)}
        >
          1
        </Button>
      );

      if (startPage > 2) {
        items.push(
          <span key="ellipsis-start" className="mx-1">
            ...
          </span>
        );
      }
    }

    // Add the page range
    for (const p of range) {
      items.push(
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(p)}
        >
          {p}
        </Button>
      );
    }

    // Show ellipsis at the end if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <span key="ellipsis-end" className="mx-1">
            ...
          </span>
        );
      }

      items.push(
        <Button
          key="end"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }

    return items;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="w-[200px]">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent>
          {issues.length === 0 ? (
            <div className="rounded-md border p-6 text-center text-muted-foreground">
              No issue reports found
            </div>
          ) : (
            <DataTable<InventoryIssueReport, unknown>
              columns={columns}
              data={issues}
              enableFiltering={false}
              enablePagination={false}
            />
          )}
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              pagination.page > 1 && handlePageChange(pagination.page - 1)
            }
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-1">
            {getPaginationItems()}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              pagination.page < pagination.totalPages &&
              handlePageChange(pagination.page + 1)
            }
            disabled={pagination.page >= pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedIssue && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Issue Report Details</DialogTitle>
              <DialogDescription>
                View details of the selected inventory issue report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Item
                  </div>
                  <div className="font-medium">
                    {selectedIssue.inventoryItemName}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Report Type
                  </div>
                  <div>{getReportTypeBadge(selectedIssue.reportType)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Status
                  </div>
                  <div>{getStatusBadge(selectedIssue.status)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Severity
                  </div>
                  <div>{getSeverityBadge(selectedIssue.severity)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Reported By
                  </div>
                  <div>{selectedIssue.reportedByName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Report Date
                  </div>
                  <div>{formatDate(selectedIssue.reportDate)}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Description
                </div>
                <div className="rounded-md border p-3 mt-1">
                  {selectedIssue.description}
                </div>
              </div>

              {selectedIssue.resolution && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Resolution
                  </div>
                  <div className="rounded-md border p-3 mt-1">
                    {selectedIssue.resolution}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
