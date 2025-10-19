"use client";

import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface PurchaseOrdersTableProps {
  initialData: any[];
  onSelectionChange: (ids: string[]) => void;
  onBulkAction: (action: "approve" | "cancel") => void;
}

export function PurchaseOrdersTable({
  initialData,
  onSelectionChange,
  onBulkAction,
}: PurchaseOrdersTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [globalFilter, setGlobalFilter] = useState("");

  const filteredData = initialData.filter(item =>
    item.orderNumber?.toLowerCase().includes(globalFilter.toLowerCase()) ||
    item.supplier?.name?.toLowerCase().includes(globalFilter.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
    onSelectionChange(Array.from(newSelection));
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
      onSelectionChange([]);
    } else {
      const allIds = new Set(filteredData.map(d => d.id));
      setSelectedIds(allIds);
      onSelectionChange(Array.from(allIds));
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search purchase orders..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size > 0 && selectedIds.size === filteredData.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Lines</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((po) => (
                <TableRow key={po.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(po.id)}
                      onCheckedChange={() => toggleSelection(po.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{po.orderNumber}</TableCell>
                  <TableCell>{po.supplier?.name || "N/A"}</TableCell>
                  <TableCell>{format(new Date(po.orderDate), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="font-medium">
                    ${Number(po.totalAmount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>{po._count?.purchaseOrderLines || 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        po.status === "RECEIVED"
                          ? "default"
                          : po.status === "PENDING"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {po.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No purchase orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50">
          <span className="font-medium">
            {selectedCount} PO{selectedCount > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onBulkAction("approve")}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onBulkAction("cancel")}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
