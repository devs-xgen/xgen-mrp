"use client";

import Link from "next/link";
import { Plus, Receipt, MoreHorizontal, Eye, Edit, Download, Send, Trash2 } from "lucide-react";
import { formatCurrencyPHP } from "@/lib/constant";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import types
import { SalesInvoiceWithItems, InvoiceStatus } from "@/types/admin/billing";

interface SalesInvoiceListProps {
  invoices: SalesInvoiceWithItems[];
  onStatusUpdate?: (invoiceId: string, status: InvoiceStatus) => Promise<void>;
  onDelete?: (invoiceId: string) => Promise<void>;
}

export function SalesInvoiceList({ 
  invoices, 
  onStatusUpdate, 
  onDelete 
}: SalesInvoiceListProps) {
  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return <Badge variant="secondary">Draft</Badge>;
      case InvoiceStatus.SENT:
        return <Badge variant="outline" className="bg-blue-500 text-white">Sent</Badge>;
      case InvoiceStatus.PAID:
        return <Badge variant="default" className="bg-green-500 text-white">Paid</Badge>;
      case InvoiceStatus.OVERDUE:
        return <Badge variant="destructive">Overdue</Badge>;
      case InvoiceStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      case InvoiceStatus.DISPUTED:
        return <Badge variant="secondary" className="bg-orange-500 text-white">Disputed</Badge>;
      case InvoiceStatus.PARTIAL:
        return <Badge variant="outline" className="bg-yellow-500 text-white">Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No sales invoices found</h3>
        <p className="text-muted-foreground mb-4">Get started by creating your first sales invoice.</p>
        <Button asChild>
          <Link href="/admin/billing/sales-invoices/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 border-b">
            <TableHead className="p-4 text-left font-medium">Invoice #</TableHead>
            <TableHead className="p-4 text-left font-medium">Customer</TableHead>
            <TableHead className="p-4 text-left font-medium">Invoice Date</TableHead>
            <TableHead className="p-4 text-left font-medium">Due Date</TableHead>
            <TableHead className="p-4 text-left font-medium">Amount</TableHead>
            <TableHead className="p-4 text-left font-medium">Status</TableHead>
            <TableHead className="p-4 text-left font-medium">Payment Terms</TableHead>
            <TableHead className="p-4 text-left font-medium">Billing Statement</TableHead>
            <TableHead className="p-4 text-left font-medium w-10">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="border-b hover:bg-muted/30 transition-colors">
              <TableCell className="p-4 align-middle font-medium">
                <Link 
                  href={`/admin/billing/sales-invoices/${invoice.id}`}
                  className="text-primary hover:underline"
                >
                  {invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell className="p-4 align-middle">
                <div>
                  {invoice.billingStatement ? (
                    <>
                      <div className="font-medium">{invoice.billingStatement.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.billingStatement.customer?.email || 'No email'}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No billing statement linked</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="p-4 align-middle">
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="p-4 align-middle">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell className="p-4 align-middle">
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrencyPHP(invoice.totalAmount)}
                  </div>
                  {invoice.discountAmount > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Discount: -{formatCurrencyPHP(invoice.discountAmount)}
                    </div>
                  )}
                  {invoice.taxAmount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Tax: {formatCurrencyPHP(invoice.taxAmount)}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="p-4 align-middle">
                {getStatusBadge(invoice.status)}
              </TableCell>
              <TableCell className="p-4 align-middle">
                <span className="text-sm">{invoice.paymentTerms || 'Net 30'}</span>
              </TableCell>
              <TableCell className="p-4 align-middle">
                {invoice.billingStatement ? (
                  <div className="space-y-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-600">
                      {invoice.billingStatement.statementNumber}
                    </Badge>
                    {invoice.billingStatement.customerOrder && (
                      <div className="text-xs text-muted-foreground">
                        Order: {invoice.billingStatement.customerOrder.orderNumber}
                      </div>
                    )}
                    {invoice.billingStatement.productionOrder && (
                      <div className="text-xs text-muted-foreground">
                        Production: {invoice.billingStatement.productionOrder.product?.name || 'N/A'}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">No billing statement</span>
                )}
              </TableCell>
              <TableCell className="p-4 align-middle">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/billing/sales-invoices/${invoice.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Invoice
                      </Link>
                    </DropdownMenuItem>
                    {invoice.status === InvoiceStatus.DRAFT && (
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/billing/sales-invoices/${invoice.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Invoice
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {invoice.status === InvoiceStatus.DRAFT && onStatusUpdate && (
                      <DropdownMenuItem onClick={() => onStatusUpdate(invoice.id, InvoiceStatus.SENT)}>
                        <Send className="mr-2 h-4 w-4" />
                        Send Invoice
                      </DropdownMenuItem>
                    )}
                    {invoice.status === InvoiceStatus.SENT && onStatusUpdate && (
                      <DropdownMenuItem onClick={() => onStatusUpdate(invoice.id, InvoiceStatus.PAID)}>
                        <Receipt className="mr-2 h-4 w-4" />
                        Mark as Paid
                      </DropdownMenuItem>
                    )}
                    {!invoice.billingStatement && (
                      <DropdownMenuItem disabled>
                        <span className="text-muted-foreground">No billing statement linked</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {invoice.status === InvoiceStatus.DRAFT && onDelete && (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => onDelete(invoice.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Invoice
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}