"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { overrideProductionOrderDates } from "@/lib/actions/superadmin/production-order";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  markAsCompleted: z.boolean().optional(),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

interface SuperadminOverrideDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    productName: string;
    startDate: Date;
    dueDate: Date;
    status: string;
  };
}

export function SuperadminOverrideDatesDialog({
  open,
  onOpenChange,
  order,
}: SuperadminOverrideDatesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: format(new Date(order.startDate), "yyyy-MM-dd"),
      dueDate: format(new Date(order.dueDate), "yyyy-MM-dd"),
      markAsCompleted: false,
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const dates: any = {};
      if (values.startDate) {
        dates.startDate = new Date(values.startDate);
      }
      if (values.dueDate) {
        dates.dueDate = new Date(values.dueDate);
      }
      if (values.markAsCompleted) {
        dates.completedAt = new Date();
      }

      await overrideProductionOrderDates(order.id, dates, values.reason);

      toast({
        title: "Dates Override Successful",
        description: "Production order dates have been updated",
      });

      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Override Failed",
        description: error.message || "Failed to override dates",
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
            Override Production Order Dates
          </DialogTitle>
          <DialogDescription>
            Manually adjust the start date, due date, or completion date for this production order.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          {/* Warning Banner */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-900 dark:text-amber-100">
                Changing dates may affect scheduling and priority calculations.
              </p>
            </div>
          </div>

          {/* Current Dates Info */}
          <div className="space-y-2 rounded-lg border p-3 bg-muted/50">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-medium break-words">{order.productName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Current Start Date:</span>
              <span className="font-medium">
                {format(new Date(order.startDate), "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Current Due Date:</span>
              <span className="font-medium">
                {format(new Date(order.dueDate), "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">{order.status}</span>
            </div>
          </div>

          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="markAsCompleted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mark as completed now</FormLabel>
                    <FormDescription>
                      Sets the completion date to current time
                    </FormDescription>
                  </div>
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
                      placeholder="Explain why you're overriding the dates (min 10 characters)..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
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
                {isLoading ? "Overriding..." : "Override Dates"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
