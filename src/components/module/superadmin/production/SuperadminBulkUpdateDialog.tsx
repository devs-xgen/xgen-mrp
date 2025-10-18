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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, CheckSquare, Calendar, DollarSign, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  bulkUpdateProductionOrders,
  bulkUpdateProductionOrderQuantities,
  bulkUpdateProductionOrderCosts,
  bulkUpdateProductionOrderDates,
} from "@/lib/actions/superadmin/production-order";

const formSchema = z.object({
  // Status & Priority
  status: z.string().optional(),
  priority: z.string().optional(),

  // Quantity
  quantity: z.coerce.number().positive("Quantity must be positive").optional(),

  // Costs
  plannedMaterialCost: z.coerce.number().nonnegative("Cost cannot be negative").optional(),
  actualMaterialCost: z.coerce.number().nonnegative("Cost cannot be negative").optional(),
  materialVariance: z.coerce.number().optional(),

  // Dates
  startDate: z.string().optional(),
  dueDate: z.string().optional(),

  reason: z.string().min(15, "Reason must be at least 15 characters"),
}).refine((data) => {
  return data.status || data.priority || data.quantity ||
         data.plannedMaterialCost !== undefined ||
         data.actualMaterialCost !== undefined ||
         data.materialVariance !== undefined ||
         data.startDate || data.dueDate;
}, {
  message: "You must update at least one field",
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
      quantity: undefined,
      plannedMaterialCost: undefined,
      actualMaterialCost: undefined,
      materialVariance: undefined,
      startDate: "",
      dueDate: "",
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      let updateCount = 0;

      // Handle Status & Priority updates
      if (values.status || values.priority) {
        const updates: any = {};
        if (values.status) updates.status = values.status;
        if (values.priority) updates.priority = values.priority;

        await bulkUpdateProductionOrders(selectedOrderIds, updates, values.reason);
        updateCount++;
      }

      // Handle Quantity update
      if (values.quantity !== undefined) {
        await bulkUpdateProductionOrderQuantities(
          selectedOrderIds,
          values.quantity,
          values.reason
        );
        updateCount++;
      }

      // Handle Cost updates
      const hasCostUpdates =
        values.plannedMaterialCost !== undefined ||
        values.actualMaterialCost !== undefined ||
        values.materialVariance !== undefined;

      if (hasCostUpdates) {
        const costs: any = {};
        if (values.plannedMaterialCost !== undefined) costs.plannedMaterialCost = values.plannedMaterialCost;
        if (values.actualMaterialCost !== undefined) costs.actualMaterialCost = values.actualMaterialCost;
        if (values.materialVariance !== undefined) costs.materialVariance = values.materialVariance;

        await bulkUpdateProductionOrderCosts(selectedOrderIds, costs, values.reason);
        updateCount++;
      }

      // Handle Date updates
      if (values.startDate || values.dueDate) {
        const dates: any = {};
        if (values.startDate) dates.startDate = new Date(values.startDate);
        if (values.dueDate) dates.dueDate = new Date(values.dueDate);

        await bulkUpdateProductionOrderDates(selectedOrderIds, dates, values.reason);
        updateCount++;
      }

      toast({
        title: "Bulk Update Successful",
        description: `Updated ${selectedOrderIds.length} production orders across ${updateCount} operation(s)`,
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
            <Tabs defaultValue="status" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="quantity">
                  <Hash className="h-4 w-4 mr-1" />
                  Quantity
                </TabsTrigger>
                <TabsTrigger value="costs">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Costs
                </TabsTrigger>
                <TabsTrigger value="dates">
                  <Calendar className="h-4 w-4 mr-1" />
                  Dates
                </TabsTrigger>
              </TabsList>

              {/* Status & Priority Tab */}
              <TabsContent value="status" className="space-y-4">
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
              </TabsContent>

              {/* Quantity Tab */}
              <TabsContent value="quantity" className="space-y-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Enter new quantity for all selected orders"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This quantity will be applied to all {selectedOrderIds.length} selected orders
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> Changing quantity may affect material reservations and
                    cost calculations. Review the impact before proceeding.
                  </p>
                </div>
              </TabsContent>

              {/* Costs Tab */}
              <TabsContent value="costs" className="space-y-4">
                <FormField
                  control={form.control}
                  name="plannedMaterialCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Material Cost (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 1500.00"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Set the planned/budgeted material cost
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actualMaterialCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Material Cost (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 1650.00"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Set the actual spent material cost
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="materialVariance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Variance (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 150.00 (can be negative)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Set the cost variance (positive = over budget, negative = under budget)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    <strong>Note:</strong> Only fill in the cost fields you want to update. Empty fields will not be changed.
                  </p>
                </div>
              </TabsContent>

              {/* Dates Tab */}
              <TabsContent value="dates" className="space-y-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Set the production start date for all selected orders
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Set the production due date for all selected orders
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Tip:</strong> You can update just the start date, just the due date, or both.
                    Empty fields will not be changed.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Reason field - always visible */}
            <div className="pt-4 border-t">
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
                      This reason will apply to all {selectedOrderIds.length} orders and will be logged in the audit trail
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
