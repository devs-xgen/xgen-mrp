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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Trash2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { forceDeleteProductionOrder } from "@/lib/actions/superadmin/production-order";

const formSchema = z.object({
  reason: z.string().min(20, "Reason must be at least 20 characters for deletion"),
  confirmDelete: z.boolean().refine((val) => val === true, {
    message: "You must confirm deletion",
  }),
});

interface SuperadminDeleteProductionOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    productName: string;
    quantity: number;
    status: string;
    customerOrderNumber?: string;
  };
}

export function SuperadminDeleteProductionOrderDialog({
  open,
  onOpenChange,
  order,
}: SuperadminDeleteProductionOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      confirmDelete: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      await forceDeleteProductionOrder(order.id, values.reason);

      toast({
        title: "Production Order Deleted",
        description: "The production order has been permanently deleted",
      });

      form.reset();
      onOpenChange(false);
      router.push("/superadmin/production");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete production order",
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
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Force Delete Production Order
          </DialogTitle>
          <DialogDescription>
            This is a destructive action that will permanently delete the production order and all
            related data.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          {/* Danger Banner */}
          <div className="bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                  ⚠️ CRITICAL ACTION WARNING
                </h3>
                <ul className="text-xs sm:text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                  <li>This will permanently delete the production order</li>
                  <li>All operations, quality checks, and material consumptions will be removed</li>
                  <li>Material reservations will be released</li>
                  <li>Cost variance data will be lost</li>
                  <li>Production history logs will be deleted</li>
                  <li>This action <strong>CANNOT be undone</strong></li>
                </ul>
                <p className="text-xs sm:text-sm text-red-900 dark:text-red-100 font-medium mt-3">
                  A complete audit log entry will be created before deletion.
                </p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-2 rounded-lg border-2 border-destructive p-3 bg-muted/50">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground font-medium">Product:</span>
              <span className="font-bold break-words">{order.productName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground font-medium">Order ID:</span>
              <span className="font-mono text-xs">{order.id.substring(0, 12)}...</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground font-medium">Quantity:</span>
              <span className="font-medium">{order.quantity} units</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground font-medium">Status:</span>
              <span className="font-medium">{order.status}</span>
            </div>
            {order.customerOrderNumber && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="text-muted-foreground font-medium">Customer Order:</span>
                <span className="font-medium">#{order.customerOrderNumber}</span>
              </div>
            )}
          </div>

          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-destructive font-semibold">
                    Deletion Reason (Required - Min 20 characters)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed explanation for why this production order is being force deleted..."
                      className="min-h-[120px] border-destructive/50 focus-visible:ring-destructive"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-destructive/80">
                    This reason will be permanently logged in the audit trail
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmDelete"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border-2 border-destructive p-4 bg-destructive/5">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-destructive data-[state=checked]:bg-destructive"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-semibold text-destructive">
                      I understand this action is permanent and cannot be undone
                    </FormLabel>
                    <FormDescription>
                      Check this box to confirm you want to proceed with deletion
                    </FormDescription>
                    <FormMessage />
                  </div>
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
              <Button
                type="submit"
                disabled={isLoading}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Deleting..." : "Permanently Delete"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
