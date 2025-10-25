"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Status } from "@prisma/client";
import {
  Card,
  CardContent,
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
  MapPin,
  ClipboardCheck,
  XCircle,
  ClipboardList,
  CalendarDays,
  Package,
  User,
} from "lucide-react";
import { updateDeliveryAssignmentStatus } from "@/lib/actions/delivery/delivery-assignment";
import { toast } from "@/hooks/use-toast";

type DeliveryAssignment = {
  id: string;
  status: Status;
  scheduledDate: Date | string | null;
  notes: string | null;
  deliveryAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  productionOrder: {
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
    };
    customerOrder: {
      id: string;
      customer: {
        id: string;
        name: string;
        email: string;
        phone: string;
      };
      shippingAddress: string | null;
    } | null;
  };
};

interface DeliveryTasksProps {
  assignments: DeliveryAssignment[];
}

export function DeliveryTasks({ assignments }: DeliveryTasksProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [tasks, setTasks] = useState(assignments);

  useEffect(() => {
    setTasks(assignments);
  }, [assignments]);

  const statusConfig = useMemo(
    () => [
      {
        value: Status.PENDING,
        label: "Pending",
        description: "Shipments waiting to be picked up",
        icon: Clock,
        iconClass: "text-amber-500",
      },
      {
        value: Status.IN_PROGRESS,
        label: "In Progress",
        description: "Deliveries currently en route",
        icon: Truck,
        iconClass: "text-sky-500",
      },
      {
        value: Status.COMPLETED,
        label: "Completed",
        description: "Successfully delivered shipments",
        icon: CheckCircle,
        iconClass: "text-emerald-500",
      },
      {
        value: Status.CANCELLED,
        label: "Cancelled",
        description: "Deliveries that were cancelled",
        icon: XCircle,
        iconClass: "text-rose-500",
      },
    ],
    []
  );

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
      setUpdating(assignment.id);
      await updateDeliveryAssignmentStatus(assignment.id, newStatus);
      toast({
        title: "Success",
        description: `Status changed to ${newStatus
          .toLowerCase()
          .replace("_", " ")}`,
      });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === assignment.id
            ? {
                ...task,
                status: newStatus,
                updatedAt: new Date(),
              }
            : task
        )
      );
      router.refresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const groupedAssignments = useMemo(() => {
    return tasks.reduce<Record<Status, DeliveryAssignment[]>>((acc, assignment) => {
      const status = assignment.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(assignment);
      return acc;
    }, {} as Record<Status, DeliveryAssignment[]>);
  }, [tasks]);

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

  const renderAssignmentCard = (assignment: DeliveryAssignment) => {
    const nextStatus = getNextStatus(assignment.status as Status);
    const isUpdating = updating === assignment.id;
    
    return (
      <div
        key={assignment.id}
        className="rounded-lg border border-border/60 bg-background/80 p-4 shadow-sm transition hover:border-border hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {assignment.productionOrder.product.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Order #{assignment.productionOrder.customerOrder?.id || "N/A"}
            </p>
          </div>
          {getStatusBadge(assignment.status as Status)}
        </div>

        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Quantity: {assignment.productionOrder.quantity}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {assignment.productionOrder.customerOrder?.customer.name ||
                "No customer assigned"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {assignment.productionOrder.customerOrder?.shippingAddress ||
                "No shipping address"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {assignment.scheduledDate
                ? format(new Date(assignment.scheduledDate), "PPP")
                : "Not scheduled"}
            </span>
          </div>
          {assignment.notes && (
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-amber-500" />
              <span className="leading-relaxed text-muted-foreground">
                {assignment.notes}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/delivery/orders/${assignment.id}`)}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            View Details
          </Button>
          {nextStatus && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate(assignment)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                getStatusIcon(nextStatus)
              )}
              {nextStatus === "IN_PROGRESS"
                ? "Start Delivery"
                : "Complete Delivery"}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const summaryCounts = useMemo(() => {
    return statusConfig.map((config) => ({
      ...config,
      count: groupedAssignments[config.value]?.length ?? 0,
    }));
  }, [groupedAssignments, statusConfig]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {summaryCounts.map(({ value, label, count, icon: Icon, iconClass }) => (
          <div
            key={value}
            className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
            <span>{label}</span>
            <span className="inline-flex h-5 min-w-[2rem] items-center justify-center rounded-full bg-muted px-2 text-[0.7rem] font-semibold text-foreground">
              {count}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statusConfig.map((column) => {
          const ColumnIcon = column.icon;
          const tasksForStatus = groupedAssignments[column.value] || [];
          const count = tasksForStatus.length;

          return (
            <Card key={column.value} className="flex min-h-[320px] flex-col border-border/60 bg-card/70">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 items-start gap-3">
                    <ColumnIcon className={`mt-0.5 h-4 w-4 ${column.iconClass}`} />
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-semibold">
                        {column.label}
                      </CardTitle>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {column.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-full border-border/60 px-2 py-0.5 text-[0.65rem]">
                    {count} task{count === 1 ? "" : "s"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-3 pt-4">
                {count === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/40 px-4 py-8 text-center">
                    <ClipboardList className="mb-3 h-6 w-6 text-muted-foreground/70" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No {column.label.toLowerCase()} tasks
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      {column.value === Status.PENDING
                        ? "New assignments will appear here once dispatched."
                        : column.value === Status.IN_PROGRESS
                        ? "Track ongoing deliveries as they move through the route."
                        : column.value === Status.COMPLETED
                        ? "Completed deliveries are archived in this lane."
                        : "Cancelled or reassigned deliveries will stay here for reference."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-3">
                    {tasksForStatus.map((assignment) => renderAssignmentCard(assignment))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
