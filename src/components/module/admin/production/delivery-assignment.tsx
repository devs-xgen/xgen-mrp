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
  updateDeliveryAssignmentStatus,
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { toast } = useToast();

  const handleAssignDelivery = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      if (deliveryAssignment) {
        await updateDeliveryAssignment(deliveryAssignment.id, {
          userId: data.userId,
          scheduledDate: data.scheduledDate,
          deliveryAddress: data.deliveryAddress,
          notes: data.notes,
          modifiedBy: "system", // TODO: Get from session
        });
      } else {
        await assignDeliveryToProductionOrder({
          productionOrderId,
          userId: data.userId,
          scheduledDate: data.scheduledDate,
          deliveryAddress: data.deliveryAddress,
          notes: data.notes,
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

  const handleStatusChange = async (newStatus: string) => {
    if (!deliveryAssignment) return;
    
    try {
      setIsUpdatingStatus(true);
      await updateDeliveryAssignmentStatus(deliveryAssignment.id, newStatus as Status);
      toast({
        title: "Status updated",
        description: `Delivery status changed to ${newStatus}`,
      });
      onRefresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderStatusSelect = () => {
    if (!deliveryAssignment) return null;
    
    return (
      <Select
        defaultValue={deliveryAssignment.status}
        onValueChange={handleStatusChange}
        disabled={isUpdatingStatus}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue>
            {isUpdatingStatus ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </div>
            ) : (
              getStatusBadge(deliveryAssignment.status as Status)
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as Status[]).map((status) => (
            <SelectItem key={status} value={status}>
              {getStatusBadge(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <Card className="rounded-3xl border border-border/70 bg-card/80 shadow-lg backdrop-blur">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/50 via-background to-muted/30 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Delivery Assignment</CardTitle>
            <CardDescription>Manage delivery responsibilities for this order</CardDescription>
          </div>
          {!deliveryAssignment && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Truck className="h-4 w-4" />
                  Assign Delivery
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Delivery</DialogTitle>
                  <DialogDescription>Assign a delivery personnel to handle this order</DialogDescription>
                </DialogHeader>
                <DeliveryAssignmentForm
                  onSubmit={handleAssignDelivery}
                  deliveryUsers={deliveryUsers}
                  customerAddress={deliveryAssignment?.productionOrder?.customerOrder?.shippingAddress ?? null}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading delivery details...
          </div>
        ) : deliveryAssignment ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <div className="mt-2">{renderStatusSelect()}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Assigned To</p>
                <p className="mt-2 text-base font-semibold text-foreground">{deliveryAssignment.userName ?? "Unassigned"}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Scheduled Date</p>
                <p className="mt-2">
                  {deliveryAssignment.scheduledDate
                    ? format(new Date(deliveryAssignment.scheduledDate), "PPP p")
                    : "Not scheduled"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery Address</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                  {deliveryAssignment.deliveryAddress ||
                    deliveryAssignment.productionOrder?.customerOrder?.shippingAddress ||
                    "No address specified"}
                </p>
              </div>
            </div>

            {deliveryAssignment.notes && (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{deliveryAssignment.notes}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Edit Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Delivery Assignment</DialogTitle>
                    <DialogDescription>Update the delivery assignment details</DialogDescription>
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
                      deliveryAssignment.productionOrder?.customerOrder?.shippingAddress
                        ? String(deliveryAssignment.productionOrder.customerOrder.shippingAddress)
                        : ""
                    }
                    isSubmitting={isSubmitting}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 py-10 text-center text-muted-foreground">
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {defaultValues ? "Update Assignment" : "Create Assignment"}
        </Button>
      </form>
    </Form>
  );
}
