"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2, Camera, FileText, MapPin, Download, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeliveryReceiptWithBilling } from "@/types/admin/billing";
import { DataTableColumnHeader } from "./data-table-column-header";
import Link from "next/link";
import { toast } from "sonner";
import { downloadDeliveryReceiptPDF } from "@/lib/actions/delivery-receipts";
import { generateDeliveryReceiptPDFClient } from "@/lib/services/delivery-receipt-pdf";
import { ShareLinkDialog } from "@/components/shared/ShareLinkDialog";

export const columns: ColumnDef<DeliveryReceiptWithBilling>[] = [
  {
    accessorKey: "receiptNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Receipt Number" />
    ),
    cell: ({ row }) => {
      const receiptNumber = row.getValue("receiptNumber") as string;
      return (
        <div className="font-medium">
          <Link 
            href={`/admin/billing/delivery-receipts/${row.original.id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {receiptNumber}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "deliveryStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("deliveryStatus") as string;
      const statusColors = {
        PENDING: "bg-yellow-100 text-yellow-800",
        IN_TRANSIT: "bg-blue-100 text-blue-800",
        DELIVERED: "bg-green-100 text-green-800",
        CANCELLED: "bg-red-100 text-red-800",
        FAILED: "bg-red-100 text-red-800",
        RETURNED: "bg-orange-100 text-orange-800",
      };
      
      return (
        <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
          {status ? status.replace('_', ' ') : 'Unknown'}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "courierService",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Courier Service" />
    ),
    cell: ({ row }) => {
      const courierService = row.getValue("courierService") as string;
      return <div className="font-medium">{courierService}</div>;
    },
  },
  {
    accessorKey: "trackingNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tracking Number" />
    ),
    cell: ({ row }) => {
      const trackingNumber = row.getValue("trackingNumber") as string;
      return trackingNumber ? (
        <div className="font-mono text-sm">{trackingNumber}</div>
      ) : (
        <div className="text-gray-400">-</div>
      );
    },
  },
  {
    accessorKey: "deliveryDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Delivery Date" />
    ),
    cell: ({ row }) => {
      const deliveryDate = row.getValue("deliveryDate") as Date;
      return deliveryDate ? (
        <div className="text-sm">
          {new Date(deliveryDate).toLocaleDateString()}
        </div>
      ) : (
        <div className="text-gray-400">-</div>
      );
    },
  },
  {
    accessorKey: "billingStatement",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const billingStatement = row.original.billingStatement;
      const customerName = billingStatement?.customer?.name || 
                          billingStatement?.customerOrder?.customer?.name || 
                          "Unknown Customer";
      return <div className="font-medium">{customerName}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm text-gray-600">
          {new Date(createdAt).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const receipt = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(receipt.id)}
            >
              Copy receipt ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/billing/delivery-receipts/${receipt.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Receipt
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/billing/delivery-receipts/${receipt.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Receipt
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {receipt.signatureImage && (
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                View Signature
              </DropdownMenuItem>
            )}
            {receipt.photoEvidence && (
              <DropdownMenuItem>
                <Camera className="mr-2 h-4 w-4" />
                View Photo
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <MapPin className="mr-2 h-4 w-4" />
              View Address
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                try {
                  // Use the server action to get the receipt data
                  const result = await downloadDeliveryReceiptPDF(receipt.id);
                  
                  if (!result.success || !result.pdfData || !result.filename) {
                    throw new Error(result.error || "Failed to get receipt data");
                  }
                  
                  // Decode the receipt data from base64
                  const receiptDataString = atob(result.pdfData);
                  const receiptData = JSON.parse(receiptDataString);
                  
                  // Generate PDF on client side
                  const pdfUint8Array = generateDeliveryReceiptPDFClient(receiptData);
                  const blob = new Blob([pdfUint8Array], { type: 'application/pdf' });
                  
                  // Create download link
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `delivery-receipt-${receipt.receiptNumber}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  
                  toast.success("PDF exported successfully!");
                } catch (error) {
                  console.error("Export error:", error);
                  toast.error(error instanceof Error ? error.message : "Failed to export PDF");
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
            >
              <ShareLinkDialog
                documentType="delivery-receipt"
                documentId={receipt.id}
                documentTitle={`Delivery Receipt ${receipt.receiptNumber}`}
                trigger={
                  <div className="flex items-center w-full">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Link
                  </div>
                }
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];