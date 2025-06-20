"use client";

import { useState, useTransition } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Plus, 
  Layers, 
  Palette,
  Ruler,
  DollarSign,
  AlertCircle,
  Check,
  X,
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { createBulkProductVariants } from "@/lib/actions/bulk-variant-creation";
import type { 
  BulkVariantCreationRequest,
} from "@/types/admin/product-variants";

// Form validation schema
const formSchema = z.object({
  sizes: z.array(z.string()).min(1, "Please add at least one size"),
  colors: z.array(z.string()).min(1, "Please add at least one color"),
  priceMultiplier: z.number().min(0.1).max(5.0).default(1.0),
  minimumStockLevel: z.number().min(0).default(10),
  initialStock: z.number().min(0).default(0),
  inheritBOM: z.boolean().default(true),
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
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sizes: [],
      colors: [],
      priceMultiplier: 1.0,
      minimumStockLevel: 10,
      initialStock: 0,
      inheritBOM: true,
    },
  });

  const sizes = form.watch("sizes");
  const colors = form.watch("colors");
  const totalVariants = sizes.length * colors.length;

  const addSize = () => {
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim().toUpperCase())) {
      form.setValue("sizes", [...sizes, sizeInput.trim().toUpperCase()]);
      setSizeInput("");
    }
  };

  const removeSize = (size: string) => {
    form.setValue("sizes", sizes.filter(s => s !== size));
  };

  const addColor = () => {
    if (colorInput.trim() && !colors.includes(colorInput.trim())) {
      form.setValue("colors", [...colors, colorInput.trim()]);
      setColorInput("");
    }
  };

  const removeColor = (color: string) => {
    form.setValue("colors", colors.filter(c => c !== color));
  };

  const addPredefinedSizes = (sizeSet: string[]) => {
    const newSizes = [...new Set([...sizes, ...sizeSet])];
    form.setValue("sizes", newSizes);
  };

  const addPredefinedColors = (colorSet: string[]) => {
    const newColors = [...new Set([...colors, ...colorSet])];
    form.setValue("colors", newColors);
  };

  const onSubmit = async (data: FormData) => {
    if (data.sizes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one size",
        variant: "destructive",
      });
      return;
    }

    if (data.colors.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please add at least one color",
        variant: "destructive",
      });
      return;
    }

    const request: BulkVariantCreationRequest = {
      productId,
      sizes: data.sizes.map((sizeName, index) => ({
        name: sizeName,
        code: sizeName.replace(/\s+/g, '').toUpperCase(),
        priceModifier: data.priceMultiplier,
        costModifier: data.priceMultiplier,
        sortOrder: index + 1,
      })),
      colors: data.colors.map(colorName => ({
        name: colorName,
        code: colorName.replace(/\s+/g, '').toUpperCase().slice(0, 3),
        priceModifier: 1.0,
        costModifier: 1.0,
      })),
      inheritBOM: data.inheritBOM,
      bomModifications: [],
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
            description: `Created ${totalVariants} product variants successfully`,
          });
          setOpen(false);
          form.reset();
          setSizeInput("");
          setColorInput("");
          if (onSuccess) {
            await onSuccess();
          }
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to create variants",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error creating variants:", error);
        toast({
          title: "Error",
          description: "Failed to create variants. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      form.reset();
      setSizeInput("");
      setColorInput("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Layers className="mr-2 h-4 w-4" />
            Create Variants
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Product Variants</DialogTitle>
          <DialogDescription>
            Create multiple variants for <strong>{productName}</strong> by adding sizes and colors.
            {totalVariants > 0 && (
              <span className="ml-2 text-primary font-medium">
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
                <CardTitle className="flex items-center text-base">
                  <Ruler className="mr-2 h-4 w-4" />
                  Sizes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Add sizes for this product</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPredefinedSizes(["XS", "S", "M", "L", "XL", "XXL"])}
                    >
                      Add Clothing Sizes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPredefinedSizes(["6", "7", "8", "9", "10", "11", "12"])}
                    >
                      Add Shoe Sizes
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    placeholder="Enter size (e.g., M, L, XL, 32, 34)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                  />
                  <Button type="button" onClick={addSize} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {sizes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected sizes ({sizes.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <Badge key={size} variant="secondary" className="gap-2">
                          {size}
                          <button
                            type="button"
                            onClick={() => removeSize(size)}
                            className="hover:bg-destructive hover:text-destructive-foreground rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Color Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Palette className="mr-2 h-4 w-4" />
                  Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Add colors for this product</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPredefinedColors(["Red", "Blue", "Green", "Black", "White"])}
                    >
                      Add Basic Colors
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPredefinedColors(["Navy", "Gray", "Brown", "Pink", "Purple"])}
                    >
                      Add Extended Colors
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    placeholder="Enter color (e.g., Red, Blue, Forest Green)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                  />
                  <Button type="button" onClick={addColor} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {colors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected colors ({colors.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <Badge key={color} variant="secondary" className="gap-2">
                          {color}
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="hover:bg-destructive hover:text-destructive-foreground rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Variant Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="priceMultiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Multiplier</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="5.0"
                            placeholder="1.0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 1.0)}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Multiplier applied to base price for all variants.
                          <br />
                          1.0 = same price, 1.2 = 20% higher, 0.9 = 10% lower
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Low stock warning threshold for each variant
                        </FormDescription>
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
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Starting stock quantity for each variant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="inheritBOM"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Inherit BOM from parent product
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Copy materials and quantities from the parent product to each variant
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Preview */}
            {totalVariants > 0 && (
              <Card className="bg-blue-50/50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-base text-blue-800">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Variant Preview ({totalVariants} variants)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-blue-700 mb-3">
                    The following variants will be created:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {sizes.map(size => (
                      colors.map(color => (
                        <Badge key={`${size}-${color}`} variant="outline" className="justify-start">
                          <Check className="w-3 h-3 mr-1" />
                          {size} - {color}
                        </Badge>
                      ))
                    ))}
                  </div>
                  {totalVariants > 20 && (
                    <div className="mt-2 text-xs text-blue-600">
                      Note: Creating {totalVariants} variants may take a moment to process.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || totalVariants === 0}
                className="min-w-[120px]"
              >
                {isPending ? "Creating..." : `Create ${totalVariants} Variants`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 