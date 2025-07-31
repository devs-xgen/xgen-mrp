"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyPHP } from "@/lib/constant"
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "./data-table-column-header";
import { SalesInvoiceWithItems } from "@/types/admin/billing";
import { MoreHorizontal, Eye, Edit, Download, Send, Copy, Trash2, Share2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { PDFDownloadButton } from "./pdf-download-button";
import { ShareLinkDialog } from "@/components/shared/ShareLinkDialog";



export const columns: ColumnDef<SalesInvoiceWithItems>[] = [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice Number" />
    ),
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors = {
        DRAFT: "bg-gray-100 text-gray-800",
        SENT: "bg-blue-100 text-blue-800",
        PAID: "bg-green-100 text-green-800",
        OVERDUE: "bg-red-100 text-red-800",
        CANCELLED: "bg-gray-100 text-gray-800",
        DISPUTED: "bg-yellow-100 text-yellow-800",
        PARTIAL: "bg-orange-100 text-orange-800",
      };

      return (
        <Badge 
          variant="secondary" 
          className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}
        >
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "billingStatement.customerName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const customerName = row.original.billingStatement?.customerName;
      const customer = row.original.billingStatement?.customer;
      
      return (
        <div>
          <div className="font-medium">{customerName || "Unknown Customer"}</div>
          {customer?.email && (
            <div className="text-sm text-muted-foreground">{customer.email}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "invoiceDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("invoiceDate") as Date;
      return <div>{formatDate(date)}</div>;
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("dueDate") as Date | null;
      if (!date) return <div className="text-muted-foreground">-</div>;
      
      const isOverdue = new Date() > date && row.original.status !== 'PAID';
      return (
        <div className={isOverdue ? "text-red-600 font-medium" : ""}>
          {formatDate(date)}
        </div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as number;
      return (
        <div className="font-medium">
          {formatCurrencyPHP(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "billingStatement.statementNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Billing Statement" />
    ),
    cell: ({ row }) => {
      const statementNumber = row.original.billingStatement?.statementNumber;
      const billingStatementId = row.original.billingStatement?.id;
      
      if (!statementNumber || !billingStatementId) {
        return <div className="text-muted-foreground">-</div>;
      }
      
      return (
        <Link 
          href={`/admin/billing/statements/${billingStatementId}`}
          className="text-blue-600 hover:underline"
        >
          {statementNumber}
        </Link>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const invoice = row.original;

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
              onClick={() => navigator.clipboard.writeText(invoice.id)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
            <PDFDownloadButton
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
            />
            <ShareLinkDialog
              documentType="sales-invoice"
              documentId={invoice.id}
              documentTitle={`Sales Invoice ${invoice.invoiceNumber}`}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Link
                </DropdownMenuItem>
              }
            />
            {invoice.status === 'DRAFT' && (
              <DropdownMenuItem>
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Invoice
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];