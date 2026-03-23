"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import {
  Eye,
  MoreHorizontal,
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
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [isArchivePending, setIsArchivePending] = useState(false);
  const [showProductionDialog, setShowProductionDialog] = useState(false);
  const [showCreateProductionDialog, setShowCreateProductionDialog] =
    useState(false);
  const [showCreateBillingDialog, setShowCreateBillingDialog] = useState(false);
  const [showViewBillingDialog, setShowViewBillingDialog] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const customerOrder = row.original;

  const onArchive = async () => {
    setIsArchivePending(true);
    try {
      await softDeleteCustomerOrder(customerOrder.id, archiveReason || undefined);
      toast({
        title: "Order Archived",
        description: `Order ${customerOrder.orderNumber} moved to Trash. It can be restored within 30 days.`,
      });
      setShowArchiveDialog(false);
      setArchiveReason("");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to archive order",
        variant: "destructive",
      });
    } finally {
      setIsArchivePending(false);
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
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Order</DialogTitle>
            <DialogDescription>
              Archive order {customerOrder.orderNumber} by moving it to Trash.
              It can be restored within 30 days before being permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="archiveReason">Reason (optional)</Label>
              <Textarea
                id="archiveReason"
                placeholder="Why is this order being archived?"
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
            <Button onClick={onArchive} disabled={isArchivePending}>
              <Archive className="h-4 w-4 mr-2" />
              {isArchivePending ? "Archiving..." : "Archive"}
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
