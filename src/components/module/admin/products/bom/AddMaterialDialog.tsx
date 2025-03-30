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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createBOMEntry, getAvailableMaterials } from "@/lib/actions/bom";
import { Loader2 } from "lucide-react";

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

interface Material {
  id: string;
  name: string;
  sku: string;
  costPerUnit: number;
  unitOfMeasure: {
    symbol: string;
    name: string;
  };
}

interface AddMaterialDialogProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export function AddMaterialDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onSuccess,
}: AddMaterialDialogProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
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
    }
  }, [open, form]);

  // Fetch available materials when dialog opens
  useEffect(() => {
    if (open) {
      const fetchMaterials = async () => {
        setIsFetching(true);
        try {
          const materialsData = await getAvailableMaterials();
          setMaterials(materialsData);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to fetch available materials",
            variant: "destructive",
          });
        } finally {
          setIsFetching(false);
        }
      };

      fetchMaterials();
    }
  }, [open, toast]);

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

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Get selected material details
  const selectedMaterialId = form.watch("materialId");
  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isFetching}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isFetching
                              ? "Loading materials..."
                              : "Select a material"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.length === 0 && !isFetching ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          No materials available
                        </div>
                      ) : (
                        materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {material.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                SKU: {material.sku} | Unit:{" "}
                                {material.unitOfMeasure.symbol} | Cost:{" "}
                                {formatCurrency(material.costPerUnit)}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedMaterial && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="font-medium">{selectedMaterial.name}</div>
                <div className="mt-1 text-muted-foreground">
                  <div>
                    Unit: {selectedMaterial.unitOfMeasure.name} (
                    {selectedMaterial.unitOfMeasure.symbol})
                  </div>
                  <div>
                    Cost per Unit:{" "}
                    {formatCurrency(selectedMaterial.costPerUnit)}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Show calculated total cost if material and quantity are provided */}
            {selectedMaterial && form.watch("quantityNeeded") > 0 && (
              <div className="rounded-md bg-muted/50 p-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Estimated Cost:</span>
                  <span className="font-bold">
                    {formatCurrency(
                      selectedMaterial.costPerUnit *
                        form.watch("quantityNeeded")
                    )}
                  </span>
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
              <Button type="submit" disabled={isLoading || isFetching}>
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
