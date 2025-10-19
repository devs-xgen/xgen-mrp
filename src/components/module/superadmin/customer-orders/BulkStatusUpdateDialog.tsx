"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bulkUpdateCustomerOrderStatus } from "@/lib/actions/superadmin/customer-order";

const formSchema = z.object({
  newStatus: z.enum(["PENDING", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  reason: z.string().min(15, "Reason must be at least 15 characters for audit trail"),
});

interface BulkStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrderIds: string[];
  orders: any[];
  onSuccess?: () => void;
}

export function BulkStatusUpdateDialog({
  open,
  onOpenChange,
  selectedOrderIds,
  orders,
  onSuccess,
}: BulkStatusUpdateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newStatus: "APPROVED",
      reason: "",
    },
  });

  // Count orders by status
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count orders with production
  const ordersWithProduction = orders.filter(o => (o._count?.productionOrders || 0) > 0).length;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const result = await bulkUpdateCustomerOrderStatus(
        selectedOrderIds,
        values.newStatus,
        values.reason
      );

      if (!result.success) {
        toast({
          title: "Bulk Update Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      // Show success toast
      toast({
        title: "Bulk Update Successful",
        description: (
          <div className="space-y-1">
            <div>
              Updated {result.count} order{result.count > 1 ? "s" : ""} to {values.newStatus}
            </div>
            {result.warnings && result.warnings.length > 0 && (
              <div className="text-amber-600 text-xs mt-1">
                {result.warnings.length} warning{result.warnings.length > 1 ? "s" : ""} (check console)
              </div>
            )}
          </div>
        ),
      });

      if (result.warnings) {
        console.warn("Bulk update warnings:", result.warnings);
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Bulk Update Failed",
        description: error.message || "Failed to update orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Bulk Update Order Status
          </DialogTitle>
          <DialogDescription>
            Update the status of {selectedOrderIds.length} selected order{selectedOrderIds.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Banner */}
          <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Bulk Status Update
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              This action will update <strong>{selectedOrderIds.length} customer orders</strong>.
              All changes will be logged in the audit trail.
            </AlertDescription>
          </Alert>

          {/* Current Status Summary */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <div className="text-sm font-medium mb-2">Current Status Distribution:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline">
                  {status}: {count}
                </Badge>
              ))}
            </div>
            {ordersWithProduction > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                {ordersWithProduction} order{ordersWithProduction > 1 ? "s" : ""} have linked production orders
              </div>
            )}
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Status to apply to all selected orders
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Reason (Required - Min 15 characters)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you're updating these orders in bulk..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This reason will apply to all {selectedOrderIds.length} orders and will be logged in the audit trail
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? `Updating ${selectedOrderIds.length} orders...`
                    : `Update ${selectedOrderIds.length} Orders`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
