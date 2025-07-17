import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Plus, Receipt, Search, Filter, Download, MoreHorizontal, Eye, Edit, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Import server actions and types
import { getAllSalesInvoices, getSalesReportData } from "@/lib/actions/sales-invoices";
import { SalesInvoiceWithItems, InvoiceStatus } from "@/types/admin/billing";
import { formatCurrencyPHP } from "@/lib/constant";

export const metadata: Metadata = {
  title: "Sales Invoices",
  description: "Manage sales invoices and track payments",
};

interface SalesInvoicesListProps {
  invoices: SalesInvoiceWithItems[];
}

function SalesInvoicesList({ invoices }: SalesInvoicesListProps) {
  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "SENT":
        return <Badge variant="outline" className="bg-blue-500 text-white">Sent</Badge>;
      case "PAID":
        return <Badge variant="default" className="bg-green-500 text-white">Paid</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "DISPUTED":
        return <Badge variant="secondary" className="bg-orange-500 text-white">Disputed</Badge>;
      case "PARTIAL":
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
            <TableHead className="p-4 text-left font-medium">Linked</TableHead>
            <TableHead className="p-4 text-left font-medium w-10">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="border-b hover:bg-muted/30 transition-colors">
              <TableCell className="p-4 align-middle font-medium">
                {invoice.invoiceNumber}
              </TableCell>
              <TableCell className="p-4 align-middle">
                <div>
                  {invoice.billingStatements && invoice.billingStatements.length > 0 ? (
                    <>
                      <div className="font-medium">{invoice.billingStatements[0].customer?.name}</div>
                      <div className="text-sm text-muted-foreground">{invoice.billingStatements[0].customer?.email}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No customer linked</span>
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
                {invoice.billingStatements && invoice.billingStatements.length > 0 ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-600">
                    {invoice.billingStatements.length} Statement{invoice.billingStatements.length > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">None</span>
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
                    {invoice.status === 'DRAFT' && (
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
                    {invoice.status === "DRAFT" && (
                      <DropdownMenuItem>
                        <Send className="mr-2 h-4 w-4" />
                        Send Invoice
                      </DropdownMenuItem>
                    )}
                    {(!invoice.billingStatements || invoice.billingStatements.length === 0) && (
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/billing/billing-statements/create?invoiceId=${invoice.id}`}>
                          Create Billing Statement
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {invoice.status === 'DRAFT' && (
                      <DropdownMenuItem className="text-destructive">
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

function SalesInvoicesTableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

async function SalesInvoicesContent() {
  try {
    // Fetch sales invoices and report data in parallel
    const [invoicesResult, reportData] = await Promise.all([
      getAllSalesInvoices({}, 1, 50), // Get first 50 invoices
      getSalesReportData()
    ]);

    const invoices = invoicesResult.data;

    // Calculate additional metrics
    const draftInvoices = invoices.filter(invoice => invoice.status === 'DRAFT').length;
    const pendingAmount = invoices
      .filter(invoice => invoice.status === 'SENT' || invoice.status === 'OVERDUE')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <Receipt className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Total Invoices
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {reportData.totalInvoices}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {draftInvoices} Draft
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-green-50/90 border border-green-200/70 dark:bg-green-950/30 dark:border-green-800/50 p-6">
            <div className="flex items-center space-x-4">
              <Receipt className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Paid Invoices
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {reportData.paidInvoices}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrencyPHP(reportData.totalSales)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-red-50/90 border border-red-200/70 dark:bg-red-950/30 dark:border-red-800/50 p-6">
            <div className="flex items-center space-x-4">
              <Receipt className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Overdue
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {reportData.overdueInvoices}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Action Required
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-amber-50/90 border border-amber-200/70 dark:bg-amber-950/30 dark:border-amber-800/50 p-6">
            <div className="flex items-center space-x-4">
              <Receipt className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Pending Amount
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrencyPHP(pendingAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting Payment
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Table Container */}
        <Card className="bg-card border rounded-lg">
          {/* Table Header */}
          <div className="p-6 pb-4 border-b bg-card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    className="pl-10"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <SalesInvoicesList invoices={invoices} />
        </Card>
      </>
    );
  } catch (error) {
    console.error('Error loading sales invoices:', error);
    return (
      <Card className="bg-card border rounded-lg p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load sales invoices. Please try refreshing the page.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </Card>
    );
  }
}

export default function SalesInvoicesPage() {
  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage sales invoices for your customers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/billing/sales-invoices/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Content with Suspense */}
      <Suspense fallback={<SalesInvoicesTableSkeleton />}>
        <SalesInvoicesContent />
      </Suspense>
    </div>
  );
} 