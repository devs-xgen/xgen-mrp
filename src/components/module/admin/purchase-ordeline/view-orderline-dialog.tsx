// src/components/module/admin/purchase-ordeline/view-orderline-dialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PurchaseOrderLine } from "@/types/admin/purchase-order";
import {
  CalendarIcon,
  BoxIcon,
  TruckIcon,
  UserIcon,
  ClipboardIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface ViewOrderLineDialogProps {
  orderLine: PurchaseOrderLine;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewOrderLineDialog({
  orderLine,
  open,
  onOpenChange,
}: ViewOrderLineDialogProps) {
  // Function to get status badge color
  const getStatusColor = (
    status: string
  ): "default" | "success" | "warning" | "destructive" => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "destructive";
      default:
        return "default";
    }
  };

  // Calculate total
  const total = Number(orderLine.unitPrice) * orderLine.quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Order Line Details</DialogTitle>
          <DialogDescription>
            View detailed information for this order line
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Line Summary */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Line Summary</h3>
            <Badge variant={getStatusColor(orderLine.status)}>
              {orderLine.status.toLowerCase()}
            </Badge>
          </div>

          {/* Material Information */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center mb-2">
              <BoxIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Material Information</h4>
            </div>
            <div className="grid grid-cols-2 gap-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{orderLine.material.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SKU</p>
                <p className="font-medium">{orderLine.material.sku}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="font-medium">
                  {orderLine.material.currentStock}{" "}
                  {orderLine.material.unitOfMeasure.symbol}
                </p>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center mb-2">
              <ClipboardIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Order Information</h4>
            </div>
            <div className="grid grid-cols-2 gap-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="font-medium">
                  {orderLine.quantity} {orderLine.material.unitOfMeasure.symbol}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit Price</p>
                <p className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PHP",
                  }).format(Number(orderLine.unitPrice))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PHP",
                  }).format(total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date Created</p>
                <p className="font-medium">
                  {new Date(orderLine.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {orderLine.notes && (
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Notes</h4>
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: orderLine.notes }}
              />
            </div>
          )}

          {/* Related Purchase Order */}
          {orderLine.purchaseOrder && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Related Purchase Order</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Purchase Order
                    </p>
                    <p className="font-medium">
                      {orderLine.purchaseOrder.poNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium">
                      {orderLine.purchaseOrder.supplier.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={getStatusColor(orderLine.purchaseOrder.status)}
                    >
                      {orderLine.purchaseOrder.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button asChild>
            <Link href={`/admin/purchase-orders?highlight=${orderLine.poId}`}>
              View Purchase Order
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
