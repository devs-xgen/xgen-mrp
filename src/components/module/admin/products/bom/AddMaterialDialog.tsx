// src/components/module/admin/products/bom/AddMaterialDialog.tsx
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
import { createBOMEntry } from "@/lib/actions/bom";
import { Loader2, AlertTriangle } from "lucide-react";
import { MaterialSelector, MaterialOption } from "@/components/shared/material";
import { MaterialCostDisplay } from "@/components/shared/material";
import { checkMaterialAvailability } from "@/lib/actions/material-search";
import { Badge } from "@/components/ui/badge";

// Define the validation schema
const formSchema = z.object({
  materialId: z
    .string({
      required_error: "Please select a material",
    })
    .min(1, "Material is required"),

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

interface AddMaterialDialogProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  preloadedMaterials?: MaterialOption[];
  excludeMaterialIds?: string[];
}

export function AddMaterialDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onSuccess,
  preloadedMaterials,
  excludeMaterialIds = [],
}: AddMaterialDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<MaterialOption | null>(null);
  const [availabilityInfo, setAvailabilityInfo] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      materialId: "",
      quantityNeeded: 1,
      wastePercentage: 0,
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        materialId: "",
        quantityNeeded: 1,
        wastePercentage: 0,
      });
      setSelectedMaterial(null);
      setAvailabilityInfo(null);
    }
  }, [open, form]);

  // When material or quantity changes, check availability
  useEffect(() => {
    const materialId = form.watch("materialId");
    const quantityNeeded = form.watch("quantityNeeded");
    const wastePercentage = form.watch("wastePercentage");

    if (materialId && quantityNeeded > 0) {
      const checkAvailability = async () => {
        setCheckingAvailability(true);
        try {
          // Calculate total needed including waste
          const totalNeeded = quantityNeeded * (1 + wastePercentage / 100);
          const info = await checkMaterialAvailability(materialId, totalNeeded);
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
    form.watch("materialId"),
    form.watch("quantityNeeded"),
    form.watch("wastePercentage"),
  ]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      await createBOMEntry({
        productId,
        materialId: values.materialId,
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
            : "Failed to add material to bill of materials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle material selection
  const handleMaterialChange = (
    materialId: string,
    material?: MaterialOption
  ) => {
    form.setValue("materialId", materialId);
    if (material) {
      setSelectedMaterial(material);
    }
  };

  // Calculate total with waste
  const calculateTotalWithWaste = () => {
    const quantity = form.watch("quantityNeeded") || 0;
    const waste = form.watch("wastePercentage") || 0;
    return quantity * (1 + waste / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Material to {productName}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <MaterialSelector
                    value={field.value}
                    onValueChange={handleMaterialChange}
                    placeholder="Select a material"
                    preloadedMaterials={preloadedMaterials}
                    excludeMaterialIds={excludeMaterialIds}
                    showStockWarnings={true}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedMaterial && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{selectedMaterial.name}</div>
                    <div className="mt-1 text-muted-foreground">
                      <div>
                        Unit: {selectedMaterial.unitOfMeasureName} (
                        {selectedMaterial.unitOfMeasureSymbol})
                      </div>
                      <div>Type: {selectedMaterial.typeName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      <MaterialCostDisplay
                        cost={selectedMaterial.costPerUnit}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Stock: {selectedMaterial.currentStock}{" "}
                      {selectedMaterial.unitOfMeasureSymbol}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      Amount needed per unit of product
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
                      Additional material for scrap/waste
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Show calculated total cost if material and quantity are provided */}
            {selectedMaterial && form.watch("quantityNeeded") > 0 && (
              <div className="rounded-md bg-muted/50 p-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total per Unit:</span>
                  <span className="font-bold">
                    {calculateTotalWithWaste().toFixed(2)}{" "}
                    {selectedMaterial.unitOfMeasureSymbol}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium">
                    Material Cost per Unit:
                  </span>
                  <MaterialCostDisplay
                    cost={selectedMaterial.costPerUnit}
                    quantity={calculateTotalWithWaste()}
                    showPerUnit={false}
                    bold
                  />
                </div>
              </div>
            )}

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
                Add Material
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
