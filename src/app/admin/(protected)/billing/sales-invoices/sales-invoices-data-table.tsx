"use client";

import { DataTable } from "@/components/global/table/data-table";
import { 
  createSelectionColumn,
  createCurrencyColumn,
  createDateColumn,
} from "@/components/global/table/column-helpers";
import { getTableConfig } from "@/components/global/table/table-utils";
import { SalesInvoiceWithItems } from "@/types/admin/billing";
import { MoreHorizontal, Eye, Edit, Trash2, Share2 } from "lucide-react";
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
import { PDFDownloadButton } from "@/components/module/admin/billing/sales-invoices/pdf-download-button";
import { ShareLinkDialog } from "@/components/shared/ShareLinkDialog";
import { useState } from "react";
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
import { deleteSalesInvoice } from "@/lib/actions/sales-invoices";

interface SalesInvoicesDataTableProps {
  data: SalesInvoiceWithItems[];
  onRefresh: () => void;
}

// Sales Invoice Actions Cell Component
function SalesInvoiceActionsCell({ 
  invoice, 
  onRefresh 
}: { 
  invoice: SalesInvoiceWithItems; 
  onRefresh: () => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/admin/billing/sales-invoices/${invoice.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          {invoice.status === 'DRAFT' ? (
            <DropdownMenuItem asChild>
              <Link href={`/admin/billing/sales-invoices/${invoice.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => toast.error('Only draft invoices can be edited')}
              className="opacity-60"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Invoice
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <ShareLinkDialog
            documentType="sales-invoice"
            documentId={invoice.id as string}
            documentTitle={`Sales Invoice ${invoice.invoiceNumber}`}
            onOpenChange={(open) => { if (!open) onRefresh(); }}
            trigger={
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem asChild>
            <PDFDownloadButton 
              invoiceId={invoice.id as string}
              invoiceNumber={invoice.invoiceNumber}
              className="w-full justify-start p-0 h-auto font-normal"
            />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={`text-destructive ${invoice.status !== 'DRAFT' ? 'opacity-60' : ''}`}
            onClick={() => {
              if (invoice.status !== 'DRAFT') {
                toast.error('Only draft invoices can be deleted');
              } else {
                setDeleteDialogOpen(true);
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
            <AlertDialogTitle>Delete Sales Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Only draft invoices can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  setIsDeleting(true);
                  const res = await deleteSalesInvoice(invoice.id as string);
                  if (res?.success) {
                    toast.success('Sales invoice deleted successfully');
                    setDeleteDialogOpen(false);
                    onRefresh();
                  } else {
                    toast.error(res?.error || 'Failed to delete sales invoice');
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to delete sales invoice');
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

export function SalesInvoicesDataTable({ 
  data, 
  onRefresh 
}: SalesInvoicesDataTableProps) {
  // Create columns using global table helpers
  const columns = [
    createSelectionColumn<SalesInvoiceWithItems>(),
    {
      accessorKey: "invoiceNumber",
      header: "Invoice Number",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="font-medium">
            <Link 
              href={`/admin/billing/sales-invoices/${invoice.id}`}
              className="hover:underline"
            >
              {invoice.invoiceNumber}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const map: Record<string, { variant: "default"|"secondary"|"destructive"|"outline"; label: string }> = {
          DRAFT: { variant: "outline", label: "Draft" },
          SENT: { variant: "secondary", label: "Sent" },
          PAID: { variant: "default", label: "Paid" },
          OVERDUE: { variant: "destructive", label: "Overdue" },
          CANCELLED: { variant: "destructive", label: "Cancelled" },
          PARTIAL: { variant: "secondary", label: "Partial" },
          DISPUTED: { variant: "secondary", label: "Disputed" },
        };
        const config = map[status] || { variant: "outline", label: status };
        return <Badge variant={config.variant} className="capitalize">{config.label}</Badge>;
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => {
        const customerName = row.original.billingStatement?.customer?.name || 
                             row.original.billingStatement?.customerName ||
                             'Unknown Customer';
        return <div className="font-medium">{customerName}</div>;
      },
    },
    createCurrencyColumn<SalesInvoiceWithItems>("totalAmount", "Total Amount", "PHP"),
    createDateColumn<SalesInvoiceWithItems>("invoiceDate", "Invoice Date"),
    createDateColumn<SalesInvoiceWithItems>("dueDate", "Due Date"),
    {
      accessorKey: "paymentTerms",
      header: "Payment Terms",
      cell: ({ row }) => {
        const terms = row.getValue("paymentTerms") as string;
        return <Badge variant="outline">{terms || "Standard"}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <SalesInvoiceActionsCell
            invoice={invoice}
            onRefresh={onRefresh}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // Get predefined table config
  const tableConfig = getTableConfig("sales-invoices");

  return (
    <DataTable
      columns={columns}
      data={data}
      {...tableConfig}
    />
  );
}
