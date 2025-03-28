// src/components/module/admin/purchase-orders/data-table-row-actions.tsx
"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import {
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PurchaseOrder } from "@/types/admin/purchase-order";
import { deletePurchaseOrder } from "@/lib/actions/purchase-order";
import { useToast } from "@/hooks/use-toast";
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
import { PurchaseOrderDetailSheet } from "./purchase-order-detail-sheet";
import { PurchaseOrderPrint } from "./purchase-order-print";
import { useRouter } from "next/navigation";

interface DataTableRowActionsProps {
  row: Row<PurchaseOrder>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const purchase = row.original;

  const onDelete = async () => {
    try {
      await deletePurchaseOrder(purchase.id);
      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });
      setShowDeleteDialog(false);
      router.refresh(); // Refresh the page data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive",
      });
    }
  };

  const onSuccess = async () => {
    router.refresh(); // Refresh the page data after successful update
  };

  const viewOrderLines = () => {
    // Navigate to the purchase order lines view filtered by this order
    router.push(`/admin/purchase-orderline?poId=${purchase.id}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={() => setShowDetailSheet(true)}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View Order Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPrintDialog(true)}>
            <Printer className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Print Order
          </DropdownMenuItem>
          <DropdownMenuItem onClick={viewOrderLines}>
            <FileText className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View Order Lines
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the purchase order{" "}
              {purchase.poNumber} and all its order lines. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PurchaseOrderDetailSheet
        purchaseOrder={purchase}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onSuccess={onSuccess}
      />

      {/* Conditional render of the Print dialog */}
      {showPrintDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowPrintDialog(false)}
        >
          <div
            className="bg-background rounded-lg p-6 w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <PurchaseOrderPrint purchaseOrder={purchase} />
          </div>
        </div>
      )}
    </>
  );
}
