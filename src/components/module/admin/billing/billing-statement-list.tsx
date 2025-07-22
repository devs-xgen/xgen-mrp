"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, FileText, Download, Edit, Trash2, Eye, Receipt, Package } from "lucide-react";

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

import { BillingStatementWithRelations, BillingStatus } from "@/types/admin/billing";
import { formatCurrencyPHP } from "@/lib/constant";
import { updateBillingStatementStatus, deleteBillingStatement } from "@/lib/actions/billing-statements";
import { toast } from "sonner";

interface BillingStatementListProps {
  statements: BillingStatementWithRelations[];
  onRefresh?: () => void;
}

export function BillingStatementList({ statements, onRefresh }: BillingStatementListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

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

  const handleStatusUpdate = async (id: string, status: BillingStatus) => {
    setIsUpdating(id);
    try {
      const result = await updateBillingStatementStatus(id, status);
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
      setIsUpdating(null);
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

  const renderCustomerInfo = (statement: BillingStatementWithRelations) => {
    return (
      <div>
        <div className="font-medium">{statement.customerName}</div>
        {statement.customer && (
          <div className="text-sm text-muted-foreground">{statement.customer.email}</div>
        )}
      </div>
    );
  };

  const renderSourceInfo = (statement: BillingStatementWithRelations) => {
    const sources = [];
    
    if (statement.customerOrder) {
      sources.push(
        <div key="order" className="text-sm text-blue-600 flex items-center">
          <Receipt className="mr-1 h-3 w-3" />
          Order: {statement.customerOrder.orderNumber}
        </div>
      );
    }
    
    if (statement.productionOrder) {
      sources.push(
        <div key="production" className="text-sm text-purple-600 flex items-center">
          <Package className="mr-1 h-3 w-3" />
          Production: {statement.productionOrder.quantity}x {statement.productionOrder.product?.name}
        </div>
      );
    }
    
    if (statement.deliveryReceipts && statement.deliveryReceipts.length > 0) {
      sources.push(
        <div key="delivery" className="text-sm text-green-600 flex items-center">
          <FileText className="mr-1 h-3 w-3" />
          Deliveries: {statement.deliveryReceipts.length}
        </div>
      );
    }
    
    if (statement.salesInvoice) {
      sources.push(
        <div key="invoice" className="text-sm text-orange-600 flex items-center">
          <FileText className="mr-1 h-3 w-3" />
          Invoice: {statement.salesInvoice.invoiceNumber}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {sources.length > 0 ? sources : (
          <div className="text-sm text-muted-foreground">Direct billing</div>
        )}
      </div>
    );
  };

  if (statements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No billing statements found</h3>
        <p className="text-muted-foreground mb-4">Get started by creating your first billing statement.</p>
        <Button asChild>
          <Link href="/admin/billing/billing-statements/create">
            Create Statement
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b">
              <TableHead className="p-4 text-left font-medium">Statement #</TableHead>
              <TableHead className="p-4 text-left font-medium">Customer</TableHead>
              <TableHead className="p-4 text-left font-medium">Source Information</TableHead>
              <TableHead className="p-4 text-left font-medium">Amount</TableHead>
              <TableHead className="p-4 text-left font-medium">Status</TableHead>
              <TableHead className="p-4 text-left font-medium">Billing Date</TableHead>
              <TableHead className="p-4 text-left font-medium">Due Date</TableHead>
              <TableHead className="p-4 text-left font-medium w-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statements.map((statement) => (
              <TableRow key={statement.id} className="border-b hover:bg-muted/30 transition-colors">
                <TableCell className="p-4 align-middle font-medium">
                  {statement.statementNumber}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {renderCustomerInfo(statement)}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {renderSourceInfo(statement)}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrencyPHP(statement.netAmount)}
                    </div>
                    {statement.totalAmount !== statement.netAmount && (
                      <div className="text-sm text-muted-foreground">
                        Total: {formatCurrencyPHP(statement.totalAmount)}
                      </div>
                    )}
                    {statement.taxAmount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Tax: {formatCurrencyPHP(statement.taxAmount)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {getStatusBadge(statement.status)}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {new Date(statement.billingDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="p-4 align-middle">
                  {statement.dueDate ? new Date(statement.dueDate).toLocaleDateString() : '-'}
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
                            onClick={() => handleStatusUpdate(statement.id, BillingStatus.SENT)}
                            disabled={isUpdating === statement.id}
                          >
                            Send Statement
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {statement.status === 'SENT' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(statement.id, BillingStatus.PAID)}
                          disabled={isUpdating === statement.id}
                        >
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      
                      {(statement.status === 'SENT' || statement.status === 'OVERDUE') && (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(statement.id, BillingStatus.DISPUTED)}
                          disabled={isUpdating === statement.id}
                        >
                          Mark as Disputed
                        </DropdownMenuItem>
                      )}
                      
                      {statement.status !== 'PAID' && statement.status !== 'CANCELLED' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(statement.id, BillingStatus.CANCELLED)}
                          disabled={isUpdating === statement.id}
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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