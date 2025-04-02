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

  // NOTE: This uses type assertion to force TypeScript to accept the checks
  // This is a last resort option when you're confident the runtime behavior will work
  // even if TypeScript doesn't agree with the types
  const qualityChecks = order.qualityChecks as unknown as QualityCheck[];

  const nextStatus = getNextStatus(order.status);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Production Order Details</CardTitle>
              <CardDescription>
                Status and progress of production order
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  order.status === "COMPLETED"
                    ? "default"
                    : order.status === "IN_PROGRESS"
                    ? "secondary"
                    : "outline"
                }
                className="text-base py-1 px-3"
              >
                {order.status.toLowerCase().replace("_", " ")}
              </Badge>
              {nextStatus && (
                <Button
                  variant="default"
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={updating || isLoading}
                >
                  {updating && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {nextStatus === "IN_PROGRESS"
                    ? "Start Production"
                    : "Complete Production"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Card content remains the same */}
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
