"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, FileText, Download, Edit, Trash2, Eye, Receipt, Package, Calendar, DollarSign, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Separator } from "@/components/ui/separator";

import { BillingStatementWithRelations, BillingStatus } from "@/types/admin/billing";
import { formatCurrencyPHP } from "@/lib/constant";
import { updateBillingStatementStatus, deleteBillingStatement } from "@/lib/actions/billing-statements";
import { toast } from "sonner";

interface BillingStatementCardProps {
  statement: BillingStatementWithRelations;
  onRefresh?: () => void;
}

export function BillingStatementCard({ statement, onRefresh }: BillingStatementCardProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusBadge = (status: BillingStatus) => {
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

  const handleStatusUpdate = async (status: BillingStatus) => {
    setIsUpdating(true);
    try {
      const result = await updateBillingStatementStatus(statement.id, status);
      if (result.success) {
        toast.success(result.message || "Status updated successfully");
        onRefresh?.();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const result = await deleteBillingStatement(deleteId);
      if (result.success) {
        toast.success(result.message || "Billing statement deleted successfully");
        onRefresh?.();
      } else {
        toast.error(result.error || "Failed to delete billing statement");
      }
    } catch (error) {
      console.error("Error deleting billing statement:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setDeleteId(null);
    }
  };

  const renderSourceInfo = () => {
    const sources = [];
    
    if (statement.customerOrder) {
      sources.push(
        <div key="order" className="flex items-center text-sm text-blue-600">
          <Receipt className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">Customer Order</div>
            <div className="text-xs text-muted-foreground">
              {statement.customerOrder.orderNumber} • {formatCurrencyPHP(statement.customerOrder.totalAmount)}
            </div>
          </div>
        </div>
      );
    }
    
    if (statement.productionOrder) {
      sources.push(
        <div key="production" className="flex items-center text-sm text-purple-600">
          <Package className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">Production Order</div>
            <div className="text-xs text-muted-foreground">
              {statement.productionOrder.quantity}x {statement.productionOrder.product?.name}
            </div>
          </div>
        </div>
      );
    }
    
    if (statement.deliveryReceipts && statement.deliveryReceipts.length > 0) {
      sources.push(
        <div key="delivery" className="flex items-center text-sm text-green-600">
          <FileText className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">Delivery Receipts</div>
            <div className="text-xs text-muted-foreground">
              {statement.deliveryReceipts.length} receipt{statement.deliveryReceipts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      );
    }
    
    if (statement.salesInvoice) {
      sources.push(
        <div key="invoice" className="flex items-center text-sm text-orange-600">
          <FileText className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">Sales Invoice</div>
            <div className="text-xs text-muted-foreground">
              {statement.salesInvoice.invoiceNumber}
            </div>
          </div>
        </div>
      );
    }

    if (sources.length === 0) {
      return (
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">Direct Billing</div>
            <div className="text-xs text-muted-foreground">
              No linked orders
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sources}
      </div>
    );
  };

  return (
    <>
      <Card className="bg-card border rounded-lg hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {statement.statementNumber}
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(statement.status)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/billing/billing-statements/${statement.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  
                  {/* Status Actions */}
                  {statement.status === 'DRAFT' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/billing/billing-statements/${statement.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Statement
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(BillingStatus.SENT)}
                        disabled={isUpdating}
                      >
                        Send Statement
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {statement.status === 'SENT' && (
                    <DropdownMenuItem
                      onClick={() => handleStatusUpdate(BillingStatus.PAID)}
                      disabled={isUpdating}
                    >
                      Mark as Paid
                    </DropdownMenuItem>
                  )}
                  
                  {(statement.status === 'SENT' || statement.status === 'OVERDUE') && (
                    <DropdownMenuItem
                      onClick={() => handleStatusUpdate(BillingStatus.DISPUTED)}
                      disabled={isUpdating}
                    >
                      Mark as Disputed
                    </DropdownMenuItem>
                  )}
                  
                  {statement.status !== 'PAID' && statement.status !== 'CANCELLED' && (
                    <DropdownMenuItem
                      onClick={() => handleStatusUpdate(BillingStatus.CANCELLED)}
                      disabled={isUpdating}
                    >
                      Cancel Statement
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {/* Delete Action - Only for DRAFT statements */}
                  {statement.status === 'DRAFT' && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(statement.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Statement
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Customer Information */}
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{statement.customerName}</div>
              {statement.customer && (
                <div className="text-sm text-muted-foreground">{statement.customer.email}</div>
              )}
            </div>
          </div>

          <Separator />

          {/* Source Information */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Source Information</h4>
            {renderSourceInfo()}
          </div>

          <Separator />

          {/* Financial Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Net Amount</div>
                <div className="font-semibold text-green-600">
                  {formatCurrencyPHP(statement.netAmount)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Due Date</div>
                <div className="font-medium">
                  {statement.dueDate ? new Date(statement.dueDate).toLocaleDateString() : 'Not set'}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Financial Details */}
          {(statement.totalAmount !== statement.netAmount || statement.taxAmount > 0) && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrencyPHP(statement.totalAmount - statement.taxAmount + statement.discountAmount)}</span>
              </div>
              {statement.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrencyPHP(statement.taxAmount)}</span>
                </div>
              )}
              {statement.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrencyPHP(statement.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{formatCurrencyPHP(statement.totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Billing Date: {new Date(statement.billingDate).toLocaleDateString()}</span>
            {statement.paidDate && (
              <span>Paid: {new Date(statement.paidDate).toLocaleDateString()}</span>
            )}
          </div>

          {/* Notes */}
          {statement.notes && (
            <div className="text-sm">
              <div className="text-muted-foreground mb-1">Notes:</div>
              <div className="text-sm bg-muted/50 p-2 rounded text-muted-foreground">
                {statement.notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the billing statement
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}