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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  bulkApprovePurchaseOrders,
  bulkCancelPurchaseOrders,
} from "@/lib/actions/superadmin/supplier";

const formSchema = z.object({
  reason: z.string().min(15, "Reason must be at least 15 characters"),
});

interface BulkPOOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPOIds: string[];
  purchaseOrders: any[];
  operation: "approve" | "cancel";
  onSuccess?: () => void;
}

export function BulkPOOperationsDialog({
  open,
  onOpenChange,
  selectedPOIds,
  purchaseOrders,
  operation,
  onSuccess,
}: BulkPOOperationsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { reason: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const result =
        operation === "approve"
          ? await bulkApprovePurchaseOrders(selectedPOIds, values.reason)
          : await bulkCancelPurchaseOrders(selectedPOIds, values.reason);

      if (!result.success) {
        toast({
          title: "Operation Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Bulk Operation Successful",
        description: `${operation === "approve" ? "Approved" : "Cancelled"} ${result.count} purchase order${
          result.count > 1 ? "s" : ""
        }`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to perform operation",
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
          <DialogTitle>{operation === "approve" ? "Approve" : "Cancel"} Purchase Orders</DialogTitle>
          <DialogDescription>
            {operation === "approve" ? "Approve" : "Cancel"} {selectedPOIds.length} selected purchase order
            {selectedPOIds.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">Bulk Operation</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            This will affect <strong>{selectedPOIds.length} purchase orders</strong>. All changes will be logged.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audit Reason (Min 15 characters)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why you're performing this operation..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : `${operation === "approve" ? "Approve" : "Cancel"} POs`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
