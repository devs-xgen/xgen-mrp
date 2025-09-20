"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Status } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Loader2,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { updateDeliveryAssignmentStatus } from "@/lib/actions/delivery/delivery-assignment";
import { useToast } from "@/hooks/use-toast";

interface DeliveryOrderDetailsProps {
  assignment: {
    id: string;
    status: Status;
    scheduledDate: Date | string | null;
    notes: string | null;
    deliveryAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
    productionOrder: {
      quantity: number;
      product: {
        name: string;
      };
      customerOrder: {
        id: string;
        customer: {
          name: string;
          email: string;
          phone: string;
        };
        shippingAddress: string | null;
      } | null;
    };
  };
}

export function DeliveryOrderDetails({
  assignment,
}: DeliveryOrderDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: Status) => {
    try {
      setUpdating(true);
      await updateDeliveryAssignmentStatus(assignment.id, newStatus);

      toast({
        title: "Status Updated",
        description: `Delivery status updated to ${newStatus
          .toLowerCase()
          .replace("_", " ")}`,
      });

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default">In Progress</Badge>;
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
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

  const nextStatus = getNextStatus(assignment.status);

  // Get the effective delivery address
  const deliveryAddress =
    assignment.deliveryAddress ||
    assignment.productionOrder.customerOrder?.shippingAddress ||
    "No delivery address specified";

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Delivery Assignment Details</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                {assignment.productionOrder.product.name}
              </CardTitle>
              <CardDescription>
                Order #{assignment.productionOrder.customerOrder?.id || "N/A"}
              </CardDescription>
            </div>
            {getStatusBadge(assignment.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Customer Information</h3>
                <p className="text-sm text-muted-foreground">
                  {assignment.productionOrder.customerOrder?.customer.name ||
                    "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {assignment.productionOrder.customerOrder?.customer.email ||
                    "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {assignment.productionOrder.customerOrder?.customer.phone ||
                    "N/A"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Delivery Address</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {deliveryAddress}
                </p>
                {assignment.deliveryAddress &&
                  assignment.productionOrder.customerOrder?.shippingAddress && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Note: This is a custom delivery address different from the
                      customer&apos;s shipping address.
                    </p>
                  )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Order Details</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Order ID:</span>{" "}
                  {assignment.productionOrder.customerOrder?.id || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Product:</span>{" "}
                  {assignment.productionOrder.product.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Quantity:</span>{" "}
                  {assignment.productionOrder.quantity}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Scheduled Date:</span>{" "}
                  {assignment.scheduledDate && !isNaN(new Date(assignment.scheduledDate).getTime())
  ? format(new Date(assignment.scheduledDate), "PPP")
  : "Not scheduled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Created:</span>{" "}
                  {/* {format(new Date(assignment.createdAt), "PPP")} */}
                  {assignment.createdAt && !isNaN(new Date(assignment.createdAt).getTime())
                    ? format(new Date(assignment.createdAt), "PPP")
                    : "Not scheduled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Last Updated:</span>{" "}
                  {/* {format(new Date(assignment.updatedAt), "PPP")} */}
                  {assignment.updatedAt && !isNaN(new Date(assignment.updatedAt).getTime())
  ? format(new Date(assignment.updatedAt), "PPP")
  : "Not scheduled"}
                </p>
              </div>
            </div>
          </div>

          {assignment.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium">Notes</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {assignment.notes}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/delivery/tasks")}
          >
            Back to Tasks
          </Button>
          {nextStatus && (
            <Button
              onClick={() => handleStatusUpdate(nextStatus)}
              disabled={updating}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : nextStatus === "IN_PROGRESS" ? (
                <Truck className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {nextStatus === "IN_PROGRESS"
                ? "Start Delivery"
                : "Complete Delivery"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
