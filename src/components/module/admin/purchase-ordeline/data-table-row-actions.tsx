// src/components/module/admin/purchase-ordeline/data-table-row-actions.tsx
"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PurchaseOrderLine } from "@/types/admin/purchase-order";
import { deletePurchaseOrderLine } from "@/lib/actions/purchaseorderline";
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
import { EditOrderLineDialog } from "./edit-orderline-dialog";
import { ViewOrderLineDialog } from "./view-orderline-dialog";
import { useRouter } from "next/navigation";

interface DataTableRowActionsProps {
  row: Row<PurchaseOrderLine>;
  onSuccess: () => void;
}

export function DataTableRowActions({
  row,
  onSuccess,
}: DataTableRowActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const orderLine = row.original;

  const onDelete = async () => {
    try {
      await deletePurchaseOrderLine(orderLine.id);
      toast({
        title: "Success",
        description: "Order line deleted successfully",
      });
      setShowDeleteDialog(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete order line",
        variant: "destructive",
      });
    }
  };

  const viewParentOrder = () => {
    router.push(`/admin/purchase-orders?highlight=${orderLine.poId}`);
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
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={viewParentOrder}>
            <ArrowUpRight className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View Order
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
              This will permanently delete this order line. This action cannot
              be undone.
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

      {/* View Dialog */}
      <ViewOrderLineDialog
        orderLine={orderLine}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
      />

      {/* Edit Dialog */}
      <EditOrderLineDialog
        orderLine={orderLine}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onSuccess}
      />
    </>
  );
}
