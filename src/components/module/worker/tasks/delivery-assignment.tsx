"use client";

import { Status } from "@prisma/client";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Loader2 } from "lucide-react";
// All unused imports (like Form, Select, Button, Dialog, useForm, etc.) have been removed.

// --- START: Interface Definitions ---

interface DeliveryUser {
  id: string;
  email: string;
  name?: string;
}

interface ProductionOrder {
  id: string;
  product: {
    id: string;
    name: string;
  };
  customerOrder?: {
    id: string;
    shippingAddress?: string | null;
    customer: {
      id: string;
      name: string;
    };
  } | null;
}

interface DeliveryAssignmentType {
  id: string;
  userId: string;
  userName?: string;
  scheduledDate?: Date | null;
  status: Status;
  notes?: string | null;
  deliveryAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
  productionOrder: ProductionOrder;
}

interface DeliveryAssignmentViewProps {
  deliveryAssignment: DeliveryAssignmentType | null;
  deliveryUsers?: DeliveryUser[];
  productionOrderId?: string;
  isLoading?: boolean;
}

export function DeliveryAssignmentView({
  deliveryAssignment,
  productionOrderId,
  isLoading = false,
}: DeliveryAssignmentViewProps) {
  
  if (isLoading) {
    return (
      <Card className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-muted-foreground" />
                Delivery Assignment
            </CardTitle>
            <CardDescription>
              View-only details for the delivery assignment of this production order.
            </CardDescription>
          </div>
          {/* Removed Assign Delivery Button */}
        </div>
      </CardHeader>
      <CardContent>
        {deliveryAssignment ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* STATUS */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Status
                </h3>
                {getStatusBadge(deliveryAssignment.status as Status)}
              </div>

              {/* ASSIGNED TO */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Assigned To
                </h3>
                <p className="font-semibold text-base">
                    {deliveryAssignment.userName || "N/A"}
                </p>
              </div>
              
              {/* SCHEDULED DATE */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Scheduled Date
                </h3>
                <p className="text-base">
                  {deliveryAssignment.scheduledDate
                    ? format(
                        new Date(deliveryAssignment.scheduledDate),
                        "PPP p"
                      )
                    : "Not scheduled"}
                </p>
              </div>
            </div>
            
            {/* DELIVERY ADDRESS */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">
                Delivery Address
              </h3>
              <p className="whitespace-pre-wrap text-base border p-3 rounded-md bg-muted/20">
                {deliveryAssignment.deliveryAddress ||
                  deliveryAssignment.productionOrder?.customerOrder
                    ?.shippingAddress ||
                  "No address specified"}
              </p>
            </div>
            
            {/* NOTES */}
            {deliveryAssignment.notes && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Notes
                </h3>
                <p className="whitespace-pre-wrap text-base border p-3 rounded-md">
                  {deliveryAssignment.notes}
                </p>
              </div>
            )}
            {/* Removed Edit Button */}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No delivery assignment has been created yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
