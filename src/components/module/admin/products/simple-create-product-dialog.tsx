"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { X, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createProduct } from "@/lib/actions/product";
import { formatCurrencyPHP } from "@/lib/constant";
import type { ProductCategory, Status } from "@prisma/client";

interface FormData {
  name: string;
  description: string;
  categoryId: string;
  sku: string;
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;
  currentStock: number;
  leadTime: number;
  status: Status;
  // Variant fields
  sizes: string[];
  colors: string[];
  hasVariants: boolean;
}

interface SimpleCreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategory[];
  onSuccess: (product: any) => void;
}

export function SimpleCreateProductDialog({
  open,
  onOpenChange,
  categories,
  onSuccess,
}: SimpleCreateProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      sku: "",
      unitCost: 0,
      sellingPrice: 0,
      minimumStockLevel: 10,
      currentStock: 0,
      leadTime: 7,
      status: "ACTIVE" as Status,
      sizes: [],
      colors: [],
      hasVariants: false,
    },
  });

  const sizes = form.watch("sizes");
  const colors = form.watch("colors");
  const hasVariants = form.watch("hasVariants");
  const unitCost = form.watch("unitCost");
  const sellingPrice = form.watch("sellingPrice");

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
    try {
      setLoading(true);
      
      const productData = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        sku: data.sku,
        unitCost: data.unitCost,
        sellingPrice: data.sellingPrice,
        minimumStockLevel: data.minimumStockLevel,
        currentStock: data.currentStock,
        leadTime: data.leadTime,
        status: data.status,
        hasVariants: data.hasVariants,
        sizeRange: data.sizes,
        colorOptions: data.colors,
      };

      const result = await createProduct(productData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Product "${data.name}" created successfully${
            data.hasVariants ? ` with ${data.sizes.length} sizes and ${data.colors.length} colors` : ""
          }`,
        });
        form.reset();
        onSuccess(result.data);
      } else {
        throw new Error(result.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Create product error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold">
            Create New Product
          </DialogTitle>
          <DialogDescription className="text-base">
            Add a new product to your inventory with optional variants
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: "Product name is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Premium Cotton T-Shirt"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    rules={{ required: "SKU is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., TSHIRT-001"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe your product..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unitCost"
                    rules={{ 
                      required: "Unit cost is required", 
                      min: { value: 0, message: "Must be positive" } 
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Cost</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                        {unitCost > 0 && (
                          <FormDescription className="text-sm font-medium">
                            {formatCurrencyPHP(unitCost)}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellingPrice"
                    rules={{ 
                      required: "Selling price is required", 
                      min: { value: 0, message: "Must be positive" } 
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                        {sellingPrice > 0 && (
                          <FormDescription className="text-sm font-medium">
                            {formatCurrencyPHP(sellingPrice)}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {unitCost > 0 && sellingPrice > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span>Profit Margin:</span>
                      <span className="font-medium">
                        {formatCurrencyPHP(sellingPrice - unitCost)} 
                        ({(((sellingPrice - unitCost) / sellingPrice) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currentStock"
                    rules={{ min: { value: 0, message: "Must be positive" } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            placeholder="0"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? 0 : parseInt(value) || 0);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minimumStockLevel"
                    rules={{ min: { value: 0, message: "Must be positive" } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Stock</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            placeholder="10"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? 0 : parseInt(value) || 0);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="leadTime"
                    rules={{ min: { value: 1, message: "Must be at least 1 day" } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Time (days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="1"
                            placeholder="7"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? 1 : parseInt(value) || 1);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="variants" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Product Variants</h3>
                    <p className="text-sm text-muted-foreground">
                      Enable variants to create different sizes and colors
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="hasVariants"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Enable Variants
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {hasVariants && (
                  <div className="space-y-6">
                    <Separator />
                    
                    {/* Sizes Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Sizes</h4>
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
                          placeholder="Enter size (e.g., M, L, XL)"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                        />
                        <Button type="button" onClick={addSize} size="icon" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {sizes.length > 0 && (
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
                      )}
                    </div>

                    {/* Colors Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Colors</h4>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addPredefinedColors(["Red", "Blue", "Green", "Black", "White"])}
                          >
                            Add Basic Colors
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          placeholder="Enter color (e.g., Red, Blue)"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                        />
                        <Button type="button" onClick={addColor} size="icon" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {colors.length > 0 && (
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
                      )}
                    </div>

                    {sizes.length > 0 && colors.length > 0 && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          This will create <strong>{sizes.length * colors.length} variants</strong> 
                          ({sizes.length} sizes × {colors.length} colors)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 