"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, createSelectionColumn, createTextColumn, createStatusColumn, createCurrencyColumn, createDateColumn, createActionsColumn, getTableConfig, createSortableHeader } from "@/components/global/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, Edit, Trash2, Package, Factory, BarChart3, Archive, FileText } from "lucide-react";
import { CustomerOrder } from "@/types/admin/customer-order";
import { Customer } from "@/types/admin/customer-order";
import { useRouter } from "next/navigation";
import { deleteCustomerOrder } from "@/lib/actions/customer-order";
import { archiveCustomerOrder } from "@/lib/actions/order-archiving";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { CreateBillingStatementDialog } from "./CreateBillingStatementDialog";

interface CustomerOrderV2TableProps {
  orders: CustomerOrder[];
  customers: Customer[];
  onOrderUpdate: (order: CustomerOrder) => void;
  onOrderDelete?: (orderId: string) => void;
}

const fulfillmentTypeColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  STOCK: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PRODUCTION: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  HYBRID: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export function CustomerOrderV2Table({ 
  orders, 
  customers, 
  onOrderUpdate,
  onOrderDelete 
}: CustomerOrderV2TableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<CustomerOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [orderToArchive, setOrderToArchive] = useState<CustomerOrder | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [orderForBilling, setOrderForBilling] = useState<CustomerOrder | null>(null);

  const handleDelete = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCustomerOrder(orderToDelete.id);
      toast({
        title: "Success",
        description: `Order ${orderToDelete.orderNumber} has been deleted successfully.`,
      });
      onOrderDelete?.(orderToDelete.id);
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const columns: ColumnDef<CustomerOrder>[] = useMemo(() => [
    // Selection column
    createSelectionColumn<CustomerOrder>(),

    // Order Number
    createTextColumn<CustomerOrder>("orderNumber", "Order Number"),

    // Customer Name
    {
      id: "customerName",
      header: createSortableHeader("Customer"),
      accessorFn: (row) => row.customer?.name ?? "",
      cell: ({ row }) => {
        const name = row.original.customer?.name ?? "—";
        const email = row.original.customer?.email ?? null;
        return (
          <div>
            <div className="font-medium">{name}</div>
            {email && (
              <div className="text-xs text-muted-foreground">{email}</div>
            )}
          </div>
        );
      },
    },

    // Order Date
    createDateColumn<CustomerOrder>("orderDate", "Order Date"),

    // Required Date
    createDateColumn<CustomerOrder>("requiredDate", "Required Date"),

    // Status
    createStatusColumn<CustomerOrder>("status", "Status"),

    // Fulfillment Progress (custom)
    {
      accessorKey: "fulfillmentProgress",
      header: "Fulfillment",
      cell: ({ row }) => {
        const order = row.original;
        if (!order.orderLines || order.orderLines.length === 0) {
          return <div className="text-sm text-muted-foreground">No items</div>;
        }

        const totalItems = order.orderLines.length;
        const fulfilledItems = order.orderLines.filter(
          (line) => line.fulfillmentStatus === "FULFILLED"
        ).length;
        const progressPercent = (fulfilledItems / totalItems) * 100;

        const fulfillmentTypes = [
          ...new Set(order.orderLines.map((line) => line.fulfillmentType).filter(Boolean)),
        ] as string[];

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Progress value={progressPercent} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground">
                {fulfilledItems}/{totalItems}
              </span>
            </div>
            <div className="flex gap-1">
              {fulfillmentTypes.map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className={`text-xs ${fulfillmentTypeColors[type || "PENDING"]}`}
                >
                  {type === "STOCK" && <Package className="h-3 w-3 mr-1" />}
                  {type === "PRODUCTION" && <Factory className="h-3 w-3 mr-1" />}
                  {type || "Pending"}
                </Badge>
              ))}
            </div>
          </div>
        );
      },
    },

    // Total Amount
    createCurrencyColumn<CustomerOrder>("totalAmount", "Total Amount"),

    // Items Count (custom)
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => {
        const order = row.original;
        const itemCount = order.orderLines?.length || 0;
        const totalQuantity =
          order.orderLines?.reduce((sum, line) => sum + line.quantity, 0) || 0;

        return (
          <div className="text-center">
            <div className="font-medium">{itemCount}</div>
            <div className="text-xs text-muted-foreground">{totalQuantity} qty</div>
          </div>
        );
      },
    },

    // Actions
    createActionsColumn<CustomerOrder>([
      {
        label: "View Details",
        icon: Eye,
        onClick: (order) => {
          router.push(`/admin/customer-orders-v2/${order.id}`);
        },
      },
      {
        label: "Edit Order",
        icon: Edit,
        onClick: (order) => {
          router.push(`/admin/customer-orders-v2/${order.id}/edit`);
        },
      },
      {
        label: "Analyze",
        icon: BarChart3,
        onClick: (order) => {
          router.push(`/admin/customer-orders-v2/${order.id}/analyze`);
        },
      },
      {
        label: "Create Billing",
        icon: FileText,
        onClick: (order) => {
          setOrderForBilling(order);
          setBillingDialogOpen(true);
        },
      },
      {
        label: "Archive Order",
        icon: Archive,
        onClick: (order) => {
          setOrderToArchive(order);
          setArchiveDialogOpen(true);
        },
      },
      {
        label: "Delete Order",
        icon: Trash2,
        onClick: (order) => {
          setOrderToDelete(order);
          setDeleteDialogOpen(true);
        },
        variant: "destructive",
      },
    ]),
  ], [customers, onOrderUpdate, router]);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={orders}
        {...getTableConfig("customer-orders-v2")}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order <strong>{orderToDelete?.orderNumber}</strong>?
              This action cannot be undone and will permanently remove the order and all related data
              including production orders, materials reservations, and billing information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={(open) => {
        setArchiveDialogOpen(open);
        if (!open) {
          setArchiveReason("");
          setOrderToArchive(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Order</DialogTitle>
            <DialogDescription>
              Archive order {orderToArchive?.orderNumber} with complete history preservation.
              The order will be moved to archives but can be restored if needed.
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
                setArchiveDialogOpen(false);
                setArchiveReason("");
                setOrderToArchive(null);
              }}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!orderToArchive) return;
                if (!archiveReason.trim()) {
                  toast({
                    title: "Archive Reason Required",
                    description: "Please provide a reason for archiving this order.",
                    variant: "destructive",
                  });
                  return;
                }
                setIsArchiving(true);
                try {
                  const result = await archiveCustomerOrder(orderToArchive.id, archiveReason);
                  if (result.success) {
                    toast({
                      title: "Order Archived",
                      description: result.message,
                    });
                    setArchiveDialogOpen(false);
                    setArchiveReason("");
                    setOrderToArchive(null);
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
                } finally {
                  setIsArchiving(false);
                }
              }}
              disabled={!archiveReason.trim() || isArchiving}
            >
              <Archive className="h-4 w-4 mr-2" />
              {isArchiving ? "Archiving..." : "Archive Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Billing Statement Dialog */}
      {orderForBilling && (
        <CreateBillingStatementDialog
          customerOrder={orderForBilling}
          open={billingDialogOpen}
          onOpenChange={(open) => {
            setBillingDialogOpen(open);
            if (!open) {
              setOrderForBilling(null);
            }
          }}
        />
      )}
    </div>
  );
}
