"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Status,
  DeliveryAssignment as PrismaDeliveryAssignment,
  ProductionOrder,
  Product,
  CustomerOrder,
  Customer,
} from "@prisma/client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Loader2,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  ClipboardCheck,
  XCircle,
  ClipboardList,
} from "lucide-react";
import { updateDeliveryAssignmentStatus } from "@/lib/actions/delivery/delivery-assignment";
import { toast } from "@/hooks/use-toast";

type DeliveryAssignment = PrismaDeliveryAssignment & {
  productionOrder: ProductionOrder & {
    product: Product;
    customerOrder?: CustomerOrder & {
      customer: Customer;
    };
  };
};

interface DeliveryTasksProps {
  assignments: DeliveryAssignment[];
}

export function DeliveryTasks({ assignments }: DeliveryTasksProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusUpdate = async (assignment: DeliveryAssignment) => {
    try {
      let newStatus: Status;
      switch (assignment.status) {
        case "PENDING":
          newStatus = "IN_PROGRESS";
          break;
        case "IN_PROGRESS":
          newStatus = "COMPLETED";
          break;
        default:
          return;
      }
      await updateDeliveryAssignmentStatus(assignment.id, newStatus);
      toast({
        title: "Success",
        description: `Status changed to ${newStatus
          .toLowerCase()
          .replace("_", " ")}`,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    }
  };

  const groupedAssignments = assignments.reduce<
    Record<Status, DeliveryAssignment[]>
  >((acc, assignment) => {
    const status = assignment.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(assignment);
    return acc;
  }, {} as Record<Status, DeliveryAssignment[]>);

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

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 mr-1" />;
      case "IN_PROGRESS":
        return <Truck className="h-4 w-4 mr-1" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "CANCELLED":
        return <AlertCircle className="h-4 w-4 mr-1" />;
      default:
        return null;
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

  const statusSections = [
    { status: "PENDING" as Status, label: "Pending", icon: MapPin },
    { status: "IN_PROGRESS" as Status, label: "In Progress", icon: Truck },
    { status: "COMPLETED" as Status, label: "Completed", icon: ClipboardCheck },
    { status: "CANCELLED" as Status, label: "Cancelled", icon: XCircle },
  ];

  const renderAssignmentCard = (assignment: DeliveryAssignment) => {
    const nextStatus = getNextStatus(assignment.status as Status);

    return (
      <Card key={assignment.id} className="mb-4">
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
            {getStatusBadge(assignment.status as Status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">Customer</p>
              <p className="text-sm text-muted-foreground">
                {assignment.productionOrder.customerOrder?.customer.name ||
                  "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Delivery Address</p>
              <p className="text-sm text-muted-foreground">
                {assignment.productionOrder.customerOrder?.shippingAddress ||
                  "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Scheduled Date</p>
              <p className="text-sm text-muted-foreground">
                {assignment.scheduledDate
                  ? format(new Date(assignment.scheduledDate), "PPP")
                  : "Not scheduled"}
              </p>
            </div>
            {assignment.notes && (
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.notes}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/delivery/orders/${assignment.id}`)}
          >
            View Details
          </Button>
          {nextStatus && (
            <Button
              onClick={() => handleStatusUpdate(assignment)}
              disabled={updating === assignment.id}
            >
              {updating === assignment.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                getStatusIcon(nextStatus)
              )}
              {nextStatus === "IN_PROGRESS"
                ? "Start Delivery"
                : "Complete Delivery"}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const renderStatusSection = (
    status: Status,
    assignments: DeliveryAssignment[]
  ) => {
    if (!assignments.length) return null;

    return (
      <Card key={status} className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{status}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">
                    {assignment.productionOrder.product.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Order #{assignment.productionOrder.id}
                  </p>
                  {assignment.scheduledDate && (
                    <p className="text-sm text-gray-500">
                      Scheduled:{" "}
                      {new Date(assignment.scheduledDate).toLocaleDateString()}
                    </p>
                  )}
                  {assignment.productionOrder.customerOrder?.customer && (
                    <p className="text-sm text-gray-500">
                      Customer:{" "}
                      {assignment.productionOrder.customerOrder.customer.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {status === "PENDING" && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(assignment)}
                    >
                      Start Delivery
                    </Button>
                  )}
                  {status === "IN_PROGRESS" && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(assignment)}
                    >
                      Mark as Delivered
                    </Button>
                  )}
                  <Button variant="outline">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid grid-cols-4 mb-6">
        {statusSections.map(({ status, label, icon: Icon }) => (
          <TabsTrigger value={status} key={status}>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span>{label}</span>
            </div>
            <Badge
              variant={
                status === "PENDING"
                  ? "secondary"
                  : status === "IN_PROGRESS"
                  ? "default"
                  : status === "COMPLETED"
                  ? "outline"
                  : "destructive"
              }
            >
              {groupedAssignments[status]?.length || 0} deliveries
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="pending">
        {groupedAssignments["PENDING"]?.length > 0 ? (
          renderStatusSection(
            "PENDING" as Status,
            groupedAssignments["PENDING"] || []
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No pending delivery tasks.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="in-progress">
        {groupedAssignments["IN_PROGRESS"]?.length > 0 ? (
          renderStatusSection(
            "IN_PROGRESS" as Status,
            groupedAssignments["IN_PROGRESS"] || []
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No in-progress delivery tasks.
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed">
        {groupedAssignments["COMPLETED"]?.length > 0 ? (
          renderStatusSection(
            "COMPLETED" as Status,
            groupedAssignments["COMPLETED"] || []
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No completed delivery tasks.
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="cancelled">
        {groupedAssignments["CANCELLED"]?.length > 0 ? (
          renderStatusSection(
            "CANCELLED" as Status,
            groupedAssignments["CANCELLED"] || []
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No cancelled delivery tasks.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
