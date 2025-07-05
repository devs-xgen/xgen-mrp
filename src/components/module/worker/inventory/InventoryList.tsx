"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InventoryItem, InventoryPagination } from "@/types/worker/inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Plus,
  AlertTriangle,
  Loader2,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { StockLevelIndicator } from "./StockLevelIndicator";
import { toast } from "@/hooks/use-toast";

interface InventoryListProps {
  items: InventoryItem[];
  pagination: InventoryPagination;
  viewOnly?: boolean;
}

export function InventoryList({ items, pagination, viewOnly = false }: InventoryListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortField, setSortField] = useState<string>(
    searchParams.get("sort") || "name"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    searchParams.get("direction") === "desc" ? "desc" : "asc"
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showIssueDialog, setShowIssueDialog] = useState<boolean>(false);
  const [showMovementDialog, setShowMovementDialog] = useState<boolean>(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState<boolean>(false);

  const handleSort = (field: string) => {
    const direction =
      field === sortField && sortDirection === "asc" ? "desc" : "asc";

    setSortField(field);
    setSortDirection(direction);

    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", field);
    params.set("direction", direction);
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const getSortIcon = (field: string) => {
    if (field !== sortField) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const calculateValue = (item: InventoryItem) => {
    return item.currentStock * item.cost;
  };

  // Mock function for reporting an issue - to be connected to the real server action
  const reportIssue = async (
    item: InventoryItem,
    issueType: string,
    notes: string
  ) => {
    setLoading(true);
    // This would be replaced with a call to the actual server action
    setTimeout(() => {
      setLoading(false);
      setShowIssueDialog(false);
      toast({
        title: "Issue reported",
        description: `Issue reported for ${item.name}`,
      });
    }, 1000);
  };

  // Mock function for recording movement - to be connected to the real server action
  const recordMovement = async (
    item: InventoryItem,
    quantity: number,
    movementType: string,
    notes: string
  ) => {
    setLoading(true);
    // This would be replaced with a call to the actual server action
    setTimeout(() => {
      setLoading(false);
      setShowMovementDialog(false);
      toast({
        title: "Movement recorded",
        description: `Movement recorded for ${item.name}`,
      });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-medium"
                      onClick={() => handleSort("sku")}
                    >
                      SKU
                      {getSortIcon("sku")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-medium"
                      onClick={() => handleSort("name")}
                    >
                      Name
                      {getSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[140px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-medium"
                      onClick={() => handleSort("stockLevel")}
                    >
                      Stock Level
                      {getSortIcon("stockLevel")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-medium"
                      onClick={() => handleSort("currentStock")}
                    >
                      Quantity
                      {getSortIcon("currentStock")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right w-[100px]">Unit</TableHead>
                  <TableHead className="text-right w-[120px]">Value</TableHead>
                  {!viewOnly && (
                    <TableHead className="text-right w-[100px]">
                      Actions
                    </TableHead>
                  )}
                  {viewOnly && (
                    <TableHead className="text-right w-[100px]">
                      Details
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={viewOnly ? 7 : 7} className="text-center py-4">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.sku}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                      </TableCell>
                      <TableCell>
                        <StockLevelIndicator level={item.stockLevel} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.currentStock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.unitOfMeasure}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(calculateValue(item))}
                      </TableCell>
                      <TableCell className="text-right">
                        {viewOnly ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <span className="sr-only">Open menu</span>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowMovementDialog(true);
                                }}
                              >
                                <MoveHorizontal className="mr-2 h-4 w-4" />
                                Record Movement
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowIssueDialog(true);
                                }}
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Report Issue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
          {Math.min(
            pagination.page * pagination.pageSize,
            pagination.totalItems
          )}{" "}
          of {pagination.totalItems} items
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === pagination.totalPages ||
                  Math.abs(page - pagination.page) <= 1
              )
              .map((page, index, array) => (
                <div key={page} className="flex items-center">
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={
                      page === pagination.page ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                </div>
              ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Details Dialog for View-Only Mode */}
      {viewOnly && selectedItem && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedItem.name}</DialogTitle>
              <DialogDescription>
                Detailed information about this inventory item
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <p className="font-mono">{selectedItem.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                  <p>{selectedItem.currentStock} {selectedItem.unitOfMeasure}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reorder Point</label>
                  <p>{selectedItem.reorderPoint} {selectedItem.unitOfMeasure}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Critical Point</label>
                  <p>{selectedItem.criticalPoint} {selectedItem.unitOfMeasure}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unit Cost</label>
                  <p>{formatCurrency(selectedItem.cost)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Value</label>
                  <p>{formatCurrency(calculateValue(selectedItem))}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stock Status</label>
                  <StockLevelIndicator level={selectedItem.stockLevel} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location ID</label>
                  <p>{selectedItem.locationId}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{selectedItem.lastUpdated}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Issue Report Dialog - Only shown when not in view-only mode */}
      {!viewOnly && selectedItem && (
        <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Issue for {selectedItem.name}</DialogTitle>
              <DialogDescription>
                Report stock discrepancies, damage, or quality issues with this
                item.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Issue form would go here */}
              <p>
                Current stock: {selectedItem.currentStock}{" "}
                {selectedItem.unitOfMeasure}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowIssueDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  reportIssue(selectedItem, "DISCREPANCY", "Test note")
                }
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Movement Record Dialog - Only shown when not in view-only mode */}
      {!viewOnly && selectedItem && (
        <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Movement for {selectedItem.name}</DialogTitle>
              <DialogDescription>
                Record consumption, transfers, or other inventory movements.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Movement form would go here */}
              <p>
                Current stock: {selectedItem.currentStock}{" "}
                {selectedItem.unitOfMeasure}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowMovementDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  recordMovement(selectedItem, 1, "CONSUMPTION", "Test note")
                }
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Movement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
