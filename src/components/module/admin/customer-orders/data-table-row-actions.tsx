"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import {
  Eye,
  MoreHorizontal,
  Trash,
  Trash2,
  Factory,
  Plus,
  FileText,
  Receipt,
  Search,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomerOrderColumn } from "@/types/admin/customer-order";
import { softDeleteCustomerOrder } from "@/lib/actions/customer-order";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { ProductionOrdersDialog } from "./production-orders-dialog";
import { CreateProductionOrdersDialog } from "./create-production-orders-dialog";
import { CreateBillingStatementDialog } from "./create-billing-statement-dialog";
import { ViewBillingDocumentsDialog } from "./view-billing-documents-dialog";

interface DataTableRowActionsProps {
  row: Row<CustomerOrderColumn>;
  onDelete?: (id: string) => Promise<void>;
  onArchive?: (
    id: string,
    reason: string,
  ) => Promise<{ success: boolean; message: string }>;
  onTrash?: (id: string, reason?: string) => Promise<void>;
}

export function DataTableRowActions({
  row,
  onDelete: onDeleteProp,
  onArchive: onArchiveProp,
}: DataTableRowActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [trashReason, setTrashReason] = useState("");
  const [isTrashPending, setIsTrashPending] = useState(false);
  const [showProductionDialog, setShowProductionDialog] = useState(false);
  const [showCreateProductionDialog, setShowCreateProductionDialog] =
    useState(false);
  const [showCreateBillingDialog, setShowCreateBillingDialog] = useState(false);
  const [showViewBillingDialog, setShowViewBillingDialog] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const customerOrder = row.original;

  const onDelete = async () => {
    if (!onDeleteProp) {
      toast({
        title: "Error",
        description: "Delete function not available",
        variant: "destructive",
      });
      return;
    }

    try {
      await onDeleteProp(customerOrder.id);
      toast({
        title: "Success",
        description: "Customer order deleted successfully",
      });
      setShowDeleteDialog(false);
      // Refresh the page to update the list
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer order",
        variant: "destructive",
      });
    }
  };

  const onMoveToTrash = async () => {
    setIsTrashPending(true);
    try {
      await softDeleteCustomerOrder(customerOrder.id, trashReason || undefined);
      toast({
        title: "Moved to Trash",
        description: `Order ${customerOrder.orderNumber} moved to trash. It can be restored within 30 days.`,
      });
      setShowTrashDialog(false);
      setTrashReason("");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to move order to trash",
        variant: "destructive",
      });
    } finally {
      setIsTrashPending(false);
    }
  };

  const onArchive = async () => {
    if (!archiveReason.trim()) {
      toast({
        title: "Archive Reason Required",
        description: "Please provide a reason for archiving this order.",
        variant: "destructive",
      });
      return;
    }

    if (!onArchiveProp) {
      toast({
        title: "Error",
        description: "Archive function not available",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await onArchiveProp(customerOrder.id, archiveReason);

      if (result.success) {
        toast({
          title: "Order Archived",
          description: result.message,
        });
        setShowArchiveDialog(false);
        setArchiveReason("");
        // Refresh the page to update the list
        router.refresh();
      } else {
        toast({
          title: "Archive Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive customer order",
        variant: "destructive",
      });
    }
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
          <DropdownMenuItem
            onClick={() =>
              router.push(`/admin/customer-orders-v2/${customerOrder.id}`)
            }
          >
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View Details
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              router.push(
                `/admin/customer-orders-v2/${customerOrder.id}/production-planning`,
              )
            }
          >
            <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Analyze Stock
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowCreateBillingDialog(true)}>
            <FileText className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Create Billing Statement
          </DropdownMenuItem>

          {customerOrder.billingStatementCount > 0 && (
            <DropdownMenuItem onClick={() => setShowViewBillingDialog(true)}>
              <Receipt className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              View Billing Documents ({customerOrder.billingStatementCount})
            </DropdownMenuItem>
          )}

          {customerOrder.productionOrderCount > 0 ? (
            <DropdownMenuItem onClick={() => setShowProductionDialog(true)}>
              <Factory className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              View Production
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setShowCreateProductionDialog(true)}
            >
              <Plus className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Create Production
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
            <Archive className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Archive Order
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowTrashDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Move to Trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer order{" "}
              {customerOrder.orderNumber}. This action cannot be undone.
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

      {/* Archive Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Order</DialogTitle>
            <DialogDescription>
              Archive order {customerOrder.orderNumber} with complete history
              preservation. The order will be moved to archives but can be
              restored if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="archiveReason">Archive Reason</Label>
              <Textarea
                id="archiveReason"
                placeholder="Please provide a reason for archiving this order..."
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowArchiveDialog(false);
                setArchiveReason("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={onArchive} disabled={!archiveReason.trim()}>
              <Archive className="h-4 w-4 mr-2" />
              Archive Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trash Dialog */}
      <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Trash</DialogTitle>
            <DialogDescription>
              Move order {customerOrder.orderNumber} to trash. It will be
              permanently deleted after 30 days unless restored.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trashReason">Reason (optional)</Label>
              <Textarea
                id="trashReason"
                placeholder="Why is this order being deleted?"
                value={trashReason}
                onChange={(e) => setTrashReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTrashDialog(false);
                setTrashReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onMoveToTrash}
              disabled={isTrashPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isTrashPending ? "Moving..." : "Move to Trash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductionOrdersDialog
        customerOrderId={customerOrder.id}
        customerOrderNumber={customerOrder.orderNumber}
        open={showProductionDialog}
        onOpenChange={setShowProductionDialog}
      />

      <CreateProductionOrdersDialog
        customerOrderId={customerOrder.id}
        customerOrderNumber={customerOrder.orderNumber}
        open={showCreateProductionDialog}
        onOpenChange={setShowCreateProductionDialog}
      />

      <CreateBillingStatementDialog
        customerOrder={customerOrder}
        open={showCreateBillingDialog}
        onOpenChange={setShowCreateBillingDialog}
      />

      <ViewBillingDocumentsDialog
        open={showViewBillingDialog}
        onOpenChange={setShowViewBillingDialog}
        customerOrderNumber={customerOrder.orderNumber}
        billingDocuments={customerOrder.billingStatements || []}
      />
    </>
  );
}
