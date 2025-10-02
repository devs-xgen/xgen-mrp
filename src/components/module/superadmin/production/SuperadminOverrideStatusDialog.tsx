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
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { forceUpdateProductionOrderStatus } from "@/lib/actions/superadmin/production-order";

const formSchema = z.object({
  newStatus: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ON_HOLD"]),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

interface SuperadminOverrideStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    productName: string;
    status: string;
    quantity: number;
    completedQuantity: number;
  };
}

export function SuperadminOverrideStatusDialog({
  open,
  onOpenChange,
  order,
}: SuperadminOverrideStatusDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newStatus: order.status as any,
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      await forceUpdateProductionOrderStatus(
        order.id,
        values.newStatus,
        values.reason
      );

      toast({
        title: "Status Override Successful",
        description: `Production order status changed to ${values.newStatus}`,
      });

      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Override Failed",
        description: error.message || "Failed to override status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Override Production Order Status
          </DialogTitle>
          <DialogDescription>
            Force update the status of this production order, bypassing normal workflow validation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          {/* Warning Banner */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-900 dark:text-amber-100">
                This action will forcefully change the production order status and will be logged in
                the audit trail.
              </p>
            </div>
          </div>

          {/* Current Order Info */}
          <div className="space-y-2 rounded-lg border p-3 bg-muted/50">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-medium break-words">{order.productName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Current Status:</span>
              <Badge>{order.status}</Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">
                {order.completedQuantity}/{order.quantity} units
              </span>
            </div>
          </div>

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
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the status you want to force this order into
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
                  <FormLabel>Override Reason (Required)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why you're overriding the status (min 10 characters)..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This reason will be logged in the audit trail
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
                {isLoading ? "Overriding..." : "Override Status"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
