"use client";

import { FileText, User, Calendar, DollarSign, Package } from "lucide-react";
import { formatCurrencyPHP } from "@/lib/constant";

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
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import types
import { SalesInvoiceWithItems, InvoiceStatus } from "@/types/admin/billing";

interface SalesInvoicePreviewProps {
  invoice: SalesInvoiceWithItems;
  showBillingStatement?: boolean;
  showCustomerInfo?: boolean;
  showMetadata?: boolean;
}

export function SalesInvoicePreview({ 
  invoice, 
  showBillingStatement = true,
  showCustomerInfo = true,
  showMetadata = true
}: SalesInvoicePreviewProps) {
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

  return (
    <div className="space-y-6">
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
      {showBillingStatement && invoice.billingStatement && (
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
                          {invoice.billingStatement.productionOrder.product?.name || 'N/A'}
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

          {/* Invoice Summary */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
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
                <div className="flex justify-between font-bold">
                  <span>Total Amount:</span>
                  <span className="text-lg">{formatCurrencyPHP(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
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

      {/* Customer Information */}
      {showCustomerInfo && invoice.billingStatement && (
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

      {/* Metadata */}
      {showMetadata && (
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
      )}
    </div>
  );
}