"use client";

import { useState } from "react";
import { DataTable } from "@/components/global/table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  DollarSign,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { SuperadminOverrideStatusDialog } from "./SuperadminOverrideStatusDialog";
import { SuperadminOverrideCostsDialog } from "./SuperadminOverrideCostsDialog";
import { SuperadminOverrideQuantityDialog } from "./SuperadminOverrideQuantityDialog";
import { SuperadminOverrideDatesDialog } from "./SuperadminOverrideDatesDialog";
import { SuperadminDeleteProductionOrderDialog } from "./SuperadminDeleteProductionOrderDialog";
import { SuperadminBulkUpdateDialog } from "./SuperadminBulkUpdateDialog";

interface ProductionOrderData {
  id: string;
  productName: string;
  productSku: string;
  variantDisplayName?: string;
  quantity: number;
  completedQuantity: number;
  startDate: Date;
  dueDate: Date;
  status: string;
  priority: string;
  customerOrderNumber?: string;
  customerName?: string;
  plannedMaterialCost: number;
  actualMaterialCost: number;
  materialVariance: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  modifiedBy?: string;
  operationsCount: number;
  completedOperations: number;
  qualityChecksCount: number;
  hasDelivery: boolean;
  isOverdue: boolean;
}

interface SuperadminProductionOrdersTableProps {
  data: ProductionOrderData[];
}

export function SuperadminProductionOrdersTable({
  data,
}: SuperadminProductionOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrderData | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [overrideDialog, setOverrideDialog] = useState<
    "status" | "costs" | "quantity" | "dates" | "delete" | null
  >(null);

  const columns: ColumnDef<ProductionOrderData>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.original.id.substring(0, 8)}</div>
      ),
    },
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.productName}</div>
          <div className="text-xs text-muted-foreground">{row.original.productSku}</div>
          {row.original.variantDisplayName && (
            <Badge variant="outline" className="mt-1 text-xs">
              {row.original.variantDisplayName}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          {row.original.customerName ? (
            <>
              <div className="font-medium text-sm">{row.original.customerName}</div>
              {row.original.customerOrderNumber && (
                <div className="text-xs text-muted-foreground">
                  #{row.original.customerOrderNumber}
                </div>
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-sm">Standalone</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">
            {row.original.completedQuantity}/{row.original.quantity}
          </div>
          <div className="text-xs text-muted-foreground">
            {Math.round((row.original.completedQuantity / row.original.quantity) * 100)}%
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const isOverdue = row.original.isOverdue;

        return (
          <div className="flex items-center gap-2">
            <Badge
              variant={
                status === "COMPLETED"
                  ? "default"
                  : status === "IN_PROGRESS"
                  ? "secondary"
                  : status === "CANCELLED"
                  ? "destructive"
                  : "outline"
              }
            >
              {status}
            </Badge>
            {isOverdue && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.priority === "CRITICAL"
              ? "destructive"
              : row.original.priority === "URGENT"
              ? "destructive"
              : "outline"
          }
        >
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: "materialVariance",
      header: "Cost Variance",
      cell: ({ row }) => {
        const variance = row.original.materialVariance;
        const isNegative = variance < 0;
        const isPositive = variance > 0;

        return (
          <div className="flex items-center gap-1">
            {isPositive && <TrendingUp className="h-4 w-4 text-red-500" />}
            {isNegative && <TrendingDown className="h-4 w-4 text-green-500" />}
            <span
              className={`font-medium ${
                isPositive ? "text-red-600" : isNegative ? "text-green-600" : ""
              }`}
            >
              ₱{Math.abs(variance).toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <div className={row.original.isOverdue ? "text-destructive font-medium" : ""}>
          {format(new Date(row.original.dueDate), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "modifiedBy",
      header: "Last Modified",
      cell: ({ row }) => (
        <div className="text-xs">
          <div>{format(new Date(row.original.updatedAt), "MMM dd, HH:mm")}</div>
          {row.original.modifiedBy && (
            <div className="text-muted-foreground">{row.original.modifiedBy}</div>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Override Actions</div>,
      cell: ({ row }) => {
        const order = row.original;

        return (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Superadmin Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* View */}
                <Link href={`/superadmin/production/${order.id}`}>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                {/* Override Actions */}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Override Functions
                </DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => {
                    setSelectedOrder(order);
                    setOverrideDialog("status");
                  }}
                >
                  <Edit className="mr-2 h-4 w-4 text-amber-600" />
                  Override Status
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setSelectedOrder(order);
                    setOverrideDialog("costs");
                  }}
                >
                  <DollarSign className="mr-2 h-4 w-4 text-amber-600" />
                  Override Costs
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setSelectedOrder(order);
                    setOverrideDialog("quantity");
                  }}
                >
                  <Package className="mr-2 h-4 w-4 text-amber-600" />
                  Override Quantity
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setSelectedOrder(order);
                    setOverrideDialog("dates");
                  }}
                >
                  <Calendar className="mr-2 h-4 w-4 text-amber-600" />
                  Override Dates
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Dangerous Actions */}
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedOrder(order);
                    setOverrideDialog("delete");
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Force Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {/* Bulk Actions Toolbar */}
      {selectedRowIds.length > 0 && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {selectedRowIds.length} order{selectedRowIds.length > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRowIds([])}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={() => setShowBulkDialog(true)}
              >
                <Shield className="mr-2 h-4 w-4" />
                Bulk Update ({selectedRowIds.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        searchKey="productName"
        searchPlaceholder="Search by product, customer, or order ID..."
        enableSelection={true}
        enableFiltering={true}
        filterOptions={[
          {
            column: "status",
            title: "Status",
            options: [
              { label: "Pending", value: "PENDING" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Cancelled", value: "CANCELLED" },
            ],
          },
          {
            column: "priority",
            title: "Priority",
            options: [
              { label: "Critical", value: "CRITICAL" },
              { label: "Urgent", value: "URGENT" },
              { label: "High", value: "HIGH" },
              { label: "Medium", value: "MEDIUM" },
              { label: "Low", value: "LOW" },
            ],
          },
        ]}
      />

      {/* Bulk Update Dialog */}
      <SuperadminBulkUpdateDialog
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
        selectedOrderIds={selectedRowIds}
        onSuccess={() => setSelectedRowIds([])}
      />

      {/* Override Dialogs */}
      {selectedOrder && (
        <>
          <SuperadminOverrideStatusDialog
            open={overrideDialog === "status"}
            onOpenChange={(open) => !open && setOverrideDialog(null)}
            order={selectedOrder}
          />
          <SuperadminOverrideCostsDialog
            open={overrideDialog === "costs"}
            onOpenChange={(open) => !open && setOverrideDialog(null)}
            order={selectedOrder}
          />
          <SuperadminOverrideQuantityDialog
            open={overrideDialog === "quantity"}
            onOpenChange={(open) => !open && setOverrideDialog(null)}
            order={selectedOrder}
          />
          <SuperadminOverrideDatesDialog
            open={overrideDialog === "dates"}
            onOpenChange={(open) => !open && setOverrideDialog(null)}
            order={selectedOrder}
          />
          <SuperadminDeleteProductionOrderDialog
            open={overrideDialog === "delete"}
            onOpenChange={(open) => !open && setOverrideDialog(null)}
            order={selectedOrder}
          />
        </>
      )}
    </>
  );
}
