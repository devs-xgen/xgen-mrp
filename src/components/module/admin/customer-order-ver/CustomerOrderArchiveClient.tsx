"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Archive, Calendar, DollarSign, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { 
  DataTable, 
  createTextColumn, 
  createDateColumn, 
  createCurrencyColumn,
  createActionsColumn,
  getTableConfig,
  createSortableHeader
} from "@/components/global/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/page-layout";
import { formatCurrencyPHP } from "@/lib/constant";

interface OrderArchiveEntry {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  archivedAt: Date;
  archivedBy: string;
  archiveReason: string;
  originalData: any;
  fulfillmentSummary: {
    totalItems: number;
    totalQuantity: number;
    completionRate: number;
    stockFulfilled: number;
    productionFulfilled: number;
    productionOrdersCreated: number;
  };
  billingStatus: string;
  totalValue: number;
  restorable: boolean;
}

interface CustomerOrderArchiveClientProps {
  initialArchives: OrderArchiveEntry[];
  total: number;
  pageCount: number;
}

const billingStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  PARTIAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  DISPUTED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

export function CustomerOrderArchiveClient({
  initialArchives,
  total,
  pageCount,
}: CustomerOrderArchiveClientProps) {
  const router = useRouter();
  const [archives] = useState<OrderArchiveEntry[]>(initialArchives);

  // Calculate summary stats safely
  const totalValue = archives.reduce((sum, archive) => sum + (archive.totalValue || 0), 0);
  const uniqueCustomers = new Set(archives.map(archive => archive.customerName)).size;
  const restorableCount = archives.filter(archive => archive.restorable).length;

  const columns: ColumnDef<OrderArchiveEntry>[] = useMemo(() => [
    // Order Number
    {
      accessorKey: "orderNumber",
      header: createSortableHeader("Order Number"),
      cell: ({ row }) => {
        const archive = row.original;
        return (
          <div className="font-medium">
            {archive.orderNumber}
          </div>
        );
      },
    },

    // Customer Name
    {
      accessorKey: "customerName",
      header: createSortableHeader("Customer"),
      cell: ({ row }) => {
        const archive = row.original;
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{archive.customerName}</span>
          </div>
        );
      },
    },

    // Archive Date
    {
      accessorKey: "archivedAt",
      header: createSortableHeader("Archived Date"),
      cell: ({ row }) => {
        const date = row.original.archivedAt;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
        );
      },
    },

    // Archived By
    {
      accessorKey: "archivedBy",
      header: "Archived By",
      cell: ({ row }) => {
        return (
          <span className="text-sm text-muted-foreground">
            {row.original.archivedBy}
          </span>
        );
      },
    },

    // Archive Reason
    {
      accessorKey: "archiveReason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.original.archiveReason;
        return (
          <div className="max-w-xs">
            <span className="text-sm truncate" title={reason}>
              {reason}
            </span>
          </div>
        );
      },
    },

    // Total Value
    {
      accessorKey: "totalValue",
      header: createSortableHeader("Total Value"),
      cell: ({ row }) => {
        const value = row.original.totalValue;
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatCurrencyPHP(value)}</span>
          </div>
        );
      },
    },

    // Billing Status
    {
      accessorKey: "billingStatus",
      header: "Billing Status",
      cell: ({ row }) => {
        const status = row.original.billingStatus;
        const colorClass = billingStatusColors[status] || billingStatusColors.DRAFT;
        
        return (
          <Badge className={colorClass}>
            {status}
          </Badge>
        );
      },
    },

    // Fulfillment Summary
    {
      id: "fulfillment",
      header: "Fulfillment",
      cell: ({ row }) => {
        const summary = row.original.fulfillmentSummary;
        
        return (
          <div className="text-sm space-y-1" title={`Items: ${summary.totalItems}, Quantity: ${summary.totalQuantity}, Completion: ${summary.completionRate}%, Stock: ${summary.stockFulfilled}, Production: ${summary.productionFulfilled}, Production Orders: ${summary.productionOrdersCreated}`}>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">{summary.totalItems}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Qty:</span>
              <span className="font-medium">{summary.totalQuantity}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Rate:</span>
              <Badge variant="outline" className="text-xs">
                {summary.completionRate}%
              </Badge>
            </div>
          </div>
        );
      },
    },

    // Restorable Status
    {
      accessorKey: "restorable",
      header: "Restorable",
      cell: ({ row }) => {
        const restorable = row.original.restorable;
        
        return (
          <Badge variant={restorable ? "default" : "secondary"}>
            {restorable ? "Yes" : "No"}
          </Badge>
        );
      },
    },

    // Actions
    createActionsColumn<OrderArchiveEntry>([
      {
        label: "View Details",
        icon: Eye,
        onClick: (archive) => {
          // Navigate to the original order details page
          router.push(`/admin/customer-orders-v2/${archive.orderId}`);
        },
      },
    ]),
  ], [router]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Total Archives</span>
          </div>
          <p className="text-2xl font-bold mt-2">{total}</p>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Total Value</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {formatCurrencyPHP(totalValue)}
          </p>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Customers</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {uniqueCustomers}
          </p>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Restorable</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {restorableCount}
          </p>
        </div>
      </div>

      {/* Archives Table */}
      <SectionCard heading="Archived Orders">
        {archives.length > 0 ? (
          <DataTable
            columns={columns}
            data={archives}
            {...getTableConfig("archived-customer-orders")}
          />
        ) : (
          <div className="text-center py-12">
            <Archive className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No Archived Orders</h3>
            <p className="text-muted-foreground mb-4">
              There are no archived customer orders yet.
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/customer-orders-v2')}
            >
              View Active Orders
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
