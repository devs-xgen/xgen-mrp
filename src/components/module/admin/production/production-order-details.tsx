"use client";

import { useState } from "react";
import { Status, Priority } from "@prisma/client";
import { ProductionOrder } from "@/types/admin/production-order";
import { OperationsManagement } from "./operations-management";
import { QualityChecks } from "./quality-checks";
import { DeliveryAssignment } from "./delivery-assignment";
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
import { QualityCheck } from "@/types/admin/quality-checks";
import { formatDate } from "@/lib/utils";
import { LinkCustomerOrderDialog } from "./link-customer-order-dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface WorkCenter {
  id: string;
  name: string;
  capacityPerHour: number;
}

interface DeliveryUser {
  id: string;
  email: string;
  name?: string;
}

interface ProductionOrderDetailsProps {
  order: ProductionOrder;
  workCenters: WorkCenter[];
  deliveryUsers?: DeliveryUser[];
  onUpdateStatus?: (status: Status) => Promise<void>;
  onUpdateOperation?: (operationId: string, status: Status) => Promise<void>;
  onAddOperation?: () => void;
  onAddQualityCheck?: () => void;
  isLoading?: boolean;
}

const deliveryAssignmentFormSchema = z.object({
  userId: z.string().min(1, "Please select a delivery personnel"),
  scheduledDate: z
    .date()
    .min(new Date(), "Scheduled date must be in the future"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  notes: z.string().optional(),
});

function ensureDeliveryAssignmentHasProductionOrder(
  assignment: any,
  order: any
) {
  if (!assignment) return null;
  if ('productionOrder' in assignment && assignment.productionOrder) {
    return assignment;
  }
  return {
    ...assignment,
    productionOrder: {
      id: order.id,
      product: order.product,
      customerOrder: order.customerOrder || null,
    },
  };
}

export function ProductionOrderDetails({
  order,
  workCenters,
  deliveryUsers = [],
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

  const qualityChecks = (order.qualityChecks || []) as unknown as QualityCheck[];
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

      <DeliveryAssignment
        productionOrderId={order.id}
        deliveryAssignment={ensureDeliveryAssignmentHasProductionOrder(order.deliveryAssignment, order)}
        deliveryUsers={deliveryUsers}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
    </div>
  );
}

export function DeliveryAssignmentForm({
  onSubmit,
  deliveryUsers,
  defaultValues,
  customerAddress,
}: any) {
  const form = useForm<z.infer<typeof deliveryAssignmentFormSchema>>({
    resolver: zodResolver(deliveryAssignmentFormSchema),
    defaultValues: {
      userId: defaultValues?.userId || "",
      scheduledDate: defaultValues?.scheduledDate
        ? new Date(defaultValues.scheduledDate)
        : new Date(),
      deliveryAddress: defaultValues?.deliveryAddress || customerAddress || "",
      notes: defaultValues?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Personnel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery personnel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {deliveryUsers.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduledDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Date</FormLabel>
              <FormControl>
                <DateTimePicker date={field.value} setDate={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deliveryAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter delivery address" {...field} />
              </FormControl>
              <FormDescription>
                Default is customer&apos;s shipping address. You can specify a
                different address if needed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any delivery notes or instructions"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          {defaultValues ? "Update Assignment" : "Create Assignment"}
        </Button>
      </form>
    </Form>
  );
}
