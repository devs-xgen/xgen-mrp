"use client";

import { useState, useEffect } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateBOMEntry } from "@/lib/actions/bom";
import { Loader2 } from "lucide-react";
import { BOMEntryForDisplay } from "@/types/admin/bom";
import { Label } from "@/components/ui/label";

// Define the validation schema
const formSchema = z.object({
  quantityNeeded: z.coerce
    .number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number",
    })
    .positive("Quantity must be greater than 0"),

  wastePercentage: z.coerce
    .number({
      required_error: "Waste percentage is required",
      invalid_type_error: "Waste percentage must be a number",
    })
    .min(0, "Waste percentage cannot be negative")
    .max(100, "Waste percentage cannot exceed 100%"),
});

interface EditMaterialDialogProps {
  entry: BOMEntryForDisplay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export function EditMaterialDialog({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: EditMaterialDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form with entry values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantityNeeded: entry.quantityNeeded,
      wastePercentage: entry.wastePercentage,
    },
  });

  // Reset form when entry changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        quantityNeeded: entry.quantityNeeded,
        wastePercentage: entry.wastePercentage,
      });
    }
  }, [entry, open, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      await updateBOMEntry({
        id: entry.id,
        quantityNeeded: values.quantityNeeded,
        wastePercentage: values.wastePercentage,
      });

      await onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update material specifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Watch quantity to calculate estimated cost
  const currentQuantity = form.watch("quantityNeeded");
  const estimatedCost = entry.costPerUnit * currentQuantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Material: {entry.materialName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <Label>Material</Label>
            <div className="rounded-md bg-muted p-3">
              <div className="font-medium">{entry.materialName}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                <p>SKU: {entry.materialSku}</p>
                <p>Unit: {entry.unitOfMeasure}</p>
                <p>Cost per Unit: {formatCurrency(entry.costPerUnit)}</p>
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantityNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Needed</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Amount of material needed per unit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wastePercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waste Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Additional material for waste/scrap
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Show updated total cost */}
            <div className="rounded-md bg-muted/50 p-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Updated Cost:</span>
                <span className="font-bold">
                  {formatCurrency(estimatedCost)}
                </span>
              </div>
              {entry.totalCost !== estimatedCost && (
                <div className="flex justify-between items-center mt-1 text-xs">
                  <span className="text-muted-foreground">Previous:</span>
                  <span
                    className={
                      estimatedCost > entry.totalCost
                        ? "text-red-500"
                        : "text-green-500"
                    }
                  >
                    {formatCurrency(entry.totalCost)} (
                    {estimatedCost > entry.totalCost
                      ? "+" + formatCurrency(estimatedCost - entry.totalCost)
                      : "-" + formatCurrency(entry.totalCost - estimatedCost)}
                    )
                  </span>
                </div>
              )}
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
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Material
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
