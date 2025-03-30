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

const formSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  quantityNeeded: z.coerce.number().positive("Quantity must be greater than 0"),
  wastePercentage: z.coerce
    .number()
    .min(0, "Waste percentage cannot be negative")
    .max(100, "Waste percentage cannot exceed 100%"),
});

interface Material {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: {
    name: string;
    symbol: string;
  };
  costPerUnit: number;
}

interface AddMaterialDialogProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export function AddMaterialDialog({
  productId,
  open,
  onOpenChange,
  onSuccess,
}: AddMaterialDialogProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      materialId: "",
      quantityNeeded: 1,
      wastePercentage: 0,
    },
  });

  useEffect(() => {
    // Fetch available materials when dialog opens
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await createBOMEntry({
        productId,
        materialId: values.materialId,
        quantityNeeded: values.quantityNeeded,
        wastePercentage: values.wastePercentage,
      });

      toast({
        title: "Material Added",
        description: "Material has been added to the bill of materials",
      });

      form.reset();
      await onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add material to BOM",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Material to BOM</DialogTitle>
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
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          <div>
                            <div>{material.name}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {material.sku} | Unit:{" "}
                              {material.unitOfMeasure.symbol} | Cost: $
                              {material.costPerUnit.toFixed(2)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantityNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
