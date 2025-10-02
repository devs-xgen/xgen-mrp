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
import { AlertTriangle, Shield, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bulkUpdateProductionOrders } from "@/lib/actions/superadmin/production-order";

const formSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  reason: z.string().min(15, "Reason must be at least 15 characters"),
}).refine((data) => data.status || data.priority, {
  message: "You must select at least one field to update",
  path: ["status"],
});

interface SuperadminBulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrderIds: string[];
  onSuccess?: () => void;
}

export function SuperadminBulkUpdateDialog({
  open,
  onOpenChange,
  selectedOrderIds,
  onSuccess,
}: SuperadminBulkUpdateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "",
      priority: "",
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const updates: any = {};
      if (values.status) updates.status = values.status;
      if (values.priority) updates.priority = values.priority;

      await bulkUpdateProductionOrders(selectedOrderIds, updates, values.reason);

      toast({
        title: "Bulk Update Successful",
        description: `Updated ${selectedOrderIds.length} production orders`,
      });

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
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Bulk Update Production Orders
          </DialogTitle>
          <DialogDescription>
            Update multiple production orders at once with a single reason
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          {/* Warning Banner */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  This action will update <strong>{selectedOrderIds.length} production orders</strong>{" "}
                  simultaneously. All changes will be logged in the audit trail.
                </p>
              </div>
            </div>
          </div>

          {/* Selected Orders Summary */}
          <div className="space-y-2 rounded-lg border p-3 bg-muted/50">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="font-medium">Selected Orders:</span>
              <Badge>{selectedOrderIds.length}</Badge>
            </div>
            <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
              {selectedOrderIds.slice(0, 5).map((id) => (
                <div key={id} className="font-mono">
                  {id.substring(0, 12)}...
                </div>
              ))}
              {selectedOrderIds.length > 5 && (
                <div className="text-muted-foreground">
                  +{selectedOrderIds.length - 5} more...
                </div>
              )}
            </div>
          </div>

          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status (leave empty to skip)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Don't change status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leave empty if you don't want to change status
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Priority (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority (leave empty to skip)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Don't change priority</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leave empty if you don't want to change priority
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
                  <FormLabel>Bulk Update Reason (Required - Min 15 characters)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why you're updating these production orders in bulk..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This reason will apply to all {selectedOrderIds.length} orders
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
