// src/components/module/admin/products/bom/ditMaterialDialog.tsx
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
import { Loader2, AlertTriangle } from "lucide-react";
import { BOMEntryForDisplay } from "@/types/admin/bom";
import { Label } from "@/components/ui/label";
import { MaterialCostDisplay } from "@/components/shared/material";
import { checkMaterialAvailability } from "@/lib/actions/material-search";
import { MaterialStatusBadge } from "@/components/shared/material";

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
  const [availabilityInfo, setAvailabilityInfo] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
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
      setAvailabilityInfo(null);
    }
  }, [entry, open, form]);

  // When quantity changes, check availability
  useEffect(() => {
    const quantityNeeded = form.watch("quantityNeeded");
    const wastePercentage = form.watch("wastePercentage");

    if (open && quantityNeeded > 0) {
      const checkAvailability = async () => {
        setCheckingAvailability(true);
        try {
          // Calculate total needed including waste
          const totalNeeded = quantityNeeded * (1 + wastePercentage / 100);
          const info = await checkMaterialAvailability(
            entry.materialId,
            totalNeeded
          );
          setAvailabilityInfo(info);
        } catch (error) {
          console.error("Error checking availability:", error);
        } finally {
          setCheckingAvailability(false);
        }
      };

      // Debounce the check
      const timeout = setTimeout(checkAvailability, 500);
      return () => clearTimeout(timeout);
    }
  }, [
    form.watch("quantityNeeded"),
    form.watch("wastePercentage"),
    open,
    entry.materialId,
  ]);

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

  // Calculate total quantity with waste
  const calculateTotalWithWaste = () => {
    const quantity = form.watch("quantityNeeded") || 0;
    const waste = form.watch("wastePercentage") || 0;
    return quantity * (1 + waste / 100);
  };

  // Get material stock status
  const getStockStatus = (): "normal" | "low" | "out" => {
    if (!availabilityInfo) return "normal";

    if (availabilityInfo.availableStock <= 0) return "out";
    if (!availabilityInfo.isAvailable) return "low";
    return "normal";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Material: {entry.materialName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <Label>Material</Label>
            <div className="rounded-md bg-muted p-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{entry.materialName}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <p>SKU: {entry.materialSku}</p>
                    <p>Unit: {entry.unitOfMeasure}</p>
                  </div>
                </div>
                <div className="text-right">
                  <MaterialCostDisplay cost={entry.costPerUnit} />
                  {availabilityInfo && (
                    <div className="mt-1">
                      <MaterialStatusBadge
                        stockStatus={getStockStatus()}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
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

            {/* Show updated total and cost */}
            <div className="rounded-md bg-muted/50 p-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total per Unit:</span>
                <span className="font-bold">
                  {calculateTotalWithWaste().toFixed(2)} {entry.unitOfMeasure}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium">
                  Material Cost per Unit:
                </span>
                <MaterialCostDisplay
                  cost={entry.costPerUnit}
                  quantity={calculateTotalWithWaste()}
                  showPerUnit={false}
                  bold
                />
              </div>
              {entry.totalCost !==
                entry.costPerUnit * calculateTotalWithWaste() && (
                <div className="flex justify-between items-center mt-1 text-xs">
                  <span className="text-muted-foreground">Previous Cost:</span>
                  <MaterialCostDisplay
                    cost={
                      (entry.totalCost / entry.quantityNeeded) *
                      (1 + entry.wastePercentage / 100)
                    }
                    quantity={1}
                    size="xs"
                    className={
                      entry.costPerUnit * calculateTotalWithWaste() >
                      entry.totalCost
                        ? "text-red-500"
                        : "text-green-500"
                    }
                  />
                </div>
              )}
            </div>

            {/* Material availability warning */}
            {availabilityInfo && !availabilityInfo.isAvailable && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">
                      Low Stock Warning
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Current available stock (
                      {availabilityInfo.availableStock.toFixed(2)}{" "}
                      {availabilityInfo.unitSymbol}) is less than required
                      amount ({availabilityInfo.requiredQuantity.toFixed(2)}{" "}
                      {availabilityInfo.unitSymbol}). Please ensure sufficient
                      material is available before production.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
