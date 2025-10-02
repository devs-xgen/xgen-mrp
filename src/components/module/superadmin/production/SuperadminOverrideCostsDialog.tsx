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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { overrideProductionOrderCosts } from "@/lib/actions/superadmin/production-order";

const formSchema = z.object({
  plannedMaterialCost: z.string().optional(),
  actualMaterialCost: z.string().optional(),
  materialVariance: z.string().optional(),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

interface SuperadminOverrideCostsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    productName: string;
    plannedMaterialCost: number;
    actualMaterialCost: number;
    materialVariance: number;
  };
}

export function SuperadminOverrideCostsDialog({
  open,
  onOpenChange,
  order,
}: SuperadminOverrideCostsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plannedMaterialCost: order.plannedMaterialCost.toString(),
      actualMaterialCost: order.actualMaterialCost.toString(),
      materialVariance: order.materialVariance.toString(),
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const costs: any = {};
      if (values.plannedMaterialCost) {
        costs.plannedMaterialCost = parseFloat(values.plannedMaterialCost);
      }
      if (values.actualMaterialCost) {
        costs.actualMaterialCost = parseFloat(values.actualMaterialCost);
      }
      if (values.materialVariance) {
        costs.materialVariance = parseFloat(values.materialVariance);
      }

      await overrideProductionOrderCosts(order.id, costs, values.reason);

      toast({
        title: "Costs Override Successful",
        description: "Production order costs have been updated",
      });

      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Override Failed",
        description: error.message || "Failed to override costs",
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
            Override Production Order Costs
          </DialogTitle>
          <DialogDescription>
            Manually adjust the planned, actual, and variance costs for this production order.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          {/* Warning Banner */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-900 dark:text-amber-100">
                Modifying costs will affect financial reports and variance analysis. This action is
                logged.
              </p>
            </div>
          </div>

          {/* Current Costs Info */}
          <div className="space-y-2 rounded-lg border p-3 bg-muted/50">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-medium break-words">{order.productName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 text-xs">
              <div className="text-center">
                <div className="text-muted-foreground mb-1">Planned</div>
                <div className="font-semibold text-xs sm:text-sm">₱{order.plannedMaterialCost.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground mb-1">Actual</div>
                <div className="font-semibold text-xs sm:text-sm">₱{order.actualMaterialCost.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground mb-1">Variance</div>
                <div
                  className={`font-semibold text-xs sm:text-sm ${
                    order.materialVariance > 0
                      ? "text-red-600"
                      : order.materialVariance < 0
                      ? "text-green-600"
                      : ""
                  }`}
                >
                  ₱{order.materialVariance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="plannedMaterialCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planned Material Cost (₱)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actualMaterialCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Material Cost (₱)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="materialVariance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Variance (₱)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Positive = over budget, Negative = under budget
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
                      placeholder="Explain why you're overriding the costs (min 10 characters)..."
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
                {isLoading ? "Overriding..." : "Override Costs"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
