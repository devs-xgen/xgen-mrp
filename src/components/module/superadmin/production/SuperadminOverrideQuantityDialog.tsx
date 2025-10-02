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
import { AlertTriangle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { overrideProductionOrderQuantity } from "@/lib/actions/superadmin/production-order";

const formSchema = z.object({
  newQuantity: z.string().min(1, "Quantity is required"),
  completedQuantity: z.string().optional(),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

interface SuperadminOverrideQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    productName: string;
    quantity: number;
    completedQuantity: number;
  };
}

export function SuperadminOverrideQuantityDialog({
  open,
  onOpenChange,
  order,
}: SuperadminOverrideQuantityDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newQuantity: order.quantity.toString(),
      completedQuantity: order.completedQuantity.toString(),
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      await overrideProductionOrderQuantity(
        order.id,
        parseInt(values.newQuantity),
        values.reason,
        values.completedQuantity ? parseInt(values.completedQuantity) : undefined
      );

      toast({
        title: "Quantity Override Successful",
        description: "Production order quantities have been updated",
      });

      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Override Failed",
        description: error.message || "Failed to override quantity",
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
            Override Production Order Quantity
          </DialogTitle>
          <DialogDescription>
            Manually adjust the planned and completed quantities for this production order.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          {/* Warning Banner */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-900 dark:text-amber-100">
                Changing quantities may affect material reservations and stock calculations.
              </p>
            </div>
          </div>

          {/* Current Quantity Info */}
          <div className="space-y-2 rounded-lg border p-3 bg-muted/50">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-medium break-words">{order.productName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Current Quantity:</span>
              <span className="font-medium">{order.quantity} units</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
              <span className="text-muted-foreground">Completed:</span>
              <span className="font-medium">{order.completedQuantity} units</span>
            </div>
          </div>

          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Planned Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>Total quantity to produce</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="completedQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Completed Quantity (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to keep current completed quantity
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
                      placeholder="Explain why you're overriding the quantity (min 10 characters)..."
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
                {isLoading ? "Overriding..." : "Override Quantity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
