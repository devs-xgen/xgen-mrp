"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Status } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Loader2,
  Truck,
  UserPlus,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  assignDeliveryToProductionOrder,
  updateDeliveryAssignment,
} from "@/lib/actions/delivery/delivery-assignment";
import { format } from "date-fns";
import { DateTimePicker } from "@/components/ui/date-time-picker";

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

interface DeliveryAssignmentProps {
  productionOrderId: string;
  deliveryAssignment: DeliveryAssignmentType | null;
  deliveryUsers: DeliveryUser[];
  onRefresh: () => Promise<void>;
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

type FormData = z.infer<typeof deliveryAssignmentFormSchema>;

export function DeliveryAssignment({
  productionOrderId,
  deliveryAssignment,
  deliveryUsers,
  onRefresh,
  isLoading = false,
}: DeliveryAssignmentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAssignDelivery = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      if (deliveryAssignment) {
        await updateDeliveryAssignment(deliveryAssignment.id, {
          ...data,
          modifiedBy: "system", // TODO: Get from session
        });
      } else {
        await assignDeliveryToProductionOrder({
          productionOrderId,
          ...data,
        });
      }

      toast({
        title: "Success",
        description: deliveryAssignment
          ? "Delivery assignment updated"
          : "Delivery assigned successfully",
      });

      setIsDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error handling delivery assignment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Delivery Assignment</CardTitle>
            <CardDescription>
              Manage delivery assignment for this production order
            </CardDescription>
          </div>
          {!deliveryAssignment && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Truck className="h-4 w-4 mr-2" />
                  Assign Delivery
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Delivery</DialogTitle>
                  <DialogDescription>
                    Assign a delivery personnel to handle this order
                  </DialogDescription>
                </DialogHeader>
                <DeliveryAssignmentForm
                  onSubmit={handleAssignDelivery}
                  deliveryUsers={deliveryUsers}
                  customerAddress={null}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {deliveryAssignment ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">
                  Status
                </h3>
                {getStatusBadge(deliveryAssignment.status)}
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">
                  Assigned To
                </h3>
                <p>{deliveryAssignment.userName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">
                  Scheduled Date
                </h3>
                <p>
                  {deliveryAssignment.scheduledDate
                    ? format(
                        new Date(deliveryAssignment.scheduledDate),
                        "PPP p"
                      )
                    : "Not scheduled"}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">
                  Delivery Address
                </h3>
                <p className="whitespace-pre-wrap">
                  {deliveryAssignment.deliveryAddress ||
                    deliveryAssignment.productionOrder?.customerOrder
                      ?.shippingAddress ||
                    "No address specified"}
                </p>
              </div>
            </div>
            {deliveryAssignment.notes && (
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">
                  Notes
                </h3>
                <p className="whitespace-pre-wrap">
                  {deliveryAssignment.notes}
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Edit Assignment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Delivery Assignment</DialogTitle>
                    <DialogDescription>
                      Update the delivery assignment details
                    </DialogDescription>
                  </DialogHeader>
                  <DeliveryAssignmentForm
                    onSubmit={handleAssignDelivery}
                    deliveryUsers={deliveryUsers}
                    defaultValues={{
                      userId: deliveryAssignment.userId,
                      scheduledDate: deliveryAssignment.scheduledDate
                        ? new Date(deliveryAssignment.scheduledDate)
                        : undefined,
                      deliveryAddress: deliveryAssignment.deliveryAddress || "",
                      notes: deliveryAssignment.notes || "",
                    }}
                    customerAddress={
                      deliveryAssignment.productionOrder?.customerOrder
                        ?.shippingAddress
                        ? String(
                            deliveryAssignment.productionOrder.customerOrder
                              .shippingAddress
                          )
                        : ""
                    }
                    isSubmitting={isSubmitting}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No delivery assignment yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DeliveryAssignmentFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  deliveryUsers: DeliveryUser[];
  defaultValues?: {
    userId: string;
    scheduledDate?: Date;
    deliveryAddress: string;
    notes: string;
  };
  customerAddress?: string | null;
  isSubmitting?: boolean;
}

export function DeliveryAssignmentForm({
  onSubmit,
  deliveryUsers,
  defaultValues,
  customerAddress,
  isSubmitting = false,
}: DeliveryAssignmentFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(deliveryAssignmentFormSchema),
    defaultValues: {
      userId: defaultValues?.userId || "",
      scheduledDate: defaultValues?.scheduledDate || new Date(),
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
                  {deliveryUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
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
                Default is customer's shipping address. You can specify a
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {defaultValues ? "Update Assignment" : "Create Assignment"}
        </Button>
      </form>
    </Form>
  );
}
