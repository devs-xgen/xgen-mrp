"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Factory, Plus, Unlink, ExternalLink, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  createProductionOrdersFromCustomerOrder,
  unlinkProductionOrderFromCustomerOrder,
} from "@/lib/actions/superadmin/customer-order";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProductionLinkingPanelProps {
  customerOrderId: string;
  productionOrders: any[];
  orderLines: any[];
}

export function ProductionLinkingPanel({
  customerOrderId,
  productionOrders,
  orderLines,
}: ProductionLinkingPanelProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [selectedProductionOrderId, setSelectedProductionOrderId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    IN_PROGRESS: "default",
    COMPLETED: "secondary",
    CANCELLED: "destructive",
  };

  const handleCreateProductionOrders = async () => {
    if (reason.length < 15) {
      toast({
        title: "Invalid Input",
        description: "Audit reason must be at least 15 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await createProductionOrdersFromCustomerOrder(
        customerOrderId,
        undefined,
        reason
      );

      if (!result.success) {
        toast({
          title: "Failed to Create Production Orders",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Production Orders Created",
        description: `Created ${result.count} production order${result.count > 1 ? "s" : ""}`,
      });

      setShowCreateDialog(false);
      setReason("");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create production orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkProductionOrder = async () => {
    if (!selectedProductionOrderId) return;

    if (reason.length < 15) {
      toast({
        title: "Invalid Input",
        description: "Audit reason must be at least 15 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await unlinkProductionOrderFromCustomerOrder(
        selectedProductionOrderId,
        reason
      );

      if (!result.success) {
        toast({
          title: "Failed to Unlink",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Production Order Unlinked",
        description: "Production order has been unlinked from this customer order",
      });

      setShowUnlinkDialog(false);
      setSelectedProductionOrderId(null);
      setReason("");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unlink production order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-purple-600" />
                Production Orders
              </CardTitle>
              <CardDescription>
                {productionOrders.length} production order{productionOrders.length !== 1 ? "s" : ""} linked to this customer order
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Production Orders
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productionOrders.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No production orders linked</p>
              <p className="text-sm text-muted-foreground">
                Create production orders to fulfill this customer order
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionOrders.map((po: any) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">
                        {po.product.name}
                        {po.productVariant && (
                          <span className="text-muted-foreground"> - {po.productVariant.displayName}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{po.quantity}</TableCell>
                      <TableCell className="text-right">{po.completedQuantity || 0}</TableCell>
                      <TableCell>
                        {po.dueDate ? format(new Date(po.dueDate), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={po.priority === "URGENT" ? "destructive" : "secondary"}>
                          {po.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[po.status] || "default"}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/superadmin/production/${po.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProductionOrderId(po.id);
                              setShowUnlinkDialog(true);
                            }}
                          >
                            <Unlink className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Production Orders Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Production Orders</DialogTitle>
            <DialogDescription>
              Create production orders for {orderLines.length} order line{orderLines.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Auto-Create Production Orders</AlertTitle>
            <AlertDescription>
              This will create a production order for each order line that doesn't already have one.
              Production orders will be linked to this customer order automatically.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-reason">Audit Reason (Min 15 characters)</Label>
              <Textarea
                id="create-reason"
                placeholder="Explain why you're creating production orders..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be logged in the audit trail
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setReason("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProductionOrders}
              disabled={isLoading || reason.length < 15}
            >
              {isLoading ? "Creating..." : "Create Production Orders"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Production Order Dialog */}
      <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink Production Order</DialogTitle>
            <DialogDescription>
              Remove the link between this production order and the customer order
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              The production order will remain in the system but will no longer be linked to this customer order.
              This action will be logged in the audit trail.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unlink-reason">Audit Reason (Min 15 characters)</Label>
              <Textarea
                id="unlink-reason"
                placeholder="Explain why you're unlinking this production order..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUnlinkDialog(false);
                setSelectedProductionOrderId(null);
                setReason("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlinkProductionOrder}
              disabled={isLoading || reason.length < 15}
            >
              {isLoading ? "Unlinking..." : "Unlink Production Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
