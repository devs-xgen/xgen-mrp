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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  bulkArchiveProducts,
  bulkActivateProducts,
  bulkUpdateProductPricing,
} from "@/lib/actions/superadmin/product";

const formSchema = z.object({
  reason: z.string().min(15, "Reason must be at least 15 characters"),
  adjustmentType: z.enum(["SET", "INCREASE", "DECREASE"]).optional(),
  adjustmentValue: z.number().optional(),
});

interface BulkProductOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductIds: string[];
  products: any[];
  operation: "archive" | "activate" | "pricing";
  onSuccess?: () => void;
}

export function BulkProductOperationsDialog({
  open,
  onOpenChange,
  selectedProductIds,
  products,
  operation,
  onSuccess,
}: BulkProductOperationsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      adjustmentType: "SET",
      adjustmentValue: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      let result;

      if (operation === "archive") {
        result = await bulkArchiveProducts(selectedProductIds, values.reason);
      } else if (operation === "activate") {
        result = await bulkActivateProducts(selectedProductIds, values.reason);
      } else if (operation === "pricing") {
        result = await bulkUpdateProductPricing(
          selectedProductIds,
          {
            adjustmentType: values.adjustmentType,
            adjustmentValue: values.adjustmentValue,
          },
          values.reason
        );
      }

      if (!result || !result.success) {
        toast({
          title: "Operation Failed",
          description: result?.error || "Failed to perform bulk operation",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Bulk Operation Successful",
        description: `Updated ${result.count} product${result.count > 1 ? "s" : ""}`,
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

  const getTitle = () => {
    switch (operation) {
      case "archive": return "Archive Products";
      case "activate": return "Activate Products";
      case "pricing": return "Update Product Pricing";
      default: return "Bulk Operation";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Apply operation to {selectedProductIds.length} selected product{selectedProductIds.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Bulk Operation
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              This action will affect <strong>{selectedProductIds.length} products</strong>.
              All changes will be logged in the audit trail.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {operation === "pricing" && (
                <>
                  <FormField
                    control={form.control}
                    name="adjustmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adjustment Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SET">Set Price</SelectItem>
                            <SelectItem value="INCREASE">Increase by Amount</SelectItem>
                            <SelectItem value="DECREASE">Decrease by Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adjustmentValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Dollar amount for the adjustment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Reason (Min 15 characters)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you're performing this bulk operation..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This reason applies to all {selectedProductIds.length} products
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
                    ? `Processing ${selectedProductIds.length} products...`
                    : `Update ${selectedProductIds.length} Products`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
