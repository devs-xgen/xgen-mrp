"use client";

import { useState } from "react";
import { Status, Priority } from "@prisma/client";
import { ProductionOrder } from "@/types/admin/production-order";
import { OperationsManagement } from "./operations-management";
import { QualityChecks } from "./quality-checks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { updateProductionOrder } from "@/lib/actions/production-order";
// Import the QualityCheck type
import { QualityCheck } from "@/types/admin/quality-checks";
import { formatDate } from "@/lib/utils";

// Add import for the LinkCustomerOrderDialog component
import { LinkCustomerOrderDialog } from "./link-customer-order-dialog";

interface WorkCenter {
  id: string;
  name: string;
  capacityPerHour: number;
}

interface ProductionOrderDetailsProps {
  order: ProductionOrder;
  workCenters: WorkCenter[];
  onUpdateStatus?: (status: Status) => Promise<void>;
  onUpdateOperation?: (operationId: string, status: Status) => Promise<void>;
  onAddOperation?: () => void;
  onAddQualityCheck?: () => void;
  isLoading?: boolean;
}

export function ProductionOrderDetails({
  order,
  workCenters,
  isLoading = false,
}: ProductionOrderDetailsProps) {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleStatusUpdate = async (newStatus: Status) => {
    try {
      setUpdating(true);
      await updateProductionOrder({
        id: order.id,
        status: newStatus,
      });

      toast({
        title: "Status Updated",
        description: `Production order status updated to ${newStatus
          .toLowerCase()
          .replace("_", " ")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    return new Promise<void>((resolve) => {
      window.location.reload();
      setTimeout(resolve, 100);
    });
  };

  const getNextStatus = (currentStatus: Status): Status | null => {
    switch (currentStatus) {
      case "PENDING":
        return "IN_PROGRESS";
      case "IN_PROGRESS":
        return "COMPLETED";
      default:
        return null;
    }
  };

  // Use type assertion to handle potential type mismatch between the database schema
  // and our frontend type definition for QualityCheck
  const qualityChecks = (order.qualityChecks ||
    []) as unknown as QualityCheck[];

  const nextStatus = getNextStatus(order.status);

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">
                Production Order: {order.product.sku}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {order.product.name} - {order.quantity} units
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant={
                  order.status === "COMPLETED"
                    ? "default"
                    : order.status === "IN_PROGRESS"
                    ? "secondary"
                    : "outline"
                }
                className="text-lg py-1.5 px-4 uppercase font-medium"
              >
                {order.status.toLowerCase().replace("_", " ")}
              </Badge>
              {nextStatus && (
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={updating || isLoading}
                  className="mt-2"
                >
                  {updating && (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  )}
                  {nextStatus === "IN_PROGRESS"
                    ? "Start Production"
                    : "Complete Production"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-muted-foreground mb-1">
                Timeline
              </h3>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Start:</span>{" "}
                {formatDate(order.startDate)}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Due:</span>{" "}
                {formatDate(order.dueDate)}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-muted-foreground mb-1">
                Priority
              </h3>
              <Badge
                variant={
                  order.priority === "HIGH" || order.priority === "URGENT"
                    ? "destructive"
                    : order.priority === "MEDIUM"
                    ? "secondary"
                    : "outline"
                }
              >
                {order.priority.toLowerCase()}
              </Badge>
            </div>
            <div>
              <h3 className="font-medium text-muted-foreground mb-1">
                Order Information
              </h3>
              {order.customerOrder ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Customer Order:</span>
                  {order.customerOrder.orderNumber}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-muted-foreground">
                    No customer order linked
                  </div>
                  <LinkCustomerOrderDialog
                    productionOrderId={order.id}
                    onRefresh={handleRefresh}
                  />
                </div>
              )}
            </div>
          </div>
          {order.notes && (
            <div className="mt-4">
              <h3 className="font-medium text-muted-foreground mb-1">Notes</h3>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <OperationsManagement
        productionOrderId={order.id}
        operations={order.operations}
        workCenters={workCenters}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <QualityChecks
        productionOrderId={order.id}
        checks={qualityChecks}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
    </div>
  );
}
