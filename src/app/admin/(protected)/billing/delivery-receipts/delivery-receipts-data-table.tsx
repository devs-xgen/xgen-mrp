"use client";

import { useState } from "react";
import { DataTable } from "@/components/global/table/data-table";
import { 
  createSelectionColumn,
  createDateColumn,
} from "@/components/global/table/column-helpers";
import { getTableConfig } from "@/components/global/table/table-utils";
import { DeliveryReceiptWithBilling } from "@/types/admin/billing";
import { MoreHorizontal, Eye, Edit, Download, Truck, MapPin, Trash2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteDeliveryReceipt } from "@/lib/actions/delivery-receipts";
import { DeliveryReceiptsExportButton } from "@/components/module/admin/billing/delivery-receipts-export-button";

interface DeliveryReceiptsDataTableProps {
  data: DeliveryReceiptWithBilling[];
  onRefresh: () => void;
}

// Delivery Receipt Actions Cell Component
function DeliveryReceiptActionsCell({ 
  receipt, 
  onRefresh 
}: { 
  receipt: DeliveryReceiptWithBilling; 
  onRefresh: () => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = receipt.deliveryStatus === 'PENDING' || receipt.deliveryStatus === 'CANCELLED';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/admin/billing/delivery-receipts/${receipt.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/billing/delivery-receipts/${receipt.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Receipt
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/billing/delivery-receipts/${receipt.id}/track`}>
              <MapPin className="mr-2 h-4 w-4" />
              Track Delivery
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className={`text-destructive ${!canDelete ? 'opacity-60' : ''}`}
            onClick={() => {
              if (canDelete) {
                setDeleteDialogOpen(true);
              } else {
                toast.error("Only PENDING or CANCELLED delivery receipts can be deleted");
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Only receipts with status PENDING or CANCELLED can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  setIsDeleting(true);
                  const res = await deleteDeliveryReceipt(receipt.id);
                  if (res?.success) {
                    toast.success("Delivery receipt deleted successfully");
                    setDeleteDialogOpen(false);
                    onRefresh();
                  } else {
                    toast.error(res?.error || "Failed to delete delivery receipt");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to delete delivery receipt");
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DeliveryReceiptsDataTable({ 
  data, 
  onRefresh 
}: DeliveryReceiptsDataTableProps) {
  // Create columns using global table helpers
  const columns = [
    createSelectionColumn<DeliveryReceiptWithBilling>(),
    {
      accessorKey: "receiptNumber",
      header: "Receipt Number",
      cell: ({ row }) => {
        const receipt = row.original;
        return (
          <div className="font-medium">
            <Link 
              href={`/admin/billing/delivery-receipts/${receipt.id}`}
              className="hover:underline"
            >
              {receipt.receiptNumber}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "deliveryStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("deliveryStatus") as string;
        const statusConfig = {
          PENDING: { variant: "outline" as const, label: "Pending" },
          IN_TRANSIT: { variant: "secondary" as const, label: "In Transit" },
          DELIVERED: { variant: "default" as const, label: "Delivered" },
          FAILED: { variant: "destructive" as const, label: "Failed" },
          RETURNED: { variant: "destructive" as const, label: "Returned" },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || 
                      { variant: "outline" as const, label: status };
        return (
          <Badge variant={config.variant} className="capitalize">
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => {
        const customerName = row.original.billingStatement?.customerName || 
                            row.original.billingStatement?.customer?.name ||
                            'Unknown Customer';
        return <div className="font-medium">{customerName}</div>;
      },
    },
    {
      accessorKey: "deliveryAddress",
      header: "Delivery Address",
      cell: ({ row }) => {
        const address = row.getValue("deliveryAddress") as string;
        return (
          <div className="max-w-[200px] truncate">
            {address || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "courierService",
      header: "Courier",
      cell: ({ row }) => {
        const courier = row.getValue("courierService") as string;
        return courier ? (
          <Badge variant="outline" className="flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {courier}
          </Badge>
        ) : "-";
      },
    },
    createDateColumn<DeliveryReceiptWithBilling>("deliveryDate", "Delivery Date"),
    createDateColumn<DeliveryReceiptWithBilling>("createdAt", "Created"),
    {
      accessorKey: "trackingNumber",
      header: "Tracking",
      cell: ({ row }) => {
        const tracking = row.getValue("trackingNumber") as string;
        return tracking ? (
          <div className="font-mono text-sm">{tracking}</div>
        ) : "-";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const receipt = row.original;
        return (
          <DeliveryReceiptActionsCell
            receipt={receipt}
            onRefresh={onRefresh}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // Get predefined table config
  const tableConfig = getTableConfig("delivery-receipts");

  return (
    <DataTable
      columns={columns}
      data={data}
      {...tableConfig}
      customToolbarActions={<DeliveryReceiptsExportButton />}
    />
  );
}
