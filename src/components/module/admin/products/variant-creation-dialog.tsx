"use client";

import { useState, useTransition } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Plus, 
  X, 
  Layers, 
  Package, 
  Settings, 
  ChevronDown,
  ChevronRight,
  Palette,
  Ruler,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { createBulkProductVariants, getProductBOMsForInheritance } from "@/lib/actions/bulk-variant-creation";
import type { 
  BulkVariantCreationRequest,
  BulkVariantCreationResult 
} from "@/types/admin/product-variants";

// Common clothing sizes with ordering
const COMMON_SIZES = [
  { name: "XS", code: "XS", order: 1, modifier: 0.9 },
  { name: "S", code: "S", order: 2, modifier: 0.95 },
  { name: "M", code: "M", order: 3, modifier: 1.0 },
  { name: "L", code: "L", order: 4, modifier: 1.05 },
  { name: "XL", code: "XL", order: 5, modifier: 1.1 },
  { name: "XXL", code: "XXL", order: 6, modifier: 1.15 },
  { name: "XXXL", code: "XXXL", order: 7, modifier: 1.2 },
] as const;

// Common colors
const COMMON_COLORS = [
  { name: "Black", code: "BLK" },
  { name: "White", code: "WHT" },
  { name: "Navy", code: "NVY" },
  { name: "Red", code: "RED" },
  { name: "Blue", code: "BLU" },
  { name: "Green", code: "GRN" },
  { name: "Gray", code: "GRY" },
  { name: "Brown", code: "BRN" },
] as const;

// Size selection schema
const sizeSelectionSchema = z.object({
  name: z.string(),
  code: z.string(),
  selected: z.boolean(),
  priceModifier: z.number().min(0.1).max(5.0),
  costModifier: z.number().min(0.1).max(5.0),
  sortOrder: z.number(),
});

// Color selection schema
const colorSelectionSchema = z.object({
  name: z.string(),
  code: z.string(),
  selected: z.boolean(),
  priceModifier: z.number().min(0.1).max(5.0),
  costModifier: z.number().min(0.1).max(5.0),
});

// BOM modification schema
const bomModificationSchema = z.object({
  materialId: z.string(),
  materialName: z.string(),
  quantityModifier: z.number().min(0.1).max(10.0),
  sizeModifiers: z.record(z.string(), z.number()).optional(),
  colorSubstitutions: z.record(z.string(), z.string()).optional(),
});

// Form validation schema
const formSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  sizes: z.array(sizeSelectionSchema),
  colors: z.array(colorSelectionSchema),
  inheritBOM: z.boolean().default(true),
  bomModifications: z.array(bomModificationSchema).default([]),
  minimumStockLevel: z.number().min(0).default(10),
  initialStock: z.number().min(0).default(0),
});

type FormData = z.infer<typeof formSchema>;

interface VariantCreationDialogProps {
  productId: string;
  productName: string;
  onSuccess?: () => Promise<void>;
  trigger?: React.ReactNode;
}

export function VariantCreationDialog({ 
  productId, 
  productName, 
  onSuccess,
  trigger 
}: VariantCreationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [bomData, setBomData] = useState<any>(null);
  const [bomOpen, setBomOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId,
      sizes: COMMON_SIZES.map(size => ({
        ...size,
        selected: false,
        priceModifier: size.modifier,
        costModifier: size.modifier,
      })),
      colors: COMMON_COLORS.map(color => ({
        ...color,
        selected: false,
        priceModifier: 1.0,
        costModifier: 1.0,
      })),
      inheritBOM: true,
      bomModifications: [],
      minimumStockLevel: 10,
      initialStock: 0,
    },
  });

  const watchSizes = form.watch("sizes");
  const watchColors = form.watch("colors");
  const watchInheritBOM = form.watch("inheritBOM");

  // Get selected sizes and colors
  const selectedSizes = watchSizes.filter(s => s.selected);
  const selectedColors = watchColors.filter(c => c.selected);
  const totalVariants = selectedSizes.length * selectedColors.length;

  // Load BOM data when inherit BOM is enabled
  const loadBOMData = async () => {
    if (watchInheritBOM && !bomData) {
      try {
        const data = await getProductBOMsForInheritance(productId);
        setBomData(data);
        if (data?.boms) {
          form.setValue(
            "bomModifications",
            data.boms.map((bom: any) => ({
              materialId: bom.materialId,
              materialName: bom.materialName,
              quantityModifier: 1.0,
              sizeModifiers: {},
              colorSubstitutions: {},
            }))
          );
        }
      } catch (error) {
        console.error("Error loading BOM data:", error);
        toast({
          title: "Warning",
          description: "Could not load BOM data for inheritance setup",
          variant: "destructive",
        });
      }
    }
  };

  // Toggle size selection
  const toggleSize = (index: number) => {
    const currentSizes = form.getValues("sizes");
    currentSizes[index].selected = !currentSizes[index].selected;
    form.setValue("sizes", [...currentSizes]);
  };

  // Toggle color selection
  const toggleColor = (index: number) => {
    const currentColors = form.getValues("colors");
    currentColors[index].selected = !currentColors[index].selected;
    form.setValue("colors", [...currentColors]);
  };

  // Add custom size
  const addCustomSize = (name: string, code: string) => {
    const currentSizes = form.getValues("sizes");
    const newSize = {
      name,
      code,
      selected: true,
      priceModifier: 1.0,
      costModifier: 1.0,
      sortOrder: currentSizes.length + 1,
    };
    form.setValue("sizes", [...currentSizes, newSize]);
  };

  // Add custom color
  const addCustomColor = (name: string, code: string) => {
    const currentColors = form.getValues("colors");
    const newColor = {
      name,
      code,
      selected: true,
      priceModifier: 1.0,
      costModifier: 1.0,
    };
    form.setValue("colors", [...currentColors, newColor]);
  };

  const onSubmit = async (data: FormData) => {
    if (selectedSizes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one size",
        variant: "destructive",
      });
      return;
    }

    if (selectedColors.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please select at least one color",
        variant: "destructive",
      });
      return;
    }

    const request: BulkVariantCreationRequest = {
      productId: data.productId,
      sizes: selectedSizes.map(size => ({
        name: size.name,
        code: size.code,
        priceModifier: size.priceModifier,
        costModifier: size.costModifier,
        sortOrder: size.sortOrder,
      })),
      colors: selectedColors.map(color => ({
        name: color.name,
        code: color.code,
        priceModifier: color.priceModifier,
        costModifier: color.costModifier,
      })),
      inheritBOM: data.inheritBOM,
      bomModifications: data.bomModifications.map(mod => ({
        materialId: mod.materialId,
        quantityModifier: mod.quantityModifier,
        sizeSpecific: mod.sizeModifiers,
        colorSpecific: mod.colorSubstitutions,
      })),
      baseSettings: {
        minimumStockLevel: data.minimumStockLevel,
        initialStock: data.initialStock,
      },
    };

    startTransition(async () => {
      try {
        const result = await createBulkProductVariants(request);
        
        if (result.success) {
          toast({
            title: "Success!",
            description: result.message,
          });
          setOpen(false);
          form.reset();
          onSuccess?.();
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to create variants",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Layers className="mr-2 h-4 w-4" />
            Create Variants
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Product Variants</DialogTitle>
          <DialogDescription>
            Create multiple variants for <strong>{productName}</strong> by selecting sizes and colors.
            {totalVariants > 0 && (
              <span className="ml-2 text-primary">
                Will create {totalVariants} variants
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Size Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ruler className="mr-2 h-5 w-5" />
                  Size Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {watchSizes.map((size, index) => (
                    <div
                      key={size.code}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        size.selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleSize(index)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{size.name}</span>
                        <Switch
                          checked={size.selected}
                          onCheckedChange={() => toggleSize(index)}
                        />
                      </div>
                      {size.selected && (
                        <div className="mt-2 space-y-1">
                          <Input
                            placeholder="Price modifier"
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="5.0"
                            value={size.priceModifier}
                            onChange={(e) => {
                              const currentSizes = form.getValues("sizes");
                              currentSizes[index].priceModifier = parseFloat(e.target.value) || 1.0;
                              form.setValue("sizes", [...currentSizes]);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Color Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Color Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {watchColors.map((color, index) => (
                    <div
                      key={color.code}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        color.selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleColor(index)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{color.name}</span>
                        <Switch
                          checked={color.selected}
                          onCheckedChange={() => toggleColor(index)}
                        />
                      </div>
                      {color.selected && (
                        <div className="mt-2 space-y-1">
                          <Input
                            placeholder="Price modifier"
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="5.0"
                            value={color.priceModifier}
                            onChange={(e) => {
                              const currentColors = form.getValues("colors");
                              currentColors[index].priceModifier = parseFloat(e.target.value) || 1.0;
                              form.setValue("colors", [...currentColors]);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* BOM Inheritance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  BOM Inheritance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="inheritBOM"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Inherit BOM from parent product
                        </FormLabel>
                        <FormDescription>
                          Copy materials from the parent product and apply size/color modifications
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              loadBOMData();
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchInheritBOM && (
                  <Collapsible open={bomOpen} onOpenChange={setBomOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Configure BOM Modifications
                        {bomOpen ? (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronRight className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-4">
                      {bomData?.boms?.map((bom: any, index: number) => (
                        <div key={bom.materialId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{bom.materialName}</span>
                            <Badge variant="outline">{bom.materialSku}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-sm text-muted-foreground">
                                Quantity Modifier
                              </label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="10.0"
                                defaultValue={1.0}
                                onChange={(e) => {
                                  const mods = form.getValues("bomModifications");
                                  if (mods[index]) {
                                    mods[index].quantityModifier = parseFloat(e.target.value) || 1.0;
                                    form.setValue("bomModifications", [...mods]);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>

            {/* Base Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Base Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minimumStockLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stock Level</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initialStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Preview */}
            {totalVariants > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    Will create {totalVariants} variants:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedSizes.map(size => (
                      selectedColors.map(color => (
                        <Badge key={`${size.code}-${color.code}`} variant="outline">
                          {size.name} {color.name}
                        </Badge>
                      ))
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || totalVariants === 0}>
                {isPending ? "Creating..." : `Create ${totalVariants} Variants`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 