"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Download, Send, Trash2, FileText, User, Calendar, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyPHP } from "@/lib/constant";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import types and server actions
import { SalesInvoiceWithItems, InvoiceStatus } from "@/types/admin/billing";
import { getSalesInvoiceById, deleteSalesInvoice, updateSalesInvoiceStatus } from "@/lib/actions/sales-invoices";

export default function SalesInvoiceViewPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<SalesInvoiceWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load invoice data
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const invoiceData = await getSalesInvoiceById(invoiceId);
        setInvoice(invoiceData);
      } catch (error) {
        console.error("Error loading invoice:", error);
        toast.error("Failed to load invoice");
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  // Handle status update
  const handleStatusUpdate = async (status: InvoiceStatus) => {
    if (!invoice) return;

    setIsUpdatingStatus(true);
    try {
      const result = await updateSalesInvoiceStatus(invoice.id, status);
      if (result.success) {
        setInvoice({ ...invoice, status });
        toast.success(`Invoice marked as ${status.toLowerCase()}`);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!invoice) return;

    setIsDeleting(true);
    try {
      const result = await deleteSalesInvoice(invoice.id);
      if (result.success) {
        toast.success("Invoice deleted successfully");
        router.push("/admin/billing/sales-invoices");
      } else {
        toast.error(result.error || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get status badge
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Invoice Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested sales invoice could not be found.
            </p>
            <Button asChild>
              <Link href="/admin/billing/sales-invoices">
                Back to Invoices
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/billing/sales-invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage sales invoice details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`/api/admin/billing/sales-invoices/${invoice.id}/download`, '_blank')}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          {invoice.status === "DRAFT" && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStatusUpdate("SENT")}
                disabled={isUpdatingStatus}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
              </Button>
              <Button size="sm" asChild>
                <Link href={`/admin/billing/sales-invoices/${invoice.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </>
          )}
          {invoice.status === "SENT" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleStatusUpdate("PAID")}
              disabled={isUpdatingStatus}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Invoice Details</CardTitle>
                {getStatusBadge(invoice.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                    <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
                    <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                    <p className="font-medium">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
                    <p className="font-medium">{invoice.paymentTerms || 'Net 30'}</p>
                  </div>
                  {invoice.poNumber && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">PO Number</p>
                      <p className="font-medium">{invoice.poNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrencyPHP(invoice.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Statement Information */}
          {invoice.billingStatement && (
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Billing Statement Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Statement Number:</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-600">
                          {invoice.billingStatement.statementNumber}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Customer:</span>
                        <span>{invoice.billingStatement.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Statement Amount:</span>
                        <span>{formatCurrencyPHP(invoice.billingStatement.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Statement Status:</span>
                        <Badge variant="outline">{invoice.billingStatement.status}</Badge>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Linked Orders */}
                {(invoice.billingStatement.customerOrder || invoice.billingStatement.productionOrder) && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Linked Orders</h4>
                    <div className="space-y-2">
                      {invoice.billingStatement.customerOrder && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                          <Package className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium">Customer Order</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.billingStatement.customerOrder.orderNumber}
                            </p>
                          </div>
                        </div>
                      )}
                      {invoice.billingStatement.productionOrder && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                          <Package className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium">Production Order</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.billingStatement.productionOrder.orderNumber}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Invoice Items */}
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-left">Description</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.invoiceItems?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            {item.productCode && (
                              <p className="text-sm text-muted-foreground">
                                Code: {item.productCode}
                              </p>
                            )}
                            {item.unit && (
                              <p className="text-xs text-muted-foreground">
                                Unit: {item.unit}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrencyPHP(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrencyPHP(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(invoice.terms || invoice.footerNotes) && (
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.terms && (
                  <div>
                    <h4 className="font-medium mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {invoice.terms}
                    </p>
                  </div>
                )}
                {invoice.footerNotes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {invoice.footerNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrencyPHP(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({invoice.taxRate}%):</span>
                <span className="font-medium">{formatCurrencyPHP(invoice.taxAmount)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">-{formatCurrencyPHP(invoice.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold text-lg">{formatCurrencyPHP(invoice.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {invoice.billingStatement && (
            <Card className="bg-card border rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{invoice.billingStatement.customerName}</p>
                  {invoice.billingStatement.customer?.email && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.billingStatement.customer.email}
                    </p>
                  )}
                  {invoice.billingStatement.customer?.phone && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.billingStatement.customer.phone}
                    </p>
                  )}
                </div>
                {invoice.billingStatement.customer?.address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-sm">
                      {invoice.billingStatement.customer.address}
                      {invoice.billingStatement.customer.city && `, ${invoice.billingStatement.customer.city}`}
                      {invoice.billingStatement.customer.state && `, ${invoice.billingStatement.customer.state}`}
                      {invoice.billingStatement.customer.postalCode && ` ${invoice.billingStatement.customer.postalCode}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.status === "DRAFT" && (
                <>
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusUpdate("SENT")}
                    disabled={isUpdatingStatus}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Invoice
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/admin/billing/sales-invoices/${invoice.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Invoice
                    </Link>
                  </Button>
                </>
              )}
              {invoice.status === "SENT" && (
                <Button 
                  className="w-full" 
                  onClick={() => handleStatusUpdate("PAID")}
                  disabled={isUpdatingStatus}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(`/api/admin/billing/sales-invoices/${invoice.id}/download`, '_blank')}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              {invoice.status === "DRAFT" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Invoice
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this invoice? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="bg-card border rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated:</span>
                <span>{new Date(invoice.updatedAt).toLocaleDateString()}</span>
              </div>
              {invoice.createdByUser && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created by:</span>
                  <span>
                    {invoice.createdByUser.profile?.firstName} {invoice.createdByUser.profile?.lastName}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}