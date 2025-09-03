"use client";

import { DataTable } from "@/components/global/table/data-table";
import { 
  createSelectionColumn,
  createTextColumn,
  createStatusColumn,
  createCurrencyColumn,
  createDateColumn,
} from "@/components/global/table/column-helpers";
import { getTableConfig } from "@/components/global/table/table-utils";
import { SalesInvoiceWithItems } from "@/types/admin/billing";
import { MoreHorizontal, Eye, Edit, Download, Send, Copy, Trash2, Share2 } from "lucide-react";
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
import { formatDate } from "@/components/global/table/table-utils";
import { PDFDownloadButton } from "@/components/module/admin/billing/sales-invoices/pdf-download-button";
import { ShareLinkDialog } from "@/components/shared/ShareLinkDialog";
import { useState } from "react";

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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

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
          <DropdownMenuItem asChild>
            <Link href={`/admin/billing/sales-invoices/${invoice.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Invoice
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Link
          </DropdownMenuItem>
          <DropdownMenuItem>
            <PDFDownloadButton 
              invoice={invoice} 
              className="w-full justify-start p-0 h-auto font-normal"
              variant="ghost"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </PDFDownloadButton>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareLinkDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        document={{
          id: invoice.id,
          type: 'sales-invoice',
          title: `Sales Invoice ${invoice.invoiceNumber}`,
          description: `Invoice for ${invoice.billingStatements?.[0]?.customer?.name || 'Customer'}`
        }}
        onSuccess={() => {
          setShareDialogOpen(false);
          onRefresh();
        }}
      />
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
    createStatusColumn<SalesInvoiceWithItems>("status", "Status", {
      DRAFT: { variant: "outline", label: "Draft" },
      SENT: { variant: "secondary", label: "Sent" },
      PAID: { variant: "default", label: "Paid" },
      OVERDUE: { variant: "destructive", label: "Overdue" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
    }),
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => {
        const customerName = row.original.billingStatements?.[0]?.customer?.name || 
                            row.original.billingStatements?.[0]?.customerName ||
                            'Unknown Customer';
        return <div className="font-medium">{customerName}</div>;
      },
    },
    createCurrencyColumn<SalesInvoiceWithItems>("totalAmount", "Total Amount", "PHP"),
    createDateColumn<SalesInvoiceWithItems>("issueDate", "Issue Date"),
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
